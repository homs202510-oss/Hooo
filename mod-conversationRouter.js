/**
 * 👻 PHANTOM — Conversation Router v2
 * كشف أقوى للـ Reply/Mention
 */
const { isSameUser, extractNumber } = require('./mod-jid');

/**
 * استخرج contextInfo من أي نوع رسالة
 */
function getContextInfo(msg) {
    const m = msg.message || {};
    return (
        m.extendedTextMessage?.contextInfo ||
        m.imageMessage?.contextInfo ||
        m.videoMessage?.contextInfo ||
        m.audioMessage?.contextInfo ||
        m.documentMessage?.contextInfo ||
        m.stickerMessage?.contextInfo ||
        m.buttonsResponseMessage?.contextInfo ||
        m.listResponseMessage?.contextInfo ||
        m.templateButtonReplyMessage?.contextInfo ||
        null
    );
}

/**
 * هل الرسالة رد على البوت؟
 */
function isReplyToBot(msg, botJids) {
    const ctx = getContextInfo(msg);
    if (!ctx) return false;

    const participant = ctx.participant;
    if (!participant) return false;

    for (const botJid of botJids) {
        if (!botJid) continue;
        if (isSameUser(participant, botJid)) return true;
    }
    return false;
}

/**
 * هل الرسالة فيها mention للبوت؟
 */
function isMentioningBot(msg, botJids) {
    const ctx = getContextInfo(msg);
    if (!ctx) return false;

    const mentioned = ctx.mentionedJid || [];
    for (const botJid of botJids) {
        if (!botJid) continue;
        const num = extractNumber(botJid);
        if (mentioned.some(m => extractNumber(m) === num)) return true;
    }
    return false;
}

/**
 * استخرج نص الرسالة
 */
function extractText(msg) {
    const m = msg.message || {};
    return (
        m.conversation ||
        m.extendedTextMessage?.text ||
        m.imageMessage?.caption ||
        m.videoMessage?.caption ||
        ''
    );
}

/**
 * نظّف mention من النص
 */
function cleanText(text, botNumbers) {
    if (!text) return '';
    let cleaned = text;
    for (const num of botNumbers) {
        if (!num) continue;
        cleaned = cleaned.replace(new RegExp(`@${num}`, 'g'), '');
    }
    return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * فحص هل الرسالة موجهة للبوت
 * @param {Object} msg الرسالة
 * @param {Array<string>} botJids قائمة JIDs المحتملة للبوت
 */
function checkDirected(msg, botJids) {
    const text = extractText(msg);
    const botNumbers = botJids.map(extractNumber).filter(Boolean);

    const reply = isReplyToBot(msg, botJids);
    const mention = isMentioningBot(msg, botJids);

    if (reply || mention) {
        const cleaned = cleanText(text, botNumbers);
        return {
            directed: true,
            reason: reply ? (mention ? 'reply+mention' : 'reply') : 'mention',
            cleanText: cleaned || text,
            rawText: text,
        };
    }

    return { directed: false, reason: null, cleanText: text, rawText: text };
}

/**
 * اجلب كل JIDs المحتملة للبوت
 */
function getBotJids(sock) {
    const jids = new Set();

    if (sock?.user?.id) {
        jids.add(sock.user.id);
        // من غير :device
        const num = extractNumber(sock.user.id);
        jids.add(num + '@s.whatsapp.net');
        jids.add(num + '@lid');
    }

    // من sock.user.lid لو موجود
    if (sock?.user?.lid) jids.add(sock.user.lid);
    if (sock?.user?.phoneNumber) jids.add(sock.user.phoneNumber);

    return Array.from(jids).filter(Boolean);
}

module.exports = {
    getContextInfo,
    isReplyToBot,
    isMentioningBot,
    extractText,
    cleanText,
    checkDirected,
    getBotJids,
};
