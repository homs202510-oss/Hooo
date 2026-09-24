const db = require('./core-database');

const BUILDINGS = {
    'منزل':  { emoji: '🏠', cost: { wood: 200, stone: 100 },            desc: 'يزيد السكان والإنتاج' },
    'مزرعة': { emoji: '🌾', cost: { wood: 150, stone: 50 },             desc: 'ينتج قمح +100/س' },
    'منجم':  { emoji: '⛏️', cost: { wood: 200, stone: 150 },            desc: 'ينتج حديد +50/س، حجر +100/س' },
    'مخزن':  { emoji: '📦', cost: { wood: 300, stone: 200 },            desc: 'يزيد سعة التخزين' },
    'سور':   { emoji: '🛡️', cost: { stone: 500, wood: 200 },            desc: 'دفاع +20' },
    'ثكنة':  { emoji: '⚔️', cost: { wood: 400, stone: 300, iron: 100 }, desc: 'تسمح بـ 10 جنود' },
};

const PRODUCTION = { 'منزل': {}, 'مزرعة': { food: 100 }, 'منجم': { iron: 50, stone: 100 }, 'مخزن': {}, 'سور': {}, 'ثكنة': {} };
const ARMY_TYPES = {
    'مشاة':  { emoji: '🗡️', cost: { gold: 50, food: 20, iron: 10 },  attack: 10, defense: 15, desc: 'متوازن' },
    'رماة':  { emoji: '🏹', cost: { gold: 100, food: 30, iron: 20 }, attack: 20, defense: 5,  desc: 'هجوم عن بعد' },
    'فرسان': { emoji: '🐎', cost: { gold: 150, food: 50, iron: 30 }, attack: 25, defense: 10, desc: 'هجوم عالي' },
};

const INITIAL_RESOURCES = { wood: 1000, stone: 1000, food: 1000, gold: 500, iron: 100 };
const RESOURCE_LABELS = {
    wood: { emoji: '🪵', name: 'خشب' }, stone: { emoji: '🪨', name: 'حجر' },
    food: { emoji: '🌾', name: 'قمح' }, gold: { emoji: '🪙', name: 'ذهب' }, iron: { emoji: '⛏️', name: 'حديد' },
};
const MAX_NAME_LENGTH = 25;
const GATHER_COOLDOWN = 10;

// ═══ الحدود القصوى للـ bonuses (منع overflow) ═══
const MAX_BONUS = {
    energy: 5000,        // 5000% = 50x
    growth: 500,         // 500% = 5x
    prodWood: 50000,
    prodStone: 50000,
    prodFood: 50000,
    prodGold: 50000,
    prodIron: 50000,
    attack: 100000,
    defense: 100000,
    maxArmy: 50000,
    speed: 10000,
};

function capBonus(key, value) {
    const max = MAX_BONUS[key];
    if (!max) return value;
    return Math.min(value, max);
}

// ═══ Helpers آمنة ═══
function getBuildingInfo(type) { return BUILDINGS[type] || { emoji: '🏗️', cost: {}, desc: 'مبنى' }; }
function getArmyInfo(type) {
    if (ARMY_TYPES[type]) return ARMY_TYPES[type];
    try { const mil = require('./mod-military'); if (mil.UNIT_TYPES[type]) return mil.UNIT_TYPES[type]; } catch (_) {}
    return { emoji: '⚔️', cost: {}, attack: 0, defense: 0, desc: 'وحدة' };
}
function getResourceInfo(type) { return RESOURCE_LABELS[type] || { emoji: '📦', name: type }; }

function getKingdom(jid) { return db.prepare('SELECT * FROM kingdoms WHERE owner_jid = ?').get(jid); }
function hasKingdom(jid) { return !!getKingdom(jid); }

