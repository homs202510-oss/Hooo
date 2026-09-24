/**
 * 👻 PHANTOM — Media Transactions
 * ضمان: no charge on failure + refund on send fail + idempotency
 */
const db = require('./core-database');
const config = require('./mod-mediaConfig');
const events = require('./mod-events');
const crypto = require('crypto');

/**
 * بدء job
 */
function startJob(userJid, command, mediaType) {
    const id = crypto.randomBytes(8).toString('hex');
    db.prepare(
        'INSERT INTO media_jobs (id, user_jid, command, media_type, cost, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, userJid, command, mediaType || null, config.MEDIA_TOOL_COST, 'pending');
    return id;
}

function updateJob(id, fields) {
    const allowed = ['input_size', 'output_size', 'processing_ms', 'status', 'error_code', 'transaction_id'];
    const keys = Object.keys(fields).filter(k => allowed.includes(k));
    if (!keys.length) return;

    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = keys.map(k => fields[k]);
    db.prepare(`UPDATE media_jobs SET ${sets} WHERE id = ?`).run(...vals, id);
}

/**
 * فحص رصيد
 */
function checkBalance(userJid, cost = null) {
    const user = require('./mod-user');
    const amount = cost === null ? config.MEDIA_TOOL_COST : cost;
    const bal = user.getCoins(userJid);
    return { ok: bal >= amount, balance: bal, cost: amount };
}

/**
 * خصم (يتم بعد نجاح الإرسال)
 */
function charge(userJid, jobId, amount = null) {
    const user = require('./mod-user');
    const cost = amount === null ? config.MEDIA_TOOL_COST : amount;

    try {
        db.exec('BEGIN IMMEDIATE');
        const bal = user.getCoins(userJid);
        if (bal < cost) { db.exec('ROLLBACK'); return { ok: false, reason: 'insufficient', balance: bal }; }

        db.prepare('UPDATE users SET coins = coins - ? WHERE jid = ?').run(cost, userJid);
        const txId = 'media_' + jobId;
        updateJob(jobId, { status: 'charged', transaction_id: txId });
        db.exec('COMMIT');
        return { ok: true, transactionId: txId, newBalance: bal - cost };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

/**
 * استرجاع
 */
function refund(userJid, jobId, amount = null) {
    const user = require('./mod-user');
    const cost = amount === null ? config.MEDIA_TOOL_COST : amount;

    try {
        db.exec('BEGIN IMMEDIATE');
        const job = db.prepare('SELECT * FROM media_jobs WHERE id = ?').get(jobId);
        if (!job || job.status !== 'charged') { db.exec('ROLLBACK'); return { ok: false, reason: 'not_charged' }; }

        db.prepare('UPDATE users SET coins = coins + ? WHERE jid = ?').run(cost, userJid);
        updateJob(jobId, { status: 'refunded' });
        db.exec('COMMIT');
        return { ok: true, newBalance: user.getCoins(userJid) };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

/**
 * Rate limit للأدوات الثقيلة
 */
function checkHeavyRate(userJid, command) {
    if (!config.heavyRate.heavyCommands.includes(command)) return { ok: true };

    const today = new Date().toISOString().slice(0, 10);
    let row = db.prepare('SELECT * FROM media_rate WHERE user_jid = ?').get(userJid);
    if (!row) {
        db.prepare('INSERT INTO media_rate (user_jid) VALUES (?)').run(userJid);
        row = db.prepare('SELECT * FROM media_rate WHERE user_jid = ?').get(userJid);
    }

    const now = Math.floor(Date.now() / 1000);

    if (row.day !== today) {
        db.prepare('UPDATE media_rate SET day = ?, count_today = 0 WHERE user_jid = ?').run(today, userJid);
        row.count_today = 0;
    }

    if (now - row.last_heavy_at < config.heavyRate.minGapSec) {
        return { ok: false, reason: 'too_fast', wait: config.heavyRate.minGapSec - (now - row.last_heavy_at) };
    }

    if (row.count_today >= config.heavyRate.maxPerDay) {
        return { ok: false, reason: 'daily_limit', max: config.heavyRate.maxPerDay };
    }

    return { ok: true };
}

function recordHeavy(userJid) {
    const today = new Date().toISOString().slice(0, 10);
    const now = Math.floor(Date.now() / 1000);
    db.prepare('UPDATE media_rate SET last_heavy_at = ?, count_today = count_today + 1, day = ? WHERE user_jid = ?')
      .run(now, today, userJid);
}

module.exports = { startJob, updateJob, checkBalance, charge, refund, checkHeavyRate, recordHeavy };
