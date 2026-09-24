const h = require('./lib-media-helper');
const { cleanupJobDir, readFile, addStickerMetadata } = require('./svc-media');

module.exports = {
    name: 'ملصق',
    aliases: ['sticker', 's'],
    desc: 'صورة/فيديو → ملصق',
    async run(ctx) {
        if (!await h.checkUser(ctx)) return;

        const mediaMsg = await h.getMediaMsg(ctx);
        if (!mediaMsg) return h.errorNoMedia(ctx);

        const type = h.media.detectMediaType(mediaMsg);
        if (!['image', 'video'].includes(type)) return ctx.error('ابعت صورة أو فيديو');

        if (type === 'video' && !await h.checkHeavy(ctx, 'ملصق_video')) return;

        const jobId = h.newJobId();
        const jobDir = h.createJobDir(jobId);
        const startMs = Date.now();

        try {
            const dl = await h.downloadMedia(ctx.sock, mediaMsg, jobDir);
            if (!dl.ok) return ctx.error('❌ فشل تحميل الوسائط');

            const info = await h.media.getMediaInfo(dl.path);
            if (info) {
                const v = h.media.validateMedia({ size: dl.size, duration: dl.duration }, type);
                if (!v.ok) {
                    if (v.reason === 'too_large') return ctx.error(`❌ الحجم كبير (${v.sizeMB.toFixed(1)}MB)`);
                    if (v.reason === 'too_long') return ctx.error(`❌ الفيديو طويل (${Math.round(v.duration)}ث)`);
                    return ctx.error('❌ وسائط غير صالحة');
                }
            }

            if (type === 'video' && dl.duration > 60) {
                return ctx.error(`❌ الفيديو ${Math.round(dl.duration)}ث — الحد 60ث`);
            }

            // تحويل مع نص PHANTOM
            const result = type === 'image'
                ? await h.media.imageToSticker(dl.path, jobDir, true)
                : await h.media.videoToSticker(dl.path, jobDir, true);

            if (!result.ok) return ctx.error('❌ فشل التحويل');

            // إضافة metadata (اسم الحزمة)
            const meta = await addStickerMetadata(result.path);
            if (!meta.ok) console.log('⚠️ metadata failed:', meta.error);

            // send
            try {
                const buf = readFile(result.path);
                await ctx.sock.sendMessage(ctx.jid, { sticker: buf }, { quoted: ctx.msg });
            } catch (e) {
                return ctx.error('❌ فشل الإرسال');
            }

            // charge
            const txId = h.mediaTx.startJob(ctx.sender, 'ملصق', type);
            h.mediaTx.updateJob(txId, { input_size: dl.size, processing_ms: Date.now() - startMs });
            const charge = h.mediaTx.charge(ctx.sender, txId);
            h.history.log(ctx.sender, 'economy', 'ملصق', `${type} → sticker`, -h.config.MEDIA_TOOL_COST);
            if (type === 'video') h.mediaTx.recordHeavy(ctx.sender);

            const bal = charge.ok ? charge.newBalance : h.user.getCoins(ctx.sender);
            await ctx.reply(`𓆩✦𓆪 تمت العملية بنجاح\n💰 التكلفة: ${h.config.MEDIA_TOOL_COST} نقطة\n💳 الرصيد: ${bal}`);
        } finally {
            cleanupJobDir(jobId);
        }
    }
};
