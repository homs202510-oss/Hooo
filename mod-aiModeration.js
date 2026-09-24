/**

// ═══ حماية المطور والمالك ═══
function isProtectedUser(jid) {
    try {
        const config = require('./config');
        const dev = require('./mod-developer');
        const num = jid.split('@')[0].split(':')[0];
        if (num === config.ownerNumber) return true;
        if (dev.isDeveloper(jid)) return true;
    } catch (_) {}
    return false;
}
 * 👻 PHANTOM — AI Moderation v6
 * كامل بدون أي دوال ناقصة
 */
const db = require('./core-database');
const config = require('./config');

// ═══ قوائم الشتيمة ═══
const PROFANITY_MILD = [
    'كلب', 'حمار', 'غبي', 'أهبل', 'بليد', 'خنزير', 'حقير', 'زبالة', 'قذر',
    'تافه', 'معتوه', 'مجنون', 'خرف', 'جبان', 'نصاب', 'كذاب', 'خسيس',
    'مقرف', 'قرف', 'عيال', 'سخيف', 'هبل',
];

const PROFANITY_SEVERE = [
    'كس', 'طيز', 'شرموط', 'عرص', 'خول', 'زاني', 'زانية',
    'نيك', 'منيك', 'متناك', 'قحبة', 'عاهرة',
    'يلعن', 'يلعنك', 'يلعن أبوك', 'يلعن دينك', 'يلعن دين',
];

const APOLOGY_KEYWORDS = [
    'اسف', 'أسف', 'اسفه', 'أسفه', 'اسفة', 'أسفة',
    'معلش', 'اتأسف', 'اعتذر', 'أعتذر',
    'انا اسف', 'أنا أسف', 'بعتذر', 'بعتذرلك', 'متأسف',
    'سامحني', 'سامحنى', 'اعذرني', 'اعزرني',
];

function normalizeText(text) {
    if (!text) return '';
    return text
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '')
        .toLowerCase();
}

function detectProfanity(text) {
    const t = normalizeText(text);
    const found = { mild: [], severe: [] };
    for (const w of PROFANITY_SEVERE) {
        if (t.includes(normalizeText(w))) found.severe.push(w);
    }
    for (const w of PROFANITY_MILD) {
        if (t.includes(normalizeText(w))) found.mild.push(w);
    }
    if (found.severe.length) return { level: 'severe', words: found.severe };
    if (found.mild.length) return { level: 'mild', words: found.mild };
    return { level: 'none', words: [] };
}

function detectApology(text) {
    const t = normalizeText(text);
    for (const w of APOLOGY_KEYWORDS) {
        if (t.includes(normalizeText(w))) return true;
    }
    return false;
}

// ═══ حالة التحذيرات ═══
function getModState(jid) {
    let s = db.prepare('SELECT * FROM ai_moderation WHERE user_jid = ?').get(jid);
    if (!s) {
        db.prepare('INSERT INTO ai_moderation (user_jid) VALUES (?)').run(jid);
        s = db.prepare('SELECT * FROM ai_moderation WHERE user_jid = ?').get(jid);
    }
    return s;
}

function bumpWarning(jid) {
    getModState(jid);
    db.prepare("UPDATE ai_moderation SET warnings = 1, last_warning = strftime('%s','now'), profanity_count = profanity_count + 1 WHERE user_jid = ?").run(jid);
    return 1;
}

function resetWarnings(jid) {
    getModState(jid);
    db.prepare('UPDATE ai_moderation SET warnings = 0, profanity_count = 0 WHERE user_jid = ?').run(jid);
}

function markApologyUsed(jid) {
    getModState(jid);
    db.prepare("UPDATE ai_moderation SET apology_used = 1, last_apology = strftime('%s','now') WHERE user_jid = ?").run(jid);
}

function wasApologyUsed(jid) {
    try {
        const s = getModState(jid);
        return s.apology_used === 1;
    } catch (_) { return false; }
}

function setBlockedUntil(jid, timestamp) {
    try {
        getModState(jid);
        db.prepare('UPDATE ai_moderation SET blocked_until = ? WHERE user_jid = ?').run(timestamp, jid);
    } catch (_) {}
}

function getBlockedUntil(jid) {
    try {
        const s = getModState(jid);
        return s.blocked_until || 0;
    } catch (_) {
        return 0;
    }
}

