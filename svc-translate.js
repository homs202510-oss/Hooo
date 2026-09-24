/**
 * 👻 Translation Service v2
 * - Auto-detect source
 * - Translate to all languages
 */
const axios = require('axios');

const LANGS = {
    ar: 'العربية 🇸🇦', en: 'English 🇬🇧', fr: 'Français 🇫🇷', de: 'Deutsch 🇩🇪',
    es: 'Español 🇪🇸', it: 'Italiano 🇮🇹', pt: 'Português 🇵🇹', tr: 'Türkçe 🇹🇷',
    ru: 'Русский 🇷🇺', zh: '中文 🇨🇳', ja: '日本語 🇯🇵', ko: '한국어 🇰🇷',
    hi: 'हिन्दी 🇮🇳', ur: 'اردو 🇵🇰', fa: 'فارسی 🇮🇷', nl: 'Nederlands 🇳🇱',
    pl: 'Polski 🇵🇱', el: 'Ελληνικά 🇬🇷', he: 'עברית 🇮🇱', sv: 'Svenska 🇸🇪',
    no: 'Norsk 🇳🇴', da: 'Dansk 🇩🇰', fi: 'Suomi 🇫🇮', cs: 'Čeština 🇨🇿',
    ro: 'Română 🇷🇴', hu: 'Magyar 🇭🇺', id: 'Indonesia 🇮🇩', ms: 'Melayu 🇲🇾',
    vi: 'Tiếng Việt 🇻🇳', th: 'ไทย 🇹🇭', uk: 'Українська 🇺🇦',
};

const ALIASES = {
    'عربي': 'ar', 'عربية': 'ar', 'انجليزي': 'en', 'إنجليزي': 'en', 'english': 'en',
    'فرنسي': 'fr', 'فرنساوي': 'fr', 'ألماني': 'de', 'الماني': 'de',
    'اسباني': 'es', 'إسباني': 'es', 'ايطالي': 'it', 'إيطالي': 'it',
    'برتغالي': 'pt', 'تركي': 'tr', 'روسي': 'ru', 'صيني': 'zh',
    'ياباني': 'ja', 'كوري': 'ko', 'هندي': 'hi', 'فارسي': 'fa',
};

function resolveLang(input) {
    if (!input) return null;
    const lc = String(input).toLowerCase().trim();
    if (LANGS[lc]) return lc;
    if (ALIASES[input] || ALIASES[lc]) return ALIASES[input] || ALIASES[lc];
    return null;
}

/**
 * كشف لغة النص
 */
function detectLang(text) {
    if (!text) return 'en';
    // عربي؟
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    // صيني/ياباني/كوري؟
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
    if (/[\u3040-\u30FF]/.test(text)) return 'ja';
    if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
    // روسي؟
    if (/[\u0400-\u04FF]/.test(text)) return 'ru';
    // هندي؟
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    // إنجليزي/لاتيني
    return 'en';
}

/**
 * ترجمة نص واحد
 */
async function translateOne(text, targetLang, sourceLang = null) {
    if (!text) return { ok: false, reason: 'empty' };
    if (text.length > 500) text = text.substring(0, 500);

    const src = sourceLang || detectLang(text);
    if (src === targetLang) return { ok: true, text: text, same: true };

    try {
        const res = await axios.get('https://api.mymemory.translated.net/get', {
            params: { q: text, langpair: `${src}|${targetLang}` },
            timeout: 12000,
        });

        const out = res.data?.responseData?.translatedText;
        if (!out) return { ok: false, reason: 'no_translation' };
        // MyMemory بيرجع رسائل خطأ كنص
        if (typeof out === 'string' && out.includes('INVALID')) return { ok: false, reason: 'invalid' };
        return { ok: true, text: out };
    } catch (e) {
        return { ok: false, reason: 'request_failed', error: e.message };
    }
}

/**
 * ترجمة لكل اللغات بالتوازي
 * @param {string} text
 * @param {number} limit عدد أقصى للغات (افتراضي: كلهم)
 * @returns {Promise<Array<{lang, name, text}>>}
 */
async function translateAll(text, limit = null) {
    const langs = Object.keys(LANGS);
    const list = limit ? langs.slice(0, limit) : langs;
    const results = [];

    // دفعات من 5 بالتوازي (عشان ما نعملش ضغط على API)
    const BATCH = 5;
    for (let i = 0; i < list.length; i += BATCH) {
        const batch = list.slice(i, i + BATCH);
        const promises = batch.map(async (lang) => {
            const r = await translateOne(text, lang);
            if (r.ok && r.text && !r.same) {
                return { lang, name: LANGS[lang], text: r.text };
            }
            return null;
        });
        const batchRes = await Promise.all(promises);
        for (const r of batchRes) if (r) results.push(r);
    }

    return results;
}

module.exports = { translate: translateOne, translateOne, translateAll, resolveLang, detectLang, LANGS, ALIASES };
