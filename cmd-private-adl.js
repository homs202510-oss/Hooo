// عدل.js - تعديل إعدادات البوت (نسخة محسنة بدون خطوط)
const fs = require('fs');
const { join } = require('path');
const { isFounder, isOwnerbot, isDeveloper } = require('./lib-roles');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const zarfPath = join(__dirname, 'db-zarf.json');
const imagePath = join(__dirname, 'image.jpeg');
const audioPath = join(__dirname, 'db-sounds', 'm.mp3');

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `⚙️ تـحـديـث الـبـوت ⚙️\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: 'عدل',
    description: '⚙️ تعديل إعدادات البوت',
    category: 'خاصة',
    usage: `.عدل [نوع] [قيمة]`,

    async execute(sock, msg) {
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const senderNum = sender.split('@')[0];
            const senderJid = senderNum + '@s.whatsapp.net';

            if (!isFounder(senderJid) && !isOwnerbot(senderJid) && !isDeveloper(senderJid)) {
                await sendMessage(sock, msg.key.remoteJid, [
                    '❌ هذا الأمر مخصص للمطور ومالك البوت فقط.'
                ], msg);
                return;
            }

            const zarfData = fs.existsSync(zarfPath)
                ? JSON.parse(fs.readFileSync(zarfPath))
                : {};

            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = text.trim().split(/\s+/);

            const type = args[1]?.toLowerCase();
            const toggle = args[2]?.toLowerCase();

            const reply = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            const sendHelp = async () => {
                const lines = [
                    '⚙️ *طريقة استخدام أمر عدل*',
                    '',
                    '📌 .عدل [نوع] [قيمة]',
                    '',
                    '📋 *أنواع التعديلات المتاحة:*',
                    '',
                    '🆔 اسم - تعديل اسم البوت',
                    '📝 وصف - تعديل وصف البوت',
                    '💬 رسالة - تعديل الرسالة النهائية',
                    '🎭 رياكت - تعديل التفاعل التلقائي',
                    '🖼️ صورة - تحديث صورة البوت',
                    '🎵 صوت - تحديث صوت البوت',
                    '',
                    '⚙️ *التحكم بالتشغيل:*',
                    '• عدل [نوع] شغل - لتشغيل الميزة',
                    '• عدل [نوع] طفي - لإيقاف الميزة',
                    '',
                    '📌 ملاحظة: يجب الرد على الرسالة المراد استخدامها'
                ];
                await sendMessage(sock, msg.key.remoteJid, lines, msg);
            };

            const getTypeName = (type) => {
                const names = {
                    'اسم': 'تغيير الاسم',
                    'وصف': 'تغيير الوصف',
                    'رسالة': 'الرسالة النهائية',
                    'رياكت': 'التفاعل التلقائي',
                    'صورة': 'صورة البوت',
                    'صوت': 'صوت البوت'
                };
                return names[type] || type;
            };

            const setStatus = (section, value) => {
                if (['شغل', 'طفي'].includes(value)) {
                    const status = value === 'شغل' ? 'on' : 'off';
                    zarfData[section] = zarfData[section] || {};
                    zarfData[section].status = status;

                    fs.writeFileSync(zarfPath, JSON.stringify(zarfData, null, 2));

                    if (section === 'audio') {
                        fs.writeFileSync(audioPath, `{${status}}`);
                    }

                    sendMessage(sock, msg.key.remoteJid, [
                        `✅ تم ${status === 'on' ? 'تشغيل' : 'إيقاف'} ${getTypeName(type)}.`
                    ], msg);
                    return true;
                }
                return false;
            };

            if (!type) {
                await sendHelp();
                return;
            }

            switch (type) {
                case 'اسم':
                    if (setStatus('group', toggle)) return;
                    if (reply?.conversation) {
                        zarfData.group = zarfData.group || {};
                        zarfData.group.newSubject = reply.conversation;
                        fs.writeFileSync(zarfPath, JSON.stringify(zarfData, null, 2));
                        await sendMessage(sock, msg.key.remoteJid, [
                            '✅ تم تحديث اسم البوت بنجاح'
                        ], msg);
                        return;
                    }
                    break;

                case 'وصف':
                    if (setStatus('group', toggle)) return;
                    if (reply?.conversation) {
                        zarfData.group = zarfData.group || {};
                        zarfData.group.newDescription = reply.conversation;
                        fs.writeFileSync(zarfPath, JSON.stringify(zarfData, null, 2));
                        await sendMessage(sock, msg.key.remoteJid, [
                            '✅ تم تحديث وصف البوت بنجاح'
                        ], msg);
                        return;
                    }
                    break;

                case 'رسالة':
                    if (setStatus('messages', toggle)) return;
                    if (reply?.conversation) {
                        zarfData.messages = zarfData.messages || {};
                        zarfData.messages.final = reply.conversation;
                        fs.writeFileSync(zarfPath, JSON.stringify(zarfData, null, 2));
                        await sendMessage(sock, msg.key.remoteJid, [
                            '✅ تم تحديث الرسالة النهائية بنجاح'
                        ], msg);
                        return;
                    }
                    break;

                case 'رياكت':
                    if (setStatus('reaction', toggle)) return;
                    if (reply?.conversation) {
                        zarfData.reaction = reply.conversation;
                        fs.writeFileSync(zarfPath, JSON.stringify(zarfData, null, 2));
                        await sendMessage(sock, msg.key.remoteJid, [
                            '✅ تم تحديث التفاعل التلقائي بنجاح'
                        ], msg);
                        return;
                    }
                    break;

                case 'صورة':
                    if (setStatus('media', toggle)) return;
                    const imageMessage = reply?.imageMessage;
                    if (imageMessage) {
                        const buffer = await downloadMediaMessage(
                            { message: { imageMessage } },
                            'buffer',
                            {},
                            { reuploadRequest: sock.updateMediaMessage }
                        );
                        fs.writeFileSync(imagePath, buffer);
                        zarfData.media = zarfData.media || {};
                        zarfData.media.image = 'image.jpeg';
                        fs.writeFileSync(zarfPath, JSON.stringify(zarfData, null, 2));
                        await sendMessage(sock, msg.key.remoteJid, [
                            '✅ تم تحديث صورة البوت بنجاح'
                        ], msg);
                        return;
                    }
                    break;

                case 'صوت':
                    if (setStatus('audio', toggle)) return;

                    if (!reply) {
                        await sendMessage(sock, msg.key.remoteJid, [
                            '❌ يرجى الرد على رسالة صوتية لتحديث صوت البوت'
                        ], msg);
                        return;
                    }

                    const audioMsg = reply.audioMessage || reply.documentMessage;
                    if (!audioMsg) {
                        await sendMessage(sock, msg.key.remoteJid, [
                            '❌ يرجى الرد على رسالة صوتية صحيحة'
                        ], msg);
                        return;
                    }

                    const buffer = await downloadMediaMessage(
                        { message: reply },
                        'buffer',
                        {},
                        { reuploadRequest: sock.updateMediaMessage }
                    );

                    fs.mkdirSync(join(__dirname, 'db-sounds'), { recursive: true });
                    fs.writeFileSync(audioPath, '{on}');

                    zarfData.audio = zarfData.audio || {};
                    zarfData.audio.file = 'sounds/m.mp3';
                    zarfData.audio.status = 'on';

                    fs.writeFileSync(zarfPath, JSON.stringify(zarfData, null, 2));
                    await sendMessage(sock, msg.key.remoteJid, [
                        '✅ تم تحديث صوت البوت وتشغيله بنجاح'
                    ], msg);
                    return;

                default:
                    await sendHelp();
                    return;
            }

            await sendHelp();

        } catch (err) {
            console.error('✗ خطأ في أمر عدل:', err);
            await sendMessage(sock, msg.key.remoteJid, [
                `❌ حدث خطأ أثناء التعديل:`,
                err.message || err.toString()
            ], msg);
        }
    }
};