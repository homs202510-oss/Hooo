/**
 * 👻 PHANTOM — Reputation Service
 */
const db = require('./core-database');

const TIERS = [
    { min: -1000, name: '👎 منبوذ', tier: 'hated' },
    { min: -200,  name: '😠 مكروه', tier: 'hostile' },
    { min: -50,   name: '😐 محايد', tier: 'neutral' },
    { min: 50,    name: '🙂 موثوق', tier: 'trusted' },
    { min: 200,   name: '😊 محترم', tier: 'respected' },
    { min: 500,   name: '⭐ نبيل', tier: 'noble' },
    { min: 1000,  name: '👑 أسطورة', tier: 'legend' },
];

const GAINS = {
    quest_completed: 5,
    battle_won: 8,
    trade_completed: 2,
    help_ally: 10,
    achievement_unlocked: 15,
    exploration_completed: 3,
    adventure_completed: 4,
};

const LOSSES = {
    battle_lost: -3,
    war_declared: -5,
    betrayal: -20,
    spam_violation: -10,
};

const DAILY_LIMIT = {
    quest_completed: 5,
    battle_won: 3,
    trade_completed: 10,
    help_ally: 2,
    exploration_completed: 5,
    adventure_completed: 5,
};

function getTier(score) {
    let current = TIERS[0];
    for (const t of TIERS) if (score >= t.min) current = t;
    return current;
}

function getNextTier(score) {
    for (const t of TIERS) if (score < t.min) return t;
    return null;
}

function get(userJid) {
    let r = db.prepare('SELECT * FROM user_reputation WHERE user_jid = ?').get(userJid);
    if (!r) {
        try {
            db.prepare('INSERT INTO user_reputation (user_jid) VALUES (?)').run(userJid);
            r = db.prepare('SELECT * FROM user_reputation WHERE user_jid = ?').get(userJid);
        } catch (_) {
            return { user_jid: userJid, score: 0, tier: 'neutral', last_event_at: 0 };
        }
    }
    return r;
}

function getTierInfo(userJid) {
    const r = get(userJid);
    const tier = getTier(r.score);
    const next = getNextTier(r.score);
    return { score: r.score, tier, next, tierKey: tier.tier };
}

function checkDailyLimit(userJid, eventType) {
    const limit = DAILY_LIMIT[eventType];
    if (!limit) return true;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startTs = Math.floor(todayStart.getTime() / 1000);

    try {
        const count = db.prepare(
            'SELECT COUNT(*) as c FROM reputation_events WHERE user_jid = ? AND event_type = ? AND created_at >= ?'
        ).get(userJid, eventType, startTs).c;
        return count < limit;
    } catch (_) { return true; }
}

function addRep(userJid, eventType, customDelta = null) {
    let delta = customDelta;
    if (delta === null) {
        if (GAINS[eventType] !== undefined) delta = GAINS[eventType];
        else if (LOSSES[eventType] !== undefined) delta = LOSSES[eventType];
        else return { ok: false, reason: 'unknown_event' };
    }

    if (delta > 0 && DAILY_LIMIT[eventType] !== undefined) {
        if (!checkDailyLimit(userJid, eventType)) {
            return { ok: false, reason: 'daily_limit' };
        }
    }

    get(userJid);
    try {
        db.prepare('UPDATE user_reputation SET score = score + ?, updated_at = strftime(\'%s\',\'now\') WHERE user_jid = ?')
          .run(delta, userJid);
        db.prepare('INSERT INTO reputation_events (user_jid, event_type, delta) VALUES (?, ?, ?)')
          .run(userJid, eventType, delta);
    } catch (_) {}

    const newScore = get(userJid).score;
    const newTier = getTier(newScore);
    return { ok: true, delta, newScore, tier: newTier };
}

module.exports = { get, getTier, getNextTier, getTierInfo, addRep, checkDailyLimit, TIERS };
