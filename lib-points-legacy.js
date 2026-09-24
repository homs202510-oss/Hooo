/**
 * 💰 PHANTOM — نظام نقاط موحد
 * الملفات القديمة (كونيكت، لفيديو) كانت بتستخدم ملف db-points.json منفصل.
 * دلوقتي بقت كلها بتقرا وتكتب على نفس عملة PHANTOM (phantom.db عبر mod-user)
 * عشان يكون في اقتصاد واحد بس في كل البوت.
 */
const user = require('./mod-user');

function getUserInfo(jid) {
    user.getOrCreate(jid);
    const balance = user.getCoins(jid);
    return { balance, points: balance };
}

function processAddition(jid, amount, reason) {
    user.getOrCreate(jid);
    const balance = user.addCoins(jid, Math.round(Number(amount) || 0));
    return { ok: true, balance, reason };
}

function processDeduction(jid, amount, reason) {
    user.getOrCreate(jid);
    const amt = Math.round(Number(amount) || 0);
    const current = user.getCoins(jid);
    if (current < amt) return { ok: false, balance: current, reason: 'insufficient' };
    const balance = user.removeCoins(jid, amt);
    return { ok: true, balance, reason };
}

function isSystemEnabled() { return true; }

module.exports = { getUserInfo, processAddition, processDeduction, isSystemEnabled };