function clearAllState(jid) {
    try {
        getModState(jid);
        db.prepare('UPDATE ai_moderation SET warnings = 0, profanity_count = 0, apology_used = 0, blocked_until = 0 WHERE user_jid = ?').run(jid);
    } catch (_) {}
}

function logBlock(jid, reason, weeks) {
    weeks = weeks || 1;
    const now = Math.floor(Date.now() / 1000);
    const until = now + (weeks * 7 * 24 * 60 * 60);
    try {
        db.prepare('INSERT INTO ai_block_history (user_jid, reason, blocked_until, weeks) VALUES (?, ?, ?, ?)')
          .run(jid, reason, until, weeks);
    } catch (_) {}
    return until;
}

// ═══ الصمت ═══
const SILENCE_KEYWORDS = [
    'اسكت', 'اسكت يا', 'اسكتوا', 'بس كده', 'بس خلاص', 'كفاية', 'كفايه',
    'بلاش كلام', 'اصمت', 'اصمتوا', 'سكوت', 'اخرس', 'اخرسي',
    'مش عايز كلام', 'متتكلمش', 'متكلمنيش',
];
const UNMUTE_KEYWORDS = [
    'اتكلم', 'اتكلمي', 'تكلم', 'رد', 'ردي', 'كلمني', 'كلميني',
    'سمحت لك', 'ممكن تتكلم', 'اتفضل اتكلم', 'قول',
];

function detectSilenceCmd(text) {
    const t = normalizeText(text);
    for (const w of SILENCE_KEYWORDS) {
        if (t.includes(normalizeText(w))) return 'silence';
    }
    for (const w of UNMUTE_KEYWORDS) {
        if (t.includes(normalizeText(w))) return 'unmute';
    }
    return null;
}

function isSilenced(jid) {
    try {
        return !!db.prepare('SELECT user_jid FROM ai_silenced WHERE user_jid = ?').get(jid);
    } catch (_) { return false; }
}

function setSilenced(jid, reason) {
    try {
        db.prepare('INSERT OR REPLACE INTO ai_silenced (user_jid, reason) VALUES (?, ?)').run(jid, reason || null);
    } catch (_) {}
}

function unmute(jid) {
    try {
        db.prepare('DELETE FROM ai_silenced WHERE user_jid = ?').run(jid);
    } catch (_) {}
}

function extractNumber(jid) {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0];
}

async function notifyDeveloper(sock, offenderJid, offenderNumber, offenderName, text, profanityWords, action, realPnJid) {
    const ownerJid = config.ownerNumber + '@s.whatsapp.net';
    const actionLabel = action === 'blocked'
        ? '🚫 حظر أسبوع (واتساب + بوت)'
        : (action === 'warned' ? '⚠️ تحذير أول' : 'ℹ️');

    let mentionJid = offenderJid;
    if (realPnJid && realPnJid.includes('@s.whatsapp.net')) mentionJid = realPnJid;
    else if (offenderJid && offenderJid.includes('@s.whatsapp.net')) mentionJid = offenderJid;
    else if (realPnJid) mentionJid = realPnJid;

    const displayNumber = extractNumber(mentionJid);

    const message = `🔴 *بلاغ من PHANTOM AI*

👤 *الشخص:* ${offenderName}
📱 *الرقم:* +${offenderNumber}

💬 *النص:*
${text.substring(0, 300)}

🚫 *الشتائم:* ${profanityWords.join('، ')}

⚡ *الإجراء:* ${actionLabel}`;

    try {
        await sock.sendMessage(ownerJid, { text: message });
        await sock.sendMessage(ownerJid, {
            text: `@${displayNumber} — ده اللي شتم 🤬`,
            mentions: [mentionJid],
        });
    } catch (e) {
        console.error('notify dev failed:', e.message);
    }
}

module.exports = {
    detectProfanity, detectApology,
    getModState, bumpWarning, resetWarnings,
    markApologyUsed, wasApologyUsed,
    setBlockedUntil, getBlockedUntil, clearAllState, logBlock,
    detectSilenceCmd, isSilenced, setSilenced, unmute,
    notifyDeveloper,
    SILENCE_KEYWORDS, UNMUTE_KEYWORDS,
};
