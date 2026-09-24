// زوجهم.js - زواج جماعي عشوائي (2-6 أزواج) مع صور من الفولدر
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
        const availableImages = weddingImages.filter(img => fs.existsSync(img.file));
        if (availableImages.length === 0) {
            console.warn('⚠️ لا توجد صور في الفولدر');
            console.warn('📌 تأكد من وجود صور باسم: wedding-1.jpg إلى wedding-14.jpg');
            return null;
        }
        const randomIndex = Math.floor(Math.random() * availableImages.length);
        const selected = availableImages[randomIndex];
        console.log(`✅ تم اختيار الصورة: ${selected.name} (${path.basename(selected.file)})`);
        return selected;
    } catch (error) {
        console.error('❌ خطأ في اختيار الصورة:', error);
        return null;
    }
}

// ========== دالة خلط المصفوفة ==========
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ========== دالة إنشاء أزواج عشوائية ==========
function createRandomCouples(participants, numberOfCouples) {
    const shuffled = shuffleArray([...participants]);
    const couples = [];
    
    for (let i = 0; i < numberOfCouples * 2 && i + 1 < shuffled.length; i += 2) {
        couples.push({
            groom: shuffled[i],
            bride: shuffled[i + 1]
        });
    }
    
    return couples;
}

module.exports = {
    command: 'زوجهم',
    description: '💍 زواج جماعي عشوائي (2-3 أزواج) مع صورة عشوائية',
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

            if (participants.length < 4) {
                await sock.sendMessage(chatId, {
                    text: '❌ عدد الأعضاء غير كافي للزواج الجماعي (يحتاج 4 على الأقل) 😅'
                }, { quoted: msg });
                return;
            }

            // ========== تحديد عدد الأزواج (2-6) ==========
            const maxCouples = Math.min(3, Math.floor(participants.length / 2));
            const minCouples = Math.min(2, maxCouples);
            const numberOfCouples = Math.floor(Math.random() * (maxCouples - minCouples + 1)) + minCouples;

            // ========== إنشاء الأزواج العشوائية ==========
            const couples = createRandomCouples(participants, numberOfCouples);

            if (couples.length === 0) {
                await sock.sendMessage(chatId, {
                    text: '❌ لا يمكن إنشاء أزواج كافية 😅'
                }, { quoted: msg });
                return;
            }

            // ========== الخطوط الفاخرة ==========
            const line = '✦ ── ✧ ── ✦ ── ✧ ── ✦';
            
            // ========== بناء النص ==========
            let couplesText = '';
            const allMentions = [];

            for (let i = 0; i < couples.length; i++) {
                const couple = couples[i];
                const groom = couple.groom;
                const bride = couple.bride;
                const groomTag = `@${groom.split('@')[0]}`;
                const brideTag = `@${bride.split('@')[0]}`;
                
                couplesText += `
${line}
   💞 *الزوج ${i + 1}* 💞
${line}

🤵 العريس : ${groomTag}
👰 العروسة : ${brideTag}
`;
                allMentions.push(groom, bride);
            }

            // ========== النص النهائي ==========
            const caption = `
${line}
   💞 *حفل زفاف جماعي* 💞
${line}

🎊 *ألف مبروك للجميع* 🎊
👫 عدد الأزواج : ${couples.length}

${couplesText}
${line}
   ✦ معلومات الزفاف ✦
${line}

🏷️ المجموعة : *${metadata.subject}*
📅 التاريخ : ${new Date().toLocaleDateString('ar-EG')}
🕐 الوقت : ${new Date().toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}

💐 نتمنى لكم حياة مليئة
   بالحب والسعادة 😍

${line}
𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴
${line}`;

            // ========== اختيار صورة عشوائية ==========
            const selectedImage = getRandomWeddingImage();
            let imageSent = false;

            if (selectedImage && fs.existsSync(selectedImage.file)) {
                try {
                    const imageBuffer = fs.readFileSync(selectedImage.file);
                    await sock.sendMessage(chatId, {
                        image: imageBuffer,
                        caption: caption,
                        mentions: allMentions
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
                    mentions: allMentions
                }, { quoted: msg });
            }

        } catch (err) {
            console.error('❌ خطأ في أمر زوجهم:', err);
            await sock.sendMessage(chatId, {
                text: '❌ حصل خطأ أثناء تنفيذ الأمر.'
            }, { quoted: msg });
        }
    }
};