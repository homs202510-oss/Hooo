const db = require('./core-database');
const { getMission, getAllMissions, getUnlockedBy, DIFF, TYPES } = require('./data-missions');
const tracker = require('./mod-tracker');
const { RARITIES, ITEM_MAP, SWORD_DEV_ID } = require('./data-items');

function getLiveState(jid) {
    const kd = require('./mod-kingdom');
    const user = require('./mod-user');

    const u = user.getOrCreate(jid);
    const kingdom = kd.getKingdom(jid);
    const kId = kingdom ? kingdom.id : null;

    const buildings = kId ? kd.getBuildings(kId) : [];
    const buildingsCount = buildings.reduce((s, b) => s + b.count, 0);
    const armyCount = kId ? kd.getArmyCount(kId) : 0;
    const resources = kId ? kd.getResources(kId) : {};

    const buys = db.prepare("SELECT COUNT(*) as c FROM market_log WHERE user_jid = ? AND action = 'buy'").get(jid).c;
    const sells = db.prepare("SELECT COUNT(*) as c FROM market_log WHERE user_jid = ? AND action = 'sell'").get(jid).c;

    const alliances = kId ? db.prepare("SELECT COUNT(*) as c FROM alliances WHERE (kingdom_a = ? OR kingdom_b = ?) AND status = 'active'").get(kId, kId).c : 0;
    const wars = kId ? db.prepare("SELECT COUNT(*) as c FROM wars WHERE attacker_id = ? OR defender_id = ?").get(kId, kId).c : 0;
    const challenges = kId ? db.prepare("SELECT COUNT(*) as c FROM challenges WHERE challenger_id = ? OR challenged_id = ?").get(kId, kId).c : 0;

    const invItems = db.prepare("SELECT SUM(quantity) as c FROM inventory WHERE user_jid = ?").get(jid).c || 0;
    const invTypes = db.prepare("SELECT COUNT(DISTINCT item_name) as c FROM inventory WHERE user_jid = ?").get(jid).c || 0;

    const invRows = db.prepare("SELECT item_name, quantity FROM inventory WHERE user_jid = ?").all(jid);
    let rareCount = 0, specialCount = 0, hasSword = 0;
    for (const r of invRows) {
        const it = ITEM_MAP.get(r.item_name);
        if (!it) continue;
        if (it.rarity === 'special') specialCount += r.quantity;
        else if (['rare', 'epic', 'legendary', 'mythic'].includes(it.rarity)) rareCount += r.quantity;
        if (r.item_name === SWORD_DEV_ID) hasSword = 1;
    }

    const stats = tracker.getStats(jid) || {};
    const completedCount = db.prepare("SELECT COUNT(*) as c FROM mission_progress WHERE user_jid = ? AND status IN ('completed','claimed')").get(jid).c;

    const totals = {
        res_wood_total:  resources.wood  || 0,
        res_stone_total: resources.stone || 0,
        res_iron_total:  resources.iron  || 0,
        res_gold_total:  resources.gold  || 0,
        res_food_total:  resources.food  || 0,
    };

    return {
        jid, user: u, kingdom,
        hasKingdom: !!kingdom,
        kingdomLevel: kingdom ? kingdom.level : 0,
        kingdomPower: kingdom ? kingdom.power : 0,
        buildingsCount, buildings, armyCount, resources,
        buys, sells, alliances, wars, challenges,
        invItems, invTypes, rareCount, specialCount, hasSword,
        stats, completedCount, ...totals,
    };
}

function checkCondition(cond, state) {
    switch (cond.k) {
        case 'always': return 1;
        case 'has_name': return state.user.name && state.user.name !== 'مجهول' ? 1 : 0;
        case 'has_kingdom': return state.hasKingdom ? 1 : 0;
        case 'buildings_count': return state.buildingsCount;
        case 'building_type': {
            const b = state.buildings.find(x => x.building_type === cond.type);
            return b ? b.count : 0;
        }
        case 'building_type_count': {
            const b = state.buildings.find(x => x.building_type === cond.type);
            return b ? b.count : 0;
        }
        case 'army_count': return state.armyCount;
        case 'train_count': return state.stats.train_count || 0;
        case 'work_count': return state.stats.work_count || 0;
        case 'daily_count': return state.stats.daily_count || 0;
        case 'transfer_count': return state.stats.transfer_count || 0;
        case 'market_buys': return state.buys;
        case 'market_sells': return state.sells;
        case 'kingdom_level': return state.kingdomLevel;
        case 'kingdom_power': return state.kingdomPower;
        case 'coins_amount': return state.user.coins;
        case 'res_wood_total': return state.res_wood_total;
        case 'res_stone_total': return state.res_stone_total;
        case 'res_iron_total': return state.res_iron_total;
        case 'res_gold_total': return state.res_gold_total;
        case 'res_food_total': return state.res_food_total;
        case 'alliances_count': return state.alliances;
        case 'wars_count': return state.wars;
        case 'challenges_count': return state.challenges;
        case 'attack_count': return state.stats.attack_count || 0;
        case 'wins_count': return state.stats.wins_count || 0;
        case 'inventory_items': return state.invItems;
        case 'inventory_types': return state.invTypes;
        case 'has_rare_item': return state.rareCount;
        case 'has_special_item': return state.specialCount;
        case 'has_sword_dev': return state.hasSword;
        case 'explorations_count': return state.stats.explorations_count || 0;
        case 'explore_area': return tracker.hasVisitedArea(state.jid, cond.area) ? 1 : 0;
        case 'adventures_count': return state.stats.adventures_count || 0;
        case 'adventures_won': return state.stats.adventures_won || 0;
        case 'completed_count': return state.completedCount;
        default: return 0;
    }
}

