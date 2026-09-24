// رياكت.js - نظام الريأكشن التلقائي حسب الرتبة (نسخة محسنة بدون خطوط)
const fs = require('fs');
const { join } = require('path');
const { jidDecode } = require('@whiskeysockets/baileys');
const hay = require('./lib-roles');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';
const configPath = join(__dirname, 'db-reaction_toggle.json');

if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ status: false }));
}

// دالة للحصول على الريأكشن المناسب للرتبة
function getReactionForRank(senderJid) {
    const senderLid = hay.toLid(senderJid);
    const { isElite } = require('./lib-roles');
    const senderNumber = senderJid.split('@')[0];

    if (hay.isFounder(senderLid)) return '👑';
    if (hay.isOwnerbot(senderLid)) return '👑';
    if (hay.isDeveloper(senderLid)) return '💠';
    if (isElite(senderNumber)) return '🌀';
    
    return null;
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎭 نـظـام الـريـاكـت 🎭\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: 'رياكت',
    description: '🎭 تشغيل أو إيقاف نظام الريأكشن التلقائي حسب الرتبة',
    usage: '.رياكت',
    category: 'خاصة',

    async execute(sock, msg) {
        try {
            const groupJid = msg.key.remoteJid;
            const sender = decode(msg.key.participant || msg.key.remoteJid);
            const senderLid = hay.toLid(sender);

            const hasAccess = hay.isFounder(senderLid) || hay.isOwnerbot(senderLid) || hay.isDeveloper(senderLid);
            
            if (!hasAccess) {
                await sendMessage(sock, groupJid, [
                    '🚫 هذا الأمر مخصص فقط للمطورين.'
                ], msg);
                return;
            }

            // تبديل الحالة
            const config = JSON.parse(fs.readFileSync(configPath));
            config.status = !config.status;
            fs.writeFileSync(configPath, JSON.stringify(config));

            const statusText = config.status ? '✅ تم التشغيل' : '❌ تم الإيقاف';
            
            const lines = [
                `${statusText}`,
                '',
                '📊 *الرتب المدعومة:*',
                '👑 المالك',
                '💠 المطور',
                '🌀 النخبة',
                '',
                `📌 الحالة الحالية: ${config.status ? '🟢 مفعل' : '🔴 معطل'}`
            ];

            await sendMessage(sock, groupJid, lines, msg);

            // إذا تم التفعيل، ابدأ المراقبة المباشرة
            if (config.status) {
                // إزالة المستمع السابق إذا كان موجوداً
                if (sock._reactionListener) {
                    sock.ev.off('messages.upsert', sock._reactionListener);
                }

                const listener = async ({ messages }) => {
                    try {
                        const m = messages[0];
                        if (!m.message || !m.key || !m.key.remoteJid) return;
                        
                        const chatId = m.key.remoteJid;
                        if (!chatId.endsWith('@g.us')) return;

                        const sender = decode(m.key.participant || m.key.remoteJid);

                        const confCheck = JSON.parse(fs.readFileSync(configPath));
                        if (!confCheck.status) return;
                        
                        const reaction = getReactionForRank(sender);
                        if (!reaction) return;

                        await sock.sendMessage(chatId, {
                            react: {
                                text: reaction,
                                key: m.key
                            }
                        }).catch(() => {});
                    } catch (err) {
                        console.error('خطأ في مستمع الرياكت:', err);
                    }
                };

                sock.ev.on('messages.upsert', listener);
                sock._reactionListener = listener;
            } else {
                // إزالة المستمع عند الإيقاف
                if (sock._reactionListener) {
                    sock.ev.off('messages.upsert', sock._reactionListener);
                    sock._reactionListener = null;
                }
            }

        } catch (err) {
            console.error('❌ خطأ في أمر رياكت:', err);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                `📌 ${err.message || err.toString()}`
            ], msg);
        }
    }
};