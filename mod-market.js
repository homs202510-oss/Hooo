const db = require('./core-database');
const { RARITIES, RARITY_ORDER, ITEM_MAP, ITEMS, SPECIAL_IDS, SWORD_DEV_ID, SWORD_DEV_UNLOCK_PURCHASES, MIN_PURCHASE_QTY } = require('./data-items');

const REFRESH_INTERVAL = 60 * 60;
const SHOP_SIZE = 10;
const PRICE_VARIATION = 0.20;
const SWORD_DEV_PRICE = 50000;

function getMeta(key, def = null) {
    const r = db.prepare('SELECT value FROM market_meta WHERE key = ?').get(key);
    return r ? r.value : def;
}
function setMeta(key, value) {
    db.prepare('INSERT OR REPLACE INTO market_meta (key, value) VALUES (?, ?)').run(key, String(value));
}
function getLastRefresh() { return parseInt(getMeta('last_refresh', '0')) || 0; }
function getCurrentRefreshId() { return parseInt(getMeta('current_refresh', '0')) || 0; }

function getUserPurchaseCount(jid) {
    const r = db.prepare("SELECT COUNT(*) as total FROM market_log WHERE user_jid = ? AND action = 'buy'").get(jid);
    return r ? r.total : 0;
}

function pickWeighted(items) {
    const pool = [];
    for (const it of items) {
        const weight = Math.max(1, Math.floor(RARITIES[it.rarity].weight * 10));
        for (let i = 0; i < weight; i++) pool.push(it);
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

function computePrice(item, refreshId) {
    if (item.id === SWORD_DEV_ID) return SWORD_DEV_PRICE;
    const seed = ((item.id.length * 7 + refreshId) % 100) / 100;
    const factor = 1 + (seed * 2 - 1) * PRICE_VARIATION;
    return Math.max(1, Math.floor(item.basePrice * factor));
}

function computeStock(item) {
    if (item.rarity === 'special') return 1;
    if (item.rarity === 'mythic') return 1 + Math.floor(Math.random() * 2);
    if (item.rarity === 'legendary') return 2 + Math.floor(Math.random() * 4);
    if (item.rarity === 'epic') return 5 + Math.floor(Math.random() * 6);
    if (item.rarity === 'rare') return 8 + Math.floor(Math.random() * 8);
    if (item.rarity === 'uncommon') return 15 + Math.floor(Math.random() * 15);
    return 30 + Math.floor(Math.random() * 30);
}

function refreshMarket() {
    const now = Math.floor(Date.now() / 1000);
    const last = getLastRefresh();
    if (last > 0 && (now - last) < REFRESH_INTERVAL) {
        return { refreshed: false, nextAt: last + REFRESH_INTERVAL };
    }

    const newRefreshId = getCurrentRefreshId() + 1;
    const allItems = Array.from(ITEM_MAP.values());

    const normalItems = allItems.filter(it => it.rarity !== 'special');
    const chosen = new Map();
    let attempts = 0;
    while (chosen.size < SHOP_SIZE && attempts < 200) {
        const it = pickWeighted(normalItems);
        if (!chosen.has(it.id)) chosen.set(it.id, it);
        attempts++;
    }
    while (chosen.size < SHOP_SIZE) {
        const it = normalItems[Math.floor(Math.random() * normalItems.length)];
        chosen.set(it.id, it);
    }

    const nonSwordSpecials = SPECIAL_IDS.filter(id => id !== SWORD_DEV_ID);
    if (Math.random() < 0.05) {
        const specialId = nonSwordSpecials[Math.floor(Math.random() * nonSwordSpecials.length)];
        const arr = Array.from(chosen.keys());
        chosen.delete(arr[Math.floor(Math.random() * arr.length)]);
        chosen.set(specialId, ITEM_MAP.get(specialId));
    }

    try {
        db.exec('BEGIN IMMEDIATE');
        for (const item of chosen.values()) {
            const price = computePrice(item, newRefreshId);
            const stock = computeStock(item);
            db.prepare('INSERT INTO market_items (refresh_id, item_id, price, stock) VALUES (?, ?, ?, ?)')
              .run(newRefreshId, item.id, price, stock);
        }
        setMeta('last_refresh', now);
        setMeta('current_refresh', newRefreshId);
        db.exec('COMMIT');
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { refreshed: false, error: e.message };
    }

    return { refreshed: true, refreshId: newRefreshId, nextAt: now + REFRESH_INTERVAL };
}

function getCurrentItems() {
    const refreshId = getCurrentRefreshId();
    if (refreshId === 0) return [];
    const rows = db.prepare('SELECT * FROM market_items WHERE refresh_id = ? ORDER BY id').all(refreshId);
    return rows.map(r => ({
        ...ITEM_MAP.get(r.item_id),
        price: r.price,
        stock: r.stock,
    })).filter(Boolean);
}

function isSwordDevUnlocked(jid) {
    const count = getUserPurchaseCount(jid);
    return count >= SWORD_DEV_UNLOCK_PURCHASES;
}

function getSwordDevOffer(jid) {
    if (!isSwordDevUnlocked(jid)) return null;
    const already = db.prepare("SELECT id FROM market_log WHERE user_jid = ? AND item_id = ? AND action = 'buy'").get(jid, SWORD_DEV_ID);
    if (already) return { owned: true };
    return { owned: false, price: SWORD_DEV_PRICE, stock: 1 };
}

function buy(userJid, itemId, qty = 1) {
    if (!Number.isInteger(qty) || qty <= 0 || qty > 999) return { ok: false, reason: 'bad_qty' };

    const item = ITEM_MAP.get(itemId);
    if (!item) return { ok: false, reason: 'not_found' };

    if (item.rarity === 'special') {
        if (qty !== 1) return { ok: false, reason: 'special_qty_1' };
    } else {
        if (qty < MIN_PURCHASE_QTY) return { ok: false, reason: 'min_qty', min: MIN_PURCHASE_QTY };
    }

    if (itemId === SWORD_DEV_ID) {
        const offer = getSwordDevOffer(userJid);
        if (!offer) return { ok: false, reason: 'sword_locked', need: SWORD_DEV_UNLOCK_PURCHASES, have: getUserPurchaseCount(userJid) };
        if (offer.owned) return { ok: false, reason: 'sword_owned' };
    }

    let marketRow = null;
    if (itemId === SWORD_DEV_ID) {
        marketRow = { id: 0, price: SWORD_DEV_PRICE, stock: 1, item_id: itemId };
    } else {
        const refreshId = getCurrentRefreshId();
        marketRow = db.prepare('SELECT * FROM market_items WHERE refresh_id = ? AND item_id = ?').get(refreshId, itemId);
        if (!marketRow) return { ok: false, reason: 'not_in_market' };
        if (marketRow.stock < qty) return { ok: false, reason: 'no_stock', stock: marketRow.stock };
    }

    const total = marketRow.price * qty;

    try {
        db.exec('BEGIN IMMEDIATE');
        const u = db.prepare('SELECT coins FROM users WHERE jid = ?').get(userJid);
        if (!u || u.coins < total) {
            db.exec('ROLLBACK');
            return { ok: false, reason: 'insufficient', needed: total, has: u ? u.coins : 0 };
        }

        if (itemId !== SWORD_DEV_ID) {
            const upd = db.prepare('UPDATE market_items SET stock = stock - ? WHERE id = ? AND stock >= ?').run(qty, marketRow.id, qty);
            if (upd.changes === 0) { db.exec('ROLLBACK'); return { ok: false, reason: 'race' }; }
        }

        db.prepare('UPDATE users SET coins = coins - ? WHERE jid = ?').run(total, userJid);

        const existing = db.prepare('SELECT * FROM inventory WHERE user_jid = ? AND item_name = ?').get(userJid, itemId);
        if (existing) {
            db.prepare('UPDATE inventory SET quantity = quantity + ? WHERE id = ?').run(qty, existing.id);
        } else {
            db.prepare('INSERT INTO inventory (user_jid, item_type, item_name, quantity) VALUES (?, ?, ?, ?)')
              .run(userJid, item.category, itemId, qty);
        }

        db.prepare('INSERT INTO market_log (user_jid, item_id, action, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?)')
          .run(userJid, itemId, 'buy', qty, marketRow.price, total);

        db.exec('COMMIT');
        const newBalance = db.prepare('SELECT coins FROM users WHERE jid = ?').get(userJid).coins;
        return { ok: true, item, qty, price: marketRow.price, total, newBalance, isSwordDev: itemId === SWORD_DEV_ID };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

function sell(userJid, itemId, qty = 1) {
    if (!Number.isInteger(qty) || qty <= 0 || qty > 999) return { ok: false, reason: 'bad_qty' };

    const item = ITEM_MAP.get(itemId);
    if (!item) return { ok: false, reason: 'not_found' };

    const inv = db.prepare('SELECT * FROM inventory WHERE user_jid = ? AND item_name = ?').get(userJid, itemId);
    if (!inv || inv.quantity < qty) return { ok: false, reason: 'no_item', have: inv ? inv.quantity : 0 };

    const refreshId = getCurrentRefreshId();
    const marketRow = db.prepare('SELECT * FROM market_items WHERE refresh_id = ? AND item_id = ?').get(refreshId, itemId);

    let basePrice;
    if (itemId === SWORD_DEV_ID) {
        basePrice = SWORD_DEV_PRICE;
    } else {
        basePrice = marketRow ? marketRow.price : item.basePrice;
    }

    const rar = RARITIES[item.rarity];
    const sellUnit = Math.max(1, Math.floor(basePrice * rar.sellRate));
    const total = sellUnit * qty;

    try {
        db.exec('BEGIN IMMEDIATE');
        const invCheck = db.prepare('SELECT * FROM inventory WHERE user_jid = ? AND item_name = ?').get(userJid, itemId);
        if (!invCheck || invCheck.quantity < qty) { db.exec('ROLLBACK'); return { ok: false, reason: 'no_item' }; }

        if (invCheck.quantity === qty) db.prepare('DELETE FROM inventory WHERE id = ?').run(invCheck.id);
        else db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE id = ?').run(qty, invCheck.id);

        db.prepare('UPDATE users SET coins = coins + ? WHERE jid = ?').run(total, userJid);
        if (marketRow) db.prepare('UPDATE market_items SET stock = stock + ? WHERE id = ?').run(qty, marketRow.id);

        db.prepare('INSERT INTO market_log (user_jid, item_id, action, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?)')
          .run(userJid, itemId, 'sell', qty, sellUnit, total);

        db.exec('COMMIT');
        const newBalance = db.prepare('SELECT coins FROM users WHERE jid = ?').get(userJid).coins;
        return { ok: true, item, qty, price: sellUnit, total, newBalance };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

function findItem(query) {
    if (!query) return null;
    const q = query.trim().toLowerCase();
    if (ITEM_MAP.has(q)) return ITEM_MAP.get(q);
    for (const it of ITEM_MAP.values()) {
        if (it.name === query.trim()) return it;
        if (it.name.toLowerCase() === q) return it;
    }
    for (const it of ITEM_MAP.values()) if (it.name.includes(query.trim())) return it;
    return null;
}

function findItemInInventory(jid, query) {
    const all = db.prepare('SELECT DISTINCT item_name FROM inventory WHERE user_jid = ?').all(jid);
    const item = findItem(query);
    if (item && all.find(r => r.item_name === item.id)) return item;
    for (const r of all) {
        const it = ITEM_MAP.get(r.item_name);
        if (it && (it.name === query.trim() || it.name.includes(query.trim()))) return it;
    }
    return null;
}

module.exports = {
    REFRESH_INTERVAL, SHOP_SIZE, SWORD_DEV_PRICE,
    refreshMarket, getCurrentItems, getLastRefresh, getCurrentRefreshId,
    buy, sell, findItem, findItemInInventory,
    getMeta, setMeta,
    getUserPurchaseCount, isSwordDevUnlocked, getSwordDevOffer,
};
