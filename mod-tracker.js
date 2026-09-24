const db = require('./core-database');

/**
 * 📊 إحصائيات تراكمية للمستخدم
 */

function ensureStats(jid) {
    const existing = db.prepare('SELECT * FROM user_stats WHERE user_jid = ?').get(jid);
    if (!existing) {
        db.prepare('INSERT INTO user_stats (user_jid) VALUES (?)').run(jid);
        return db.prepare('SELECT * FROM user_stats WHERE user_jid = ?').get(jid);
    }
    return existing;
}

function getStats(jid) {
    return db.prepare('SELECT * FROM user_stats WHERE user_jid = ?').get(jid) || null;
}

function track(jid, eventType, amount = 1) {
    ensureStats(jid);
    const allowed = [
        'work_count', 'daily_count', 'transfer_count', 'market_buys', 'market_sells',
        'train_count', 'attack_count', 'wins_count', 'explorations_count',
        'adventures_count', 'adventures_won',
    ];
    if (!allowed.includes(eventType)) return;
    db.prepare(`UPDATE user_stats SET ${eventType} = ${eventType} + ?, updated_at = strftime('%s','now') WHERE user_jid = ?`)
      .run(amount, jid);
}

function markAreaVisited(jid, areaId) {
    ensureStats(jid);
    const stats = getStats(jid);
    let visited = [];
    try { visited = JSON.parse(stats.areas_visited || '[]'); } catch (_) {}
    if (!visited.includes(areaId)) {
        visited.push(areaId);
        db.prepare('UPDATE user_stats SET areas_visited = ?, updated_at = strftime(\'%s\',\'now\') WHERE user_jid = ?')
          .run(JSON.stringify(visited), jid);
    }
}

function hasVisitedArea(jid, areaId) {
    const stats = getStats(jid);
    if (!stats) return false;
    try {
        const visited = JSON.parse(stats.areas_visited || '[]');
        return visited.includes(areaId);
    } catch (_) { return false; }
}

module.exports = { ensureStats, getStats, track, markAreaVisited, hasVisitedArea };
