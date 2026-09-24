const db = require('./core-database');
const { getArea, getAllAreas } = require('./data-areas');
const tracker = require('./mod-tracker');
const { RARITIES, ITEM_MAP, ITEMS } = require('./data-items');

const COOLDOWN_SECONDS = 30; // الحد الأدنى بين أي استكشافين

function getLastGlobalExploration(jid) {
    const r = db.prepare('SELECT MAX(last_at) as m FROM exploration_cooldowns WHERE user_jid = ?').get(jid);
    return r ? (r.m || 0) : 0;
}

function getAreaCooldown(jid, areaId) {
    const r = db.prepare('SELECT last_at FROM exploration_cooldowns WHERE user_jid = ? AND area_id = ?').get(jid, areaId);
    return r ? (r.last_at || 0) : 0;
}

function isAreaUnlocked(jid, area) {
    const user = require('./mod-user');
    const kd = require('./mod-kingdom');
    const u = user.getOrCreate(jid);
    const k = kd.getKingdom(jid);
    const kLevel = k ? k.level : 0;
    const playerLevel = Math.floor(Math.sqrt(u.xp / 10)) + 1;

    return playerLevel >= area.minLevel && kLevel >= area.minKingdomLevel;
}

function explore(jid, areaId) {
    const area = getArea(areaId);
    if (!area) return { ok: false, reason: 'unknown_area' };

    if (!isAreaUnlocked(jid, area)) return { ok: false, reason: 'locked', area };

    const now = Math.floor(Date.now() / 1000);
    const lastGlobal = getLastGlobalExploration(jid);
    if (now - lastGlobal < COOLDOWN_SECONDS) return { ok: false, reason: 'global_cooldown', wait: COOLDOWN_SECONDS - (now - lastGlobal) };

    const lastArea = getAreaCooldown(jid, areaId);
    if (now - lastArea < area.cooldown) return { ok: false, reason: 'area_cooldown', wait: area.cooldown - (now - lastArea), area };

    // تنفيذ الاستكشاف
    const user = require('./mod-user');
    const kd = require('./mod-kingdom');
    const k = kd.getKingdom(jid);

    const gained = {};
    const items = [];
    let xp = 20 + area.dangers * 10;
    let coins = 0;

    // موارد
    for (const [type, range] of Object.entries(area.rewards)) {
        if (type === 'coins') { coins = randInt(range[0], range[1]); continue; }
        const amount = randInt(range[0], range[1]);
        gained[type] = amount;
        if (k) kd.addResource(k.id, type, amount);
    }

    // فرصة عنصر نادر
    if (Math.random() < area.rareChance) {
        // اختار عنصر من الفئة المناسبة
        const pool = ITEMS.filter(it => {
            if (area.dangers <= 2) return it[4] === 'uncommon' || it[4] === 'rare';
            if (area.dangers <= 5) return it[4] === 'rare' || it[4] === 'epic';
            return it[4] === 'epic' || it[4] === 'legendary';
        });
        if (pool.length) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            user.addItem(jid, pick[3], pick[0], 1);
            items.push({ id: pick[0], name: pick[2], emoji: pick[1], rarity: pick[4] });
        }
    }

    user.addCoins(jid, coins);
    user.addXP(jid, xp);

    // تسجيل
    tracker.track(jid, 'explorations_count', 1);
    tracker.markAreaVisited(jid, areaId);

    db.prepare('INSERT OR REPLACE INTO exploration_cooldowns (user_jid, area_id, last_at) VALUES (?, ?, ?)')
      .run(jid, areaId, now);

    return { ok: true, area, gained, coins, xp, items };
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

module.exports = { explore, isAreaUnlocked, getAllAreas, getArea, COOLDOWN_SECONDS };
