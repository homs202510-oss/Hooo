/**
 * 👑 PHANTOM — Developer Access System
 */
const db = require('./core-database');
const config = require('./config');

const DEV_CODE = 'H231';

function getDeveloper() {
    return db.prepare('SELECT * FROM developer LIMIT 1').get();
}

function getDeveloperJid() {
    const d = getDeveloper();
    return d ? d.user_jid : null;
}

function isDeveloper(jid) {
    const dev = getDeveloper();
    if (!dev) return false;
    return dev.user_jid === jid;
}

function isOwner(jid) {
    return jid.split('@')[0].split(':')[0] === config.ownerNumber;
}

function isPrivileged(jid) {
    return isDeveloper(jid) || isOwner(jid);
}

function isRegistered() {
    return !!getDeveloper();
}

function activate(jid) {
    const existing = getDeveloper();
    if (existing) {
        if (existing.user_jid === jid) return { ok: false, reason: 'already_you' };
        return { ok: false, reason: 'taken' };
    }
    try {
        db.prepare('INSERT INTO developer (user_jid) VALUES (?)').run(jid);
        return { ok: true };
    } catch (e) {
        return { ok: false, reason: 'error', error: e.message };
    }
}

/**
 * منح كل الصلاحيات — Max each
 */
function grantAllPrivileges(jid) {
    const report = [];
    const errors = [];

    // ═══ 1) المستخدم — Max ═══
    try {
        const user = require('./mod-user');
        user.getOrCreate(jid, 'المطور');
        db.prepare('UPDATE users SET coins = 999999999, xp = 999999999, level = 999 WHERE jid = ?').run(jid);
        report.push('💰 999M نقطة');
        report.push('⭐ Level 999');
    } catch (e) { errors.push('user: ' + e.message); }

    // ═══ 2) الرتبة — إمبراطور ═══
    try {
        const existing = db.prepare('SELECT * FROM user_ranks WHERE user_jid = ?').get(jid);
        if (existing) {
            db.prepare('UPDATE user_ranks SET rank_id = 8 WHERE user_jid = ?').run(jid);
        } else {
            db.prepare('INSERT INTO user_ranks (user_jid, rank_id) VALUES (?, 8)').run(jid);
        }
        report.push('👑 إمبراطور');
    } catch (e) { errors.push('rank: ' + e.message); }

    // ═══ 3) كل الإنجازات ═══
    try {
        const allAch = require('./data-achievements').getAllAchievements();
        for (const a of allAch) {
            try {
                db.prepare(`INSERT OR REPLACE INTO user_achievements (user_jid, achievement_id, progress, unlocked, claimed, unlocked_at, claimed_at)
                    VALUES (?, ?, ?, 1, 1, strftime('%s','now'), strftime('%s','now'))`)
                    .run(jid, a.id, a.target);
                if (a.title) {
                    try {
                        db.prepare('INSERT OR IGNORE INTO user_titles (user_jid, title) VALUES (?, ?)').run(jid, a.title);
                    } catch (_) {}
                }
            } catch (_) {}
        }
        report.push(`🏆 كل الإنجازات (${allAch.length})`);
    } catch (e) { errors.push('achievements: ' + e.message); }

    // ═══ 4) كل المناطق ═══
    try {
        const tracker = require('./mod-tracker');
        const areas = require('./data-areas').getAllAreas();
        const visited = areas.map(a => a.id);
        tracker.ensureStats(jid);
        db.prepare('UPDATE user_stats SET areas_visited = ? WHERE user_jid = ?')
          .run(JSON.stringify(visited), jid);
        report.push(`🗺️ كل المناطق (${areas.length})`);
    } catch (e) { errors.push('areas: ' + e.message); }

    // ═══ 5) كل المهام ═══
    try {
        const allMissions = require('./data-missions').getAllMissions();
        for (const m of allMissions) {
            try {
                db.prepare(`INSERT OR REPLACE INTO mission_progress (user_jid, mission_id, status, progress, claimed, completed_at, claimed_at)
                    VALUES (?, ?, 'claimed', ?, 1, strftime('%s','now'), strftime('%s','now'))`)
                    .run(jid, m.id, m.target);
            } catch (_) {}
        }
        report.push(`🎯 كل المهام (${allMissions.length})`);
    } catch (e) { errors.push('missions: ' + e.message); }

    // ═══ 6) كل العناصر ═══
    try {
        const ITEM_MAP = require('./data-items').ITEM_MAP;
        const allItems = Array.from(ITEM_MAP.values());
        for (const it of allItems) {
            try {
                const qty = it.rarity === 'special' ? 999 : 999999;
                db.prepare(`INSERT OR REPLACE INTO inventory (user_jid, item_type, item_name, quantity)
                    VALUES (?, ?, ?, ?)`)
                    .run(jid, it.category, it.id, qty);
            } catch (_) {}
        }
        report.push(`🎒 كل العناصر (${allItems.length})`);
    } catch (e) { errors.push('items: ' + e.message); }

    // ═══ 7) المملكة — Max ═══
    try {
        const kd = require('./mod-kingdom');
        const mil = require('./mod-military');

        let k = kd.getKingdom(jid);
        if (!k) {
            const created = kd.createKingdom(jid, 'مملكة المطور');
            if (!created.ok) throw new Error('create failed');
            k = kd.getKingdom(jid);
        }
        if (!k) throw new Error('kingdom not found');

        db.prepare('UPDATE kingdoms SET level = 100, power = 9999999 WHERE id = ?').run(k.id);

        // موارد Max
        for (const r of ['wood', 'stone', 'food', 'gold', 'iron']) {
            try { kd.setResource(k.id, r, 999999999); } catch (_) {}
        }

        // كل المباني Max
        for (const btype of Object.keys(kd.BUILDINGS)) {
            try {
                const existing = kd.getBuilding(k.id, btype);
                if (existing) {
                    db.prepare('UPDATE kingdom_buildings SET count = 9999, level = 10 WHERE id = ?').run(existing.id);
                } else {
                    db.prepare('INSERT INTO kingdom_buildings (kingdom_id, building_type, level, count) VALUES (?, ?, 10, 9999)').run(k.id, btype);
                }
            } catch (_) {}
        }

        // كل الجيش Max
        for (const stype of Object.keys(mil.UNIT_TYPES)) {
            try {
                const existing = db.prepare('SELECT * FROM kingdom_army WHERE kingdom_id = ? AND soldier_type = ?').get(k.id, stype);
                if (existing) {
                    db.prepare('UPDATE kingdom_army SET count = 99999, level = 10, experience = 0, morale = 100 WHERE id = ?').run(existing.id);
                } else {
                    db.prepare('INSERT INTO kingdom_army (kingdom_id, soldier_type, count, experience, level, morale) VALUES (?, ?, 99999, 0, 10, 100)').run(k.id, stype);
                }
            } catch (_) {}
        }

        // المخزن Max
        try {
            const wh = require('./mod-warehouse');
            wh.ensure(k.id);
            db.prepare('UPDATE kingdom_warehouse SET level = 20, capacity = 999999999 WHERE kingdom_id = ?').run(k.id);
        } catch (_) {}

        // المصنع Max
        try {
            const factory = require('./mod-factory');
            factory.ensure(k.id);
            db.prepare('UPDATE factories SET level = 15, capacity = 999 WHERE kingdom_id = ?').run(k.id);
        } catch (_) {}

        // الخزينة
        try {
            const treasury = require('./mod-treasury');
            treasury.ensure(k.id);
            db.prepare('UPDATE kingdom_treasury SET balance = 999999999 WHERE kingdom_id = ?').run(k.id);
        } catch (_) {}

        try { kd.updatePower(k.id); } catch (_) {}
        report.push('🏰 مملكة Lv100 + كل المباني Max + جيش كامل');
    } catch (e) { errors.push('kingdom: ' + e.message); }

    // ═══ 8) السمعة Max ═══
    try {
        const rep = require('./mod-reputation');
        rep.get(jid);
        db.prepare('UPDATE user_reputation SET score = 999999 WHERE user_jid = ?').run(jid);
        report.push('⭐ السمعة Max');
    } catch (e) { errors.push('reputation: ' + e.message); }

    // ═══ 9) المهارات Max ═══
    try {
        const skills = ['economy', 'combat', 'exploration', 'crafting', 'leadership', 'trading'];
        for (const s of skills) {
            try {
                db.prepare('INSERT OR REPLACE INTO user_skills (user_jid, skill_id, level, xp) VALUES (?, ?, 20, 99999)').run(jid, s);
            } catch (_) {}
        }
        report.push('🧩 كل المهارات Max');
    } catch (e) { errors.push('skills: ' + e.message); }

    // ═══ 10) المقر Max ═══
    try {
        db.prepare('INSERT OR REPLACE INTO headquarters (user_jid, level, capacity, protection, efficiency) VALUES (?, 10, 9999, 999, 999)').run(jid);
        report.push('🏛️ المقر Max');
    } catch (e) { errors.push('hq: ' + e.message); }

    // ═══ 11) البنك Max ═══
    try {
        db.prepare('INSERT OR REPLACE INTO bank_accounts (user_jid, balance) VALUES (?, 999999999)').run(jid);
        report.push('🏦 البنك Max');
    } catch (e) { errors.push('bank: ' + e.message); }

    return {
        ok: errors.length === 0,
        report,
        errors,
    };
}

module.exports = {
    DEV_CODE,
    getDeveloper, getDeveloperJid, isDeveloper, isPrivileged,
    isRegistered, activate, grantAllPrivileges,
};
