const db = require('./core-database');

// ═══════════════════════════════════════════
// إعدادات التحالف
// ═══════════════════════════════════════════
const MAX_ALLIANCES = 5;
const ALLIANCE_PRODUCTION_BONUS = 0.05; // 5% لكل تحالف
const ALLIANCE_DEFENSE_BONUS = 0.30;     // 30% دفاع مشترك

// ═══════════════════════════════════════════
// التحالفات
// ═══════════════════════════════════════════
function getAllianceBetween(a, b) {
    const [x, y] = a < b ? [a, b] : [b, a];
    return db.prepare('SELECT * FROM alliances WHERE kingdom_a = ? AND kingdom_b = ?').get(x, y);
}

function getAlliancesCount(kingdomId) {
    const r = db.prepare(`
        SELECT COUNT(*) as total FROM alliances
        WHERE (kingdom_a = ? OR kingdom_b = ?) AND status = 'active'
    `).get(kingdomId, kingdomId);
    return r ? r.total : 0;
}

function createAllianceRequest(fromId, toId) {
    if (fromId === toId) return { ok: false, reason: 'self' };

    const countA = getAlliancesCount(fromId);
    const countB = getAlliancesCount(toId);
    if (countA >= MAX_ALLIANCES) return { ok: false, reason: 'max_from', max: MAX_ALLIANCES };
    if (countB >= MAX_ALLIANCES) return { ok: false, reason: 'max_to', max: MAX_ALLIANCES };

    const existing = getAllianceBetween(fromId, toId);
    if (existing) {
        if (existing.status === 'pending') {
            if (existing.requested_by === toId) {
                db.prepare("UPDATE alliances SET status = 'active', accepted_at = strftime('%s','now') WHERE id = ?").run(existing.id);
                return { ok: true, action: 'accepted', alliance: db.prepare('SELECT * FROM alliances WHERE id = ?').get(existing.id) };
            }
            return { ok: false, reason: 'already_pending' };
        }
        if (existing.status === 'active') return { ok: false, reason: 'already_active' };
        db.prepare("DELETE FROM alliances WHERE id = ?").run(existing.id);
    }

    const [x, y] = fromId < toId ? [fromId, toId] : [toId, fromId];
    const r = db.prepare('INSERT INTO alliances (kingdom_a, kingdom_b, requested_by) VALUES (?, ?, ?)').run(x, y, fromId);
    return { ok: true, action: 'created', alliance: db.prepare('SELECT * FROM alliances WHERE id = ?').get(r.lastInsertRowid) };
}

function getAlliances(kingdomId) {
    return db.prepare(`
        SELECT a.*,
            CASE WHEN a.kingdom_a = ? THEN a.kingdom_b ELSE a.kingdom_a END AS partner_id
        FROM alliances a
        WHERE a.kingdom_a = ? OR a.kingdom_b = ?
        ORDER BY a.created_at DESC
    `).all(kingdomId, kingdomId, kingdomId);
}

function getAllianceBonus(kingdomId) {
    const count = getAlliancesCount(kingdomId);
    const capped = Math.min(count, MAX_ALLIANCES);
    return {
        count: capped,
        production: capped * ALLIANCE_PRODUCTION_BONUS,
        defense: capped > 0 ? ALLIANCE_DEFENSE_BONUS : 0,
    };
}

// ═══════════════════════════════════════════
// التحديات
// ═══════════════════════════════════════════
function getChallengeBetween(a, b) {
    return db.prepare(`
        SELECT * FROM challenges
        WHERE (challenger_id = ? AND challenged_id = ?)
           OR (challenger_id = ? AND challenged_id = ?)
    `).get(a, b, b, a);
}

