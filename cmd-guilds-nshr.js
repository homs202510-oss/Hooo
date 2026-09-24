// نشر.js - أمر النشر المتطور مع عرض الجروبات والنشر في جروب محدد أو الكل

const { jidDecode } = require('@whiskeysockets/baileys');
const { isFounder, isOwnerbot, isDeveloper } = require('./lib-roles');

const decode = jid =>
  (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

// ========== دوال تحميل الميديا (للدعم مع الرد) ==========
async function downloadMedia(sock, msg) {
    try {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) return null;

        let mediaType = null;
        let mediaBuffer = null;
        let mediaOptions = {};

        if (quoted.imageMessage) {
            mediaType = 'image';
            mediaBuffer = await sock.downloadMediaMessage({
                key: {
                    remoteJid: msg.key.remoteJid,
                    fromMe: false,
                    id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    participant: msg.message.extendedTextMessage.contextInfo.participant
                },
                message: quoted
            }, 'buffer');
            mediaOptions = { image: mediaBuffer };
        } else if (quoted.videoMessage) {
            mediaType = 'video';
            mediaBuffer = await sock.downloadMediaMessage({
                key: {
                    remoteJid: msg.key.remoteJid,
                    fromMe: false,
                    id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    participant: msg.message.extendedTextMessage.contextInfo.participant
                },
                message: quoted
            }, 'buffer');
            mediaOptions = { video: mediaBuffer };
        } else if (quoted.stickerMessage) {
            mediaType = 'sticker';
            mediaBuffer = await sock.downloadMediaMessage({
                key: {
                    remoteJid: msg.key.remoteJid,
                    fromMe: false,
                    id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    participant: msg.message.extendedTextMessage.contextInfo.participant
                },
                message: quoted
            }, 'buffer');
            mediaOptions = { sticker: mediaBuffer };
        } else if (quoted.documentMessage) {
            mediaType = 'document';
            mediaBuffer = await sock.downloadMediaMessage({
                key: {
                    remoteJid: msg.key.remoteJid,
                    fromMe: false,
                    id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    participant: msg.message.extendedTextMessage.contextInfo.participant
                },
                message: quoted
            }, 'buffer');
            mediaOptions = {
                document: mediaBuffer,
                mimetype: quoted.documentMessage.mimetype,
                fileName: quoted.documentMessage.fileName || 'file'
            };
        } else if (quoted.audioMessage) {
            mediaType = 'audio';
            mediaBuffer = await sock.downloadMediaMessage({
                key: {
                    remoteJid: msg.key.remoteJid,
                    fromMe: false,
                    id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    participant: msg.message.extendedTextMessage.contextInfo.participant
                },
                message: quoted
            }, 'buffer');
            mediaOptions = {
                audio: mediaBuffer,
                mimetype: quoted.audioMessage.mimetype || 'audio/mp4',
                ptt: quoted.audioMessage.ptt || false
            };
        }

        if (!mediaBuffer) return null;
        return { type: mediaType, buffer: mediaBuffer, options: mediaOptions };
    } catch (e) {
        console.error('❌ خطأ في تحميل الميديا:', e);
        return null;
    }
}

// ========== استخراج النص والهدف من الأمر ==========
function extractTextAndTarget(fullText) {
    // إزالة الأمر
    let text = fullText.replace(/^\.نشر\s*/i, '').trim();
    let target = null; // 'كل' أو رقم جروب أو null (يعني الجروب الحالي)
    let messageText = '';

    // إذا كان النص يبدأ بـ 'كل'
    if (text.toLowerCase().startsWith('كل ')) {
        target = 'كل';
        messageText = text.substring(3).trim();
    } else if (text.toLowerCase() === 'كل') {
        target = 'كل';
        messageText = '';
    } else {
        // تحقق من وجود رقم جروب في أول النص
        const words = text.split(' ');
        const firstWord = words[0];
        // نتحقق إذا كانت الكلمة الأولى هي رقم جروب (أرقام فقط)
        if (/^\d+$/.test(firstWord)) {
            target = firstWord;
            messageText = words.slice(1).join(' ');
        } else {
            // لا يوجد رقم، نعتبر النص كله هو النص المرسل للجروب الحالي
            messageText = text;
        }
    }

    return { target, messageText };
}

