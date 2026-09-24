const user = require('./mod-user');

const TYPE_LABELS = {
    resources: { emoji: '🌾', label: 'الموارد' },
    tools:     { emoji: '🔧', label: 'الأدوات' },
    weapons:   { emoji: '⚔️', label: 'الأسلحة' },
    items:     { emoji: '📦', label: 'العناصر' },
    other:     { emoji: '🎁', label: 'أخرى' },
};

module.exports = {
    name: 'حقيبة',
    aliases: ['inventory', 'bag', 'شنطة'],
    desc: 'عرض حقيبة المستخدم',
    async run(ctx) {
        let targetJid = ctx.sender;
        let isSelf = true;

        if (ctx.mentioned.length > 0) {
            targetJid = ctx.mentioned[0];
            isSelf = false;
        } else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;
            isSelf = false;
        }

        user.getOrCreate(targetJid, isSelf ? ctx.pushName : null);
        const items = user.getInventory(targetJid);

        if (!items.length) {
            return ctx.card('الحقيبة', [
                { emoji: '🎒', title: 'الحقيبة فاضية', content: ' مفيش عناصر عندك حالياً' },
                { emoji: '💡', title: 'ملاحظة', content: ' هتتجمع عناصر مع الوقت' },
            ], isSelf ? [] : [targetJid]);
        }

        const grouped = {};
        for (const it of items) {
            const key = it.item_type || 'items';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(it);
        }

        const blocks = [];
        for (const [type, list] of Object.entries(grouped)) {
            const meta = TYPE_LABELS[type] || TYPE_LABELS.items;
            const content = list.map(it => ` 𓆩✦𓆪 ${it.item_name} × ${it.quantity}`).join('\n');
            blocks.push({ emoji: meta.emoji, title: meta.label, content });
        }

        const total = items.reduce((s, i) => s + i.quantity, 0);
        blocks.push({ emoji: '📊', title: 'الإجمالي', content: ` ${total} عنصر` });

        await ctx.card('الحقيبة', blocks, isSelf ? [] : [targetJid]);
    }
};
