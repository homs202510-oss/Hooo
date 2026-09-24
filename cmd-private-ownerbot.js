// plugins/اونر.js - إدارة مالكي البوت (نسخة ملكية فرعونية)

const hay = require('./lib-roles');

function extractPureNumber(jid) {
    if (!jid) return null;
    return String(jid).split('@')[0].trim();
}

function normalizeJid(jid) {
    if (!jid) return null;
    const pure = extractPureNumber(jid);
    if (!pure) return null;
    return hay.toLid(pure);
}

function getDisplayName(jid, store) {
    try {
        const contact = store?.contacts?.[jid] || {};
        return contact.notify || contact.vname || contact.name || extractPureNumber(jid);
    } catch {
        return extractPureNumber(jid);
    }
}

module.exports = {
    command: ['اونربوت', 'اونر', 'مالك'],
    description: 'إدارة مالكي البوت (OwnerBot)',
    usage: '.اونر اضف/ازل + منشن',
    category: 'خاصة',

    async execute(sock, msg) {
        try {
            const check = hay.ensureIntegrity();
            if (!check.ok) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n⚠️ ${check.message}\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`
                }, { quoted: msg });
            }

            const senderJid = normalizeJid(
                msg.key.fromMe ? msg.key.remoteJid : (msg.key.participant || msg.key.remoteJid)
            );
            if (!senderJid) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n❌ تعذر تحديد هوية المرسل\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`
                }, { quoted: msg });
            }

            const remoteJid = msg.key.remoteJid;
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const parts = text.trim().split(/\s+/);
            const action = parts[1];

            if (!['اضف', 'ازل'].includes(action)) {
                return sock.sendMessage(remoteJid, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n📖 دليل الأوامر\n\n◈ .اونر اضف + منشن\n◈ .اونر ازل + منشن\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`
                }, { quoted: msg });
            }

            // 🔐 إضافة/إزالة OwnerBot → حصري  لاونر بوت
            if (!(hay.isFounder(senderJid) || hay.isOwnerbot(senderJid))) {
                return sock.sendMessage(remoteJid, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🚫 صلاحية مرفوضة\nهذا الأمر حصري مالك البوت \n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`
                }, { quoted: msg });
            }

            const ctx = msg.message?.extendedTextMessage?.contextInfo;
            const targetJid = normalizeJid(ctx?.mentionedJid?.[0] || ctx?.participant);

            if (!targetJid) {
                return sock.sendMessage(remoteJid, {
                    text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n📍 استهداف مطلوب\nيجب المنشن أو الرد على الشخص المستهدف\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`
                }, { quoted: msg });
            }

            const nameDisplay = getDisplayName(targetJid, sock.store);
            const owners = hay.getDevData().ownerbot || [];

            // -------------------------------------
            // 🔥 إضافة OwnerBot
            // -------------------------------------
            if (action === 'اضف') {

                if (hay.isFounder(targetJid)) {
                    return sock.sendMessage(remoteJid, {
                        text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🎯 مستوى أعلى\n@${nameDisplay} هو مالك بالفعل\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`,
                        mentions: [targetJid]
                    }, { quoted: msg });
                }

                if (hay.isOwnerbot(targetJid)) {
                    return sock.sendMessage(remoteJid, {
                        text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n✅ موجود مسبقاً\n@${nameDisplay} مالك بالفعل\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`,
                        mentions: [targetJid]
                    }, { quoted: msg });
                }

                if (owners.length >= 3) {
                    return sock.sendMessage(remoteJid, {
                        text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n📊 الحد الأقصى\nوصلت للحد المسموح (3 مالكين فقط)\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`
                    }, { quoted: msg });
                }

                const ok = hay.setOwnerbot(targetJid);

                return sock.sendMessage(remoteJid, {
                    text: ok
                        ? `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🎉 تمت الترقية بنجاح\n@${nameDisplay} أصبح مالك البوت\n💾 تم حفظ البيانات\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`
                        : `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n❌ فشل في العملية\nحاول مرة أخرى\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`,
                    mentions: [targetJid]
                }, { quoted: msg });
            }

            // -------------------------------------
            // 🔥 إزالة OwnerBot
            // -------------------------------------
            if (action === 'ازل') {

                if (!hay.isOwnerbot(targetJid)) {
                    return sock.sendMessage(remoteJid, {
                        text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n⚠️ غير موجود\n@${nameDisplay} ليس مالكاً للبوت\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`,
                        mentions: [targetJid]
                    }, { quoted: msg });
                }

                const ok = hay.removeOwnerbot(targetJid);

                return sock.sendMessage(remoteJid, {
                    text: ok
                        ? `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n🗑️ تمت الإزالة بنجاح\nتم إزالة @${nameDisplay} من المالكين\n💾 تم تحديث النظام\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`
                        : `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n❌ فشل في العملية\nحاول مرة أخرى\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`,
                    mentions: [targetJid]
                }, { quoted: msg });
            }

        } catch (err) {
            console.error('اونربوت error:', err);
            return sock.sendMessage(msg.key.remoteJid, {
                text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐒𝐘𝐒𝐓𝐄𝐌 👑\n━━━━━━━━━━━━━━━━━━━━\n❌ خطأ غير متوقع\n${err.message}\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`
            }, { quoted: msg });
        }
    }
};