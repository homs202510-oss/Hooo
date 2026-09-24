const h = require('./lib-media-helper');
const { cleanupJobDir, readFile } = require('./svc-media');

module.exports = {
    name: 'دائري',
    aliases: ['circle', 'videonote'],
    desc: 'فيديو → دائري',
    async run(ctx) {
        if (!await h.checkUser(ctx)) return;

        const mediaMsg = await h.getMediaMsg(ctx);
        if (!mediaMsg) return h.errorNoMedia(ctx);

        const type = h.media.detectMediaType(mediaMsg);
        if (type !== 'video') return ctx.error('ابعت فيديو');

        if (!await h.checkHeavy(ctx, 'دائري')) return;

        const jobId = h.newJobId();
        const jobDir = h.createJobDir(jobId);
        const startMs = Date.now();

        try {
            const dl = await h.downloadMedia(ctx.sock, mediaMsg, jobDir);
            if (!dl.ok) return ctx.error('❌ فشل التحميل');

            if (dl.duration > 60) return ctx.error(`❌ الفيديو ${Math.round(dl.duration)}ث — الحد 60ث`);

            const result = await h.media.toVideoNote(dl.path, jobDir);
            if (!result.ok) {
                if (result.error === 'too_large') return ctx.error(`❌ الفيديو كبير بعد التحويل (${result.sizeMB.toFixed(1)}MB)`);
                return ctx.error('❌ فشل التحويل للدائري');
            }

            try {
                const buf = readFile(result.path);
                // ✅ إرسال كـ video note (pttv)
                await ctx.sock.sendMessage(ctx.jid, {
                    video: buf,
                    mimetype: 'video/mp4',
                    pttv: true,     // ✅ دي المهمة
                }, { quoted: ctx.msg });
            } catch (e) {
                console.log('video note send error:', e.message);
                return ctx.error('❌ فشل الإرسال');
            }

            const txId = h.mediaTx.startJob(ctx.sender, 'دائري', 'video');
            h.mediaTx.updateJob(txId, { input_size: dl.size, processing_ms: Date.now() - startMs });
            const charge = h.mediaTx.charge(ctx.sender, txId);
            h.history.log(ctx.sender, 'economy', 'دائري', 'video → note', -h.config.MEDIA_TOOL_COST);
            h.mediaTx.recordHeavy(ctx.sender);

            const bal = charge.ok ? charge.newBalance : h.user.getCoins(ctx.sender);
            await ctx.reply(`𓆩✦𓆪 تمت العملية بنجاح\n💰 التكلفة: ${h.config.MEDIA_TOOL_COST} نقطة\n💳 الرصيد: ${bal}`);
        } finally {
            cleanupJobDir(jobId);
        }
    }
};
