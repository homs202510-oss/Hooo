const db = require('./core-database');

/**
 * نظام تهنئة مركزي
 * كل تقدم مهم يبعث مرة واحدة فقط (UNIQUE على user+event+key)
 */

function alreadySent(jid, eventType, eventKey) {
    const r = db.prepare('SELECT id FROM notifications_log WHERE user_jid = ? AND event_type = ? AND event_key = ?')
        .get(jid, eventType, eventKey);
    return !!r;
}

function markSent(jid, eventType, eventKey) {
    try {
        db.prepare('INSERT OR IGNORE INTO notifications_log (user_jid, event_type, event_key) VALUES (?, ?, ?)')
          .run(jid, eventType, eventKey);
    } catch (_) {}
}

/**
 * يبعث تهنئة عبر ctx (مع منشن)
 */
async function notify(ctx, title, message, opts = {}) {
    const eventType = opts.eventType || 'generic';
    const eventKey = opts.eventKey || Date.now().toString();

    if (alreadySent(ctx.sender, eventType, eventKey)) return false;

    const content = `🎉 *مبروك* @${ctx.senderNumber}!\n\n${message}`;
    const mentions = [ctx.sender, ...(opts.extraMentions || [])];

    try {
        await ctx.sock.sendMessage(ctx.jid, { text: content, mentions });
        markSent(ctx.sender, eventType, eventKey);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * تهنئة رتبة
 */
async function notifyRank(ctx, rankName, rankId) {
    return notify(ctx, 'ترقية', `${rankName}\n\nرقم ${rankId} من 8\n\nاستمر في التقدم 👻`, {
        eventType: 'rank', eventKey: `rank_${rankId}`,
    });
}

/**
 * تهنئة إنجاز
 */
async function notifyAchievement(ctx, ach) {
    return notify(ctx, 'إنجاز', `🏆 *${ach.name}*\n${ach.desc}`, {
        eventType: 'achievement', eventKey: ach.id,
    });
}

/**
 * تهنئة عنصر نادر
 */
async function notifyRareItem(ctx, item) {
    return notify(ctx, 'rare', `${item.emoji} *${item.name}*\n\nحصلت على عنصر ${item.rarity || 'نادر'}!`, {
        eventType: 'rare_item', eventKey: `${item.id}_${Math.floor(Date.now()/1000)}`,
    });
}

/**
 * تهنئة انتصار
 */
async function notifyWin(ctx, targetName) {
    return notify(ctx, 'win', `⚔️ انتصرت على *${targetName}*!`, {
        eventType: 'win', eventKey: `win_${targetName}_${Math.floor(Date.now()/60000)}`,
    });
}

module.exports = {
    notify, notifyRank, notifyAchievement, notifyRareItem, notifyWin,
    alreadySent, markSent,
};
