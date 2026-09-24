// قرعة-قنبلة.js - دمج قرعة وقنبلة (نسخة محسنة)
const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['قرعة', 'قنبلة'],
    description: '🎯 اختيار فائز عشوائي أو لعبة القنبلة',
    usage: '.قرعة | .قنبلة [@منشن]',
    category: 'العاب',

    async execute(sock, msg, args) {
        try {
            const chatId = msg.key.remoteJid;
            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const isBomb = fullText.includes('قنبلة');

            // التأكد من أن الأمر في مجموعة
            if (!chatId.endsWith('@g.us')) {
                await sock.sendMessage(chatId, {
                    text: '❌ هذا الأمر يعمل فقط في المجموعات.'
                }, { quoted: msg });
                return;
            }

            // جلب المنشنات
            let mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            // لو مفيش منشنات نجيب أعضاء الجروب
            if (!mentioned.length) {
                const groupMetadata = await sock.groupMetadata(chatId);
                mentioned = groupMetadata.participants
                    .filter(p => p.id !== sock.user.id)
                    .map(p => p.id);
            }

            if (!mentioned.length) {
                await sendMessage(sock, chatId, [
                    '❌ لا يوجد أعضاء للاختيار'
                ], msg);
                return;
            }

            // ===== لعبة القنبلة (عد تنازلي 10 ثواني) =====
            if (isBomb) {
                await sock.sendMessage(chatId, {
                    react: { text: '💣', key: msg.key }
                });

                const sent = await sock.sendMessage(chatId, {
                    text: `💣 القنبلة تبحث عن الضحية...\n👥 عدد المشاركين: ${mentioned.length}`
                }, { quoted: msg });

                let winner = null;

                for (let i = 9; i >= 0; i--) {
                    winner = mentioned[Math.floor(Math.random() * mentioned.length)];
                    const winnerName = winner.split('@')[0];

                    let text;
                    if (i > 0) {
                        text = `💣 *القنبلة تبحث عن الضحية*
━━━━━━━━━━━━━━━━━━━━
🎯 يتم اختيار:
👤 @${winnerName}

⏳ الانفجار خلال:
${i}...${i <= 3 ? ' 💥' : ''}

📊 متبقي: ${i} ثواني
━━━━━━━━━━━━━━━━━━━━
𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
                    } else {
                        text = `💥 *انفجرت القنبلة!*
━━━━━━━━━━━━━━━━━━━━
☠️ الضحية النهائية:
👑 @${winnerName}

🎉 الفائز هو @${winnerName} 🎉

🫡 ارقد بسلام...
━━━━━━━━━━━━━━━━━━━━
𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
                    }

                    await sock.sendMessage(chatId, {
                        text: text,
                        mentions: [winner],
                        edit: sent.key
                    });

                    if (i > 0) {
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }

                await sock.sendMessage(chatId, {
                    react: { text: '💥', key: sent.key }
                });
                return;
            }

            // ===== قرعة عادية (عد تنازلي 5 ثواني) =====
            await sock.sendMessage(chatId, {
                react: { text: '🎯', key: msg.key }
            });

            const sent = await sock.sendMessage(chatId, {
                text: `🎯 جاري اختيار الفائز العشوائي...\n👥 عدد المشاركين: ${mentioned.length}`
            }, { quoted: msg });

            let winner = null;

            for (let i = 5; i >= 0; i--) {
                const tempWinner = mentioned[Math.floor(Math.random() * mentioned.length)];
                const tempName = tempWinner.split('@')[0];

                let text;
                if (i > 0) {
                    text = `🎯 *جاري اختيار الفائز...*
━━━━━━━━━━━━━━━━━━━━
👤 المرشح الحالي: @${tempName}

⏳ ${i}...${i <= 2 ? ' 🎲' : ''}
━━━━━━━━━━━━━━━━━━━━
𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
                } else {
                    winner = tempWinner;
                    const winnerName = winner.split('@')[0];
                    text = `🎉 *الفائز هو!*
━━━━━━━━━━━━━━━━━━━━
👑 @${winnerName}

🎁 مبرووووك! 🎊

🤖 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻
━━━━━━━━━━━━━━━━━━━━
𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
                }

                await sock.sendMessage(chatId, {
                    text: text,
                    mentions: [tempWinner],
                    edit: sent.key
                });

                if (i > 0) {
                    await new Promise(r => setTimeout(r, 800));
                }
            }

            if (winner) {
                await sock.sendMessage(chatId, {
                    react: { text: '🎉', key: sent.key }
                });
            }

        } catch (err) {
            console.error('❌ خطأ:', err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ حدث خطأ أثناء التنفيذ'
            }, { quoted: msg });
        }
    }
};

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🎯 قـرعـة - قـنـبـلـة 🎯\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}