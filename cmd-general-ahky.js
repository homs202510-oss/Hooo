// احكي.js - ترجمة ونطق النص بأي لغة (مع نقاط)

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ========== المسارات ==========
const pointsFile = path.join(__dirname, 'db-points.json');
const PRICE = 50;

// ========== معلومات اللغات ==========
const langsInfo = {
    'عربي': { code: 'ar', flag: '🇸🇦', name: 'العربية', supported: true },
    'انجليزي': { code: 'en', flag: '🇬🇧', name: 'الإنجليزية', supported: true },
    'فرنسي': { code: 'fr', flag: '🇫🇷', name: 'الفرنسية', supported: true },
    'ألماني': { code: 'de', flag: '🇩🇪', name: 'الألمانية', supported: true },
    'إسباني': { code: 'es', flag: '🇪🇸', name: 'الإسبانية', supported: true },
    'روسي': { code: 'ru', flag: '🇷🇺', name: 'الروسية', supported: true },
    'هندي': { code: 'hi', flag: '🇮🇳', name: 'الهندية', supported: true },
    'إيطالي': { code: 'it', flag: '🇮🇹', name: 'الإيطالية', supported: true },
    'صيني': { code: 'zh-CN', flag: '🇨🇳', name: 'الصينية', supported: false },
    'ياباني': { code: 'ja', flag: '🇯🇵', name: 'اليابانية', supported: false },
    'تركي': { code: 'tr', flag: '🇹🇷', name: 'التركية', supported: true },
    'كوري': { code: 'ko', flag: '🇰🇷', name: 'الكورية', supported: false },
    'فارسي': { code: 'fa', flag: '🇮🇷', name: 'الفارسية', supported: false },
    'برتغالي': { code: 'pt', flag: '🇵🇹', name: 'البرتغالية', supported: true },
    'هولندي': { code: 'nl', flag: '🇳🇱', name: 'الهولندية', supported: true },
    'يوناني': { code: 'el', flag: '🇬🇷', name: 'اليونانية', supported: false },
    'سويدي': { code: 'sv', flag: '🇸🇪', name: 'السويدية', supported: true }
};

// ========== دوال النقاط ==========
function loadPoints() {
    if (!fs.existsSync(pointsFile))
        fs.writeFileSync(pointsFile, JSON.stringify({}, null, 2));
    return JSON.parse(fs.readFileSync(pointsFile));
}

function savePoints(data) {
    fs.writeFileSync(pointsFile, JSON.stringify(data, null, 2));
}

// ========== دالة الإرسال بتنسيق موحد ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🗣️ الـتـرجـمـة والـنـطـق 🗣️\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    
    await sock.sendMessage(chatId, { 
        text: msg, 
        mentions 
    }, { 
        quoted: quoted 
    });
}

// ========== دالة الترجمة ==========
async function translate(text, targetLang) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await axios.get(url, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        if (res.data?.[0]) {
            return res.data[0].map(x => x[0]).join('');
        }
        return null;
    } catch (error) {
        console.error('❌ خطأ في الترجمة:', error.message);
        return null;
    }
}

