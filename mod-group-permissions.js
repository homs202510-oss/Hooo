/**
 * 👻 Group Permission Service v3
 * فحص أدمن أكثر قوة — يدعم @lid + @s.whatsapp.net + كل الصيغ
 */
const config = require('./config');
const dev = require('./mod-developer');
const { extractNumber } = require('./mod-jid');

function isDeveloper(jid) {
    return dev.isDeveloper(jid);
}

function isGroupOwner(jid, groupMetadata) {
    if (!groupMetadata || !groupMetadata.owner) return false;
    return extractNumber(jid) === extractNumber(groupMetadata.owner);
}

function isGroupAdmin(jid, groupMetadata) {
    if (!groupMetadata || !groupMetadata.participants) return false;
    const num = extractNumber(jid);
    const p = groupMetadata.participants.find(x => {
        return extractNumber(x.id || x.jid || x.phoneNumber || '') === num;
    });
    return p && (p.admin === 'admin' || p.admin === 'superadmin');
}

/**
 * فحص البوت أدمن — يدعم كل الصيغ
 */
function isBotAdmin(groupMetadata, botJid) {
    if (!groupMetadata || !groupMetadata.participants || !botJid) return false;

    const botNum = extractNumber(botJid);
    if (!botNum) return false;

    // ابحث في كل الأعضاء
    for (const p of groupMetadata.participants) {
        const candidates = [
            p.id,
            p.jid,
            p.phoneNumber,
            p.lid,
            p.pn,
        ].filter(Boolean);

        for (const c of candidates) {
            if (extractNumber(c) === botNum) {
                if (p.admin === 'admin' || p.admin === 'superadmin') return true;
            }
        }
    }
    return false;
}

/**
 * فحص أدمن — ياخد كل JIDs ممكنة للبوت
 */
function isBotAdminAny(groupMetadata, botJids) {
    if (!groupMetadata || !groupMetadata.participants) return false;
    if (!Array.isArray(botJids)) botJids = [botJids];

    const botNums = botJids.map(extractNumber).filter(Boolean);
    if (!botNums.length) return false;

    for (const p of groupMetadata.participants) {
        const candidates = [p.id, p.jid, p.phoneNumber, p.lid, p.pn].filter(Boolean);

        for (const c of candidates) {
            const cNum = extractNumber(c);
            if (botNums.includes(cNum)) {
                if (p.admin === 'admin' || p.admin === 'superadmin') return true;
            }
        }
    }
    return false;
}

/**
 * فحص أدمن — من Baileys مباشرة (أحدث بيانات)
 */
async function checkBotAdminFresh(sock, groupJid) {
    try {
        const meta = await sock.groupMetadata(groupJid);

        const botId = sock.user?.id || '';
        const botLid = sock.user?.lid || '';
        const botNum = extractNumber(botId);

        const botNums = [botNum];
        if (botLid) botNums.push(extractNumber(botLid));

        for (const p of meta.participants) {
            const candidates = [p.id, p.jid, p.phoneNumber, p.lid, p.pn].filter(Boolean);

            for (const c of candidates) {
                if (botNums.includes(extractNumber(c))) {
                    if (p.admin === 'admin' || p.admin === 'superadmin') {
                        return true;
                    }
                }
            }
        }
        return false;
    } catch (e) {
        console.error('checkBotAdminFresh error:', e.message);
        return false;
    }
}

function level(jid, groupMetadata, botJid) {
    if (isDeveloper(jid)) return 'developer';
    if (isGroupOwner(jid, groupMetadata)) return 'owner';
    if (isGroupAdmin(jid, groupMetadata)) return 'admin';
    return 'member';
}

function canModerate(actorJid, targetJid, groupMetadata, botJid) {
    const actorLevel = level(actorJid, groupMetadata, botJid);
    const targetLevel = level(targetJid, groupMetadata, botJid);

    const ranks = { developer: 4, owner: 3, admin: 2, member: 1 };

    if (ranks[targetLevel] >= ranks[actorLevel]) return false;
    if (targetLevel === 'developer') return false;
    return true;
}

module.exports = {
    isDeveloper,
    isGroupOwner,
    isGroupAdmin,
    isBotAdmin,
    isBotAdminAny,
    checkBotAdminFresh,
    level,
    canModerate,
};
