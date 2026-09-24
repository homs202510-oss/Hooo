const { isElite } = require('./lib-roles');

module.exports = {
    command: 'اسرع',
    description: 'يعزز من سرعة استجابة البوت عن طريق تنظيف الذاكرة المؤقتة.',
    usage: '.اسرع',
  category: 'نظام',
  
    async execute(sock, msg) {
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const senderLid = senderJid.split('@')[0];

        // التحقق من صلاحيات النخبة
        if (!isElite(senderLid)) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '❌ هذا الأمر مخصص فقط للنخبة.',
            }, { quoted: msg });
        }

        try {
            const startTime = process.hrtime();

            // تنظيف الذاكرة المؤقتة (يتطلب تشغيل Node.js باستخدام --expose-gc)
            if (global.gc) {
                global.gc();
            }

            // إجبار الأحداث المعلقة على التنفيذ
            setImmediate(() => {});

            const diff = process.hrtime(startTime);
            const executionTime = (diff[0] * 1e9 + diff[1]) / 1e6;

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ تم تعزيز أداء البوت بنجاح!\n⏳ الوقت المستغرق: *${executionTime.toFixed(2)}ms*`,
            }, { quoted: msg });
        } catch (error) {
            console.error('❌ حدث خطأ أثناء تعزيز الأداء:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ حدث خطأ أثناء محاولة تحسين أداء البوت.',
            }, { quoted: msg });
        }
    }
};