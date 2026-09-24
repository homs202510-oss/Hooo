/**
 * 👻 .بروفايل_بوت — للمطور فقط
 */
const botProfile = require('./svc-botProfile');
const media = require('./svc-media');
const dev = require('./mod-developer');
const user = require('./mod-user');

module.exports = {
    name: 'بروفايل_بوت',
    aliases: ['botprofile', 'botprofile-set'],
    desc: 'إدارة هوية البوت (للمطور)',
    hidden: true,
    async run(ctx) {
        if (!dev.isPrivileged(ctx.sender) && !user.isOwner(ctx.sender)) {
            return;
        }

        const sub = ctx.args[0];

        // عرض
        if (!sub || sub === 'عرض') {
            const id = botProfile.getIdentity();
            const hasImg = botProfile.hasImage();

            return ctx.card('👻 هوية البوت', [
                { emoji: '📛', title: 'الاسم', content: id.name },
                { emoji: '👤', title: 'المطور', content: id.developer },
                { emoji: '🏷️', title: 'الشعار', content: id.slogan },
                { emoji: '🖼️', title: 'الصورة', content: hasImg ? '✅ موجودة' : '❌ مفيش' },
                { emoji: '🔢', title: 'الإصدار', content: `${id.version}` },
                { emoji: '💡', title: 'الأوامر', content: '.بروفايل_بوت صورة (Reply)\n.بروفايل_بوت اسم [نص]\n.بروفايل_بوت شعار [نص]\n.بروفايل_بوت مطور [نص]' },
            ]);
        }

        // تحديث صورة
        if (sub === 'صورة') {
            const h = require('./lib-media-helper');
            const mediaMsg = await h.getMediaMsg(ctx);
            if (!mediaMsg) return ctx.error('اعمل Reply على صورة');

            const type = media.detectMediaType(mediaMsg);
            if (type !== 'image') return ctx.error('اعمل Reply على صورة');

            const jobId = media.newJobId();
            const jobDir = media.createJobDir(jobId);

            try {
                const dl = await media.downloadMedia(ctx.sock, mediaMsg, jobDir);
                if (!dl.ok) return ctx.error('❌ فشل التحميل');

                const result = await botProfile.setImage(dl.buffer, dl.mimetype, ctx.sender);
                if (!result.ok) return ctx.error('❌ فشل الحفظ');

                await ctx.success(`✅ تم تحديث صورة البوت\n🔢 الإصدار الجديد: ${botProfile.getIdentity().version}`);
            } finally {
                media.cleanupJobDir(jobId);
            }
            return;
        }

        // تحديث اسم
        if (sub === 'اسم') {
            const name = ctx.args.slice(1).join(' ').trim();
            if (!name) return ctx.error('اكتب الاسم');
            botProfile.setIdentity({ name }, ctx.sender);
            return ctx.success(`✅ تم تحديث الاسم: ${name}`);
        }

        // تحديث شعار
        if (sub === 'شعار') {
            const slogan = ctx.args.slice(1).join(' ').trim();
            if (!slogan) return ctx.error('اكتب الشعار');
            botProfile.setIdentity({ slogan }, ctx.sender);
            return ctx.success(`✅ تم تحديث الشعار: ${slogan}`);
        }

        // تحديث مطور
        if (sub === 'مطور') {
            const devName = ctx.args.slice(1).join(' ').trim();
            if (!devName) return ctx.error('اكتب اسم المطور');
            botProfile.setIdentity({ developer: devName }, ctx.sender);
            return ctx.success(`✅ تم تحديث المطور: ${devName}`);
        }

        return ctx.error('أمر غير معروف');
    }
};
