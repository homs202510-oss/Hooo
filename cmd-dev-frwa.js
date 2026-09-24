// ملف: فروع.js – نسخة فخمة
const { jidDecode } = require('@whiskeysockets/baileys');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
    command: 'فروع',
    description: 'يعرض روابط البوت بأسلوب فخم وملكي',
    usage: '.فروع',
    category: 'المطور',

    async execute(sock, msg) {
        try {
            const groupJid = msg.key.remoteJid;
            const sender = decode(msg.key.participant || groupJid);
            const senderName = msg.pushName || sender.split('@')[0];

            // الروابط كما هي
            const links = {
                'قناة_واتساب': 'https://whatsapp.com/channel/0029Vb84qzoEKyZPmnwxDQ3d',
                'مجموعة_الدعم': 'https://chat.whatsapp.com/FL43hcmEAU7JIXVTRsayqT',
                'قناة_تليجرام_(ملفات_البوت)': ''
            };

            // النص الفخم المُهدى للمستخدم
            const fakhIntro = `🌹 *يَا صَاحِبَ الْفَخْرِ وَالْبَهَاءِ* 🌹\n\n`;
            const fakhLine = `🔱 *أَتَيْتَنَا بِسُؤَالِكَ كَأَنَّكَ تَفْتَحُ أَبْوَابَ الْجَنَّةِ* 🔱\n`;
            const fakhMiddle = `فَهَا أَنَا أَبْعَثُ إِلَيْكَ بِهَذِهِ الْفُرُوعِ النَّيِّرَةِ، كُلُّ فَرْعٍ مِنْهَا نَجْمٌ يَهْدِي إِلَى سَبِيلِ الْمَجْدِ.\n\n`;
            
            let linksText = `┏━━━━━━━━━━━━━━━━┓\n`;
            for (const [name, link] of Object.entries(links)) {
                let displayName = name.replace(/_/g, ' ');
                displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
                linksText += `┃ ✦ *${displayName}*\n┃   ↳ ${link}\n┃\n`;
            }
            linksText += `┗━━━━━━━━━━━━━━━━┛\n\n`;

            const footer = `✨ *مَا هَذَا كُلُّهُ إِلَّا مِن فَضْلِ رَبِّي* ✨\n\n⚡ 𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️ – حَيْثُ تَتَوَّجُ الْكَلِمَاتُ تَاجَ الْبَقَاءِ ⚡`;

            const fullMessage = fakhIntro + fakhLine + fakhMiddle + linksText + footer;

            // إرسال الرد مع منشن للمستخدم لجعله يشعر بالفخامة
            await sock.sendMessage(groupJid, {
                text: fullMessage,
                mentions: [sender]
            }, { quoted: msg });

            // تفاعل على أمره تقديراً له
            await sock.sendMessage(groupJid, {
                react: { text: '🏵️', key: msg.key }
            }).catch(() => {});

        } catch (error) {
            console.error('❌ خطأ في أمر فروع الفخم:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ عذراً يا أمير، قصر الروابط يعاني من عطل تقني مؤقت.' }, { quoted: msg });
        }
    }
};