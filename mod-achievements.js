const db = require('./core-database');
const { getAllAchievements, getAchievement, ACH_CATS } = require('./data-achievements');
const tracker = require('./mod-tracker');

function getLiveState(jid) {
    const kd = require('./mod-kingdom');
    const user = require('./mod-user');
    const mil = require('./mod-military');
    const { ITEM_MAP, SWORD_DEV_ID } = require('./data-items');

    const u = user.getOrCreate(jid);
    const kingdom = kd.getKingdom(jid);
    const kId = kingdom ? kingdom.id : null;
    const buildings = kId ? kd.getBuildings(kId) : [];
    const buildingsCount = buildings.reduce((s, b) => s + b.count, 0);
    const armyCount = kId ? mil.getArmyCount(kId) : 0;
    const armyStats = kId ? mil.getArmyStats(kId) : { defense: 0 };
    const resources = kId ? kd.getResources(kId) : {};
    const stats = tracker.getStats(jid) || {};

    const buys = db.prepare("SELECT COUNT(*) as c FROM market_log WHERE user_jid = ? AND action = 'buy'").get(jid).c;
    const sells = db.prepare("SELECT COUNT(*) as c FROM market_log WHERE user_jid = ? AND action = 'sell'").get(jid).c;
    const alliances = kId ? db.prepare("SELECT COUNT(*) as c FROM alliances WHERE (kingdom_a = ? OR kingdom_b = ?) AND status = 'active'").get(kId, kId).c : 0;
    const missions = db.prepare("SELECT COUNT(*) as c FROM mission_progress WHERE user_jid = ? AND status IN ('completed','claimed')").get(jid).c;

    const invRows = db.prepare("SELECT item_name, quantity FROM inventory WHERE user_jid = ?").all(jid);
    let invItems = 0, invTypes = 0, rareCount = 0, specialCount = 0, hasSword = 0;
    const seen = new Set();
    for (const r of invRows) {
        invItems += r.quantity;
        if (!seen.has(r.item_name)) { seen.add(r.item_name); invTypes++; }
        const it = ITEM_MAP.get(r.item_name);
        if (!it) continue;
        if (it.rarity === 'special') specialCount += r.quantity;
        else if (['rare','epic','legendary','mythic'].includes(it.rarity)) rareCount += r.quantity;
        if (r.item_name === SWORD_DEV_ID) hasSword = 1;
    }

    const areasVisited = (() => {
        try { return JSON.parse(stats.areas_visited || '[]').length; } catch (_) { return 0; }
    })();

    const resAll50k = (resources.wood >= 50000 && resources.stone >= 50000 && resources.iron >= 50000 && resources.gold >= 50000) ? 1 : 0;

    return {
        jid, user: u, kingdom,
        hasKingdom: kingdom ? 1 : 0,
        kingdomLevel: kingdom ? kingdom.level : 0,
        kingdomPower: kingdom ? kingdom.power : 0,
        buildingsCount, armyCount, defense_total: armyStats.defense,
        resources, coins_amount: u.coins, user_level: u.level,
        invItems, invTypes, rareCount, specialCount, hasSword,
        market_buys: buys, market_sells: sells, trade_total: buys + sells,
        alliances_count: alliances, missions_completed: missions,
        work_count: stats.work_count || 0,
        daily_count: stats.daily_count || 0,
        transfer_count: stats.transfer_count || 0,
        train_count: stats.train_count || 0,
        attack_count: stats.attack_count || 0,
        wins_count: stats.wins_count || 0,
        explorations_count: stats.explorations_count || 0,
        adventures_count: stats.adventures_count || 0,
        adventures_won: stats.adventures_won || 0,
        areas_visited: areasVisited,
        res_wood_total: resources.wood || 0,
        res_stone_total: resources.stone || 0,
        res_iron_total: resources.iron || 0,
        res_gold_total: resources.gold || 0,
        res_food_total: resources.food || 0,
        res_all_50k: resAll50k,
    };
}

