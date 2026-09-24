/**
 * 👻 PHANTOM — تطبيع النص العربي
 * بيخلي الأوامر تتحمل الأخطاء الإملائية
 */

/**
 * الحروف المتشابهة → شكل موحد
 */
const CHAR_MAP = {
    'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا',
    'ة': 'ه',
    'ى': 'ي',
    'ؤ': 'و',
    'ئ': 'ي',
    'ﻻ': 'لا',
    'ﻷ': 'لا', 'ﻹ': 'لا', 'ﻵ': 'لا',
};

const DIACRITICS = /[\u064B-\u065F\u0670\u0640]/g; // تشكيل + تطويل

/**
 * تطبيع نص عربي للبحث
 */
function normalize(text) {
    if (!text || typeof text !== 'string') return '';
    let out = text.toLowerCase().trim();
    out = out.replace(DIACRITICS, '');
    out = out.split('').map(ch => CHAR_MAP[ch] || ch).join('');
    return out;
}

module.exports = { normalize };
