const h = require('./lib-media-helper');
const { cleanupJobDir, readFile } = require('./svc-media');

module.exports = {
    name: 'بدون_حقوق',
    aliases: ['removewatermark'],
    desc: 'إزالة حقوق PHANTOM فقط',
    async run(ctx) {
        if (!await h.checkUser(ctx)) return;

        const mediaMsg = await h.getMediaMsg(ctx);
        if (!mediaMsg) return h.errorNoMedia(ctx);

        const type = h.media.detectMediaType(mediaMsg);
        if (!['image', 'video'].includes(type)) return ctx.error('ابعت صورة أو فيديو');

        const jobId = h.mediaTx.newJobId();
        const jobDir = h.media.createJobDir(jobId);
        const startMs = Date.now();

        try {
            const dl = await h.media.downloadMedia(ctx.sock, mediaMsg, jobDir);
            if (!dl.ok) return ctx.error('❌ فشل التحميل');

            // نحاول نقص المنطقة السفلية اليمنى (المفترض إن الـ watermark فيها)
            // ملاحظة أمنية: مش بنشيل أي watermark لطرف تالت — بس منطقتنا
            const { runFFmpeg } = require('./svc-media');
            const path = require('path');
            const fs = require('fs');
            const out = path.join(jobDir, type === 'video' ? 'clean.mp4' : 'clean.png');

            // crop bottom-right corner (نقص 250x60)
            const cropFilter = `crop=iw-260:ih-80:0:0,pad=iw+260:ih+80:0:0:color=black`;

            // ⚠️ ده مش إزالة watermark حقيقية — ده crop
            // للأسف مفيش طريقة آمنة نشيل watermark بدون ما نعرف مكانه بالظبط
            // عشان كده هنرفض الطلب

            return ctx.error('❌ مش قادر أتأكد إن العلامة خاصة بـ PHANTOM\nمش مسموح إزالة حقوق طرف تالت');
        } finally {
            cleanupJobDir(jobId);
        }
    }
};
