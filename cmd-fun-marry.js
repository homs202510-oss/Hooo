module.exports = {
    name: 'زواج',
    aliases: ['marry', 'اتجوز'],
    desc: 'البوت يختار اتنين عشوائي من الجروب',
    groupOnly: true,
    async run(ctx) {
        let mentions = ctx.mentioned;

        // لو مفيش mention → البوت يختار من أعضاء الجروب
        if (mentions.length < 2) {
            try {
                const metadata = await ctx.sock.groupMetadata(ctx.jid);
                const members = metadata.participants
                    .filter(p => !p.id.includes(ctx.sock.user?.id?.split(':')[0]))
                    .map(p => p.id);

                if (members.length < 2) {
                    return ctx.error('الجروب فيه أقل من عضوين');
                }

                // اختار اتنين عشوائي
                const shuffled = [...members].sort(() => Math.random() - 0.5);
                mentions = [shuffled[0], shuffled[1]];
            } catch (e) {
                return ctx.error('مش قادر أجيب أعضاء الجروب');
            }
        } else {
            // لو في mention → اختار اتنين عشوائي منهم
            mentions = [...mentions].sort(() => Math.random() - 0.5).slice(0, 2);
        }

        const a = mentions[0];
        const b = mentions[1];
        const numA = a.split('@')[0].split(':')[0];
        const numB = b.split('@')[0].split(':')[0];

        const accept = Math.random() > 0.3;

        if (accept) {
            await ctx.card('مبروك!', [
                { emoji: '💍', title: 'حصل جواز', content: ` @${numA} اتجوز @${numB}\n\n ربنا يتمم بخير 🎉` },
            ], [a, b]);
        } else {
            await ctx.card('مرفوض', [
                { emoji: '💔', title: 'النتيجة', content: ` @${numA} رفض عرض الزواج من @${numB}` },
            ], [a, b]);
        }
    }
};
