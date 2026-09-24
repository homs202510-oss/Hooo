const user = require('./mod-user');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
    name: 'توب',
    aliases: ['top', 'اغنى', 'ترتيب'],
    desc: 'أغنى الأعضاء',
    async run(ctx) {
        const top = user.getTopByCoins(10);

        if (!top.length) {
            return ctx.card('أغنى الأعضاء', [
                { emoji: '🏆', title: 'مفيش أحد', content: 'لسه محدش جمع فلوس' },
                { emoji: '💡', title: 'ابدأ', content: '.يومي — .عمل' },
            ]);
        }

        const mentions = [];
        const lines = top.map((u, i) => {
            const medal = MEDALS[i] || `#${i + 1}`;
            const number = u.jid.split('@')[0].split(':')[0];
            mentions.push(u.jid);
            const name = u.name || u.push_name || 'مجهول';
            return `${medal} *${name}*\n     💰 ${u.coins.toLocaleString('ar-EG')} 🪙`;
        });

        await ctx.card('🏆 أغنى أعضاء PHANTOM', [
            { emoji: '💰', title: 'الترتيب', content: lines.join('\n\n') },
        ], mentions);
    }
};