// ========== دالة تحويل النص إلى صوت (محسنة) ==========
async function textToSpeech(text, lang, file) {
    try {
        // تنظيف النص من الرموز الخاصة
        const cleanText = text.replace(/[^a-zA-Z0-9\u0600-\u06FF\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\uAC00-\uD7AF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\s]/g, ' ');
        const encodedText = encodeURIComponent(cleanText.substring(0, 200)); // حد أقصى 200 حرف
        
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`;
        
        const res = await axios.get(url, {
            responseType: 'stream',
            timeout: 20000,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        // التحقق من أن الاستجابة تحتوي على بيانات
        if (!res.data) {
            throw new Error('استجابة فارغة من الخادم');
        }
        
        const writer = fs.createWriteStream(file);
        res.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                // التحقق من أن الملف ليس فارغاً
                const stats = fs.statSync(file);
                if (stats.size < 1000) {
                    reject(new Error('الملف الصوتي فارغ أو تالف'));
                } else {
                    resolve();
                }
            });
            writer.on('error', reject);
            
            // مهلة إضافية
            setTimeout(() => {
                reject(new Error('انتهت المهلة'));
            }, 30000);
        });
    } catch (error) {
        console.error('❌ خطأ في TTS:', error.message);
        throw new Error(`فشل تحويل النص إلى صوت: ${error.message}`);
    }
}

// ========== دالة عرض اللغات ==========
function getLanguagesList() {
    const lines = ['📚 *اللغات المدعومة للنطق:*', ''];
    const langs = Object.keys(langsInfo);
    
    // عرض اللغات المدعومة فقط
    const supported = langs.filter(l => langsInfo[l].supported);
    const unsupported = langs.filter(l => !langsInfo[l].supported);
    
    const half = Math.ceil(supported.length / 2);
    const firstCol = supported.slice(0, half);
    const secondCol = supported.slice(half);
    
    for (let i = 0; i < Math.max(firstCol.length, secondCol.length); i++) {
        const left = firstCol[i] ? `${langsInfo[firstCol[i]].flag} ${firstCol[i]}` : '';
        const right = secondCol[i] ? `${langsInfo[secondCol[i]].flag} ${secondCol[i]}` : '';
        if (left && right) {
            lines.push(`   ${left.padEnd(20)} ${right}`);
        } else if (left) {
            lines.push(`   ${left}`);
        } else if (right) {
            lines.push(`   ${right}`);
        }
    }
    
    if (unsupported.length > 0) {
        lines.push('');
        lines.push('⚠️ *لغات غير مدعومة للنطق:*');
        lines.push(`   ${unsupported.map(l => `${langsInfo[l].flag} ${l}`).join('  ')}`);
        lines.push('   (سيتم النطق بالعربية بدلاً منها)');
    }
    
    lines.push('');
    lines.push(`💰 سعر الخدمة: *${PRICE} نقطة*`);
    lines.push('💡 استخدم: `.احكي النص` (بالعربي)');
    lines.push('📝 مثال: `.احكي مرحبا كيف حالك`');
    lines.push('🌍 أو `.احكي لغة النص`');
    lines.push('📝 مثال: `.احكي تركي مرحبا`');
    
    return lines;
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['احكي', 'انطق', 'نطق'],
    description: '🗣️ ترجمة ونطق النص بأي لغة',
    category: 'عام',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const senderNumber = sender.split('@')[0];

            // ===== قراءة النص =====
            const fullText = msg.message?.conversation || 
                            msg.message?.extendedTextMessage?.text || '';

            // ===== عرض المساعدة =====
            if (!fullText || fullText.trim() === '.احكي' || fullText.trim() === '.انطق') {
                const lines = getLanguagesList();
                return sendMessage(sock, chatId, lines, msg);
            }

            // ===== التحقق من النقاط =====
            const points = loadPoints();
            const userPoints = points[sender] || 0;

            if (userPoints < PRICE) {
                const lines = [
                    '❌ *رصيد غير كافٍ*',
                    '',
                    `💰 سعر الخدمة: *${PRICE} نقطة*`,
                    `💰 رصيدك الحالي: *${userPoints} نقطة*`,
                    `💰 المتبقي: *${PRICE - userPoints} نقطة*`,
                    '',
                    '📌 يمكنك كسب النقاط عبر:',
                    '   • الفوز في المعارك ⚔️',
                    '   • هزيمة الوحوش 🐉',
                    '   • المشاركة في الفعاليات 🎯'
                ];
                return sendMessage(sock, chatId, lines, msg);
            }

            // ===== استخراج النص =====
            const parts = fullText.trim().split(/\s+/);
            parts.shift();
            
            if (parts.length === 0) {
                const lines = [
                    '⚠️ *يرجى كتابة النص*',
                    '',
                    '📌 الصيغة: `.احكي النص`',
                    '📌 أو `.احكي لغة النص`',
                    '',
                    'مثال: `.احكي مرحبا`',
                    'مثال: `.احكي تركي مرحبا`'
                ];
                return sendMessage(sock, chatId, lines, msg);
            }

            // ===== التحقق من وجود لغة محددة =====
            const firstWord = parts[0].toLowerCase();
            let targetLang = 'ar';
            let langKey = 'عربي';
            let textStartIndex = 0;
            
            let foundLang = false;
            for (const [key, info] of Object.entries(langsInfo)) {
                if (key.toLowerCase() === firstWord || info.name === firstWord) {
                    targetLang = info.code;
                    langKey = key;
                    foundLang = true;
                    textStartIndex = 1;
                    break;
                }
            }

            // ===== استخراج النص =====
            let originalText;
            if (foundLang) {
                originalText = parts.slice(textStartIndex).join(' ');
            } else {
                originalText = parts.join(' ');
                langKey = 'عربي';
                targetLang = 'ar';
            }

            if (!originalText || originalText.trim().length === 0) {
                const lines = [
                    '⚠️ *يرجى كتابة النص*',
                    '',
                    '📌 الصيغة: `.احكي النص`',
                    '📌 أو `.احكي لغة النص`'
                ];
                return sendMessage(sock, chatId, lines, msg);
            }

            // ===== تحديد اللغة المعروضة =====
            const langDisplay = langKey;
            const langFlag = langsInfo[langDisplay]?.flag || '🇸🇦';
            const isSupported = langsInfo[langDisplay]?.supported !== false;

            // ===== خصم النقاط =====
            points[sender] -= PRICE;
            savePoints(points);

            // ===== رسالة جاري الترجمة =====
            await sock.sendMessage(chatId, {
                text: `⏳ *جاري الترجمة والنطق...*\n━━━━━━━━━━━━━━━━━━━━\n${langFlag} ${langDisplay}\n📝 "${originalText}"\n💰 تم خصم ${PRICE} نقطة`
            }, { quoted: msg });

            // ===== الترجمة =====
            let translatedText = originalText;
            let usedLang = targetLang;
            
            if (targetLang !== 'ar') {
                translatedText = await translate(originalText, targetLang);
                
                if (!translatedText) {
                    points[sender] += PRICE;
                    savePoints(points);
                    
                    return sendMessage(sock, chatId, [
                        '❌ *فشلت الترجمة*',
                        '',
                        '📌 تم إرجاع النقاط تلقائياً',
                        '📌 حاول مرة أخرى أو استخدم لغة أخرى'
                    ], msg);
                }
            }

            // ===== التحقق من دعم اللغة للنطق =====
            let speechText = translatedText;
            let speechLang = targetLang;
            let speechLangDisplay = langDisplay;
            
            if (!isSupported) {
                // إذا كانت اللغة غير مدعومة، ننطق بالعربية
                speechLang = 'ar';
                speechLangDisplay = 'عربي (ترجمة)';
                // نترجم النص للعربية للنطق
                if (targetLang !== 'ar') {
                    const arabicTranslation = await translate(translatedText, 'ar');
                    if (arabicTranslation) {
                        speechText = arabicTranslation;
                    }
                }
            }

            // ===== إنشاء ملف الصوت =====
            const file = path.join(__dirname, `speech_${Date.now()}.mp3`);
            
            try {
                await textToSpeech(speechText, speechLang, file);
            } catch (error) {
                points[sender] += PRICE;
                savePoints(points);
                
                return sendMessage(sock, chatId, [
                    '❌ *فشل تحويل النص إلى صوت*',
                    '',
                    '📌 تم إرجاع النقاط تلقائياً',
                    `📝 ${error.message}`,
                    '📌 حاول نصاً أقصر أو بلغة أخرى'
                ], msg);
            }

            // ===== بناء رسالة النتيجة =====
            const remainingPoints = points[sender] || 0;
            
            let resultLines = [];
            
            if (targetLang === 'ar') {
                resultLines = [
                    `🗣️ *النطق — ${langFlag} ${langDisplay}*`,
                    `━━━━━━━━━━━━━━━━━━━━`,
                    `📝 "${translatedText}"`,
                    `━━━━━━━━━━━━━━━━━━━━`,
                    `💰 الرصيد المتبقي: *${remainingPoints} نقطة*`,
                    `━━━━━━━━━━━━━━━━━━━━`,
                    `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
                ];
            } else {
                let extraLine = '';
                if (!isSupported) {
                    extraLine = `\n⚠️ تم النطق بالعربية (اللغة غير مدعومة للنطق)`;
                }
                
                resultLines = [
                    `🗣️ *الترجمة والنطق — ${langFlag} ${langDisplay}*`,
                    `━━━━━━━━━━━━━━━━━━━━`,
                    `📝 *النص الأصلي:*`,
                    `${originalText}`,
                    `━━━━━━━━━━━━━━━━━━━━`,
                    `🌐 *النص المترجم:*`,
                    `${translatedText}`,
                    extraLine,
                    `━━━━━━━━━━━━━━━━━━━━`,
                    `💰 الرصيد المتبقي: *${remainingPoints} نقطة*`,
                    `━━━━━━━━━━━━━━━━━━━━`,
                    `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
                ].filter(line => line !== '');
            }

            // ===== إرسال النتيجة =====
            await sock.sendMessage(chatId, {
                text: resultLines.join('\n'),
                mentions: [sender]
            }, { quoted: msg });

            // ===== إرسال الصوت =====
            if (fs.existsSync(file)) {
                const stats = fs.statSync(file);
                if (stats.size > 1000) {
                    await sock.sendMessage(chatId, {
                        audio: fs.readFileSync(file),
                        mimetype: 'audio/mpeg',
                        ptt: false
                    }, { quoted: msg });
                }
                
                try {
                    fs.unlinkSync(file);
                } catch (e) {}
            }

        } catch (error) {
            console.error('❌ خطأ في أمر احكي:', error);
            
            const lines = [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ];
            
            await sendMessage(sock, msg.key.remoteJid, lines, msg);
        }
    }
};