/**
 * 👻 PHANTOM — Factory Service
 */
const db = require('./core-database');
const balance = require('./mod-balance-advanced').factory;
const events = require('./mod-events');

function ensure(kingdomId) {
    let f = db.prepare('SELECT * FROM factories WHERE kingdom_id = ?').get(kingdomId);
    if (!f) {
        db.prepare('INSERT INTO factories (kingdom_id) VALUES (?)').run(kingdomId);
        f = db.prepare('SELECT * FROM factories WHERE kingdom_id = ?').get(kingdomId);
    }
    return f;
}

function get(kingdomId) {
    return ensure(kingdomId);
}

function getQueue(kingdomId) {
    // حدّث اللي خلص الأول
    processCompleted(kingdomId);
    return db.prepare("SELECT * FROM factory_queue WHERE kingdom_id = ? AND status = 'active' ORDER BY completes_at ASC").all(kingdomId);
}

function getUpgradeCost(level) {
    return Math.floor(balance.upgradeCostBase * Math.pow(balance.upgradeCostMult, level - 1));
}

function upgrade(kingdomId) {
    const f = ensure(kingdomId);
    if (f.level >= balance.maxLevel) return { ok: false, reason: 'max_level' };

    const cost = getUpgradeCost(f.level);
    const kd = require('./mod-kingdom');
    if (kd.getResource(kingdomId, 'gold') < cost) return { ok: false, reason: 'no_gold', cost };

    try {
        db.exec('BEGIN IMMEDIATE');
        kd.addResource(kingdomId, 'gold', -cost);
        const newCap = f.capacity + balance.capacityPerLevel;
        db.prepare('UPDATE factories SET level = level + 1, capacity = ?, upgraded_at = strftime(\'%s\',\'now\') WHERE kingdom_id = ?')
          .run(newCap, kingdomId);
        db.exec('COMMIT');
        return { ok: true, newLevel: f.level + 1, newCap };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

/**
 * بدء إنتاج
 */
function startProduction(kingdomId, recipeId, quantity = 1) {
    const recipe = balance.recipes[recipeId];
    if (!recipe) return { ok: false, reason: 'unknown_recipe' };
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) return { ok: false, reason: 'bad_quantity' };

    const f = ensure(kingdomId);
    const active = db.prepare("SELECT COUNT(*) as c FROM factory_queue WHERE kingdom_id = ? AND status = 'active'").get(kingdomId).c;
    if (active >= f.capacity) return { ok: false, reason: 'queue_full', current: active, max: f.capacity };

    // حساب المدخلات
    const inputs = {};
    for (const [res, amt] of Object.entries(recipe.inputs)) {
        inputs[res] = amt * quantity;
    }

    const kd = require('./mod-kingdom');
    if (!kd.canAfford(kingdomId, inputs)) return { ok: false, reason: 'no_resources', cost: inputs };

    const timeSec = recipe.timeSec * quantity;
    const now = Math.floor(Date.now() / 1000);

    try {
        db.exec('BEGIN IMMEDIATE');
        // خصم الموارد
        for (const [res, amt] of Object.entries(inputs)) kd.addResource(kingdomId, res, -amt);

        const r = db.prepare(
            'INSERT INTO factory_queue (kingdom_id, recipe_id, quantity, started_at, completes_at) VALUES (?, ?, ?, ?, ?)'
        ).run(kingdomId, recipeId, quantity, now, now + timeSec);

        db.exec('COMMIT');

        events.emit('production_started', { kingdom_id: kingdomId, recipe_id: recipeId, queue_id: r.lastInsertRowid });

        return { ok: true, queueId: r.lastInsertRowid, completesAt: now + timeSec, timeSec };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

/**
 * معالجة اللي خلص
 */
function processCompleted(kingdomId) {
    const now = Math.floor(Date.now() / 1000);
    const done = db.prepare("SELECT * FROM factory_queue WHERE kingdom_id = ? AND status = 'active' AND completes_at <= ?").all(kingdomId, now);

    if (!done.length) return [];

    const user = require('./mod-user');
    const kd = require('./mod-kingdom');
    const k = db.prepare('SELECT owner_jid FROM kingdoms WHERE id = ?').get(kingdomId);
    const ownerJid = k ? k.owner_jid : null;

    const results = [];

    for (const q of done) {
        const recipe = balance.recipes[q.recipe_id];
        if (!recipe) continue;

        try {
            db.exec('BEGIN IMMEDIATE');
            const qty = recipe.output.qty * q.quantity;

            // ضيف للمخزون (inventory)
            if (ownerJid) user.addItem(ownerJid, 'items', recipe.output.item, qty);

            // XP
            if (ownerJid && recipe.xp) user.addXP(ownerJid, recipe.xp * q.quantity);

            db.prepare("UPDATE factory_queue SET status = 'completed' WHERE id = ?").run(q.id);
            db.exec('COMMIT');

            results.push({ queueId: q.id, item: recipe.output.item, qty });
            events.emit('production_completed', { kingdom_id: kingdomId, queue_id: q.id, item: recipe.output.item, qty });
        } catch (e) {
            try { db.exec('ROLLBACK'); } catch (_) {}
        }
    }

    return results;
}

function getRecipes() {
    return balance.recipes;
}

module.exports = { get, ensure, getQueue, upgrade, startProduction, processCompleted, getRecipes, getUpgradeCost };
