module.exports = {
    name: 'طلاق',
    aliases: ['divorce', 'اتطلق'],
    desc: 'البوت يختار اتنين عشوائي من الجروب',
    groupOnly: true,
    async run(ctx) {
        let mentions = ctx.mentioned;

        if (mentions.length < 2) {
            try {
                const metadata = await ctx.sock.groupMetadata(ctx.jid);
                const members = metadata.participants
                    .filter(p => !p.id.includes(ctx.sock.user?.id?.split(':')[0]))
                    .map(p => p.id);

                if (members.length < 2) {
                    return ctx.error('الجروب فيه أقل من عضوين');
                }

                const shuffled = [...members].sort(() => Math.random() - 0.5);
                mentions = [shuffled[0], shuffled[1]];
            } catch (e) {
                return ctx.error('مش قادر أجيب أعضاء الجروب');
            }
        } else {
            mentions = [...mentions].sort(() => Math.random() - 0.5).slice(0, 2);
        }

        const a = mentions[0];
        const b = mentions[1];
        const numA = a.split('@')[0].split(':')[0];
        const numB = b.split('@')[0].split(':')[0];

        await ctx.card('طلاق!', [
            { emoji: '💔', title: 'تم الطلاق', content: ` @${numA} طلق @${numB}\n\n ربنا يعوض عليكم` },
        ], [a, b]);
    }
};
