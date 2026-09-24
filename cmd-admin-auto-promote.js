// رقيهم.js - ترقية المطور والأونر إلى مشرفين (نسخة محسنة بدون خطوط)
const { jidDecode } = require('@whiskeysockets/baileys');
const { isFounder, isOwnerbot, isDeveloper } = require('./lib-roles');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';
const clean = num => num.replace(/[^0-9]/g, '');

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🛠️ تـرقـيـة الـمـطـوريـن 🛠️\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: 'رقيهم',
    description: '🛠️ يرقى المطور والأونر إلى مشرفين (بدون تنزيل أي مشرف)',
    usage: '.رقيهم',
    category: 'ادارة',

    async execute(sock, msg) {
        try {
            const groupJid = msg.key.remoteJid;
            const sender = decode(msg.key.participant || groupJid);
            const senderNum = clean(sender);

            // تأكد أنه جروب
            if (!groupJid.endsWith('@g.us')) {
                await sock.sendMessage(groupJid, {
                    text: '❌ هذا الأمر يعمل داخل المجموعات فقط.'
                }, { quoted: msg });
                return;
            }

            // صلاحيات
            if (!isFounder(senderNum) && !isOwnerbot(senderNum) && !isDeveloper(senderNum)) {
                await sock.sendMessage(groupJid, {
                    text: '🚫 ذل من لا صلاحيات له 😂🫵.'
                }, { quoted: msg });
                return;
            }

            const metadata = await sock.groupMetadata(groupJid);
            const botNumber = clean(decode(sock.user.id));

            let toPromote = [];

            for (let p of metadata.participants) {
                const num = clean(decode(p.id));
                const isAdmin = p.admin !== null;

                const isStaff = isFounder(num) || isOwnerbot(num) || isDeveloper(num);

                // ترقية المطور/الأونر إذا لم يكن مشرفاً
                if (isStaff && !isAdmin && num !== botNumber) {
                    toPromote.push(p.id);
                }
            }

            // تنفيذ الترقية فقط
            if (toPromote.length > 0) {
                await sock.groupParticipantsUpdate(groupJid, toPromote, 'promote');
            }

            // رسالة
            if (toPromote.length > 0) {
                const lines = [
                    '🛠️ *تم تحديث الإدارة*',
                    '',
                    `👑 تم ترقية (${toPromote.length}):`,
                    ...toPromote.map(id => `✔️ @${clean(decode(id))}`)
                ];
                await sendMessage(sock, groupJid, lines, msg, toPromote);
            } else {
                await sendMessage(sock, groupJid, [
                    '⚠️ جميع المطورين مشرفون بالفعل.'
                ], msg);
            }

        } catch (err) {
            console.error('❌ خطأ:', err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حدث خطأ:\n${err.message || err}`
            }, { quoted: msg });
        }
    }
};