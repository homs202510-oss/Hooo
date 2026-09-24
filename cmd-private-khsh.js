// خش.js - دخول البوت إلى مجموعة عبر رابط دعوة (للأونر فقط)

const { jidDecode } = require('@whiskeysockets/baileys');
const hay = require('./lib-roles');

// ✅ دالة تحويل إلى LID
function getLid(number) {
    if (!number) return null;
    if (number.includes('@lid')) return number;
    if (number.includes('@s.whatsapp.net')) {
        return number.split('@')[0] + '@lid';
    }
    return number + '@lid';
}

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🚪 الـدخـول إلـى مـجـمـوعـة 🚪\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: 'خش',
    description: '🚪 دخول البوت إلى مجموعة عبر رابط دعوة (للأونر والمؤسس فقط)',
    category: 'خاصة',
    usage: '.خش [رابط دعوة واتساب] (بالرد على رسالة تحتوي على الرابط)',

    async execute(sock, m) {
        try {
            const chatId = m.key.remoteJid;
            const fullJid = m.key.participant || m.key.remoteJid;
            const decoded = jidDecode(fullJid);
            const senderNumber = decoded?.user || fullJid.split('@')[0];
            const senderLid = getLid(senderNumber);

            // ===== التحقق من الصلاحيات (الأونر فقط) =====
            const isOwner = hay.isFounder(senderLid) || hay.isOwnerbot(senderLid);
            if (!isOwner) {
                await sendMessage(sock, chatId, [
                    '🚫 *غير مصرح*',
                    '',
                    '🔒 هذا الأمر مخصص للأونر فقط.',
                    '📌 لا يمكن لأي شخص آخر استخدامه'
                ], m);
                return;
            }

            // ===== استخراج الروابط من الرسالة =====
            function extractLinks(message) {
                const links = [];
                const regex = /https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+/g;

                if (message.conversation) {
                    const matches = message.conversation.match(regex);
                    if (matches) links.push(...matches);
                }

                if (message.extendedTextMessage?.text) {
                    const matches = message.extendedTextMessage.text.match(regex);
                    if (matches) links.push(...matches);
                }

                if (message.extendedTextMessage?.contextInfo?.quotedMessage) {
                    const quotedLinks = extractLinks(message.extendedTextMessage.contextInfo.quotedMessage);
                    links.push(...quotedLinks);
                }

                if (message.buttonsMessage?.contentText) {
                    const matches = message.buttonsMessage.contentText.match(regex);
                    if (matches) links.push(...matches);
                }

                if (message.buttonsMessage?.buttons) {
                    message.buttonsMessage.buttons.forEach(button => {
                        if (button.urlButton?.url) {
                            const matches = button.urlButton.url.match(regex);
                            if (matches) links.push(...matches);
                        }
                        if (button.quickReplyButton?.displayText) {
                            const matches = button.quickReplyButton.displayText.match(regex);
                            if (matches) links.push(...matches);
                        }
                    });
                }

                if (message.templateMessage?.fourRowTemplate?.content?.text) {
                    const matches = message.templateMessage.fourRowTemplate.content.text.match(regex);
                    if (matches) links.push(...matches);
                }

                if (message.templateMessage?.hydratedTemplate?.content?.text) {
                    const matches = message.templateMessage.hydratedTemplate.content.text.match(regex);
                    if (matches) links.push(...matches);
                }

                if (message.templateMessage?.hydratedTemplate?.buttons) {
                    message.templateMessage.hydratedTemplate.buttons.forEach(button => {
                        if (button.urlButton?.url) {
                            const matches = button.urlButton.url.match(regex);
                            if (matches) links.push(...matches);
                        }
                    });
                }

                if (message.listMessage?.description) {
                    const matches = message.listMessage.description.match(regex);
                    if (matches) links.push(...matches);
                }

                if (message.listMessage?.sections) {
                    message.listMessage.sections.forEach(section => {
                        section.rows?.forEach(row => {
                            if (row.description) {
                                const matches = row.description.match(regex);
                                if (matches) links.push(...matches);
                            }
                        });
                    });
                }

                return [...new Set(links)];
            }

            const message = m.message;
            const links = extractLinks(message);

            if (links.length === 0) {
                await sendMessage(sock, chatId, [
                    '❌ *لم يتم العثور على رابط مجموعة صالح*',
                    '',
                    '📌 تأكد أن الرسالة تحتوي على رابط دعوة واتساب',
                    '📝 مثال: `https://chat.whatsapp.com/XXXXXXXXXX`'
                ], m);
                return;
            }

            const link = links[0];
            const inviteCode = link.split('https://chat.whatsapp.com/')[1];

            try {
                const result = await sock.groupAcceptInvite(inviteCode);

                if (result) {
                    await sendMessage(sock, chatId, [
                        '✅ *تم الدخول إلى المجموعة بنجاح!*',
                        '',
                        `🔗 الرابط: ${link}`
                    ], m);
                } else {
                    await sendMessage(sock, chatId, [
                        '✅ *تم إرسال طلب الدخول*',
                        '',
                        `🔗 الرابط: ${link}`,
                        '',
                        '📌 قد يحتاج الطلب موافقة المشرفين'
                    ], m);
                }

            } catch (err) {
                console.error('❌ خطأ في أمر خش:', err);

                let errorLines = [
                    '❌ *فشل الدخول إلى المجموعة*',
                    '',
                    `🔗 الرابط: ${link}`
                ];

                if (err.message && err.message.includes('401')) {
                    errorLines.push('📌 الرابط منتهي الصلاحية');
                } else if (err.message && err.message.includes('403')) {
                    errorLines.push('📌 تم رفض دخول البوت');
                } else if (err.message && err.message.includes('404')) {
                    errorLines.push('📌 المجموعة غير موجودة');
                } else if (err.message && err.message.includes('409')) {
                    errorLines = [
                        '✅ *البوت موجود بالفعل في المجموعة*',
                        '',
                        `🔗 الرابط: ${link}`
                    ];
                } else if (err.message && err.message.includes('invite')) {
                    errorLines.push('📌 رابط الدعوة غير صالح');
                } else {
                    errorLines.push(`📝 ${err.message || 'خطأ غير معروف'}`);
                }

                errorLines.push('');
                errorLines.push('📌 حاول مرة أخرى باستخدام رابط صحيح');

                await sendMessage(sock, chatId, errorLines, m);
            }

        } catch (error) {
            console.error('❌ خطأ في أمر خش:', error);
            await sendMessage(sock, m.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], m);
        }
    }
};