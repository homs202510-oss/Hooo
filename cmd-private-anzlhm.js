const { jidDecode } = require('@whiskeysockets/baileys');
const { isFounder, isOwnerbot, isDeveloper } = require('./lib-roles');

const formatJid = (jid) => {
    const data = jidDecode(jid);
    const user = data?.user || jid.split('@')[0];
    return user + '@s.whatsapp.net';
};

const onlyNumbers = (id) => id.replace(/[^0-9]/g, '');

module.exports = {
    command: 'انزلهم',
    description: 'تنزيل المشرفين مع حماية المطورين',
    usage: '.انزلهم',
    category: 'خاصة',

    async execute(sock, msg) {
        try {
            const group = msg.key.remoteJid;

            if (!group.endsWith('@g.us')) {
                return sock.sendMessage(group, {
                    text: '❗ الأمر يعمل داخل المجموعات فقط.'
                }, { quoted: msg });
            }

            const sender = formatJid(msg.key.participant || group);
            const senderNum = onlyNumbers(sender);

            if (
                !isFounder(senderNum) &&
                !isOwnerbot(senderNum) &&
                !isDeveloper(senderNum)
            ) {
                return sock.sendMessage(group, {
                    text: '❗ذل من لا صلاحيات له 😂🫵'
                }, { quoted: msg });
            }

            const meta = await sock.groupMetadata(group);
            const bot = onlyNumbers(formatJid(sock.user.id));
            const participants = meta.participants;

            const adminsToRemove = [];
            const adminsToAdd = [];

            for (const user of participants) {
                const jid = formatJid(user.id);
                const num = onlyNumbers(jid);
                const isAdmin = !!user.admin;

                const protectedUser =
                    isFounder(num) ||
                    isOwnerbot(num) ||
                    isDeveloper(num);

                // رفع المحميين
                if (protectedUser && !isAdmin && num !== bot) {
                    adminsToAdd.push(user.id);
                }

                // تنزيل غير المحميين
                if (!protectedUser && isAdmin && num !== bot) {
                    adminsToRemove.push(user.id);
                }
            }

            if (adminsToRemove.length) {
                await sock.groupParticipantsUpdate(group, adminsToRemove, 'demote');
            }

            if (adminsToAdd.length) {
                await sock.groupParticipantsUpdate(group, adminsToAdd, 'promote');
            }

            // ✅ FIX: تعريف result
            let result = `\n\n`;
            result += `اوف زحلقت ${adminsToRemove.length} مشرف بالغلط 😂🫵`;

            await sock.sendMessage(group, {
                text: result
            }, { quoted: msg });

        } catch (err) {
            console.error(err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ خطأ:\n${err.message || err}`
            }, { quoted: msg });
        }
    }
};