function createKingdom(jid, name) {
    try {
        db.exec('BEGIN IMMEDIATE');
        const existing = db.prepare('SELECT id FROM kingdoms WHERE owner_jid = ?').get(jid);
        if (existing) { db.exec('ROLLBACK'); return { ok: false, reason: 'exists' }; }
        const now = Math.floor(Date.now() / 1000);
        const result = db.prepare('INSERT INTO kingdoms (owner_jid, name, level, power, last_gather) VALUES (?, ?, 1, 100, ?)').run(jid, name, now);
        const kingdomId = result.lastInsertRowid;
        for (const [type, amount] of Object.entries(INITIAL_RESOURCES)) {
            db.prepare('INSERT INTO kingdom_resources (kingdom_id, resource_type, amount) VALUES (?, ?, ?)').run(kingdomId, type, amount);
        }
        db.exec('COMMIT');
        return { ok: true, kingdomId };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

function getInventoryBonuses(jid) {
    const { ITEM_MAP } = require('./data-items');
    const rows = db.prepare('SELECT item_name, quantity FROM inventory WHERE user_jid = ?').all(jid);
    const total = {};
    for (const r of rows) {
        const item = ITEM_MAP.get(r.item_name);
        if (!item || !item.bonuses) continue;
        // ✅ cap على الـ quantity
        const qty = Math.min(r.quantity || 0, 100);
        for (const [key, val] of Object.entries(item.bonuses)) {
            total[key] = (total[key] || 0) + (val * qty);
        }
    }
    // ✅ cap على المجموع
    for (const key in total) {
        total[key] = capBonus(key, total[key]);
    }
    return total;
}

function getKingdomBonuses(kingdomId) {
    const k = db.prepare('SELECT owner_jid FROM kingdoms WHERE id = ?').get(kingdomId);
    if (!k) return {};
    return getInventoryBonuses(k.owner_jid);
}

function getResources(kingdomId) {
    const rows = db.prepare('SELECT resource_type, amount FROM kingdom_resources WHERE kingdom_id = ?').all(kingdomId);
    const map = {};
    for (const r of rows) map[r.resource_type] = Math.min(r.amount || 0, 999999999);
    return map;
}
function getResource(kingdomId, type) {
    const r = db.prepare('SELECT amount FROM kingdom_resources WHERE kingdom_id = ? AND resource_type = ?').get(kingdomId, type);
    return r ? Math.min(r.amount || 0, 999999999) : 0;
}
function setResource(kingdomId, type, amount) {
    const safe = Math.min(Math.max(0, Math.floor(amount)), 999999999);
    db.prepare('UPDATE kingdom_resources SET amount = ? WHERE kingdom_id = ? AND resource_type = ?').run(safe, kingdomId, type);
}
function addResource(kingdomId, type, delta) {
    const current = getResource(kingdomId, type);
    const newAmount = Math.min(Math.max(0, current + delta), 999999999);
    setResource(kingdomId, type, newAmount);
    return newAmount;
}
function canAfford(kingdomId, cost) {
    for (const [type, required] of Object.entries(cost)) if (getResource(kingdomId, type) < required) return false;
    return true;
}
function deductCost(kingdomId, cost) {
    for (const [type, amount] of Object.entries(cost)) addResource(kingdomId, type, -amount);
}

function getBuildings(kingdomId) { return db.prepare('SELECT * FROM kingdom_buildings WHERE kingdom_id = ? ORDER BY building_type').all(kingdomId); }
function getBuildingsCount(kingdomId) {
    const r = db.prepare('SELECT COUNT(*) as total FROM kingdom_buildings WHERE kingdom_id = ?').get(kingdomId);
    return r ? r.total : 0;
}
function getBuilding(kingdomId, type) {
    return db.prepare('SELECT * FROM kingdom_buildings WHERE kingdom_id = ? AND building_type = ?').get(kingdomId, type);
}
function addBuilding(kingdomId, type) {
    const existing = getBuilding(kingdomId, type);
    if (existing) db.prepare('UPDATE kingdom_buildings SET count = count + 1 WHERE id = ?').run(existing.id);
    else db.prepare('INSERT INTO kingdom_buildings (kingdom_id, building_type, level, count) VALUES (?, ?, 1, 1)').run(kingdomId, type);
    updatePower(kingdomId);
}

function getProductionPerHour(kingdomId) {
    const buildings = getBuildings(kingdomId);
    const rate = { wood: 0, stone: 0, food: 0, gold: 0, iron: 0 };
    for (const b of buildings) {
        const prod = PRODUCTION[b.building_type] || {};
        const count = Math.min(b.count || 0, 999);
        const level = Math.min(b.level || 1, 10);
        for (const [res, amount] of Object.entries(prod)) {
            rate[res] = (rate[res] || 0) + amount * count * level;
        }
    }

    // منازل → boost (محدود)
    const houses = buildings.find(b => b.building_type === 'منزل');
    const housesCount = houses ? Math.min(houses.count || 0, 999) : 0;
    let boost = 1 + Math.floor(housesCount / 10) * 0.05;

    // تحالفات
    try {
        const dp = require('./mod-diplomacy');
        const aBonus = dp.getAllianceBonus(kingdomId);
        boost += Math.min(aBonus.production || 0, 1); // cap 100%
    } catch (_) {}

    // bonuses من العناصر (محدودة)
    const bonuses = getKingdomBonuses(kingdomId);
    if (bonuses.energy) boost += Math.min(bonuses.energy / 100, 50); // cap 5000%

    // ✅ cap نهائي على boost
    boost = Math.min(boost, 100);

    for (const key in rate) rate[key] = Math.floor(rate[key] * boost);

    // إضافة إنتاج مباشر (محدود)
    rate.wood  += Math.min(bonuses.prodWood  || 0, 500000);
    rate.stone += Math.min(bonuses.prodStone || 0, 500000);
    rate.food  += Math.min(bonuses.prodFood  || 0, 500000);
    rate.gold  += Math.min(bonuses.prodGold  || 0, 500000);
    rate.iron  += Math.min(bonuses.prodIron  || 0, 500000);

    // growth (محدود)
    if (bonuses.growth) {
        const gm = 1 + Math.min(bonuses.growth / 100, 5); // cap 500%
        for (const key in rate) rate[key] = Math.floor(rate[key] * gm);
    }

    // ✅ cap نهائي على كل مورد
    for (const key in rate) rate[key] = Math.min(rate[key], 10000000);

    return rate;
}

function collectProduction(kingdomId) {
    const k = db.prepare('SELECT last_gather, created_at FROM kingdoms WHERE id = ?').get(kingdomId);
    if (!k) return { ok: false, reason: 'not_found' };
    const now = Math.floor(Date.now() / 1000);
    const lastGather = k.last_gather || 0;
    if (lastGather > 0 && (now - lastGather) < GATHER_COOLDOWN) {
        return { ok: false, reason: 'too_soon', wait: GATHER_COOLDOWN - (now - lastGather) };
    }
    const since = lastGather > 0 ? lastGather : (k.created_at || now);
    // ✅ cap على الوقت (بحد أقصى 24 ساعة)
    const elapsed = Math.min(Math.max(0, now - since), 86400);
    if (elapsed < 1) return { ok: false, reason: 'too_soon', wait: 1 };

    const rate = getProductionPerHour(kingdomId);
    const gained = {};
    for (const [res, perHour] of Object.entries(rate)) {
        if (perHour <= 0) continue;
        const amount = Math.floor((perHour * elapsed) / 3600);
        if (amount > 0) {
            const actual = Math.min(amount, 10000000); // cap لكل عملية
            addResource(kingdomId, res, actual);
            gained[res] = actual;
        }
    }
    db.prepare('UPDATE kingdoms SET last_gather = ? WHERE id = ?').run(now, kingdomId);
    return { ok: true, gained, seconds: elapsed };
}

function getArmy(kingdomId) { return db.prepare('SELECT * FROM kingdom_army WHERE kingdom_id = ?').all(kingdomId); }
function getArmyCount(kingdomId, type = null) {
    if (type) {
        const r = db.prepare('SELECT count FROM kingdom_army WHERE kingdom_id = ? AND soldier_type = ?').get(kingdomId, type);
        return r ? (r.count || 0) : 0;
    }
    const r = db.prepare('SELECT SUM(count) as total FROM kingdom_army WHERE kingdom_id = ?').get(kingdomId);
    return r?.total || 0;
}
function getMaxArmy(kingdomId) {
    const barracks = db.prepare("SELECT SUM(count * level) as total FROM kingdom_buildings WHERE kingdom_id = ? AND building_type = 'ثكنة'").get(kingdomId);
    const base = Math.min((barracks?.total || 0) * 10, 100000);
    const bonuses = getKingdomBonuses(kingdomId);
    return base + Math.min(bonuses.maxArmy || 0, 100000);
}
function trainSoldiers(kingdomId, type, quantity) {
    const soldier = ARMY_TYPES[type];
    if (!soldier) return { ok: false, reason: 'unknown_type' };
    const totalCost = {};
    for (const [res, amount] of Object.entries(soldier.cost)) totalCost[res] = amount * quantity;
    if (!canAfford(kingdomId, totalCost)) return { ok: false, reason: 'insufficient', cost: totalCost };
    const current = getArmyCount(kingdomId);
    const max = getMaxArmy(kingdomId);
    if (current + quantity > max) return { ok: false, reason: 'capacity', current, max };
    try {
        db.exec('BEGIN IMMEDIATE');
        deductCost(kingdomId, totalCost);
        const existing = db.prepare('SELECT * FROM kingdom_army WHERE kingdom_id = ? AND soldier_type = ?').get(kingdomId, type);
        if (existing) db.prepare('UPDATE kingdom_army SET count = count + ? WHERE id = ?').run(quantity, existing.id);
        else db.prepare('INSERT INTO kingdom_army (kingdom_id, soldier_type, count) VALUES (?, ?, ?)').run(kingdomId, type, quantity);
        db.exec('COMMIT');
        updatePower(kingdomId);
        return { ok: true, quantity, type };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

function getArmyStats(kingdomId) {
    const army = getArmy(kingdomId);
    let attack = 0, defense = 0;
    for (const a of army) {
        const info = getArmyInfo(a.soldier_type);
        attack += (info.attack || 0) * (a.count || 0);
        defense += (info.defense || 0) * (a.count || 0);
    }
    const walls = db.prepare("SELECT SUM(count * level) as total FROM kingdom_buildings WHERE kingdom_id = ? AND building_type = 'سور'").get(kingdomId);
    defense += Math.min((walls?.total || 0) * 20, 100000);

    try {
        const dp = require('./mod-diplomacy');
        const aBonus = dp.getAllianceBonus(kingdomId);
        if (aBonus.defense > 0) defense = Math.floor(defense * (1 + Math.min(aBonus.defense, 0.5)));
    } catch (_) {}

    const bonuses = getKingdomBonuses(kingdomId);
    attack += Math.min(bonuses.attack || 0, 100000);
    defense += Math.min(bonuses.defense || 0, 100000);

    return {
        attack: Math.min(attack, 50000000),
        defense: Math.min(defense, 50000000),
    };
}

function getUpgradeCost(kingdomId, level) {
    const safeLevel = Math.min(level, 100);
    const base = { wood: safeLevel * 200, stone: safeLevel * 150, food: safeLevel * 100 };
    const bonuses = getKingdomBonuses(kingdomId);
    if (bonuses.growth) {
        const gm = 1 - Math.min(0.5, bonuses.growth / 100);
        for (const k in base) base[k] = Math.max(1, Math.floor(base[k] * gm));
    }
    return base;
}

function upgradeKingdom(kingdomId) {
    const k = db.prepare('SELECT * FROM kingdoms WHERE id = ?').get(kingdomId);
    if (!k) return { ok: false, reason: 'not_found' };
    const cost = getUpgradeCost(kingdomId, k.level);
    if (!canAfford(kingdomId, cost)) return { ok: false, reason: 'insufficient', cost };
    try {
        db.exec('BEGIN IMMEDIATE');
        deductCost(kingdomId, cost);
        db.prepare('UPDATE kingdoms SET level = level + 1 WHERE id = ?').run(kingdomId);
        db.exec('COMMIT');
        updatePower(kingdomId);
        return { ok: true, newLevel: k.level + 1 };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

function updatePower(kingdomId) {
    const k = db.prepare('SELECT level FROM kingdoms WHERE id = ?').get(kingdomId);
    if (!k) return;
    const buildingsCount = getBuildingsCount(kingdomId);
    const army = getArmyCount(kingdomId);
    const bonuses = getKingdomBonuses(kingdomId);
    const power = Math.min(
        (k.level || 1) * 100 + buildingsCount * 50 + army * 5 + (bonuses.attack || 0) + (bonuses.defense || 0),
        1000000000
    );
    db.prepare('UPDATE kingdoms SET power = ? WHERE id = ?').run(power, kingdomId);
}

function formatCost(cost) {
    return Object.entries(cost).map(([type, amount]) => {
        const info = getResourceInfo(type);
        return `${info.emoji} ${amount} ${info.name}`;
    }).join(' + ');
}

module.exports = {
    BUILDINGS, PRODUCTION, ARMY_TYPES, INITIAL_RESOURCES, RESOURCE_LABELS,
    MAX_NAME_LENGTH, GATHER_COOLDOWN, MAX_BONUS,
    getBuildingInfo, getArmyInfo, getResourceInfo,
    getKingdom, hasKingdom, createKingdom,
    getInventoryBonuses, getKingdomBonuses,
    getResources, getResource, setResource, addResource, canAfford, deductCost,
    getBuildings, getBuildingsCount, getBuilding, addBuilding,
    getProductionPerHour, collectProduction,
    getArmy, getArmyCount, getMaxArmy, trainSoldiers, getArmyStats,
    getUpgradeCost, upgradeKingdom, updatePower, formatCost,
};
