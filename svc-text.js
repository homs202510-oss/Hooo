/**
 * 👻 Text Service
 */
function countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function countChars(text, withSpaces = true) {
    if (!text) return 0;
    return withSpaces ? text.length : text.replace(/\s/g, '').length;
}

function countLines(text) {
    if (!text) return 0;
    return text.split('\n').length;
}

function reverseText(text) {
    if (!text) return '';
    return [...text].reverse().join('');
}

function reverseWords(text) {
    if (!text) return '';
    return text.split(/\s+/).reverse().join(' ');
}

function normalizeSpaces(text) {
    if (!text) return '';
    return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function removeExtraSpaces(text) {
    return normalizeSpaces(text);
}

function addSpaces(text, n = 2) {
    if (!text) return '';
    return text.split('').join(' '.repeat(n));
}

function shorten(text, maxLen = 100) {
    if (!text) return '';
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen - 3).trim() + '...';
}

function longestWord(text) {
    if (!text) return '';
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '';
    return words.reduce((a, b) => a.length >= b.length ? a : b, '');
}

function shortestWord(text) {
    if (!text) return '';
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '';
    return words.reduce((a, b) => a.length <= b.length ? a : b, '');
}

// ═══ أشكال الزخرفة ═══
function decorate(text, style = 1) {
    if (!text) return '';
    const styles = {
        1: (t) => `✧･ﾟ: *${t}* :ﾟ･✧`,
        2: (t) => `▬▬▬ ${t} ▬▬▬`,
        3: (t) => `『 ${t} 』`,
        4: (t) => `❈ ${t} ❈`,
        5: (t) => `◆━━ ${t} ━━◆`,
        6: (t) => `⚜ ${t} ⚜`,
        7: (t) => `◈ ${t} ◈`,
        8: (t) => `✿ ${t} ✿`,
        9: (t) => `❥ ${t} ❥`,
        10: (t) => `⚡ ${t} ⚡`,
    };
    const fn = styles[style] || styles[1];
    return fn(text);
}

// ═══ تحويل الحروف لأشكال مختلفة ═══
const CHAR_MAPS = {
    // 𝐁𝐨𝐥𝐝
    bold: (s) => s.replace(/[A-Za-z]/g, c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D400 + code - 65);
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D41A + code - 97);
        return c;
    }),
    // 𝘐𝘵𝘢𝘭𝘪𝘤
    italic: (s) => s.replace(/[A-Za-z]/g, c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D434 + code - 65);
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D44E + code - 97);
        return c;
    }),
    // 𝓢𝓬𝓻𝓲𝓹𝓽
    script: (s) => s.replace(/[A-Za-z]/g, c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D49C + code - 65);
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D4B6 + code - 97);
        return c;
    }),
    // 𝕯𝖔𝖚𝖇𝖑𝖊
    double: (s) => s.replace(/[A-Za-z]/g, c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D538 + code - 65);
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D552 + code - 97);
        return c;
    }),
    // 𝙼𝚘𝚗𝚘
    mono: (s) => s.replace(/[A-Za-z]/g, c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D670 + code - 65);
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D68A + code - 97);
        return c;
    }),
    // Ⓒⓘⓡⓒⓛⓔⓓ
    circle: (s) => s.replace(/[A-Za-z0-9]/g, c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x24B6 + code - 65);
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x24D0 + code - 97);
        if (code >= 48 && code <= 57) return String.fromCodePoint(0x2460 + code - 49);
        return c;
    }),
    // 🅢🅠🅤🅐🅡🅔🅓
    square: (s) => s.replace(/[A-Z]/g, c => String.fromCodePoint(0x1F130 + c.charCodeAt(0) - 65)),
    // Ｆｕｌｌｗｉｄｔｈ
    fullwidth: (s) => s.replace(/[!-~]/g, c => String.fromCharCode(c.charCodeAt(0) + 0xFEE0)),
};

function transform(text, style = 'bold') {
    const fn = CHAR_MAPS[style];
    if (!fn) return text;
    return fn(text);
}

module.exports = {
    countWords, countChars, countLines,
    reverseText, reverseWords,
    normalizeSpaces, removeExtraSpaces, addSpaces,
    shorten, longestWord, shortestWord,
    decorate, transform, CHAR_MAPS,
};
