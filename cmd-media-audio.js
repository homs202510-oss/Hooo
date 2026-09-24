const h = require('./lib-media-helper');
const { cleanupJobDir, readFile } = require('./svc-media');

module.exports = {
    name: 'صوت',
    aliases: ['audio', 'toaudio'],
    desc: 'فيديو → صوت',
    async run(ctx) {
        if (!await h.checkUser(ctx)) return;

        const mediaMsg = await h.getMediaMsg(ctx);
        if (!mediaMsg) return h.errorNoMedia(ctx);

        const type = h.media.detectMediaType(mediaMsg);
        if (type !== 'video') return ctx.error('ابعت فيديو');

        const jobId = h.newJobId();
        const jobDir = h.media.createJobDir(jobId);
        const startMs = Date.now();

        try {
            const dl = await h.media.downloadMedia(ctx.sock, mediaMsg, jobDir);
            if (!dl.ok) return ctx.error('❌ فشل التحميل');

            const result = await h.media.extractAudio(dl.path, jobDir);
            if (!result.ok) return ctx.error('❌ فشل استخراج الصوت');

            try {
                const buf = readFile(result.path);
                await ctx.sock.sendMessage(ctx.jid, { audio: buf, mimetype: 'audio/mp4', ptt: false }, { quoted: ctx.msg });
            } catch (_) { return ctx.error('❌ فشل الإرسال'); }

            const txId = h.mediaTx.startJob(ctx.sender, 'صوت', 'video');
            h.mediaTx.updateJob(txId, { input_size: dl.size, processing_ms: Date.now() - startMs });
            const charge = h.mediaTx.charge(ctx.sender, txId);
            h.history.log(ctx.sender, 'economy', 'صوت', 'video → audio', -h.config.MEDIA_TOOL_COST);

            const bal = charge.ok ? charge.newBalance : h.user.getCoins(ctx.sender);
            await ctx.reply(`𓆩✦𓆪 تمت العملية بنجاح\n💰 التكلفة: ${h.config.MEDIA_TOOL_COST} نقطة\n💳 الرصيد: ${bal}`);
        } finally {
            cleanupJobDir(jobId);
        }
    }
};
