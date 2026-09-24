const BOT_NAME = '𝓟𝑯𝑨𝑵𝑻𝑶𝑴';
const TAGLINE = '❖ شبح يراقب ❖';
const LINE = '━━━━━━━━━━━━━━━━━━━';

const header = () =>
`╭━━━━━━━━━━━━━━━━━━━━━╮
┃   👻  𝓟𝑯𝑨𝑵𝑻𝑶𝑴  👻   ┃
╰━━━━━━━━━━━━━━━━━━━━━╯`;

const footer = () =>
`${LINE}
      ${TAGLINE}
${LINE}`;

function section(emoji, title, content) {
    const e = emoji || '▸';
    const t = title || '';
    let out = `\n▸ ${e} *${t}*\n`;
    if (content) {
        const lines = String(content).split('\n');
        for (const line of lines) {
            out += `   ${line.trim()}\n`;
        }
    }
    return out;
}

function card(title, blocks) {
    let out = header() + '\n\n';
    out += `     ❥ *${title || ''}* ❥\n`;
    for (const b of (blocks || [])) {
        if (!b) continue;
        out += section(b.emoji, b.title, b.content);
    }
    out += `\n${footer()}`;
    return out;
}

function welcome(text) {
    return `${header()}\n\n     ❥ ${text} ❥\n\n${footer()}`;
}

function message(sections, title = null) {
    let out = header() + '\n';
    if (title) out += `\n     ❥ *${title}* ❥\n`;
    for (const sec of (sections || [])) {
        if (!sec) continue;
        out += section(sec.emoji, sec.title || sec.ar, sec.content || '');
    }
    out += `\n${footer()}`;
    return out;
}

function simple(text) {
    return `${header()}\n\n${text}\n\n${footer()}`;
}

function success(text) {
    return `${header()}\n\n     ✅ *${text}*\n\n${footer()}`;
}

function error(text) {
    return `${header()}\n\n     ⚠️ *${text}*\n\n${footer()}`;
}

module.exports = { BOT_NAME, header, footer, section, card, welcome, message, simple, success, error };
