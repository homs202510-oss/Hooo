// جماعي.js - منشن جماعي مفصل للنخبة والمشرفين (نسخة محسنة بدون خطوط)
const { isElite } = require('./lib-roles');

module.exports = {
    command: ['جماعي', 'قيام', 'جروبي'],
    category: 'ادارة',
    description: '👥 منشن جماعي مفصل للنخبة والمشرفين فقط داخل المجموعات (يظهر المالك والمشرفين والأعضاء)',
    usage: '.جماعي',

    async execute(sock, msg, args = []) {
        try {
            const groupJid = msg.key.remoteJid;
            const senderJid = msg.key.participant || msg.participant || groupJid;

            if (!groupJid.endsWith('@g.us')) {
                await sock.sendMessage(groupJid, {
                    text: '🚫 هذا الأمر يعمل داخل المجموعات فقط.',
                }, { quoted: msg });
                return;
            }

            const senderNumber = senderJid.split('@')[0];

            // ===== التحقق من صلاحية المستخدم (نخبة أو مشرف) =====
            const metadata = await sock.groupMetadata(groupJid);
            const participant = metadata.participants.find(p => p.id === senderJid);
            const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
            const isEliteMember = isElite(senderNumber);

            if (!isEliteMember && !isAdmin) {
                await sock.sendMessage(groupJid, {
                    text: '❌ هذا الأمر مخصص للنخبة والمشرفين فقط.',
                }, { quoted: msg });
                return;
            }

            const groupName = metadata.subject;
            const participants = metadata.participants;
            const memberCount = participants.length;
            const allIds = participants.map(p => p.id);

            let profilePicUrl;
            try {
                profilePicUrl = await sock.profilePictureUrl(groupJid, 'image');
            } catch {
                profilePicUrl = 'https://i.pinimg.com/736x/28/2b/e5/282be5ae28f1b520d253a2dfc4f2e57a.jpg';
            }

            let owner = metadata.owner ? `@${metadata.owner.split('@')[0]}` : 'غير معروف';
            let admins = [];
            let members = [];

            // ترتيب المشاركين
            let adminCount = 0;
            let memberCount2 = 0;

            for (let p of participants) {
                const id = `@${p.id.split('@')[0]}`;
                if (p.admin === 'superadmin') {
                    owner = id;
                } else if (p.admin === 'admin') {
                    adminCount++;
                    admins.push(`   ${adminCount}. ${id}`);
                } else {
                    memberCount2++;
                    members.push(`   ${memberCount2}. ${id}`);
                }
            }

            const lines = [
                '👥 *منشن جماعي*',
                '',
                `📛 المجموعة: ${groupName}`,
                `🧮 الأعضاء: ${memberCount}`,
                '',
                '👑 *المالك*',
                `   ${owner}`,
                '',
                '🛡️ *المشرفين*',
                admins.length > 0 ? admins.join('\n') : '   لا يوجد مشرفين',
                '',
                '👤 *الأعضاء*',
                members.length > 0 ? members.join('\n') : '   لا يوجد أعضاء'
            ];

            let msgText = `👥 مـنـشـن جـمـاعـي 👥\n`;
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            for (const line of lines) {
                msgText += `${line}\n`;
            }
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            msgText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

            await sock.sendMessage(groupJid, {
                image: { url: profilePicUrl },
                caption: msgText,
                mentions: allIds,
            }, { quoted: msg });

            await sock.sendMessage(groupJid, {
                react: { text: '⚡', key: msg.key },
            });

        } catch (err) {
            console.error('❌ خطأ في أمر جماعي:', err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚠️ حدث خطأ أثناء التنفيذ:\n${err.message || err.toString()}`,
            }, { quoted: msg });
        }
    }
};