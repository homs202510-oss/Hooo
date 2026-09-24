/**
 * 👻 PHANTOM — Event System
 */
const db = require('./core-database');

const listeners = new Map();

function on(eventType, handler) {
    if (!listeners.has(eventType)) listeners.set(eventType, []);
    listeners.get(eventType).push(handler);
}

async function emit(eventType, data) {
    const handlers = listeners.get(eventType) || [];
    for (const h of handlers) {
        try { await h(data); } catch (e) {
            console.error(`Event ${eventType} error:`, e.message);
        }
    }
}

function logEvent(eventType, userJid, meta) {
    try {
        db.prepare('INSERT INTO reputation_events (user_jid, event_type, delta, created_at) VALUES (?, ?, ?, strftime(\'%s\',\'now\'))')
          .run(userJid, eventType, meta?.delta || 0);
    } catch (_) {}
}

module.exports = { on, emit, logEvent };
