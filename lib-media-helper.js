/**
 * 👻 Media Helper — مشترك
 */
const media = require('./svc-media');
const mediaTx = require('./mod-mediaTransactions');
const user = require('./mod-user');
const history = require('./mod-history');
const config = require('./mod-mediaConfig');

async function getReplyMedia(ctx) {
    const ctxInfo = ctx.msg.message?.extendedTextMessage?.contextInfo;
    if (!ctxInfo?.quotedMessage) return null;

    return {
        key: {
            remoteJid: ctx.jid,
            id: ctxInfo.stanzaId,
            fromMe: false,
            participant: ctxInfo.participant,
        },
        message: ctxInfo.quotedMessage,
    };
}

async function getAttachedMedia(ctx) {
    const m = ctx.msg.message;
    if (m?.imageMessage || m?.videoMessage || m?.audioMessage || m?.documentMessage || m?.stickerMessage) {
        return ctx.msg;
    }
    return null;
}

async function getMediaMsg(ctx) {
    return (await getAttachedMedia(ctx)) || (await getReplyMedia(ctx));
}

function errorNoMedia(ctx) {
    return ctx.card('👻 أدوات PHANTOM', [
        { emoji: '📎', title: 'ابعت الوسائط', content: '𓆩✦𓆪 ابعت الملف أو اعمل Reply عليه واكتب الأمر' },
        { emoji: '💰', title: 'التكلفة', content: `${config.MEDIA_TOOL_COST} نقطة` },
    ]);
}

async function checkUser(ctx) {
    user.getOrCreate(ctx.sender, ctx.pushName);
    const chk = mediaTx.checkBalance(ctx.sender);
    if (!chk.ok) {
        await ctx.card('❌ رصيد غير كافي', [
            { emoji: '💳', title: 'رصيدك', content: `${chk.balance} نقطة` },
            { emoji: '💰', title: 'التكلفة', content: `${chk.cost} نقطة` },
        ]);
        return false;
    }
    return true;
}

async function checkHeavy(ctx, cmd) {
    const r = mediaTx.checkHeavyRate(ctx.sender, cmd);
    if (!r.ok) {
        if (r.reason === 'too_fast') {
            await ctx.error(`⏳ استنى ${r.wait} ثانية قبل العملية الجاية`);
        } else if (r.reason === 'daily_limit') {
            await ctx.error(`🌙 وصلت الحد اليومي (${r.max} عملية)`);
        }
        return false;
    }
    return true;
}

module.exports = {
    getMediaMsg,
    getReplyMedia,
    getAttachedMedia,
    errorNoMedia,
    checkUser,
    checkHeavy,
    media,
    mediaTx,
    config,
    user,
    history,
    // ✅ Aliases مباشرة
    newJobId: media.newJobId,
    createJobDir: media.createJobDir,
    cleanupJobDir: media.cleanupJobDir,
    downloadMedia: media.downloadMedia,
    readFile: media.readFile,
};
