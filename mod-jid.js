/**
 * 👻 PHANTOM — أدوات JID
 * بتتعامل مع كل الصيغ: @s.whatsapp.net, @lid, @g.us + الجهاز
 */

function extractNumber(jid) {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0];
}

function isSameUser(a, b) {
    if (!a || !b) return false;
    return extractNumber(a) === extractNumber(b);
}

function isInArray(jid, arr) {
    if (!Array.isArray(arr)) return false;
    const num = extractNumber(jid);
    return arr.some(x => extractNumber(x) === num);
}

module.exports = { extractNumber, isSameUser, isInArray };
