// ر.js - إرسال تحرش نار لشخص تم منشنه أو الرد عليه مع صورة البروفايل (نسخة محسنة)
const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['ر', 'ح', 'ش'],
    description: '🫦 إرسال تحرش نار لشخص تم منشنه أو الرد عليه مع صورة البروفايل',
    usage: '.ر @منشن | .ر (رد على رسالة)',
    category: 'تحرش',

    async execute(sock, msg) {
        try {
            // تفاعل البوت بالرمز 🫦
            for (let i = 0; i < 10; i++) {
                await sock.sendMessage(msg.key.remoteJid, { react: { text: '🫦', key: msg.key } });
            }

            const flirtLines = [
                "🫦 بتمنى أطعم شفايفك",
                "🫦 لو حضنتك كان العالم توقف",
                "🫦 عيونك نار وأنا أحب الاحتراق",
                "🫦 قربك يخلي قلبي يرقص",
                "🫦 شفايفك ملاذي",
                "🫦 حضنك أحلى من أي شتاء",
                "🫦 قلبي يخونني لما أشوفك",
                "🫦 أحب لمسة يدك",
                "🫦 قربك يجنني",
                "🫦 عيونك تسحرني",
                "🫦 ريحتك تغرقني بالجنون",
                "🫦 ضحكتك أحلى موسيقى",
                "🫦 شفايفك تدعوني للقرب",
                "🫦 أحب صوتك أكثر من أي أغنية",
                "🫦 حضنك يجعل كل شيء مثالي",
                "🫦 قربك يجعل قلبي يخفق بسرعة",
                "🫦 عيونك تحرقني شوق",
                "🫦 كل نظرة منك نار",
                "🫦 أشتاقلك أكثر من أي شيء",
                "🫦 لو كنت جمبي الآن… كان شيء جنوني",
                "🫦 أحب ضحكتك المجنونة",
                "🫦 لمستك تكهربني",
                "🫦 قربك حلم مستحيل أفارقك فيه",
                "🫦 عيونك تجعلني أذوب",
                "🫦 شفايفك سر أحلامي",
                "🫦 أحب كل تفاصيلك",
                "🫦 قربك يذيبني",
                "🫦 حضورك يجعل اليوم أسطورة",
                "🫦 أحب كيف تنظر لي",
                "🫦 أحس بكلامك في قلبي",
                "🫦 كل لحظة معك نار",
                "🫦 أريدك هنا الآن",
                "🫦 قربك يجعل قلبي يفقد توازنه",
                "🫦 كل حركة منك فخامة",
                "🫦 أحب شعورك جنبي",
                "🫦 قربك يسرق مني كل شيء",
                "🫦 أحب ضحكتك مع شقاوتك",
                "🫦 عيونك تجعلني أتوه",
                "🫦 شفايفك أروع من أي حلم",
                "🫦 أحب قربك المجنون",
                "🫦 لمستك تجعلني أذوب",
                "🫦 حضورك يشعل النار في قلبي",
                "🫦 أحب ابتسامتك المجنونة",
                "🫦 قربك يجعل كل شيء مثالي",
                "🫦 كل لحظة معك حياة جديدة",
                "🫦 شفايفك مغناطيس لعالمي",
                "🫦 أحب لمستك اللطيفة",
                "🫦 قربك يجعلني أريدك أكثر",
                "🫦 عيونك تجعلني أعيش الخيال",
                "🫦 حضنك يجعل كل شيء رائع",
                "🫦 أحب طريقة حديثك",
                "🫦 قربك يجعل قلبي يشتعل"
            ];

            let targetJid = null;
            let quotedMessageId = null;

            const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

            // تحديد الهدف
            if (contextInfo?.quotedMessage) {
                targetJid = contextInfo.participant;
                quotedMessageId = contextInfo.stanzaId;
            } else if (contextInfo?.mentionedJid?.length > 0) {
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
                    { text: `❌ لازم تمنشن أو ترد على رسالة عشان أرسل لك التحرش نار 🫦` },
                    { quoted: msg }
                );
                return;
            }

            // التأكد من صيغة الـ JID
            if (!targetJid.includes('@')) {
                targetJid = `${targetJid}@s.whatsapp.net`;
            }

            // جلب صورة البروفايل
            const profilePic = await sock.profilePictureUrl(targetJid, 'image').catch(() => null);
            const randomFlirt = flirtLines[Math.floor(Math.random() * flirtLines.length)];

            // ===== إرسال الرسالة =====
            if (profilePic) {
                await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        image: { url: profilePic },
                        caption: `@${targetJid.split('@')[0]} ${randomFlirt}`,
                        mentions: [targetJid]
                    },
                    { quoted: msg }
                );
            } else {
                await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        text: `@${targetJid.split('@')[0]} ${randomFlirt}`,
                        mentions: [targetJid]
                    },
                    { quoted: msg }
                );
            }

        } catch (error) {
            console.error('❌ خطأ في أمر ر:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ صار خطأ: ${error.message || error.toString()}`
            }, { quoted: msg });
        }
    }
};