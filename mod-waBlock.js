const db = require('./core-database');

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS wa_blocks (
            user_jid TEXT PRIMARY KEY,
            blocked_at INTEGER DEFAULT (strftime('%s','now')),
            reason TEXT,
            unblocked_at INTEGER
        );
    `);
} catch (_) {}

async function blockOnWhatsApp(sock, jid) {
    try {
        await sock.updateBlockStatus(jid, 'block');
        db.prepare('INSERT OR REPLACE INTO wa_blocks (user_jid, reason) VALUES (?, ?)')
          .run(jid, 'شتيمة');
        console.log(`🚫 WA Block: ${jid}`);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

async function unblockOnWhatsApp(sock, jid) {
    try {
        await sock.updateBlockStatus(jid, 'unblock');
        db.prepare('UPDATE wa_blocks SET unblocked_at = strftime(\'%s\',\'now\') WHERE user_jid = ?').run(jid);
        console.log(`✅ WA Unblock: ${jid}`);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

function isBlockedOnWhatsApp(jid) {
    const row = db.prepare('SELECT * FROM wa_blocks WHERE user_jid = ? AND unblocked_at IS NULL').get(jid);
    return !!row;
}

module.exports = { blockOnWhatsApp, unblockOnWhatsApp, isBlockedOnWhatsApp };