function checkCondition(cond, state) {
    switch (cond.k) {
        case 'always': return 1;
        case 'user_level': return state.user_level;
        case 'coins_amount': return state.coins_amount;
        case 'work_count': return state.work_count;
        case 'daily_count': return state.daily_count;
        case 'transfer_count': return state.transfer_count;
        case 'market_buys': return state.market_buys;
        case 'market_sells': return state.market_sells;
        case 'trade_total': return state.trade_total;
        case 'inventory_items': return state.invItems;
        case 'inventory_types': return state.invTypes;
        case 'has_kingdom': return state.hasKingdom;
        case 'kingdom_level': return state.kingdomLevel;
        case 'buildings_count': return state.buildingsCount;
        case 'building_type_count': {
            const b = state.buildings ? state.buildings.find(x => x.building_type === cond.type) : null;
            return b ? b.count : 0;
        }
        case 'army_count': return state.armyCount;
        case 'train_count': return state.train_count;
        case 'defense_total': return state.defense_total;
        case 'attack_count': return state.attack_count;
        case 'wins_count': return state.wins_count;
        case 'alliances_count': return state.alliances_count;
        case 'missions_completed': return state.missions_completed;
        case 'explorations_count': return state.explorations_count;
        case 'areas_visited': return state.areas_visited;
        case 'adventures_count': return state.adventures_count;
        case 'adventures_won': return state.adventures_won;
        case 'rare_count': return state.rareCount;
        case 'special_count': return state.specialCount;
        case 'has_sword_dev': return state.hasSword;
        case 'res_wood_total': return state.res_wood_total;
        case 'res_stone_total': return state.res_stone_total;
        case 'res_iron_total': return state.res_iron_total;
        case 'res_gold_total': return state.res_gold_total;
        case 'res_all_50k': return state.res_all_50k;
        default: return 0;
    }
}

function ensureRow(jid, achId) {
    let row = db.prepare('SELECT * FROM user_achievements WHERE user_jid = ? AND achievement_id = ?').get(jid, achId);
    if (!row) {
        db.prepare('INSERT INTO user_achievements (user_jid, achievement_id) VALUES (?, ?)').run(jid, achId);
        row = db.prepare('SELECT * FROM user_achievements WHERE user_jid = ? AND achievement_id = ?').get(jid, achId);
    }
    return row;
}

function updateAll(jid) {
    const state = getLiveState(jid);
    const unlocks = [];

    for (const a of getAllAchievements()) {
        const row = ensureRow(jid, a.id);
        if (row.unlocked) continue;

        const value = checkCondition(a.condition, state);
        const progress = Math.min(value, a.target);
        const complete = value >= a.target;

        if (complete) {
            db.prepare('UPDATE user_achievements SET progress = ?, unlocked = 1, unlocked_at = strftime(\'%s\',\'now\') WHERE id = ?')
              .run(progress, row.id);
            if (a.title) {
                try {
                    db.prepare('INSERT OR IGNORE INTO user_titles (user_jid, title) VALUES (?, ?)').run(jid, a.title);
                } catch (_) {}
            }
            unlocks.push(a);
        } else if (progress !== row.progress) {
            db.prepare('UPDATE user_achievements SET progress = ? WHERE id = ?').run(progress, row.id);
        }
    }
    return unlocks;
}

function getList(jid) {
    updateAll(jid);
    const rows = db.prepare('SELECT * FROM user_achievements WHERE user_jid = ?').all(jid);
    const map = new Map(rows.map(r => [r.achievement_id, r]));

    const unlocked = [], inProgress = [], locked = [];

    for (const a of getAllAchievements()) {
        const row = map.get(a.id);
        const data = { achievement: a, progress: row ? row.progress : 0, unlocked: row ? row.unlocked : 0, claimed: row ? row.claimed : 0 };
        if (row && row.unlocked) unlocked.push(data);
        else if (row && row.progress > 0) inProgress.push(data);
        else locked.push(data);
    }

    return { unlocked, inProgress, locked };
}

function claim(jid, achId) {
    const a = getAchievement(achId);
    if (!a) return { ok: false, reason: 'not_found' };

    updateAll(jid);
    const row = db.prepare('SELECT * FROM user_achievements WHERE user_jid = ? AND achievement_id = ?').get(jid, achId);
    if (!row) return { ok: false, reason: 'not_found' };
    if (!row.unlocked) return { ok: false, reason: 'not_unlocked' };
    if (row.claimed) return { ok: false, reason: 'already' };

    const user = require('./mod-user');

    try {
        db.exec('BEGIN IMMEDIATE');
        const recheck = db.prepare('SELECT * FROM user_achievements WHERE id = ? AND claimed = 0').get(row.id);
        if (!recheck) { db.exec('ROLLBACK'); return { ok: false, reason: 'race' }; }

        user.addCoins(jid, a.rewards.coins || 0);
        if (a.rewards.xp) user.addXP(jid, a.rewards.xp);

        db.prepare('UPDATE user_achievements SET claimed = 1, claimed_at = strftime(\'%s\',\'now\') WHERE id = ?').run(row.id);
        db.prepare('INSERT OR IGNORE INTO user_rewards (user_jid, source, source_id, coins, xp) VALUES (?, ?, ?, ?, ?)')
          .run(jid, 'achievement', a.id, a.rewards.coins || 0, a.rewards.xp || 0);

        db.exec('COMMIT');
        return { ok: true, achievement: a, rewards: a.rewards };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

function getUnlockedCount(jid) {
    const r = db.prepare('SELECT COUNT(*) as c FROM user_achievements WHERE user_jid = ? AND unlocked = 1').get(jid);
    return r ? r.c : 0;
}

module.exports = { getLiveState, updateAll, getList, claim, getUnlockedCount };
