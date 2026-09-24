/**
 * 👻 Protection Service
 */
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9-]+\.(com|net|org|io|me|co|info|xyz|app|dev|tv|gg)(\/[^\s]*)?)/gi;
const MENTION_LIMIT = 10;

function hasLink(text) {
    if (!text) return false;
    URL_REGEX.lastIndex = 0;
    return URL_REGEX.test(text);
}

function extractLinks(text) {
    if (!text) return [];
    URL_REGEX.lastIndex = 0;
    return text.match(URL_REGEX) || [];
}

function hasMassMention(msg) {
    const ctx = msg.message?.extendedTextMessage?.contextInfo
        || msg.message?.imageMessage?.contextInfo
        || msg.message?.videoMessage?.contextInfo
        || null;
    if (!ctx) return false;
    const mentions = ctx.mentionedJid || [];
    return mentions.length >= MENTION_LIMIT;
}

function getMediaType(msg) {
    const m = msg.message || {};
    if (m.imageMessage) return 'image';
    if (m.videoMessage) return 'video';
    if (m.documentMessage) return 'file';
    if (m.audioMessage) return 'audio';
    if (m.stickerMessage) return 'sticker';
    return null;
}

function check(msg, settings) {
    const text = msg.message?.conversation
        || msg.message?.extendedTextMessage?.text
        || msg.message?.imageMessage?.caption
        || msg.message?.videoMessage?.caption
        || '';

    const violations = [];

    if (settings.link_protection === 1 && hasLink(text)) {
        violations.push({ type: 'link', reason: 'رابط' });
    }

    if (settings.mention_protection === 1 && hasMassMention(msg)) {
        violations.push({ type: 'mention', reason: 'منشن جماعي' });
    }

    const media = getMediaType(msg);
    if (media === 'image' && settings.image_protection === 1) {
        violations.push({ type: 'image', reason: 'صورة' });
    }
    if (media === 'video' && settings.video_protection === 1) {
        violations.push({ type: 'video', reason: 'فيديو' });
    }
    if (media === 'file' && settings.file_protection === 1) {
        violations.push({ type: 'file', reason: 'ملف' });
    }

    return violations;
}

module.exports = { hasLink, extractLinks, hasMassMention, getMediaType, check };
