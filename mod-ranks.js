const db = require('./core-database');
const { getRank, getNextRank, getAllRanks } = require('./data-ranks');
const ach = require('./mod-achievements');

const DEVELOPER_RANK = { id: 9, name: '👑 DEVELOPER', tier: 'developer', color: '👑✨', requirements: {} };

function getUserRank(jid) {
    const dev = require('./mod-developer');
    if (dev.isDeveloper(jid)) return DEVELOPER_RANK;

    let row = db.prepare('SELECT * FROM user_ranks WHERE user_jid = ?').get(jid);
    if (!row) {
        db.prepare('INSERT INTO user_ranks (user_jid, rank_id) VALUES (?, 1)').run(jid);
        row = db.prepare('SELECT * FROM user_ranks WHERE user_jid = ?').get(jid);
    }
    return getRank(row.rank_id);
}

function getRankRow(jid) {
    return db.prepare('SELECT * FROM user_ranks WHERE user_jid = ?').get(jid);
}

function checkRequirements(jid, requirements) {
    const state = ach.getLiveState(jid);
    const user = require('./mod-user');
    const u = user.getOrCreate(jid);

    const results = [];
    const map = {
        xp: { label: '⭐ XP', value: u.xp },
        has_kingdom: { label: '🏰 مملكة', value: state.hasKingdom ? 1 : 0 },
        kingdom_level: { label: '📈 مستوى المملكة', value: state.kingdomLevel },
        buildings_count: { label: '🏗️ المباني', value: state.buildingsCount },
        army_count: { label: '⚔️ الجيش', value: state.armyCount },
        missions: { label: '🎯 المهام', value: state.missions_completed },
        achievements: { label: '🏆 الإنجازات', value: ach.getUnlockedCount(jid) },
        wins: { label: '🔥 الانتصارات', value: state.wins_count },
        explorations: { label: '🗺️ الاستكشافات', value: state.explorations_count },
        special_items: { label: '💎 عناصر خاصة', value: state.specialCount },
    };

    for (const [key, req] of Object.entries(requirements)) {
        const info = map[key];
        if (!info) continue;
        results.push({
            key, label: info.label,
            current: info.value || 0,
            required: req,
            met: (info.value || 0) >= req,
        });
    }
    return results;
}

function canPromote(jid) {
    const dev = require('./mod-developer');
    if (dev.isDeveloper(jid)) return { ok: false, reason: 'max' };

    const row = getRankRow(jid);
    if (!row) return { ok: false, reason: 'no_row' };
    const next = getNextRank(row.rank_id);
    if (!next) return { ok: false, reason: 'max' };

    const checks = checkRequirements(jid, next.requirements);
    const allMet = checks.every(c => c.met);
    return { ok: allMet, next, checks };
}

function promote(jid) {
    const dev = require('./mod-developer');
    if (dev.isDeveloper(jid)) return { ok: false, reason: 'max' };

    const result = canPromote(jid);
    if (!result.ok) {
        if (result.reason === 'max') return { ok: false, reason: 'max' };
        return { ok: false, reason: 'not_met', next: result.next, checks: result.checks };
    }

    try {
        db.exec('BEGIN IMMEDIATE');
        db.prepare('UPDATE user_ranks SET rank_id = ?, promoted_at = strftime(\'%s\',\'now\') WHERE user_jid = ?')
          .run(result.next.id, jid);
        db.exec('COMMIT');
        return { ok: true, rank: result.next };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

module.exports = { getUserRank, getRankRow, checkRequirements, canPromote, promote, DEVELOPER_RANK };
