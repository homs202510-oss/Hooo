// مانهو.js - أمر جلب فصول المانجا مع صور الفصل (نسخة محسنة تشبه كود الصور)
// يستخدم MangaDex API مع منطق بحث متعدد المحاولات

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ========== دوال البحث مع إعادة المحاولة (مثل كود الصور) ==========

// البحث عن المانجا مع محاولات متعددة
async function searchManga(title, maxAttempts = 3) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const url = `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=10&order[relevance]=desc&availableTranslatedLanguage[]=ar&availableTranslatedLanguage[]=en`;
            const response = await axios.get(url, { timeout: 15000 });
            if (response.data.data && response.data.data.length > 0) {
                return response.data.data;
            }
        } catch (e) {
            console.warn(`محاولة ${attempt + 1} للبحث عن المانجا فشلت:`, e.message);
            if (attempt < maxAttempts - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
            }
        }
    }
    return null;
}

// جلب فصول المانجا مع محاولات متعددة
async function getMangaChapters(mangaId, chapterNumber = null, maxAttempts = 3) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            let url = `https://api.mangadex.org/chapter?manga=${mangaId}&limit=100&order[chapter]=desc&translatedLanguage[]=ar&translatedLanguage[]=en`;
            if (chapterNumber) {
                url += `&chapter=${chapterNumber}`;
            }
            const response = await axios.get(url, { timeout: 15000 });
            if (response.data.data) {
                return response.data.data;
            }
        } catch (e) {
            console.warn(`محاولة ${attempt + 1} لجلب الفصول فشلت:`, e.message);
            if (attempt < maxAttempts - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
            }
        }
    }
    return null;
}

// جلب صور الفصل مع محاولات متعددة
async function getChapterPages(chapterId, maxAttempts = 3) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const url = `https://api.mangadex.org/at-home/server/${chapterId}`;
            const response = await axios.get(url, { timeout: 10000 });
            if (response.data && response.data.chapter) {
                return response.data;
            }
        } catch (e) {
            if (e.response && e.response.status === 404) {
                throw new Error('الفصل غير متاح (404)');
            }
            console.warn(`محاولة ${attempt + 1} لجلب صور الفصل فشلت:`, e.message);
            if (attempt < maxAttempts - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
            }
        }
    }
    return null;
}

// ========== دوال تحميل الصور (مثل كود الصور) ==========

// تحميل الصورة من الرابط مع إعادة المحاولة
async function downloadImage(url, maxAttempts = 3) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const response = await axios({
                url: url,
                method: 'GET',
                responseType: 'arraybuffer',
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://mangadex.org/'
                }
            });
            if (response.data && response.data.length > 5000) {
                return Buffer.from(response.data);
            }
        } catch (e) {
            console.warn(`محاولة ${attempt + 1} لتحميل الصورة فشلت:`, e.message);
            if (attempt < maxAttempts - 1) {
                await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
            }
        }
    }
    return null;
}

// ========== جلب صورة الغلاف ==========

function getCoverUrl(mangaId, coverFileName) {
    if (!coverFileName) return null;
    return `https://uploads.mangadex.org/covers/${mangaId}/${coverFileName}`;
}

// ========== دوال التنسيق ==========

