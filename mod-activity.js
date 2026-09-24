const db = require('./core-database');

function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function ensure(jid) {
    const day = today();
    let row = db.prepare('SELECT * FROM activity WHERE user_jid = ? AND day = ?').get(jid, day);
    if (!row) {
        db.prepare('INSERT INTO activity (user_jid, day) VALUES (?, ?)').run(jid, day);
        row = db.prepare('SELECT * FROM activity WHERE user_jid = ? AND day = ?').get(jid, day);
    }
    return row;
}

function trackMessage(jid) {
    ensure(jid);
    db.prepare('UPDATE activity SET messages = messages + 1 WHERE user_jid = ? AND day = ?').run(jid, today());
}

function trackCommand(jid) {
    ensure(jid);
    db.prepare('UPDATE activity SET commands = commands + 1 WHERE user_jid = ? AND day = ?').run(jid, today());
}

function trackAiMsg(jid) {
    ensure(jid);
    db.prepare('UPDATE activity SET ai_msgs = ai_msgs + 1 WHERE user_jid = ? AND day = ?').run(jid, today());
}

function trackXP(jid, amount) {
    ensure(jid);
    db.prepare('UPDATE activity SET xp_earned = xp_earned + ? WHERE user_jid = ? AND day = ?').run(amount, jid, today());
}

function getToday(jid) { return ensure(jid); }

function getLast7(jid) {
    return db.prepare('SELECT * FROM activity WHERE user_jid = ? ORDER BY day DESC LIMIT 7').all(jid);
}

function getTotal(jid) {
    return db.prepare(`
        SELECT
            COALESCE(SUM(messages), 0) as messages,
            COALESCE(SUM(commands), 0) as commands,
            COALESCE(SUM(ai_msgs), 0) as ai_msgs,
            COALESCE(SUM(xp_earned), 0) as xp_earned
        FROM activity WHERE user_jid = ?
    `).get(jid);
}

module.exports = { trackMessage, trackCommand, trackAiMsg, trackXP, getToday, getLast7, getTotal, today };
