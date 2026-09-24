// ب.js - إدارة المجموعات عن بعد (نسخة محسنة بدون خطوط)
const { getPlugins } = require('./lib-plugin-list');
const { jidDecode } = require('@whiskeysockets/baileys');
const { isFounder, isOwnerbot, isDeveloper } = require('./lib-roles');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `📋 إدارة الـجـروبـات 📋\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: 'ب',
    description: '📋 عرض المجموعات أو تنفيذ أمر في مجموعة أخرى',
    category: 'نقابات',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = decode(msg.key.participant || msg.participant || chatId);
            const senderLid = sender.split('@')[0];

            // ===== صلاحيات =====
            if (!(await isFounder(senderLid) || await isOwnerbot(senderLid) || await isDeveloper(senderLid))) {
                await sendMessage(sock, chatId, [
                    '🚫 هذا الأمر مخصص للمطور أو مالك البوت فقط.'
                ], msg);
                return;
            }

            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const input = text.trim().split(' ').slice(1);
            const indexOrCommand = input[0];
            const commandText = input.slice(1).join(' ');

            let groups = [];
            try {
                const allChats = await sock.groupFetchAllParticipating();
                groups = Object.values(allChats);
            } catch (e) {
                await sendMessage(sock, chatId, [
                    `❌ حدث خطأ أثناء جلب المجموعات: ${e.message}`
                ], msg);
                return;
            }

            // ترتيب حسب الأعضاء
            groups.sort((a, b) => (b.participants?.length || 0) - (a.participants?.length || 0));

            // ===== IDs + روابط فقط =====
            if (indexOrCommand === 'ids') {
                const lines = [
                    '🆔 *IDs + روابط الجروبات:*',
                    ''
                ];

                for (let i = 0; i < groups.length; i++) {
                    const group = groups[i];

                    let inviteLink = '❌';
                    try {
                        const code = await sock.groupInviteCode(group.id);
                        inviteLink = `https://chat.whatsapp.com/${code}`;
                    } catch {
                        inviteLink = '❌ لا يوجد صلاحية';
                    }

                    lines.push(`*${i + 1}*`);
                    lines.push(`ID: ${group.id}`);
                    lines.push(`🔗 ${inviteLink}`);
                    lines.push('');
                }

                await sendMessage(sock, chatId, lines, msg);
                return;
            }

            // ===== عرض الجروبات =====
            if (!indexOrCommand || indexOrCommand === 'عرض') {
                const lines = [
                    '📊 *قائمة المجموعات مع ID + الرابط:*',
                    ''
                ];

                for (let i = 0; i < groups.length; i++) {
                    const group = groups[i];
                    const count = group.participants?.length || 0;

                    let inviteLink = '❌';
                    try {
                        const code = await sock.groupInviteCode(group.id);
                        inviteLink = `https://chat.whatsapp.com/${code}`;
                    } catch {
                        inviteLink = '❌ البوت ليس أدمن';
                    }

                    lines.push(`*${i + 1}. ${group.subject}*`);
                    lines.push(`👥 الأعضاء: ${count}`);
                    lines.push(`🆔 ID: ${group.id}`);
                    lines.push(`🔗 ${inviteLink}`);
                    lines.push('');
                }

                lines.push('🔹 الاستخدام:');
                lines.push('ب [رقم] [أمر]');
                lines.push('📝 مثال: ب 3 ,ادمن');

                await sendMessage(sock, chatId, lines, msg);
                return;
            }

            const index = parseInt(indexOrCommand);
            if (isNaN(index) || !commandText) {
                await sendMessage(sock, chatId, [
                    '⚠️ الاستخدام:',
                    'ب [رقم] [أمر]',
                    '📝 مثال: ب 2 ,ادمن'
                ], msg);
                return;
            }

            const group = groups[index - 1];
            if (!group) {
                await sendMessage(sock, chatId, [
                    `❌ لا يوجد مجموعة بهذا الرقم`
                ], msg);
                return;
            }

            const cmd = commandText.trim();

            // ===== ادمن =====
            if (cmd === ',ادمن') {
                try {
                    await sock.groupParticipantsUpdate(group.id, [sender], 'promote');
                    const inviteCode = await sock.groupInviteCode(group.id);
                    const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

                    await sendMessage(sock, chatId, [
                        `✅ تم رفعك أدمن في: *${group.subject}*`,
                        `🔗 ${inviteLink}`
                    ], msg);
                    return;
                } catch (e) {
                    await sendMessage(sock, chatId, [
                        `❌ فشل: ${e.message}`
                    ], msg);
                    return;
                }
            }

            // ===== لينك =====
            if (cmd === ',لينك') {
                try {
                    const inviteCode = await sock.groupInviteCode(group.id);
                    await sendMessage(sock, chatId, [
                        `🔗 رابط *${group.subject}*`,
                        `https://chat.whatsapp.com/${inviteCode}`
                    ], msg);
                    return;
                } catch (e) {
                    await sendMessage(sock, chatId, [
                        `❌ خطأ: ${e.message}`
                    ], msg);
                    return;
                }
            }

            // ===== اقبلني =====
            if (cmd === ',اقبلني') {
                try {
                    const inviteCode = await sock.groupInviteCode(group.id);
                    await sock.groupAcceptInvite(inviteCode);

                    await sendMessage(sock, chatId, [
                        `✅ دخلت إلى: *${group.subject}*`
                    ], msg);
                    return;
                } catch (e) {
                    await sendMessage(sock, chatId, [
                        `❌ فشل: ${e.message}`
                    ], msg);
                    return;
                }
            }

            // ===== ضيفني =====
            if (cmd === ',ضيفني') {
                try {
                    await sock.groupParticipantsUpdate(group.id, [sender], 'add');

                    await sendMessage(sock, chatId, [
                        `✅ تمت إضافتك إلى: *${group.subject}*`
                    ], msg);
                    return;
                } catch (e) {
                    await sendMessage(sock, chatId, [
                        `❌ فشل: ${e.message}`
                    ], msg);
                    return;
                }
            }

            // ===== تنفيذ أوامر داخل الجروب =====
            const fakeMsg = {
                key: {
                    remoteJid: group.id,
                    participant: sender,
                    fromMe: false,
                    id: msg.key.id
                },
                message: {
                    extendedTextMessage: {
                        text: commandText,
                        contextInfo: {
                            participant: sender,
                            mentionedJid: [sender]
                        }
                    }
                }
            };

            const allPlugins = getPlugins();
            const cmdName = commandText.trim().split(' ')[0].replace('.', '').toLowerCase();
            const cmdArgs = commandText.trim().split(/\s+/).slice(1);

            const plugin = Object.values(allPlugins).find(p => {
                if (!p.command) return false;
                const commands = Array.isArray(p.command) ? p.command : [p.command];
                return commands.some(c => c.replace(/^\./, '').toLowerCase() === cmdName);
            });

            if (!plugin) {
                await sendMessage(sock, chatId, [
                    `❌ الأمر غير موجود: ${cmdName}`
                ], msg);
                return;
            }

            try {
                await plugin.execute(sock, fakeMsg, cmdArgs);
            } catch (e) {
                console.error(e);
                await sendMessage(sock, chatId, [
                    '⚠️ خطأ أثناء التنفيذ داخل الجروب'
                ], msg);
            }

        } catch (error) {
            console.error('❌ خطأ في أمر ب:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};