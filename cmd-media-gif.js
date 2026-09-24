const h = require('./lib-media-helper');
const { cleanupJobDir, readFile } = require('./svc-media');

module.exports = {
    name: 'gif',
    aliases: ['togif'],
    desc: 'فيديو → GIF',
    async run(ctx) {
        if (!await h.checkUser(ctx)) return;

        const mediaMsg = await h.getMediaMsg(ctx);
        if (!mediaMsg) return h.errorNoMedia(ctx);

        const type = h.media.detectMediaType(mediaMsg);
        if (type !== 'video') return ctx.error('ابعت فيديو');

        if (!await h.checkHeavy(ctx, 'gif')) return;

        const jobId = h.newJobId();
        const jobDir = h.media.createJobDir(jobId);
        const startMs = Date.now();

        try {
            const dl = await h.media.downloadMedia(ctx.sock, mediaMsg, jobDir);
            if (!dl.ok) return ctx.error('❌ فشل التحميل');

            if (dl.duration > 15) return ctx.error(`❌ الفيديو طويل — الحد 15ث لـ GIF`);

            const result = await h.media.toGif(dl.path, jobDir);
            if (!result.ok) {
                if (result.error === 'gif_too_large') return ctx.error(`❌ GIF كبير (${result.sizeMB.toFixed(1)}MB)`);
                return ctx.error('❌ فشل التحويل');
            }

            try {
                const buf = readFile(result.path);
                await ctx.sock.sendMessage(ctx.jid, { video: buf, gifPlayback: true }, { quoted: ctx.msg });
            } catch (_) { return ctx.error('❌ فشل الإرسال'); }

            const txId = h.mediaTx.startJob(ctx.sender, 'gif', 'video');
            h.mediaTx.updateJob(txId, { input_size: dl.size, processing_ms: Date.now() - startMs });
            const charge = h.mediaTx.charge(ctx.sender, txId);
            h.history.log(ctx.sender, 'economy', 'gif', 'video → gif', -h.config.MEDIA_TOOL_COST);
            h.mediaTx.recordHeavy(ctx.sender);

            const bal = charge.ok ? charge.newBalance : h.user.getCoins(ctx.sender);
            await ctx.reply(`𓆩✦𓆪 تمت العملية بنجاح\n💰 التكلفة: ${h.config.MEDIA_TOOL_COST} نقطة\n💳 الرصيد: ${bal}`);
        } finally {
            cleanupJobDir(jobId);
        }
    }
};
