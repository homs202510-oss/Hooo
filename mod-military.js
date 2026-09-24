const db = require('./core-database');

// ═══════════════════════════════════════════
// أنواع الوحدات
// ═══════════════════════════════════════════
const UNIT_TYPES = {
    'مشاة':  { emoji: '🗡️', cost: { food: 20, iron: 10 },  coins: 20,  attack: 10, defense: 15, speed: 10, food: 1, desc: 'متوازن، دفاع جيد' },
    'رماة':  { emoji: '🏹', cost: { food: 30, iron: 20 },  coins: 35,  attack: 20, defense: 5,  speed: 15, food: 1, desc: 'هجوم بعيد' },
    'فرسان': { emoji: '🐎', cost: { food: 50, iron: 30 },  coins: 80,  attack: 25, defense: 10, speed: 30, food: 3, desc: 'هجوم عالي وسرعة' },
    'درع':   { emoji: '🛡️', cost: { food: 40, iron: 50 },  coins: 100, attack: 5,  defense: 40, speed: 5,  food: 2, desc: 'دفاع صلب' },
    'سريع':  { emoji: '⚡', cost: { food: 25, iron: 15 },  coins: 60,  attack: 15, defense: 10, speed: 50, food: 1, desc: 'سرعة عالية للغارات' },
};

const MAX_UNIT_LEVEL = 10;
const XP_PER_LEVEL = 1000;
const TRAIN_FOOD = 5;
const TRAIN_COINS = 10;
const TRAIN_XP = 100;

// ═══════════════════════════════════════════
// الجيش الخام
// ═══════════════════════════════════════════
function getArmyRaw(kingdomId) {
    return db.prepare('SELECT * FROM kingdom_army WHERE kingdom_id = ?').all(kingdomId);
}

function getUnit(kingdomId, type) {
    return db.prepare('SELECT * FROM kingdom_army WHERE kingdom_id = ? AND soldier_type = ?').get(kingdomId, type);
}

// ═══════════════════════════════════════════
// الجيش المُحسَّن (مع stats)
// ═══════════════════════════════════════════
function getArmy(kingdomId) {
    const rows = getArmyRaw(kingdomId);
    return rows.map(r => {
        const def = UNIT_TYPES[r.soldier_type];
        if (!def) return null;
        const levelMul = 1 + (r.level - 1) * 0.10;      // +10% لكل مستوى
        const moraleMul = (r.morale || 100) / 100;       // 0.00 - 1.00
        const xpMul = 1 + Math.min(r.experience, XP_PER_LEVEL) / XP_PER_LEVEL * 0.20; // +20% XP بحد أقصى

        return {
            type: r.soldier_type,
            emoji: def.emoji,
            count: r.count,
            level: r.level,
            experience: r.experience,
            morale: r.morale,
            attack: Math.floor(def.attack * levelMul * moraleMul * xpMul),
            defense: Math.floor(def.defense * levelMul * moraleMul * xpMul),
            speed: def.speed,
            food: def.food,
            desc: def.desc,
        };
    }).filter(Boolean);
}

function getArmyCount(kingdomId, type = null) {
    if (type) {
        const r = getUnit(kingdomId, type);
        return r ? r.count : 0;
    }
    const r = db.prepare('SELECT SUM(count) as total FROM kingdom_army WHERE kingdom_id = ?').get(kingdomId);
    return r?.total || 0;
}

function getMaxArmy(kingdomId) {
    const barracks = db.prepare("SELECT SUM(count * level) as total FROM kingdom_buildings WHERE kingdom_id = ? AND building_type = 'ثكنة'").get(kingdomId);
    const base = (barracks?.total || 0) * 10;
    let bonuses = {};
    try { bonuses = require('./mod-kingdom').getKingdomBonuses(kingdomId); } catch (_) {}
    return base + (bonuses.maxArmy || 0);
}

