// زوجني.js - زواج عشوائي (نسخة سريعة مع صور من الفولدر)
const fs = require('fs');
const path = require('path');

// ========== قائمة صور الزفاف (من resources) ==========
const weddingImages = [
    { name: 'صورة 1', file: path.join(__dirname, 'wedding-1.jpg') },
    { name: 'صورة 2', file: path.join(__dirname, 'wedding-2.jpg') },
    { name: 'صورة 3', file: path.join(__dirname, 'wedding-3.jpg') },
    { name: 'صورة 4', file: path.join(__dirname, 'wedding-4.jpg') },
    { name: 'صورة 5', file: path.join(__dirname, 'wedding-5.jpg') },
    { name: 'صورة 6', file: path.join(__dirname, 'wedding-6.jpg') },
    { name: 'صورة 7', file: path.join(__dirname, 'wedding-7.jpg') },
    { name: 'صورة 8', file: path.join(__dirname, 'wedding-8.jpg') },
    { name: 'صورة 9', file: path.join(__dirname, 'wedding-9.jpg') },
    { name: 'صورة 10', file: path.join(__dirname, 'wedding-10.jpg') },
    { name: 'صورة 11', file: path.join(__dirname, 'wedding-11.jpg') },
    { name: 'صورة 12', file: path.join(__dirname, 'wedding-12.jpg') },
    { name: 'صورة 13', file: path.join(__dirname, 'wedding-13.jpg') },
    { name: 'صورة 14', file: path.join(__dirname, 'wedding-14.jpg') }
];

// ========== دالة اختيار صورة عشوائية ==========
function getRandomWeddingImage() {
    try {
        // تصفية الصور الموجودة فعلياً
        const availableImages = weddingImages.filter(img => {
            return fs.existsSync(img.file);
        });

        if (availableImages.length === 0) {
            console.warn('⚠️ لا توجد صور في الفولدر');
            console.warn('📌 تأكد من وجود صور باسم: wedding-1.jpg إلى wedding-14.jpg');
            return null;
        }

        // اختيار عشوائي
        const randomIndex = Math.floor(Math.random() * availableImages.length);
        const selected = availableImages[randomIndex];
        console.log(`✅ تم اختيار الصورة: ${selected.name} (${path.basename(selected.file)})`);
        return selected;
    } catch (error) {
        console.error('❌ خطأ في اختيار الصورة:', error);
        return null;
    }
}

module.exports = {
    command: 'زوجني',
    description: '💍 زواج عشوائي من شخص في المجموعة مع صورة عشوائية',
    category: 'عرس',
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        if (!chatId.endsWith('@g.us') || !sender) {
            await sock.sendMessage(chatId, {
                text: '❌ هذا الأمر يعمل داخل *المجموعات فقط*.'
            }, { quoted: msg });
            return;
        }

        try {
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants
                .map(p => p.id)
                .filter(id => id !== sender);

            if (participants.length === 0) {
                await sock.sendMessage(chatId, {
                    text: '❌ لا يوجد أعضاء كافيين للزواج 😅'
                }, { quoted: msg });
                return;
            }

            const partner = participants[Math.floor(Math.random() * participants.length)];
            const groom = sender;
            const bride = partner;

            const groomTag = `@${groom.split('@')[0]}`;
            const brideTag = `@${bride.split('@')[0]}`;

            // ✨ نص فخم
            const caption = `
✦ ── ✧ ── ✦ ── ✧ ── ✦
   💞 *حفل زفاف جديد* 💞
✦ ── ✧ ── ✦ ── ✧ ── ✦

🎊 *ألف مبروك* 🎊

🤵 العريس : ${groomTag}
👰 العروسة : ${brideTag}

✨ تم عقد قرانكم في :
🏷️ *${metadata.subject}*

💐 نتمنى لكم حياة مليئة
   بالحب والسعادة 😍

📅 ${new Date().toLocaleDateString('ar-EG')}
🕐 ${new Date().toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}

✦ ── ✧ ── ✦ ── ✧ ── ✦
𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴
✦ ── ✧ ── ✦ ── ✧ ── ✦`;

            // 🖼️ اختيار صورة عشوائية من القائمة
            const selectedImage = getRandomWeddingImage();
            let imageSent = false;

            if (selectedImage && fs.existsSync(selectedImage.file)) {
                try {
                    const imageBuffer = fs.readFileSync(selectedImage.file);
                    await sock.sendMessage(chatId, {
                        image: imageBuffer,
                        caption: caption,
                        mentions: [groom, bride]
                    }, { quoted: msg });
                    imageSent = true;
                } catch (imgError) {
                    console.warn('⚠️ فشل إرسال الصورة:', imgError.message);
                }
            }

            // إذا فشل إرسال الصورة، نرسل النص فقط
            if (!imageSent) {
                await sock.sendMessage(chatId, {
                    text: caption,
                    mentions: [groom, bride]
                }, { quoted: msg });
            }

        } catch (err) {
            console.error('❌ خطأ في أمر زوجني:', err);
            await sock.sendMessage(chatId, {
                text: '❌ حصل خطأ أثناء تنفيذ الأمر.'
            }, { quoted: msg });
        }
    }
};