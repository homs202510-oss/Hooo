/**
 * 👻 PHANTOM — أمر .تفاعل
 */
const conv = require('./mod-conversation');
const user = require('./mod-user');
const dev = require('./mod-developer');

const TEACHING_MESSAGE = `👻 *تم تفعيل التفاعل معايا*

عشان أقدر أرد عليك:
𓆩✦𓆪 اعمل *Reply* على رسالتي
𓆩✦𓆪 أو اعمل لي *Mention*

وبعدها اتكلم معايا طبيعي.`;

const GROUP_TEACHING_MESSAGE = `╭━━━ 𓆩 👻 𓆪 ━━━╮
   𝒫𝐻𝒜𝒩𝒯𝒪𝑀 𝐵𝒪𝒯
╰━━━━━━━━━━━━━━━╯

👻 *التفاعل اتفعل للجميع في الجروب*

━━━━━━━━━━━━━━━━━━━

🤖 *إزاي تكلمني؟*

 𓆩✦𓆪 اعمل *Reply* على رسالتي
 𓆩✦𓆪 أو اعمل لي *Mention* @${'{$BOT_NUM$}'}

وبعدها اتكلم معايا طبيعي.

━━━━━━━━━━━━━━━━━━━

💡 *ملاحظات:*
• مش هرد على الرسائل العادية
• بس لما تكون موجهة ليا (Reply/Mention)
• تقدر تسألني عن مملكتك، جيشك، رصيدك، أو أي حاجة

━━━━━━━━━━━━━━━━━━━

👻 استمتعوا 👑`;

module.exports = {
    name: 'تفاعل',
    aliases: ['interact', 'conversation'],
    desc: 'تفعيل/إيقاف وضع المحادثة',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        const args = ctx.args;
        const subcommand = args[0];
        const action = args[1];

        // ═══════════════════════════════════════════
        // .تفاعل الكل — للمطور فقط
        // ═══════════════════════════════════════════
        if (subcommand === 'الكل' || subcommand === 'كل') {
            if (!dev.isPrivileged(ctx.sender)) {
                return ctx.error('الأمر ده للمطور بس 👑');
            }
            if (!ctx.isGroup) {
                return ctx.error('الأمر ده في الجروبات بس');
            }

            // إيقاف
            if (action === 'إيقاف' || action === 'ايقاف' || action === 'stop') {
                conv.disableGroup(ctx.jid);
                return ctx.success('تم إيقاف التفاعل الجماعي');
            }

            // تفعيل
            const already = conv.isGroupEnabled(ctx.jid);
            conv.enableGroup(ctx.jid, ctx.sender);

            if (already) {
                return ctx.success('التفاعل الجماعي مفعّل بالفعل');
            }

            // ═══ جيب كل الأعضاء ═══
            let members = [];
            try {
                const meta = await ctx.sock.groupMetadata(ctx.jid);
                members = meta.participants.map(p => p.id);
            } catch (e) {
                return ctx.error('مش قادر أجيب أعضاء الجروب');
            }

            // ابعت الرسالة مع mention مخفي
            const botNum = require('./mod-jid').extractNumber(ctx.sock.user?.id || '');
            const messageText = GROUP_TEACHING_MESSAGE.replace('{$BOT_NUM$}', botNum);

            try {
                await ctx.sock.sendMessage(ctx.jid, {
                    text: messageText,
                    mentions: members, // ← mention مخفي لكل الأعضاء
                });
            } catch (e) {
                return ctx.error('فشل إرسال الرسالة');
            }

            return;
        }

        // ═══════════════════════════════════════════
        // .تفاعل إيقاف — إيقاف المستخدم
        // ═══════════════════════════════════════════
        if (subcommand === 'إيقاف' || subcommand === 'ايقاف' || subcommand === 'stop') {
            conv.disableUser(ctx.sender);
            return ctx.success('تم إيقاف التفاعل. لما تحتاجني اكتب .تفاعل تاني');
        }

        // ═══════════════════════════════════════════
        // .تفاعل — تفعيل المستخدم
        // ═══════════════════════════════════════════
        const already = conv.isUserEnabled(ctx.sender);
        conv.enableUser(ctx.sender, ctx.sender);

        if (!already) {
            await ctx.sock.sendMessage(ctx.jid, { text: TEACHING_MESSAGE });
        } else {
            await ctx.success('التفاعل مفعّل بالفعل');
        }
    }
};
