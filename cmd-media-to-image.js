const h = require('./lib-media-helper');
const { cleanupJobDir, readFile } = require('./svc-media');

module.exports = {
    name: 'صورة',
    aliases: ['toimg', 'image'],
    desc: 'ملصق → صورة',
    async run(ctx) {
        if (!await h.checkUser(ctx)) return;

        const mediaMsg = await h.getMediaMsg(ctx);
        if (!mediaMsg) return h.errorNoMedia(ctx);

        const type = h.media.detectMediaType(mediaMsg);
        if (type !== 'sticker') return ctx.error('اعمل Reply على ملصق');

        const jobId = h.newJobId();
        const jobDir = h.media.createJobDir(jobId);
        const startMs = Date.now();

        try {
            const dl = await h.media.downloadMedia(ctx.sock, mediaMsg, jobDir);
            if (!dl.ok) return ctx.error('❌ فشل التحميل');

            const result = await h.media.stickerToImage(dl.path, jobDir);
            if (!result.ok) return ctx.error('❌ فشل التحويل');

            try {
                const buf = readFile(result.path);
                await ctx.sock.sendMessage(ctx.jid, { image: buf }, { quoted: ctx.msg });
            } catch (_) { return ctx.error('❌ فشل الإرسال'); }

            const txId = h.mediaTx.startJob(ctx.sender, 'صورة', 'sticker');
            h.mediaTx.updateJob(txId, { input_size: dl.size, processing_ms: Date.now() - startMs });
            const charge = h.mediaTx.charge(ctx.sender, txId);
            h.history.log(ctx.sender, 'economy', 'صورة', 'sticker → image', -h.config.MEDIA_TOOL_COST);

            const bal = charge.ok ? charge.newBalance : h.user.getCoins(ctx.sender);
            await ctx.reply(`𓆩✦𓆪 تمت العملية بنجاح\n💰 التكلفة: ${h.config.MEDIA_TOOL_COST} نقطة\n💳 الرصيد: ${bal}`);
        } finally {
            cleanupJobDir(jobId);
        }
    }
};
