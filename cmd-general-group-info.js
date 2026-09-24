// معلومات.js - عرض معلومات متقدمة عن المجموعة (نسخة بدون خطوط)
module.exports = {
    command: 'معلومات',
    description: '📋 عرض معلومات متقدمة عن المجموعة (الأعضاء، المشرفين، المؤسس، الصورة، الإحصائيات)',
    usage: '.معلومات',
    category: 'عام',

    async execute(sock, m) {
        try {
            const chatId = m.key.remoteJid;

            if (!chatId.endsWith('@g.us')) {
                return sock.sendMessage(chatId, {
                    text: '❌ هذا الأمر يعمل فقط داخل المجموعات.'
                }, { quoted: m });
            }

            const meta = await sock.groupMetadata(chatId);
            const name = meta.subject || 'بدون اسم';
            const desc = meta.desc || 'لا يوجد وصف';
            const total = meta.participants.length;
            const admins = meta.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const adminsCount = admins.length;

            // استخراج المؤسس (المالك)
            let ownerJid = meta.owner || null;
            if (!ownerJid) {
                const superAdmin = meta.participants.find(p => p.admin === 'superadmin');
                if (superAdmin) ownerJid = superAdmin.id;
            }

            const ownerNum = ownerJid ? ownerJid.split('@')[0] : 'غير معروف';

            // حالة المجموعة
            const isLocked = meta.announce ? '🔒 مقفل (الإعلانات فقط)' : '🔓 مفتوح (للجميع)';
            const isRestrict = meta.restrict ? '⛔ مقيد (المشرفين فقط)' : '✅ غير مقيد (الكل)';

            // تاريخ الإنشاء
            let creationText = 'غير معروف';
            if (meta.creation) {
                const creationDate = new Date(meta.creation * 1000);
                const now = new Date();
                const diffDays = Math.floor((now - creationDate) / (1000 * 86400));
                creationText = `${creationDate.toLocaleDateString('ar-EG')} (منذ ${diffDays} يوم)`;
            }

            // صورة المجموعة
            let pictureUrl = null;
            try {
                pictureUrl = await sock.profilePictureUrl(chatId, 'image');
            } catch {}

            // ===== بناء الرسالة بدون خطوط =====
            let caption = `📊 مـعـلـومـات الـمـجـمـوعـة 📊\n`;
            caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            caption += `🏷️ الاسم: ${name}\n`;
            caption += `👥 الأعضاء: ${total}\n`;
            caption += `👑 المشرفون: ${adminsCount}\n`;
            caption += `👤 المؤسس: @${ownerNum}\n`;
            caption += `🔐 الحالة: ${isLocked}\n`;
            caption += `⚙️ القيود: ${isRestrict}\n`;
            caption += `📆 التأسيس: ${creationText}\n`;
            
            // ===== عرض الوصف كاملاً =====
            caption += `📝 الوصف:\n${desc}\n`;
            caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            caption += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

            const mentions = ownerJid ? [ownerJid] : [];

            if (pictureUrl) {
                await sock.sendMessage(chatId, {
                    image: { url: pictureUrl },
                    caption: caption,
                    mentions: mentions
                }, { quoted: m });
            } else {
                await sock.sendMessage(chatId, {
                    text: caption,
                    mentions: mentions
                }, { quoted: m });
            }

        } catch (err) {
            console.error('✗ خطأ في أمر معلومات:', err);
            await sock.sendMessage(m.key.remoteJid, {
                text: '❌ حدث خطأ أثناء جلب معلومات المجموعة.\n📌 تأكد من صلاحيات البوت.'
            }, { quoted: m });
        }
    }
};