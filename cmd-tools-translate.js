const tr = require('./svc-translate');
const user = require('./mod-user');

function splitText(chunks, maxLen = 4000) {
    // نقسّم لرسائل
    const messages = [];
    let current = '';
    for (const c of chunks) {
        if ((current + '\n' + c).length > maxLen) {
            if (current) messages.push(current);
            current = c;
        } else {
            current = current ? current + '\n' + c : c;
        }
    }
    if (current) messages.push(current);
    return messages;
}

module.exports = {
    name: 'ترجمة',
    aliases: ['translate', 'tr', 'ترجمه'],
    desc: 'ترجمة لكل اللغات',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        let text = ctx.args.join(' ').trim();
        let targetLang = null;

        // شوف لو آخر كلمة لغة محددة
        const parts = text.split(/\s+/);
        if (parts.length > 1) {
            const last = parts[parts.length - 1];
            const resolved = tr.resolveLang(last);
            if (resolved) {
                targetLang = resolved;
                text = parts.slice(0, -1).join(' ').trim();
            }
        }

        // Reply
        if (!text) {
            const ctxInfo = ctx.msg.message?.extendedTextMessage?.contextInfo;
            if (ctxInfo?.quotedMessage) {
                text = ctxInfo.quotedMessage.conversation || ctxInfo.quotedMessage.extendedTextMessage?.text || '';
            }
        }

        if (!text) {
            return ctx.card('🌐 الترجمة', [
                { emoji: '📌', title: 'الاستخدام', content: '.ترجمة [نص]\n→ يترجم لكل اللغات\n\n.ترجمة [نص] [لغة]\n→ لغة واحدة بس' },
                { emoji: '💡', title: 'أمثلة', content: '.ترجمة حمص مر من هنا\n.ترجمة hello عربي\nReply + .ترجمة' },
            ]);
        }

        // ═══ لو حدد لغة → ترجمة واحدة ═══
        if (targetLang) {
            await ctx.reply('⏳ جاري الترجمة...');
            const r = await tr.translateOne(text, targetLang);
            if (!r.ok) return ctx.error(`❌ فشل: ${r.reason}`);
            return ctx.card('🌐 ترجمة', [
                { emoji: '📝', title: 'الأصل', content: text.substring(0, 300) },
                { emoji: '🌍', title: tr.LANGS[targetLang] || targetLang, content: r.text.substring(0, 800) },
            ]);
        }

        // ═══ كل اللغات ═══
        await ctx.reply('⏳ جاري الترجمة لكل اللغات...');

        const results = await tr.translateAll(text);
        if (!results.length) return ctx.error('❌ فشلت الترجمة');

        // بناء النص
        const header = `🌐 *ترجمة لكل اللغات*\n\n📝 *الأصل:*\n${text.substring(0, 200)}\n\n━━━━━━━━━━━━━━━━━━━\n`;
        const lines = results.map(r => `🌍 *${r.name}*\n${r.text}`).join('\n\n━━━━━━━━━━━━━━━━━━━\n');

        const fullText = header + lines;

        // قسّم لو طويل
        const messages = splitText([fullText], 4000);

        for (let i = 0; i < messages.length; i++) {
            const prefix = messages.length > 1 ? `(${i+1}/${messages.length})\n` : '';
            await ctx.sock.sendMessage(ctx.jid, { text: prefix + messages[i] });
            // استنى شوية بين الرسايل
            if (i < messages.length - 1) await new Promise(r => setTimeout(r, 800));
        }
    }
};