// ═══════════════════════════════════════════
// حساب القوة الكلية
// ═══════════════════════════════════════════
function getArmyStats(kingdomId) {
    const army = getArmy(kingdomId);
    let attack = 0, defense = 0, speed = 0, food = 0, count = 0;
    for (const u of army) {
        attack += u.attack * u.count;
        defense += u.defense * u.count;
        speed += u.speed * u.count;
        food += u.food * u.count;
        count += u.count;
    }

    // بونص السور
    const walls = db.prepare("SELECT SUM(count * level) as total FROM kingdom_buildings WHERE kingdom_id = ? AND building_type = 'سور'").get(kingdomId);
    defense += (walls?.total || 0) * 20;

    // بونص التحالف
    try {
        const dp = require('./mod-diplomacy');
        const ab = dp.getAllianceBonus(kingdomId);
        if (ab.defense > 0) defense = Math.floor(defense * (1 + ab.defense));
    } catch (_) {}

    // بونص العناصر
    let itemBonus = {};
    try { itemBonus = require('./mod-kingdom').getKingdomBonuses(kingdomId); } catch (_) {}
    attack += itemBonus.attack || 0;
    defense += itemBonus.defense || 0;
    speed += itemBonus.speed || 0;

    return { attack, defense, speed, food, count };
}