function createChallenge(fromId, toId) {
    if (fromId === toId) return { ok: false, reason: 'self' };
    const existing = getChallengeBetween(fromId, toId);
    if (existing) {
        if (existing.status === 'pending') {
            if (existing.challenger_id === toId) {
                db.prepare("UPDATE challenges SET status = 'accepted' WHERE id = ?").run(existing.id);
                return { ok: true, action: 'accepted', challenge: db.prepare('SELECT * FROM challenges WHERE id = ?').get(existing.id) };
            }
            return { ok: false, reason: 'already_pending' };
        }
        if (existing.status === 'accepted') return { ok: false, reason: 'already_active' };
        db.prepare('DELETE FROM challenges WHERE id = ?').run(existing.id);
    }
    const r = db.prepare('INSERT INTO challenges (challenger_id, challenged_id) VALUES (?, ?)').run(fromId, toId);
    return { ok: true, action: 'created', challenge: db.prepare('SELECT * FROM challenges WHERE id = ?').get(r.lastInsertRowid) };
}

function getChallenges(kingdomId) {
    return db.prepare(`
        SELECT c.*,
            CASE WHEN c.challenger_id = ? THEN c.challenged_id ELSE c.challenger_id END AS opponent_id
        FROM challenges c
        WHERE c.challenger_id = ? OR c.challenged_id = ?
        ORDER BY c.created_at DESC
    `).all(kingdomId, kingdomId, kingdomId);
}

// ═══════════════════════════════════════════
// الحروب
// ═══════════════════════════════════════════
function getWarBetween(a, b) {
    return db.prepare(`
        SELECT * FROM wars
        WHERE (attacker_id = ? AND defender_id = ?)
           OR (attacker_id = ? AND defender_id = ?)
    `).get(a, b, b, a);
}

function createWar(attackerId, defenderId) {
    if (attackerId === defenderId) return { ok: false, reason: 'self' };

    // فحص التحالف
    const alliance = getAllianceBetween(attackerId, defenderId);
    if (alliance && alliance.status === 'active') {
        return { ok: false, reason: 'allied' };
    }

    const existing = getWarBetween(attackerId, defenderId);
    if (existing) {
        if (existing.status === 'active') return { ok: false, reason: 'already_active' };
        db.prepare('DELETE FROM wars WHERE id = ?').run(existing.id);
    }
    const r = db.prepare('INSERT INTO wars (attacker_id, defender_id) VALUES (?, ?)').run(attackerId, defenderId);
    return { ok: true, war: db.prepare('SELECT * FROM wars WHERE id = ?').get(r.lastInsertRowid) };
}

function getWars(kingdomId) {
    return db.prepare(`
        SELECT w.*,
            CASE WHEN w.attacker_id = ? THEN w.defender_id ELSE w.attacker_id END AS opponent_id
        FROM wars w
        WHERE (w.attacker_id = ? OR w.defender_id = ?) AND w.status = 'active'
        ORDER BY w.created_at DESC
    `).all(kingdomId, kingdomId, kingdomId);
}

// ═══════════════════════════════════════════
// مساعدات
// ═══════════════════════════════════════════
function getKingdomById(id) {
    return db.prepare('SELECT * FROM kingdoms WHERE id = ?').get(id);
}

function getKingdomName(id) {
    const k = db.prepare('SELECT name FROM kingdoms WHERE id = ?').get(id);
    return k ? k.name : `مملكة #${id}`;
}

function getKingdomOwner(id) {
    const k = db.prepare('SELECT owner_jid FROM kingdoms WHERE id = ?').get(id);
    return k ? k.owner_jid : null;
}

function statusLabel(status) {
    const map = {
        pending:  '⏳ معلق',
        active:   '✅ نشط',
        accepted: '✅ مقبول',
        rejected: '❌ مرفوض',
        ended:    '🔚 منتهي',
    };
    return map[status] || status;
}

module.exports = {
    MAX_ALLIANCES, ALLIANCE_PRODUCTION_BONUS, ALLIANCE_DEFENSE_BONUS,
    getAllianceBetween, createAllianceRequest, getAlliances, getAlliancesCount, getAllianceBonus,
    getChallengeBetween, createChallenge, getChallenges,
    getWarBetween, createWar, getWars,
    getKingdomById, getKingdomName, getKingdomOwner,
    statusLabel,
};
