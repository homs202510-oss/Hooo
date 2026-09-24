// حب.js - اكتشف نسبة الحب بينك وبين شخص آخر (نسخة محسنة)
module.exports = {
    command: ['حب', 'محبة'],
    description: '💘 اكتشف نسبة الحب بينك وبين شخص آخر!',
    category: 'تسلية',
    usage: '.حب @العضو | .حب (رد على رسالة)',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const senderName = msg.pushName || 'أنت';
            const senderJid = msg.key.participant || msg.key.remoteJid;

            const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
            const mentions = contextInfo?.mentionedJid;
            const quotedSender = contextInfo?.participant;

            let targetJid = null;
            let targetName = '';

            // تحديد الهدف (منشن أو رد)
            if (mentions && mentions.length > 0) {
                targetJid = mentions[0];
                targetName = targetJid.split('@')[0];
            } else if (quotedSender) {
                targetJid = quotedSender;
                targetName = targetJid.split('@')[0];
            } else {
                const lines = [
                    '💘 *نسبة الحب*',
                    '',
                    '👀 منشن حد كده عشان أقولك بيحبك قد إيه!',
                    '📌 أو رد على رسالة الشخص',
                    '',
                    '📝 مثال: .حب @العضو',
                    '📝 مثال: (رد على رسالة) .حب'
                ];
                let msgText = `💘 نـسـبـة الـحـب 💘\n`;
                msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
                for (const line of lines) {
                    msgText += `${line}\n`;
                }
                msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
                msgText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
                await sock.sendMessage(chatId, { text: msgText }, { quoted: msg });
                return;
            }

            // التأكد من أن المستخدم لم يحب نفسه
            if (targetJid === senderJid) {
                await sock.sendMessage(chatId, {
                    text: '😅 لا يمكنك حساب نسبة الحب مع نفسك! جرب مع شخص آخر.'
                }, { quoted: msg });
                return;
            }

            const percent = Math.floor(Math.random() * 101);
            const senderNum = senderJid.split('@')[0];

            let reaction = '';
            let emoji = '';
            let advice = '';

            if (percent >= 90) {
                emoji = '❤️‍🔥';
                reaction = 'دي علاقة حب عظيمة! أنتم صنعتم لبعضكم البعض!';
                advice = 'استمروا على هذا الحب، أنتم مثال للعشاق 🥰';
            } else if (percent >= 75) {
                emoji = '💖';
                reaction = 'علاقة حب قوية جداً! في طريقكم للجواز 😂💍';
                advice = 'اهتموا ببعضكم أكثر، الحب يحتاج رعاية 💕';
            } else if (percent >= 60) {
                emoji = '💗';
                reaction = 'في مشاعر حب واضحة، بس محتاجة شوية اهتمام أكتر 🥺';
                advice = 'خذوا وقتكم، الحب الحقيقي لا يستعجل 💫';
            } else if (percent >= 40) {
                emoji = '💛';
                reaction = 'نسبة حب متوسطة، ممكن تتطور مع الوقت 🌱';
                advice = 'تقربوا أكثر، شاركوا لحظاتكم مع بعض 💞';
            } else if (percent >= 20) {
                emoji = '💔';
                reaction = 'للأسف مش بيحبك كده أوي... خليك قوي! 😔';
                advice = 'لا تحزن، الحب الحقيقي بيأتي في وقته المناسب 💪';
            } else {
                emoji = '💀';
                reaction = 'يا سلام! العلاقة دي محتاجة إنعاش! 🚑';
                advice = 'ابعدوا شوية، خليكم أصدقاء أفضل 😅';
            }

            const lines = [
                '💘 *نسبة الحب*',
                '',
                `❤️ *${percent}%* ${emoji}`,
                '',
                `👤 ${senderName} ❤️ @${targetName}`,
                '',
                `📝 ${reaction}`,
                `💡 نصيحة: ${advice}`
            ];

            let msgText = `💘 نـسـبـة الـحـب 💘\n`;
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            for (const line of lines) {
                msgText += `${line}\n`;
            }
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            msgText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

            await sock.sendMessage(chatId, {
                text: msgText,
                mentions: [targetJid, senderJid]
            }, { quoted: msg });

        } catch (error) {
            console.error('✗ خطأ في أمر حب:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ حدث خطأ أثناء تنفيذ الأمر.'
            }, { quoted: msg });
        }
    }
};