function getMissionRow(jid, missionId) {
    return db.prepare('SELECT * FROM mission_progress WHERE user_jid = ? AND mission_id = ?').get(jid, missionId);
}

function isUnlocked(jid, missionId) {
    const mission = getMission(missionId);
    if (!mission) return false;
    for (const reqId of mission.requires) {
        const row = getMissionRow(jid, reqId);
        if (!row || (row.status !== 'completed' && row.status !== 'claimed')) return false;
    }
    return true;
}

function ensureMission(jid, missionId) {
    const existing = getMissionRow(jid, missionId);
    if (!existing) {
        db.prepare('INSERT INTO mission_progress (user_jid, mission_id) VALUES (?, ?)').run(jid, missionId);
        return getMissionRow(jid, missionId);
    }
    return existing;
}

function updateProgress(jid) {
    const state = getLiveState(jid);
    const updates = [];

    for (const m of getAllMissions()) {
        let row = getMissionRow(jid, m.id);
        const unlocked = isUnlocked(jid, m.id);
        if (!unlocked && !row) continue;
        if (!row) row = ensureMission(jid, m.id);
        if (row.claimed) continue;

        const value = checkCondition(m.condition, state);
        const progress = Math.min(value, m.target);
        const complete = value >= m.target;

        let newStatus = row.status;
        if (complete) newStatus = 'completed';
        else if (row.status === 'active') newStatus = 'active';

        if (progress !== row.progress || newStatus !== row.status) {
            db.prepare('UPDATE mission_progress SET progress = ?, status = ?, completed_at = ? WHERE id = ?')
              .run(progress, newStatus, complete ? Math.floor(Date.now() / 1000) : null, row.id);
            updates.push({ id: m.id, progress, status: newStatus });
        }
    }
    return updates;
}

function claimReward(jid, missionId) {
    const mission = getMission(missionId);
    if (!mission) return { ok: false, reason: 'not_found' };

    updateProgress(jid);
    const row = getMissionRow(jid, missionId);
    if (!row) return { ok: false, reason: 'not_started' };
    if (row.status !== 'completed') return { ok: false, reason: 'not_complete' };
    if (row.claimed) return { ok: false, reason: 'already_claimed' };

    const user = require('./mod-user');
    const kd = require('./mod-kingdom');

    try {
        db.exec('BEGIN IMMEDIATE');
        const check = db.prepare('SELECT * FROM mission_progress WHERE id = ? AND claimed = 0 AND status = ?').get(row.id, 'completed');
        if (!check) { db.exec('ROLLBACK'); return { ok: false, reason: 'race' }; }

        user.addCoins(jid, mission.rewards.coins || 0);
        if (mission.rewards.xp) user.addXP(jid, mission.rewards.xp);

        if (mission.rewards.resources) {
            const kingdom = kd.getKingdom(jid);
            if (kingdom) {
                for (const [type, amount] of Object.entries(mission.rewards.resources)) {
                    kd.addResource(kingdom.id, type, amount);
                }
            }
        }

        db.prepare('UPDATE mission_progress SET claimed = 1, status = ?, claimed_at = ? WHERE id = ?')
          .run('claimed', Math.floor(Date.now() / 1000), row.id);
        db.exec('COMMIT');

        updateProgress(jid);
        return { ok: true, mission, rewards: mission.rewards };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

function getAvailable(jid) {
    updateProgress(jid);
    const rows = db.prepare(`
        SELECT id, user_jid, mission_id, status, progress, claimed, started_at, completed_at, claimed_at
        FROM mission_progress WHERE user_jid = ?
        ORDER BY mission_id
    `).all(jid);

    const active = [], available = [], completed = [], locked = [];

    for (const r of rows) {
        const mission = getMission(r.mission_id);
        if (!mission) continue;
        const data = { mission, progress: r.progress, status: r.status, claimed: r.claimed, target: mission.target };
        if (r.claimed || r.status === 'completed' || r.status === 'claimed') completed.push(data);
        else if (r.progress > 0) active.push(data);
        else available.push(data);
    }

    return { active, available, completed, locked };
}

function getNextSuggested(jid) {
    updateProgress(jid);
    const row = db.prepare(`
        SELECT id, user_jid, mission_id, status, progress, claimed
        FROM mission_progress
        WHERE user_jid = ? AND claimed = 0 AND status IN ('active','completed')
        ORDER BY CASE WHEN status = 'completed' THEN 0 ELSE 1 END, mission_id ASC
        LIMIT 1
    `).get(jid);

    if (!row) {
        const all = getAllMissions();
        for (const m of all) {
            if (isUnlocked(jid, m.id)) {
                const r = getMissionRow(jid, m.id);
                if (!r || !r.claimed) return { mission: m, row: r };
            }
        }
        return null;
    }
    const mission = getMission(row.mission_id);
    return { mission, row };
}

function startMission(jid, missionId) {
    const mission = getMission(missionId);
    if (!mission) return { ok: false, reason: 'not_found' };
    if (!isUnlocked(jid, missionId)) return { ok: false, reason: 'locked' };
    ensureMission(jid, missionId);
    updateProgress(jid);
    return { ok: true, mission, row: getMissionRow(jid, missionId) };
}

module.exports = {
    getLiveState, checkCondition, isUnlocked,
    getMissionRow, ensureMission, updateProgress, claimReward,
    getAvailable, getNextSuggested, startMission,
};
