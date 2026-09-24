const db = require('./core-database');

function getState(jid) {
    let s = db.prepare('SELECT * FROM ai_state WHERE user_jid = ?').get(jid);
    if (!s) {
        db.prepare('INSERT INTO ai_state (user_jid) VALUES (?)').run(jid);
        s = db.prepare('SELECT * FROM ai_state WHERE user_jid = ?').get(jid);
    }
    return s;
}

function incrementMsg(jid) {
    getState(jid);
    db.prepare('UPDATE ai_state SET total_msgs = total_msgs + 1 WHERE user_jid = ?').run(jid);
}

function incrementAiMsg(jid) {
    getState(jid);
    db.prepare('UPDATE ai_state SET ai_msgs = ai_msgs + 1, last_ai_at = strftime(\'%s\',\'now\') WHERE user_jid = ?').run(jid);
}

function setEnabled(jid, enabled) {
    getState(jid);
    db.prepare('UPDATE ai_state SET enabled = ? WHERE user_jid = ?').run(enabled ? 1 : 0, jid);
}

function isEnabled(jid) {
    return getState(jid).enabled === 1;
}

function setStyle(jid, style) {
    getState(jid);
    db.prepare('UPDATE ai_state SET style = ? WHERE user_jid = ?').run(style, jid);
}

// Rate limit: 1 طلب AI كل 4 ثواني
const MIN_GAP_SEC = 4;
function canRequest(jid) {
    const s = getState(jid);
    const now = Math.floor(Date.now() / 1000);
    if (now - (s.last_ai_at || 0) < MIN_GAP_SEC) {
        return { ok: false, wait: MIN_GAP_SEC - (now - s.last_ai_at) };
    }
    return { ok: true };
}

module.exports = { getState, incrementMsg, incrementAiMsg, setEnabled, isEnabled, setStyle, canRequest, MIN_GAP_SEC };
