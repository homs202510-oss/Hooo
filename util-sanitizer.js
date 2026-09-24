/**
 * 👻 PHANTOM — Response Sanitizer
 */
function sanitizeResponse(text) {
    if (!text || typeof text !== 'string') return '';

    let cleaned = text;

    // شيل 👻 من بداية الرد (هتتضاف بعدين يدوياً)
    cleaned = cleaned.replace(/^[\s👻]+/u, '');

    // شيل @mentions مكررة من البداية
    cleaned = cleaned.replace(/^(@\S+\s*)+/g, '');

    // شيل أسطر فاضية متكررة (أكتر من 2)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // شيل المسافات الزيادة (بس مش newlines)
    cleaned = cleaned.replace(/[ \t]+/g, ' ');

    // trim
    cleaned = cleaned.trim();

    return cleaned;
}

/**
 * فحص هل الرد صالح للإرسال
 */
function isValidResponse(text) {
    if (!text) return false;
    if (typeof text !== 'string') return false;

    const cleaned = text.trim();

    // أقل من حرفين → فاضي
    if (cleaned.length < 3) return false;

    // لو مجرد إيموجي / رموز / مسافات
    if (/^[👻🎭✨🔥💎⚔️🛡️👑\s\u200f\u200e]+$/u.test(cleaned)) return false;

    // لو مجرد "؟" أو "..." أو نقط
    if (/^[؟?!.,،\s]+$/.test(cleaned)) return false;

    return true;
}

module.exports = { sanitizeResponse, isValidResponse };