// ========== جلب قائمة الجروبات ==========
async function getGroupList(sock) {
    const groups = await sock.groupFetchAllParticipating();
    const groupList = [];
    for (const id in groups) {
        const meta = groups[id];
        groupList.push({
            id: id,
            name: meta.subject || 'بدون اسم',
            participants: meta.participants.length
        });
    }
    // ترتيب حسب الاسم
    groupList.sort((a, b) => a.name.localeCompare(b.name));
    return groupList;
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: 'نشر',
    description: 'نشر رسالة في جروب محدد أو كل الجروبات مع عرض القائمة',
    usage: '.نشر - عرض قائمة الجروبات\n.نشر النص - نشر في الجروب الحالي\n.نشر رقم النص - نشر في جروب محدد\n.نشر كل النص - نشر في كل الجروبات',
    category: 'نقابات',

    async execute(sock, msg) {
        try {
            const sender = decode(msg.key.participant || msg.key.remoteJid);
            const remoteJid = msg.key.remoteJid;

            // التحقق من الصلاحيات
            const allowed = isDeveloper(sender) || isOwnerbot(sender) || isFounder(sender);
            if (!allowed) {
                return await sock.sendMessage(remoteJid, {
                    text: '❌ هذا الأمر خاص بالمطور / الأونر / المؤسس فقط.'
                }, { quoted: msg });
            }

            // استخراج النص الكامل
            let fullText = '';
            if (msg.message?.conversation) {
                fullText = msg.message.conversation;
            } else if (msg.message?.extendedTextMessage?.text) {
                fullText = msg.message.extendedTextMessage.text;
            }

            // ===== حالة 1: .نشر فقط (عرض القائمة) =====
            if (!fullText || fullText.trim() === '.نشر' || fullText.trim() === '.نشر ') {
                const groupList = await getGroupList(sock);
                if (groupList.length === 0) {
                    return await sock.sendMessage(remoteJid, {
                        text: '❌ البوت ليس عضواً في أي مجموعة.'
                    }, { quoted: msg });
                }

                let listText = `📋 *قائمة الجروبات التي فيها البوت*\n━━━━━━━━━━━━━━━━━━━━\n`;
                listText += `📌 *عدد الجروبات:* ${groupList.length}\n\n`;
                for (let i = 0; i < groupList.length; i++) {
                    const g = groupList[i];
                    const num = g.id.replace('@g.us', '');
                    listText += `${i+1}. ${g.name}\n`;
                    listText += ``;
                    listText += `   👥 ${g.participants} عضو\n\n`;
                }
                listText += `━━━━━━━━━━━━━━━━━━━━\n`;
                listText += `📌 *للنشر:* .نشر [رقم الجروب أو كل] النص\n`;
                listText += `📌 *مثال:* .نشر 17 مرحباً\n`;
                listText += `📌 *مثال:* .نشر كل مرحباً بالجميع`;

                return await sock.sendMessage(remoteJid, {
                    text: listText
                }, { quoted: msg });
            }

            // ===== استخراج النص والهدف =====
            const { target, messageText } = extractTextAndTarget(fullText);

            // ===== التحقق من وجود نص (مع دعم الرد) =====
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            let hasQuoted = !!quotedMsg;
            let media = null;

            if (hasQuoted) {
                media = await downloadMedia(sock, msg);
            }

            // إذا لم يوجد نص ولا ميديا ولا رد
            if (!messageText && !media && !hasQuoted) {
                return await sock.sendMessage(remoteJid, {
                    text: `⚠️ يجب كتابة نص أو الرد على رسالة.\n📌 مثال: .نشر 17 مرحباً\n📌 أو: رد على رسالة واكتب .نشر 17`
                }, { quoted: msg });
            }

            // ===== تحديد الجروبات المستهدفة =====
            let targetGroups = [];
            let targetDescription = '';

            if (target === 'كل') {
                const groups = await sock.groupFetchAllParticipating();
                targetGroups = Object.keys(groups);
                targetDescription = `جميع الجروبات (${targetGroups.length})`;
            } else if (target && /^\d+$/.test(target)) {
                // النشر في جروب محدد بالرقم (الرقم من القائمة)
                const groupList = await getGroupList(sock);
                const index = parseInt(target) - 1;
                if (index >= 0 && index < groupList.length) {
                    const group = groupList[index];
                    targetGroups = [group.id];
                    targetDescription = `الجروب: ${group.name} (${target})`;
                } else {
                    // محاولة البحث بالرقم مباشرة
                    const groupId = target + '@g.us';
                    try {
                        await sock.groupMetadata(groupId);
                        targetGroups = [groupId];
                        const meta = await sock.groupMetadata(groupId);
                        targetDescription = `الجروب: ${meta.subject} (${target})`;
                    } catch {
                        return await sock.sendMessage(remoteJid, {
                            text: `❌ لا يوجد جروب بالرقم: ${target}\n📌 استخدم .نشر لعرض قائمة الجروبات`
                        }, { quoted: msg });
                    }
                }
            } else {
                // النشر في الجروب الحالي
                targetGroups = [remoteJid];
                try {
                    const meta = await sock.groupMetadata(remoteJid);
                    targetDescription = `الجروب الحالي: ${meta.subject}`;
                } catch {
                    targetDescription = `الجروب الحالي`;
                }
            }

            if (targetGroups.length === 0) {
                return await sock.sendMessage(remoteJid, {
                    text: '❌ لا توجد مجموعات مستهدفة للنشر.'
                }, { quoted: msg });
            }

            // ===== النشر =====
            let sent = 0;
            let failed = 0;
            const results = [];

            for (const groupId of targetGroups) {
                try {
                    const metadata = await sock.groupMetadata(groupId);
                    const mentions = metadata.participants.map(p => p.id);

                    // بناء المحتوى
                    let finalMessage = {
                        text: `📢 رسالة إدارية رسمية\n\n${messageText}`,
                        mentions
                    };

                    // إذا كان هناك ميديا
                    if (media) {
                        const mediaOptions = media.options;
                        finalMessage = {
                            ...mediaOptions,
                            caption: `📢 رسالة إدارية من المطور \n\n${messageText}`,
                            mentions
                        };
                    } else if (hasQuoted && !media) {
                        // الرد على رسالة نصية
                        const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || '';
                        let combinedText = `📢 رسالة إدارية رسمية\n\n`;
                        if (messageText) combinedText += `${messageText}\n\n`;
                        combinedText += `━━━━━━━━━━━━━━━━━━━━\n📎 *الرسالة المقتبسة:*\n${quotedText}`;
                        finalMessage = {
                            text: combinedText,
                            mentions
                        };
                    }

                    await sock.sendMessage(groupId, finalMessage);
                    sent++;
                    results.push({ groupId, status: '✅' });
                } catch (err) {
                    failed++;
                    results.push({ groupId, status: '❌', error: err.message });
                    console.error(`فشل الإرسال إلى ${groupId}:`, err.message);
                }

                // تأخير بين الإرسال لتجنب الحظر
                if (targetGroups.length > 1) {
                    await new Promise(resolve => setTimeout(resolve, 1200));
                }
            }

            // ===== تقرير =====
            let report = `✅ *تم النشر*\n━━━━━━━━━━━━━━━━━━━━\n`;
            report += `📌 *الهدف:* ${targetDescription}\n`;
            report += `📨 *تم الإرسال إلى:* ${sent} مجموعة\n`;
            if (failed > 0) {
                report += `❌ *فشل في:* ${failed} مجموعة\n`;
            }

            if (results.length <= 20 && results.length > 0) {
                report += `\n📌 *التفاصيل:*\n`;
                for (const r of results) {
                    const name = r.groupId.replace('@g.us', '').slice(0, 15);
                    report += `${r.status} ${name} ${r.error || ''}\n`;
                }
            }

            await sock.sendMessage(remoteJid, { text: report }, { quoted: msg });

        } catch (err) {
            console.error(err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حدث خطأ:\n${err.message}`
            }, { quoted: msg });
        }
    }
};