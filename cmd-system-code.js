/**
 * 🎁 .كود CODE VALUE TYPE USES — إنشاء كود
 */
const rewards = require('./mod-group-rewards');
const dev = require('./mod-developer');
const user = require('./mod-user');

const TYPE_MAP = {
    'نقطة': 'points', 'نقاط': 'points', 'point': 'points', 'points': 'points',
    'خشب': 'wood', 'wood': 'wood',
    'حجر': 'stone', 'stone': 'stone',
    'حديد': 'iron', 'iron': 'iron',
    'طعام': 'food', 'food': 'food',
    'ذهب': 'gold', 'gold': 'gold',
};

module.exports = {
    name: 'كود',
    aliases: ['code', 'createcode'],
    desc: 'إنشاء كود مكافأة',
    hidden: false,
    async run(ctx) {
        if (!dev.isPrivileged(ctx.sender) && !user.isOwner(ctx.sender)) {
            return ctx.error('الأمر ده للمطور بس 👑');
        }

        const args = ctx.args;
        if (args.length < 4) {
            return ctx.card('🎁 إنشاء كود', [
                { emoji: '📌', title: 'الاستخدام', content: '.كود [CODE] [VALUE] [TYPE] [USES]' },
                { emoji: '💡', title: 'أمثلة', content: '.كود 68659 200 نقطة 4\n.كود 26860 500 خشب 3\n.كود ABC123 1000 gold 10' },
                { emoji: '🎯', title: 'الأنواع', content: 'نقطة • خشب • حجر • حديد • طعام • ذهب' },
            ]);
        }

        const code = String(args[0]).trim();
        const valueStr = String(args[1]).trim();
        const typeStr = String(args[2]).trim();
        const usesStr = String(args[3]).trim();

        const value = parseInt(valueStr);
        const uses = parseInt(usesStr);
        const typeKey = TYPE_MAP[typeStr] || TYPE_MAP[typeStr.toLowerCase()];

        if (!typeKey) {
            return ctx.error(`النوع "${typeStr}" غير معروف\n\nالأنواع: نقطة، خشب، حجر، حديد، طعام، ذهب`);
        }
        if (!Number.isInteger(value) || value <= 0) return ctx.error('القيمة لازم رقم موجب');
        if (!Number.isInteger(uses) || uses <= 0) return ctx.error('الاستخدامات لازم رقم موجب');

        const result = rewards.createCode(code, typeKey, value, uses, ctx.sender);

        if (!result.ok) {
            if (result.reason === 'exists') return ctx.error('الكود ده موجود بالفعل');
            if (result.reason === 'code_short') return ctx.error('الكود قصير (3 أحرف على الأقل)');
            if (result.reason === 'bad_type') return ctx.error('نوع غير مدعوم');
            if (result.reason === 'bad_value') return ctx.error('قيمة غير صحيحة');
            if (result.reason === 'bad_uses') return ctx.error('عدد استخدامات غير صحيح');
            return ctx.error(`فشل الإنشاء: ${result.error || 'خطأ غير معروف'}`);
        }

        const typeLabels = { points: 'نقطة 🪙', wood: 'خشب 🪵', stone: 'حجر 🪨', iron: 'حديد ⛓️', food: 'طعام 🌾', gold: 'ذهب 🪙' };

        await ctx.card('🎁 كود جديد', [
            { emoji: '🔑', title: 'الكود', content: `*${code}*` },
            { emoji: '🎯', title: 'المكافأة', content: `${value} ${typeLabels[typeKey]}` },
            { emoji: '📊', title: 'الاستخدامات', content: `${uses}` },
            { emoji: '💡', title: 'للإرسال', content: `المستخدم يكتب: .استخدم ${code}` },
        ]);

        console.log(`🎁 Code created: ${code} — ${value} ${typeKey} x${uses}`);
    }
};