function formatChaptersMessage(mangaTitle, chapters, coverUrl) {
    let message = `📚 *${mangaTitle}*\n━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (!chapters || chapters.length === 0) {
        message += `❌ لا توجد فصول متاحة لهذه المانجا.`;
        return { text: message, image: coverUrl };
    }

    // تصفية الفصول التي تحتوي على أرقام صحيحة
    const validChapters = chapters.filter(c => c.attributes.chapter && !isNaN(c.attributes.chapter));
    if (validChapters.length === 0) {
        message += `❌ لا توجد فصول صالحة لهذه المانجا.`;
        return { text: message, image: coverUrl };
    }

    // ترتيب الفصول تنازلياً
    const sortedChapters = validChapters.sort((a, b) => parseFloat(b.attributes.chapter) - parseFloat(a.attributes.chapter));

    message += `📖 *عدد الفصول:* ${sortedChapters.length}\n\n`;
    message += `📌 *أحدث الفصول:*\n`;

    const limitedChapters = sortedChapters.slice(0, 10);
    for (const chapter of limitedChapters) {
        const chapterNum = chapter.attributes.chapter || '?';
        const title = chapter.attributes.title || 'بدون عنوان';
        let lang = 'غير محدد';
        const langData = chapter.attributes.translatedLanguage;
        if (Array.isArray(langData)) lang = langData.join(', ');
        else if (typeof langData === 'string') lang = langData;
        message += `• الفصل ${chapterNum} - ${title} (${lang})\n`;
    }

    if (sortedChapters.length > 10) {
        message += `\n⚠️ *و ${sortedChapters.length - 10} فصول أخرى...*`;
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📌 *لقراءة فصل معين:* .مانهو "${mangaTitle}" <رقم الفصل>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `〔 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻 〕`;
    
    return { text: message, image: coverUrl };
}

// ========== الأمر الرئيسي ==========

module.exports = {
    command: ['مانهو'],
    category: 'وسائط',
    description: '📚 جلب فصول المانجا وصور الفصل (مع نظام بحث متقدم)',
    usage: '.مانهو <اسم المانجا> - عرض الفصول\n.مانهو <اسم المانجا> <رقم الفصل> - عرض صور الفصل',

    async execute(sock, msg, args) {
        try {
            const chatId = msg.key.remoteJid;

            // استخراج اسم المانجا ورقم الفصل
            let searchQuery = args ? args.join(' ').trim() : '';

            if (!searchQuery && msg.message?.conversation) {
                searchQuery = msg.message.conversation.replace(/^\.مانهو\s*/i, '').trim();
            }

            if (!searchQuery && msg.message?.extendedTextMessage?.text) {
                searchQuery = msg.message.extendedTextMessage.text.replace(/^\.مانهو\s*/i, '').trim();
            }

            if (!searchQuery) {
                return await sock.sendMessage(chatId, {
                    text: `📚 *أمر المانجا*\n━━━━━━━━━━━━━━━━━━━━\n📌 *الاستخدام:*\n.مانهو <اسم المانجا> - عرض الفصول\n.مانهو <اسم المانجا> <رقم الفصل> - عرض صور الفصل\n\n📌 *مثال:*\n.مانهو ون بيس\n.مانهو ناروتو 172`
                }, { quoted: msg });
            }

            // ===== تحليل النص: استخراج رقم الفصل =====
            let chapterNumber = null;
            const words = searchQuery.split(' ');
            const lastWord = words[words.length - 1];
            if (!isNaN(lastWord) && parseInt(lastWord) > 0) {
                chapterNumber = parseInt(lastWord);
                searchQuery = words.slice(0, -1).join(' ');
            }

            // تفاعل جارٍ البحث
            await sock.sendMessage(chatId, {
                react: { text: '⏳', key: msg.key }
            });

            // ===== البحث عن المانجا (مع إعادة المحاولة) =====
            const mangaResults = await searchManga(searchQuery);
            if (!mangaResults || mangaResults.length === 0) {
                await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
                return await sock.sendMessage(chatId, {
                    text: `❌ لم يتم العثور على مانجا باسم "${searchQuery}".\n📌 تأكد من كتابة الاسم بشكل صحيح.`
                }, { quoted: msg });
            }

            // اختيار النتيجة الأولى (الأكثر تطابقاً)
            const manga = mangaResults[0];
            const mangaId = manga.id;
            const mangaTitle = manga.attributes.title.en || manga.attributes.title['ja-ro'] || 'غير معروف';

            // ===== جلب صورة الغلاف =====
            let coverUrl = null;
            const coverRelationships = manga.relationships.filter(rel => rel.type === 'cover_art');
            if (coverRelationships.length > 0) {
                const coverFileName = coverRelationships[0].attributes?.fileName;
                if (coverFileName) coverUrl = getCoverUrl(mangaId, coverFileName);
            }

            // ===== إذا كان هناك رقم فصل محدد =====
            if (chapterNumber) {
                // جلب جميع الفصول
                const allChapters = await getMangaChapters(mangaId);
                if (!allChapters || allChapters.length === 0) {
                    await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
                    return await sock.sendMessage(chatId, {
                        text: `❌ لا توجد فصول متاحة لـ "${mangaTitle}".`
                    }, { quoted: msg });
                }

                // البحث عن الفصل المطلوب
                const targetChapter = allChapters.find(c => {
                    const chNum = c.attributes.chapter;
                    return chNum && !isNaN(chNum) && parseFloat(chNum) === chapterNumber;
                });

                if (!targetChapter) {
                    const availableChapters = allChapters
                        .filter(c => c.attributes.chapter && !isNaN(c.attributes.chapter))
                        .sort((a, b) => parseFloat(a.attributes.chapter) - parseFloat(b.attributes.chapter))
                        .map(c => parseFloat(c.attributes.chapter));
                    
                    let suggestion = '';
                    if (availableChapters.length > 0) {
                        const nearest = availableChapters.reduce((prev, curr) => 
                            Math.abs(curr - chapterNumber) < Math.abs(prev - chapterNumber) ? curr : prev
                        );
                        suggestion = `\n\n📌 *الفصل الأقرب المتاح:* ${nearest}\n📌 *جرب:* .مانهو "${mangaTitle}" ${nearest}`;
                    }

                    await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
                    return await sock.sendMessage(chatId, {
                        text: `❌ لا يوجد فصل ${chapterNumber} لـ "${mangaTitle}".${suggestion}`
                    }, { quoted: msg });
                }

                const chapterId = targetChapter.id;
                const chapterNum = targetChapter.attributes.chapter || '?';
                const chapterTitle = targetChapter.attributes.title || 'بدون عنوان';
                const chapterLang = Array.isArray(targetChapter.attributes.translatedLanguage) 
                    ? targetChapter.attributes.translatedLanguage.join(', ') 
                    : targetChapter.attributes.translatedLanguage || 'غير محدد';

                // ===== جلب صور الفصل (مع إعادة المحاولة) =====
                let pagesData;
                try {
                    pagesData = await getChapterPages(chapterId);
                } catch (pageError) {
                    await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
                    let errorMsg = `❌ فشل تحميل صور الفصل ${chapterNum}.`;
                    if (pageError.message.includes('404')) {
                        errorMsg += `\n\n📌 *السبب:* الفصل غير متاح حالياً.\n📌 *نصيحة:* جرب فصلاً آخر.`;
                    } else {
                        errorMsg += `\n\n📌 *السبب:* ${pageError.message}`;
                    }
                    return await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
                }

                if (!pagesData || !pagesData.chapter || !pagesData.chapter.data || pagesData.chapter.data.length === 0) {
                    await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
                    return await sock.sendMessage(chatId, {
                        text: `❌ الفصل ${chapterNum} لا يحتوي على صور.`
                    }, { quoted: msg });
                }

                const baseUrl = pagesData.baseUrl;
                const chapterHash = pagesData.chapter.hash;
                const pageFiles = pagesData.chapter.data;

                // ===== إرسال صور الفصل (بنفس طريقة كود الصور) =====
                const totalPages = pageFiles.length;
                const caption = `📚 *${mangaTitle}*\n━━━━━━━━━━━━━━━━━━━━\n📖 *الفصل ${chapterNum}* - ${chapterTitle}\n🌐 *اللغة:* ${chapterLang}\n📄 *عدد الصفحات:* ${totalPages}\n━━━━━━━━━━━━━━━━━━━━\n〔 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻 〕`;

                // تحميل الصور واحدة تلو الأخرى وإرسالها
                const firstImageBuffer = await downloadImage(`${baseUrl}/data/${chapterHash}/${pageFiles[0]}`);
                if (!firstImageBuffer) {
                    await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
                    return await sock.sendMessage(chatId, {
                        text: `❌ فشل تحميل الصورة الأولى للفصل ${chapterNum}.`
                    }, { quoted: msg });
                }

                // إرسال الصورة الأولى مع الكابشن
                await sock.sendMessage(chatId, {
                    image: firstImageBuffer,
                    caption: caption
                }, { quoted: msg });

                // إرسال باقي الصور
                for (let i = 1; i < pageFiles.length; i++) {
                    const imageBuffer = await downloadImage(`${baseUrl}/data/${chapterHash}/${pageFiles[i]}`);
                    if (imageBuffer) {
                        await sock.sendMessage(chatId, {
                            image: imageBuffer
                        });
                    } else {
                        console.warn(`⚠️ فشل تحميل الصفحة ${i+1}`);
                    }
                    // تأخير 200ms بين الصور لتجنب الحظر وضمان الترتيب
                    await new Promise(r => setTimeout(r, 200));
                }

                await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
                return;
            }

            // ===== عرض قائمة الفصول =====
            const chapters = await getMangaChapters(mangaId);
            if (!chapters || chapters.length === 0) {
                await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
                return await sock.sendMessage(chatId, {
                    text: `❌ لا توجد فصول متاحة لـ "${mangaTitle}".`
                }, { quoted: msg });
            }

            const { text, image } = formatChaptersMessage(mangaTitle, chapters, coverUrl);

            if (image) {
                const coverBuffer = await downloadImage(image);
                if (coverBuffer) {
                    await sock.sendMessage(chatId, {
                        image: coverBuffer,
                        caption: text
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(chatId, { text }, { quoted: msg });
            }

            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });

        } catch (err) {
            console.error('❌ خطأ في أمر المانجا:', err);
            await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حدث خطأ: ${err.message || 'خطأ غير معروف'}`
            }, { quoted: msg });
        }
    }
};