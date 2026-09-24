// خطيبتي.js - اختيار خطيبة عشوائية (نسخة محسنة بدون خطوط)
module.exports = {
    command: ['خطيبتي', 'خطيبة'],
    description: '💘 يطلعلك خطيبتك عشوائي من المجموعة',
    usage: '.خطيبتي',
    category: 'عرس',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const senderId = msg.key.participant || msg.key.remoteJid;

            if (!chatId.endsWith('@g.us')) {
                await sock.sendMessage(chatId, {
                    text: '❌ الأمر ده للجروبات بس يا نجم.'
                }, { quoted: msg });
                return;
            }

            const metadata = await sock.groupMetadata(chatId);

            // استبعاد البوت نفسه والمرسل
            const members = metadata.participants
                .map(p => p.id)
                .filter(id =>
                    id !== senderId &&
                    !id.endsWith('@broadcast') &&
                    !id.includes('bot') &&
                    !id.includes('wa.me')
                );

            if (!members.length) {
                await sock.sendMessage(chatId, {
                    text: '❌ مفيش حد تختارهولك 😂'
                }, { quoted: msg });
                return;
            }

            const fiancee = members[Math.floor(Math.random() * members.length)];
            const me = `@${senderId.split('@')[0]}`;
            const her = `@${fiancee.split('@')[0]}`;

            const replies = [
                `${me} 😂 يا خروف يا أهبل… خطيبتك اهي ${her} روحلها خاص بدل ما تفضل مزنوق كده`,
                `${me} 😈 مبروك يا خروف الموسم… ${her} مستنياك وانت واقف عامل فيها نجم وانت ولا حاجة`,
                `${me} 🤡 يا أهبل فوق بقى… ${her} أهي قدامك وانت لسه بتفكر تقول ايه`,
                `${me} 🔥 شد حيلك يا خروف قبل ما ${her} تزهق منك خالص`,
                `${me} 💀 يا أهبل إنت اتخطبت رسميًا… ${her} مستنية منك حركة مش تمثيل`,
                `${me} 🚨 خبر عاجل: العريس يا خروف تايه ومش لاقي الخاص… ${her} بتضحك عليك`,
                `${me} 😏 يا أهبل لو ما دخلتش تكلم ${her} حالاً تبقى خروف معتمد`,
                `${me} 😂 يا خروف عامل فيها تقيل؟ ${her} شايفا كل الهجص ده`,
                `${me} 🤦‍♂️ يا أهبل بطل رعشة وروحلها… ${her} مش هتعضك`,
                `${me} 😎 يا خروف الجروب كله شايفك وانت متوتر… ${her} أهي مستنياك`,
                `${me} 💣 يا أهبل الفرصة قدامك… ${her} مش هتستناك للأبد`,
                `${me} 🐑 يا خروف خش كلم ${her} بدل ما تفضل تتفرج`,
                `${me} 😂 يا أهبل لو فضلت ساكت كده ${her} هتفك الخطوبة قبل ما تبدأ`,
                `${me} 🔥 يا خروف فوق لنفسك… ${her} خطيبتك مش صاحبتك في الحضانة`,
                `${me} 😈 يا أهبل شد أعصابك وروحلها… ${her} مش محتاجة محامي`
            ];

            const text = replies[Math.floor(Math.random() * replies.length)];

            await sock.sendMessage(chatId, {
                text: text,
                mentions: [senderId, fiancee]
            }, { quoted: msg });

        } catch (err) {
            console.error('❌ خطأ أمر خطيبتي:', err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ حصل خطأ يا معلم.'
            }, { quoted: msg });
        }
    }
};