const h = require('./lib-media-helper');
const { cleanupJobDir, readFile } = require('./svc-media');

module.exports = {
    name: 'قص',
    aliases: ['trim'],
    desc: 'قص فيديو',
    async run(ctx) {
        if (!await h.checkUser(ctx)) return;

        const mediaMsg = await h.getMediaMsg(ctx);
        if (!mediaMsg) return h.errorNoMedia(ctx);

        const type = h.media.detectMediaType(mediaMsg);
        if (type !== 'video') return ctx.error('ابعت فيديو');

        const startStr = ctx.args[0];
        const endStr = ctx.args[1];

        if (!startStr || !endStr) {
            return ctx.card('✂️ قص', [
                { emoji: '📌', title: 'الاستخدام', content: '.قص 0:00 0:15\n(بالدقائق:الثواني)' },
                { emoji: '💰', title: 'التكلفة', content: `${h.config.MEDIA_TOOL_COST} نقطة` },
            ]);
        }

        const start = h.media.parseTime(startStr);
        const end = h.media.parseTime(endStr);

        if (start === null || end === null) return ctx.error('❌ صيغة الوقت غلط');
        if (end <= start) return ctx.error('❌ وقت النهاية لازم بعد البداية');

        if (!await h.checkHeavy(ctx, 'قص')) return;

        const jobId = h.newJobId();
        const jobDir = h.media.createJobDir(jobId);
        const startMs = Date.now();

        try {
            const dl = await h.media.downloadMedia(ctx.sock, mediaMsg, jobDir);
            if (!dl.ok) return ctx.error('❌ فشل التحميل');

            if (end > dl.duration) return ctx.error(`❌ الفيديو ${Math.round(dl.duration)}ث بس`);

            const result = await h.media.trimMedia(dl.path, jobDir, start, end);
            if (!result.ok) return ctx.error('❌ فشل القص');

            try {
                const buf = readFile(result.path);
                await ctx.sock.sendMessage(ctx.jid, { video: buf, caption: `✂️ ${startStr} → ${endStr}` }, { quoted: ctx.msg });
            } catch (_) { return ctx.error('❌ فشل الإرسال'); }

            const txId = h.mediaTx.startJob(ctx.sender, 'قص', 'video');
            h.mediaTx.updateJob(txId, { input_size: dl.size, processing_ms: Date.now() - startMs });
            const charge = h.mediaTx.charge(ctx.sender, txId);
            h.history.log(ctx.sender, 'economy', 'قص', `${startStr} → ${endStr}`, -h.config.MEDIA_TOOL_COST);
            h.mediaTx.recordHeavy(ctx.sender);

            const bal = charge.ok ? charge.newBalance : h.user.getCoins(ctx.sender);
            await ctx.reply(`𓆩✦𓆪 تمت العملية بنجاح\n💰 التكلفة: ${h.config.MEDIA_TOOL_COST} نقطة\n💳 الرصيد: ${bal}`);
        } finally {
            cleanupJobDir(jobId);
        }
    }
};
