const h = require('./lib-media-helper');
const { cleanupJobDir, readFile } = require('./svc-media');

function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

module.exports = {
    name: 'ضغط',
    aliases: ['compress'],
    desc: 'ضغط صورة/فيديو',
    async run(ctx) {
        if (!await h.checkUser(ctx)) return;

        const mediaMsg = await h.getMediaMsg(ctx);
        if (!mediaMsg) return h.errorNoMedia(ctx);

        const type = h.media.detectMediaType(mediaMsg);
        if (!['image', 'video'].includes(type)) return ctx.error('ابعت صورة أو فيديو');

        if (type === 'video' && !await h.checkHeavy(ctx, 'ضغط')) return;

        const jobId = h.newJobId();
        const jobDir = h.media.createJobDir(jobId);
        const startMs = Date.now();

        try {
            const dl = await h.media.downloadMedia(ctx.sock, mediaMsg, jobDir);
            if (!dl.ok) return ctx.error('❌ فشل التحميل');

            const result = await h.media.compressMedia(dl.path, jobDir, type === 'video');
            if (!result.ok) return ctx.error('❌ فشل الضغط');

            const saved = result.inputSize - result.outputSize;
            const percent = result.inputSize > 0 ? ((saved / result.inputSize) * 100).toFixed(1) : '0';

            try {
                const buf = readFile(result.path);
                if (type === 'video') {
                    await ctx.sock.sendMessage(ctx.jid, { video: buf, caption: `📦 ضغط: ${percent}%` }, { quoted: ctx.msg });
                } else {
                    await ctx.sock.sendMessage(ctx.jid, { image: buf, caption: `📦 ضغط: ${percent}%` }, { quoted: ctx.msg });
                }
            } catch (_) { return ctx.error('❌ فشل الإرسال'); }

            const txId = h.mediaTx.startJob(ctx.sender, 'ضغط', type);
            h.mediaTx.updateJob(txId, { input_size: result.inputSize, output_size: result.outputSize, processing_ms: Date.now() - startMs });
            const charge = h.mediaTx.charge(ctx.sender, txId);
            h.history.log(ctx.sender, 'economy', 'ضغط', `${fmtSize(result.inputSize)} → ${fmtSize(result.outputSize)}`, -h.config.MEDIA_TOOL_COST);
            if (type === 'video') h.mediaTx.recordHeavy(ctx.sender);

            const bal = charge.ok ? charge.newBalance : h.user.getCoins(ctx.sender);
            await ctx.reply(`𓆩✦𓆪 تمت العملية\n📥 قبل: ${fmtSize(result.inputSize)}\n📤 بعد: ${fmtSize(result.outputSize)}\n💾 توفير: ${percent}%\n💰 التكلفة: ${h.config.MEDIA_TOOL_COST}\n💳 الرصيد: ${bal}`);
        } finally {
            cleanupJobDir(jobId);
        }
    }
};
