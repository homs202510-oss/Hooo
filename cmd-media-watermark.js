const h = require('./lib-media-helper');
const { cleanupJobDir, readFile } = require('./svc-media');

module.exports = {
    name: 'حقوق',
    aliases: ['watermark'],
    desc: 'إضافة حقوق PHANTOM',
    async run(ctx) {
        if (!await h.checkUser(ctx)) return;

        const mediaMsg = await h.getMediaMsg(ctx);
        if (!mediaMsg) return h.errorNoMedia(ctx);

        const type = h.media.detectMediaType(mediaMsg);
        if (!['image', 'video'].includes(type)) return ctx.error('ابعت صورة أو فيديو');

        if (type === 'video' && !await h.checkHeavy(ctx, 'قص')) return;

        const jobId = h.newJobId();
        const jobDir = h.media.createJobDir(jobId);
        const startMs = Date.now();

        try {
            const dl = await h.media.downloadMedia(ctx.sock, mediaMsg, jobDir);
            if (!dl.ok) return ctx.error('❌ فشل التحميل');

            const result = await h.media.addPhantomWatermark(dl.path, jobDir, type === 'video');
            if (!result.ok) return ctx.error('❌ فشل إضافة الحقوق');

            try {
                const buf = readFile(result.path);
                if (type === 'video') {
                    await ctx.sock.sendMessage(ctx.jid, { video: buf, caption: '👻 PHANTOM' }, { quoted: ctx.msg });
                } else {
                    await ctx.sock.sendMessage(ctx.jid, { image: buf, caption: '👻 PHANTOM' }, { quoted: ctx.msg });
                }
            } catch (_) { return ctx.error('❌ فشل الإرسال'); }

            const txId = h.mediaTx.startJob(ctx.sender, 'حقوق', type);
            h.mediaTx.updateJob(txId, { input_size: dl.size, processing_ms: Date.now() - startMs });
            const charge = h.mediaTx.charge(ctx.sender, txId);
            h.history.log(ctx.sender, 'economy', 'حقوق', type, -h.config.MEDIA_TOOL_COST);

            const bal = charge.ok ? charge.newBalance : h.user.getCoins(ctx.sender);
            await ctx.reply(`𓆩✦𓆪 تمت العملية بنجاح\n💰 التكلفة: ${h.config.MEDIA_TOOL_COST} نقطة\n💳 الرصيد: ${bal}`);
        } finally {
            cleanupJobDir(jobId);
        }
    }
};
