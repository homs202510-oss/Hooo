/**
 * 👻 PHANTOM AI — Memory System
 */
const db = require('./core-database');

const MAX_MEMORY_PER_USER = 50;
const MAX_CONVO_PER_USER = 20;

function addMemory(jid, fact, category = 'general', importance = 1) {
    if (!fact || fact.length < 2 || fact.length > 300) return false;

    // منع التكرار
    const existing = db.prepare('SELECT id FROM ai_memory WHERE user_jid = ? AND fact = ?').get(jid, fact);
    if (existing) return false;

    db.prepare('INSERT INTO ai_memory (user_jid, fact, category, importance) VALUES (?, ?, ?, ?)')
      .run(jid, fact, category, importance);

    // تقليم الذاكرة
    const count = db.prepare('SELECT COUNT(*) as c FROM ai_memory WHERE user_jid = ?').get(jid).c;
    if (count > MAX_MEMORY_PER_USER) {
        db.prepare(`DELETE FROM ai_memory WHERE id IN (
            SELECT id FROM ai_memory WHERE user_jid = ? ORDER BY importance ASC, created_at ASC LIMIT ?
        )`).run(jid, count - MAX_MEMORY_PER_USER);
    }
    return true;
}

function getMemory(jid, limit = 15) {
    return db.prepare('SELECT fact, category, importance FROM ai_memory WHERE user_jid = ? ORDER BY importance DESC, created_at DESC LIMIT ?')
        .all(jid, limit);
}

function clearMemory(jid) {
    db.prepare('DELETE FROM ai_memory WHERE user_jid = ?').run(jid);
}

function getMemoryCount(jid) {
    return db.prepare('SELECT COUNT(*) as c FROM ai_memory WHERE user_jid = ?').get(jid).c;
}

// ═══ Conversation context ═══
function addConvo(jid, role, content) {
    if (!content) return;
    db.prepare('INSERT INTO ai_convos (user_jid, role, content) VALUES (?, ?, ?)').run(jid, role, content);

    const count = db.prepare('SELECT COUNT(*) as c FROM ai_convos WHERE user_jid = ?').get(jid).c;
    if (count > MAX_CONVO_PER_USER * 2) {
        db.prepare(`DELETE FROM ai_convos WHERE id IN (
            SELECT id FROM ai_convos WHERE user_jid = ? ORDER BY id ASC LIMIT ?
        )`).run(jid, count - MAX_CONVO_PER_USER);
    }
}

function getConvo(jid, limit = 8) {
    const rows = db.prepare('SELECT role, content FROM ai_convos WHERE user_jid = ? ORDER BY id DESC LIMIT ?').all(jid, limit);
    return rows.reverse();
}

function clearConvo(jid) {
    db.prepare('DELETE FROM ai_convos WHERE user_jid = ?').run(jid);
}

module.exports = {
    addMemory, getMemory, clearMemory, getMemoryCount,
    addConvo, getConvo, clearConvo,
    MAX_MEMORY_PER_USER, MAX_CONVO_PER_USER,
};