// ═══════════════════════════════════════════
// تجنيد
// ═══════════════════════════════════════════
function recruit(kingdomId, ownerJid, type, qty) {
    if (!Number.isInteger(qty) || qty <= 0 || qty > 1000) return { ok: false, reason: 'bad_qty' };
    const def = UNIT_TYPES[type];
    if (!def) return { ok: false, reason: 'unknown_type' };

    const totalCost = {};
    for (const [res, amount] of Object.entries(def.cost)) totalCost[res] = amount * qty;
    const totalCoins = def.coins * qty;

    const current = getArmyCount(kingdomId);
    const max = getMaxArmy(kingdomId);
    if (current + qty > max) return { ok: false, reason: 'capacity', current, max };

    const kd = require('./mod-kingdom');
    if (!kd.canAfford(kingdomId, totalCost)) return { ok: false, reason: 'insufficient', cost: totalCost };

    const user = require('./mod-user');
    const balance = user.getCoins(ownerJid);
    if (balance < totalCoins) return { ok: false, reason: 'no_coins', need: totalCoins, have: balance };

    try {
        db.exec('BEGIN IMMEDIATE');
        // اخصم موارد
        for (const [res, amt] of Object.entries(totalCost)) kd.addResource(kingdomId, res, -amt);
        // اخصم نقاط
        db.prepare('UPDATE users SET coins = coins - ? WHERE jid = ?').run(totalCoins, ownerJid);
        // ضيف وحدات
        const existing = getUnit(kingdomId, type);
        if (existing) {
            db.prepare('UPDATE kingdom_army SET count = count + ? WHERE id = ?').run(qty, existing.id);
        } else {
            db.prepare('INSERT INTO kingdom_army (kingdom_id, soldier_type, count) VALUES (?, ?, ?)').run(kingdomId, type, qty);
        }
        db.exec('COMMIT');
        try { require('./mod-kingdom').updatePower(kingdomId); } catch (_) {}
        return { ok: true, type, qty, cost: totalCost, coins: totalCoins, newBalance: balance - totalCoins };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

// ═══════════════════════════════════════════
// تدريب (يضيف XP)
// ═══════════════════════════════════════════
function train(kingdomId, ownerJid, type) {
    const def = UNIT_TYPES[type];
    if (!def) return { ok: false, reason: 'unknown_type' };

    const unit = getUnit(kingdomId, type);
    if (!unit || unit.count === 0) return { ok: false, reason: 'no_units' };

    if (unit.level >= MAX_UNIT_LEVEL) return { ok: false, reason: 'max_level' };

    const kd = require('./mod-kingdom');
    const foodCost = TRAIN_FOOD * unit.count;
    const coinsCost = TRAIN_COINS * unit.count;

    if (kd.getResource(kingdomId, 'food') < foodCost) return { ok: false, reason: 'no_food', need: foodCost };
    const user = require('./mod-user');
    const balance = user.getCoins(ownerJid);
    if (balance < coinsCost) return { ok: false, reason: 'no_coins', need: coinsCost, have: balance };

    try {
        db.exec('BEGIN IMMEDIATE');
        kd.addResource(kingdomId, 'food', -foodCost);
        db.prepare('UPDATE users SET coins = coins - ? WHERE jid = ?').run(coinsCost, ownerJid);

        let newXP = unit.experience + TRAIN_XP;
        let newLevel = unit.level;
        let leveledUp = false;

        while (newXP >= XP_PER_LEVEL && newLevel < MAX_UNIT_LEVEL) {
            newXP -= XP_PER_LEVEL;
            newLevel++;
            leveledUp = true;
        }

        db.prepare('UPDATE kingdom_army SET experience = ?, level = ? WHERE id = ?').run(newXP, newLevel, unit.id);
        db.exec('COMMIT');

        try { require('./mod-kingdom').updatePower(kingdomId); } catch (_) {}

        return { ok: true, type, level: newLevel, xp: newXP, leveledUp, foodCost, coinsCost, newBalance: balance - coinsCost };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

// ═══════════════════════════════════════════
// الهجوم
// ═══════════════════════════════════════════
function attack(attackerId, defenderId) {
    const aStats = getArmyStats(attackerId);
    const dStats = getArmyStats(defenderId);

    if (aStats.count === 0) return { ok: false, reason: 'no_army_attacker' };

    // بونص القوة من العناصر للمهاجم
    let aItems = {}, dItems = {};
    try { aItems = require('./mod-kingdom').getKingdomBonuses(attackerId); } catch (_) {}
    try { dItems = require('./mod-kingdom').getKingdomBonuses(defenderId); } catch (_) {}

    const lootBonus = 1 + (aItems.lootBonus || 0) / 100;

    // قوة مبدئية
    let aPower = aStats.attack * 1.0 + aStats.speed * 0.3;
    let dPower = dStats.defense * 1.0 + dStats.speed * 0.2;

    // عامل عشوائي محدود (±15%)
    const aRand = 0.85 + Math.random() * 0.30;
    const dRand = 0.85 + Math.random() * 0.30;
    aPower *= aRand;
    dPower *= dRand;

    const winner = aPower > dPower ? 'attacker' : 'defender';
    const total = aPower + dPower;
    const aLossRate = winner === 'attacker' ? 0.10 : 0.30;
    const dLossRate = winner === 'defender' ? 0.10 : 0.30;

    // خسائر
    const losses = { attacker: Math.floor(aStats.count * aLossRate), defender: Math.floor(dStats.count * dLossRate) };
    if (losses.attacker < 1 && winner === 'defender') losses.attacker = 1;
    if (losses.defender < 1 && winner === 'attacker') losses.defender = 1;

    // غنائم
    let loot = null;
    if (winner === 'attacker') {
        const kd = require('./mod-kingdom');
        const res = kd.getResources(defenderId);
        loot = {};
        for (const [type, amount] of Object.entries(res)) {
            const stolen = Math.floor(amount * 0.15 * lootBonus);
            if (stolen > 0) {
                kd.addResource(defenderId, type, -stolen);
                kd.addResource(attackerId, type, stolen);
                loot[type] = stolen;
            }
        }
    }

    // طبّق الخسائر
    applyLosses(attackerId, losses.attacker);
    applyLosses(defenderId, losses.defender);

    // سجل الحرب
    try {
        require('./mod-diplomacy').createWar(attackerId, defenderId);
    } catch (_) {}

    return { ok: true, winner, aPower: Math.floor(aPower), dPower: Math.floor(dPower), losses, loot, aStats, dStats };
}

function applyLosses(kingdomId, totalLoss) {
    if (totalLoss <= 0) return;
    const army = getArmyRaw(kingdomId);
    const totalCount = army.reduce((s, u) => s + u.count, 0);
    if (totalCount === 0) return;

    let remaining = totalLoss;
    for (const u of army) {
        if (remaining <= 0) break;
        const share = Math.min(u.count, Math.ceil(totalLoss * (u.count / totalCount)));
        const loss = Math.min(share, remaining, u.count);
        if (loss > 0) {
            const newCount = u.count - loss;
            if (newCount <= 0) db.prepare('DELETE FROM kingdom_army WHERE id = ?').run(u.id);
            else db.prepare('UPDATE kingdom_army SET count = ? WHERE id = ?').run(newCount, u.id);
            remaining -= loss;
        }
    }
    try { require('./mod-kingdom').updatePower(kingdomId); } catch (_) {}
}

module.exports = {
    UNIT_TYPES, MAX_UNIT_LEVEL, XP_PER_LEVEL,
    getArmyRaw, getUnit, getArmy, getArmyCount, getMaxArmy,
    getArmyStats, recruit, train, attack,
};
