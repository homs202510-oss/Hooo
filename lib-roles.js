/**
 * 👑 PHANTOM — نظام الرتب (مؤسس / أونر / مطور / نخبة)
 * - المؤسس = OWNER_NUMBER في .env + مطور PHANTOM المسجّل
 * - الأونر والمطورين بيتخزنوا في db-roles.json
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');

const FILE = path.join(__dirname, 'db-roles.json');

function load() {
    try {
        const d = JSON.parse(fs.readFileSync(FILE, 'utf8'));
        return { ownerbot: d.ownerbot || [], developers: d.developers || [] };
    } catch (_) {
        return { ownerbot: [], developers: [] };
    }
}

function save(d) {
    fs.writeFileSync(FILE, JSON.stringify(d, null, 2));
    syncElite();
}

const bare = x => (x == null ? '' : String(x).split('@')[0].split(':')[0].trim());

// المعرّف الموحّد (رقم أو LID بدون @domain)
function toLid(x) { return bare(x); }

function founderIds() {
    const ids = new Set();
    if (config.ownerNumber) ids.add(String(config.ownerNumber));
    try {
        const j = require('./mod-developer').getDeveloperJid();
        if (j) ids.add(bare(j));
    } catch (_) {}
    return ids;
}

function isFounder(x) { const b = bare(x); return !!b && founderIds().has(b); }
function isOwnerbot(x) { const b = bare(x); return !!b && load().ownerbot.includes(b); }
function isDeveloper(x) { const b = bare(x); return !!b && load().developers.includes(b); }
function isElite(x) { return isFounder(x) || isOwnerbot(x) || isDeveloper(x); }

function getDevData() {
    const d = load();
    return { founder: [...founderIds()], ownerbot: d.ownerbot, developers: d.developers };
}

function ensureIntegrity() { return { ok: true }; }

function addTo(list, x) {
    const b = bare(x); if (!b) return false;
    const d = load();
    if (d[list].includes(b)) return false;
    d[list].push(b); save(d); return true;
}
function removeFrom(list, x) {
    const b = bare(x); if (!b) return false;
    const d = load();
    if (!d[list].includes(b)) return false;
    d[list] = d[list].filter(v => v !== b); save(d); return true;
}

// مصفوفة أرقام النخبة (بتتحدّث في مكانها)
const eliteNumbers = [];
function syncElite() {
    const d = load();
    eliteNumbers.length = 0;
    eliteNumbers.push(...founderIds(), ...d.ownerbot, ...d.developers);
}
syncElite();

module.exports = {
    toLid, extractPureNumber: toLid, isFounder, isOwnerbot, isDeveloper, isElite, getDevData, ensureIntegrity,
    setOwnerbot: x => addTo('ownerbot', x),
    removeOwnerbot: x => removeFrom('ownerbot', x),
    addDeveloper: x => addTo('developers', x),
    removeDeveloper: x => removeFrom('developers', x),
    eliteNumbers,
};
