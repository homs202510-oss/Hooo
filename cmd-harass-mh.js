// بوسه.js - إرسال بوسة طويلة مع شعر غزلي (نسخة محسنة بدون خطوط)
const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['بوسه', 'مح', 'قبلة'],
    description: '💋 إرسال بوسة طويلة مع شعر غزلي',
    usage: '.قبلة @منشن | .بوسه (رد على رسالة)',
    category: 'تحرش',

    async execute(sock, msg) {
        try {
            // تفاعل أولي
            await sock.sendMessage(msg.key.remoteJid, { 
                react: { text: '💋', key: msg.key } 
            });

            const kissLines = [
                "💋 موووووووواااااااااااااااااااااااحههههههههههه لك، عيونك تستاهل قبلاتي كلها ❤️",
                "💋 مووووووااااااااااااااااااحههههه، أنت حياة لقلبي ودفى لروحي 💞",
                "💋 مووووووااااااااااااااححححححح، كل بوسة مني لك هي وعد بالحب للأبد 💗",
                "💋 موووووواااااااااااااحهههه، أنت السبب اللي يخلي قلبي يدق بسرعة 😘",
                "💋 مووووووااااااااااححححح، أنت جنتي على الأرض ❤️",
                "💋 موووووواااااااااااااحححح، ما أكتفي منك مهما حاولت 💖",
                "💋 مووووووااااااااححححح، ريحتك تخليني أذوب أكتر من البوسة نفسها 💓",
                "💋 موووووواااااااااححححح، كل بوسة لك فيها مليون إحساس 💕",
                "💋 مووووووااااااااححححح، أنت أغلى وأجمل من أي شيء بالحياة 💝",
                "💋 موووووواااااااححححح، أنت الحلم اللي ما أصحى منه أبدًا 😍",
                "💋 مووووووااااااااااححححح، شفايفك تستحق كل بوسة في العالم 🌹",
                "💋 موووووواااااااااااحححح، أنت نبض قلبي وروح روحي 💜",
                "💋 موووووواااااااححححح، كل يوم بوسة جديدة لك لأنك تستاهل 💛",
                "💋 موووووواااااااااححححح، أنت أجمل ما في حياتي 🥰",
                "💋 موووووواااااااححححح، حبك هو السعادة الحقيقية 💚"
            ];

            let targetJid = null;
            let quotedMessageId = null;

            const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

            // إذا رد على رسالة
            if (contextInfo?.quotedMessage) {
                targetJid = contextInfo.participant;
                quotedMessageId = contextInfo.stanzaId;
            }
            // إذا منشن
            else if (contextInfo?.mentionedJid?.length > 0) {
                targetJid = contextInfo.mentionedJid[0];
            } else {
                // التحقق من وجود منشن في النص
                const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                const mentionMatch = fullText.match(/@(\d+)/);
                if (mentionMatch) {
                    targetJid = `${mentionMatch[1]}@s.whatsapp.net`;
                }
            }

            if (!targetJid) {
                await sock.sendMessage(
                    msg.key.remoteJid,
                    { 
                        text: '❌ لازم تمنشن أو ترد على رسالة عشان أقدر أرسل البوسة 😏',
                        mentions: [msg.key.participant || msg.key.remoteJid]
                    },
                    { quoted: msg }
                );
                return;
            }

            // التأكد من صيغة الـ JID
            if (!targetJid.includes('@')) {
                targetJid = `${targetJid}@s.whatsapp.net`;
            }

            // اختيار بوسة عشوائية
            const randomKiss = kissLines[Math.floor(Math.random() * kissLines.length)];

            // إرسال
            if (quotedMessageId) {
                await sock.sendMessage(
                    msg.key.remoteJid,
                    { 
                        text: `${randomKiss}`,
                        mentions: [targetJid]
                    },
                    { 
                        quoted: {
                            key: {
                                remoteJid: msg.key.remoteJid,
                                id: quotedMessageId,
                                participant: targetJid
                            },
                            message: { conversation: "Original Message" }
                        }
                    }
                );
            } else {
                await sock.sendMessage(
                    msg.key.remoteJid,
                    { 
                        text: `@${targetJid.split('@')[0]} ${randomKiss}`,
                        mentions: [targetJid]
                    },
                    { quoted: msg }
                );
            }

        } catch (error) {
            console.error('❌ خطأ في أمر بوسه:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ صار خطأ: ${error.message || error.toString()}`
            }, { quoted: msg });
        }
    }
};