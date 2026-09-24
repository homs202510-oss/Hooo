/**
 * 👻 PHANTOM — Bot Profile Service
 * هوية البوت الرسمية — Persistent
 */
const fs = require('fs');
const path = require('path');
const db = require('./core-database');

const PROFILE_DIR = __dirname;
if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true });

function getRow() {
    let r = db.prepare('SELECT * FROM bot_profile WHERE id = 1').get();
    if (!r) {
        db.prepare('INSERT INTO bot_profile (id) VALUES (1)').run();
        r = db.prepare('SELECT * FROM bot_profile WHERE id = 1').get();
    }
    return r;
}

function get() {
    const r = getRow();
    return {
        imagePath: r.image_path,
        imageUrl: r.image_url,
        version: r.version,
        identityName: r.identity_name,
        developer: r.developer,
        slogan: r.slogan,
        phone: require('./config').ownerNumber,
        updatedAt: r.updated_at,
        updatedBy: r.updated_by,
    };
}

/**
 * احفظ صورة البوت (path + copy to project folder)
 */
async function setImage(buffer, mimetype, byJid) {
    const ext = (mimetype || '').includes('png') ? 'png' : 'jpg';
    const filename = `phantom-profile-v${Date.now()}.${ext}`;
    const fullPath = path.join(PROFILE_DIR, filename);

    fs.writeFileSync(fullPath, buffer);

    const old = getRow();
    // امسح الصورة القديمة
    if (old.image_path && fs.existsSync(old.image_path)) {
        try { fs.unlinkSync(old.image_path); } catch (_) {}
    }

    db.prepare('UPDATE bot_profile SET image_path = ?, version = version + 1, updated_at = strftime(\'%s\',\'now\'), updated_by = ? WHERE id = 1')
      .run(fullPath, byJid);

    return { ok: true, path: fullPath };
}

function setImageFromUrl(url, byJid) {
    db.prepare('UPDATE bot_profile SET image_url = ?, version = version + 1, updated_at = strftime(\'%s\',\'now\'), updated_by = ? WHERE id = 1')
      .run(url, byJid);
    return { ok: true };
}

function hasImage() {
    const r = getRow();
    return !!(r.image_path && fs.existsSync(r.image_path)) || !!r.image_url;
}

function getImageBuffer() {
    const r = getRow();
    if (r.image_path && fs.existsSync(r.image_path)) {
        return { ok: true, buffer: fs.readFileSync(r.image_path), path: r.image_path };
    }
    return { ok: false };
}

function getIdentity() {
    const r = getRow();
    return {
        name: r.identity_name,
        developer: r.developer,
        slogan: r.slogan,
        version: r.version,
    };
}

function setIdentity(fields, byJid) {
    const allowed = { name: 'identity_name', developer: 'developer', slogan: 'slogan' };
    for (const [k, v] of Object.entries(fields)) {
        if (allowed[k]) {
            db.prepare(`UPDATE bot_profile SET ${allowed[k]} = ?, updated_at = strftime('%s','now'), updated_by = ? WHERE id = 1`)
              .run(v, byJid);
        }
    }
    return { ok: true };
}

module.exports = { get, getRow, setImage, setImageFromUrl, hasImage, getImageBuffer, getIdentity, setIdentity };
