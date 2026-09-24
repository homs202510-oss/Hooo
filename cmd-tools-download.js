const dl = require('./svc-download');
const user = require('./mod-user');

module.exports = {
    name: 'تحميل',
    aliases: ['download', 'dl'],
    desc: 'تحميل من روابط',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        let url = ctx.args[0];
        if (!url) {
            const ctxInfo = ctx.msg.message?.extendedTextMessage?.contextInfo;
            if (ctxInfo?.quotedMessage) {
                const q = ctxInfo.quotedMessage;
                url = q.conversation || q.extendedTextMessage?.text || '';
            }
        }
        if (!url) return ctx.error('اكتب الرابط\n.تحميل [رابط]');

        if (!dl.isValidUrl(url)) return ctx.error('❌ رابط غير صالح');

        const platform = dl.detectPlatform(url);
        if (!platform) return ctx.error('❌ المنصة غير مدعومة\n\nالمدعوم: YouTube, TikTok, Instagram, Twitter, Facebook');

        await ctx.reply('⏳ جاري التحميل...');

        const info = await dl.getVideoInfo(url);
        if (!info.ok) {
            return ctx.error(`❌ فشل التحميل\n${info.error || info.reason || ''}`);
        }

        const fileRes = await dl.downloadFile(info.url);
        if (!fileRes.ok) {
            return ctx.error(`❌ فشل تنزيل الملف\n${fileRes.error || ''}`);
        }

        if (fileRes.size > dl.MAX_SIZE_MB * 1024 * 1024) {
            return ctx.error(`❌ الملف كبير (${(fileRes.size / 1024 / 1024).toFixed(1)}MB)`);
        }

        // اكتشف النوع من الـ URL
        const isVideo = /\.(mp4|webm|mov)/i.test(info.url) || !/\.(mp3|m4a|webm)/i.test(info.url);

        try {
            if (isVideo) {
                await ctx.sock.sendMessage(ctx.jid, { video: fileRes.buffer, caption: `📥 من ${platform}` }, { quoted: ctx.msg });
            } else {
                await ctx.sock.sendMessage(ctx.jid, { audio: fileRes.buffer, mimetype: 'audio/mp4' }, { quoted: ctx.msg });
            }
        } catch (e) {
            return ctx.error('❌ فشل الإرسال');
        }
    }
};
