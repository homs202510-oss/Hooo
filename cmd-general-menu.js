// اوامر.js - قائمة الأوامر بحسب الفئة (نسخة مستقرة مع دعم الأوامر المباشرة)
// يدعم: .اوامر، .قائمة، .menu، .قسم، .اقسام، .الاوامر
// يدعم أيضاً كتابة اسم القسم مباشرة: .تسلية، .عرس، .العاب، ... إلخ (مضاف في command)

const fs = require('fs');
const path = require('path');

// صورة القائمة: صورة البوت لو موجودة، وإلا image.jpeg جنب الملفات
function getMenuImage() {
    try {
        const bp = require('./svc-botProfile');
        if (bp.hasImage()) {
            const r = bp.getImageBuffer();
            if (r.ok) return r.buffer;
        }
    } catch (_) {}
    const p = path.join(__dirname, 'image.jpeg');
    return fs.existsSync(p) ? fs.readFileSync(p) : null;
}

// ========== إيموجيات الأقسام ==========
const categoryIcons = {
    'خاصة': '🔒',
    'عام': '🌐',
    'ادارة': '👑',
    'العاب': '🎮',
    'تسلية': '🎯',
    'ترفيه': '🎪',
    'ديني': '🕌',
    'نظام': '⚙️',
    'المطور': '💻',
    'يوتيوب': '▶️',
    'AI': '🤖',
    'وسائط': '🎬',
    'خدمات': '🛠️',
    'متجر': '🛒',
    'مالية': '💰',
    'مملكة': '🏰',
    'مرح': '😄',
    'ملصقات': '🏷️',
    'أدوات': '🔧',
    'فعاليات': '🎊',
    'عرس': '💍',
    'مهام': '📋',
    'نقابات': '⚔️',
    'أخرى': '📦',
    'بنك': '🏦',
    'تحرش': '👀'
};

// ========== الأوامر الثابتة المطلوب إضافتها ==========
const staticCommands = {
    'خاصة': [
        { cmd: 'اقفل', desc: '🔒 قفل أمر عالمياً' },
        { cmd: 'افتح', desc: '🔓 فتح أمر عالمياً' },
        { cmd: 'المقفولة', desc: '📋 عرض الأوامر المقفولة' },
        { cmd: 'بان', desc: '⛔ حظر مستخدم' },
        { cmd: 'فك', desc: '✅ فك الحظر عن مستخدم' },
        { cmd: 'بان فك', desc: '✅ فك الحظر عن مستخدم' },
        { cmd: 'تفعيل', desc: '▶️ تفعيل مجلد (زرف)' },
        { cmd: 'تعطيل', desc: '⏹️ تعطيل مجلد (زرف)' }
    ],
    'عام': [
        { cmd: 'تفاعل', desc: '😎 تعيين تفاعل لنفسك' },
        { cmd: 'استقبال', desc: '📋 .استقبال قفل استقبال الأعضاء' },
        { cmd: 'وداع', desc: '💔 .وداع قفل  رسائل الوداع' },
        { cmd: 'ترحيب', desc: '🌷 .ترحيب قفل رسائل الترحيب' },
        { cmd: 'رد تلقائي', desc: '🤖 لتشغيل الردود التلقائية' },
        // ====== أوامر بدون نقطة (تعمل كأوامر نصية) ======
        { cmd: 'اتكلم', desc: '🗣️ تشغيل الردود التلقائية (بدون نقطة)' },
        { cmd: 'تشغيل الردود', desc: '▶️ تشغيل الردود التلقائية (بدون نقطة)' },
        { cmd: 'اكتم', desc: '🔇 إيقاف الردود التلقائية (بدون نقطة)' },
        { cmd: 'اطفي الردود', desc: '🔇 إيقاف الردود التلقائية (بدون نقطة)' },
        { cmd: 'أخرس', desc: '🔇 إيقاف الردود التلقائية (بدون نقطة)' }
    ]
};

// ========== قائمة الأوامر التي تعمل بدون نقطة ==========
const noDotCommands = ['اتكلم', 'تشغيل الردود', 'اكتم', 'اطفي الردود', 'أخرس'];

// ========== إيموجيات الأوامر ==========
function getCommandEmoji(commandName) {
    const emojiMap = {
        'اونر': '👑',
        'ايقاف': '⏹️',
        'اوامر': '📋',
        'مطور': '💻',
        'نخبة': '⭐',
        'ادمن': '👥',
        'bot': '🤖',
        'lids': '🆔',
        'zarf_control': '⚙️',
        'تبادل': '📊',
        'منشن': '📢',
        'م': '📢',
        'مخفي': '👥',
        'حماية': '🛡️',
        'حماية-الاشراف': '🛡️',
        'طرد': '🚫',
        'طرد-فردي': '🚫',
        'حظر': '⛔',
        'حظر_كلمات': '⛔',
        'تقييد': '🔇',
        'رفع': '⬆️',
        'تنزيل': '⬇️',
        'تعيين': '📌',
        'ترقية': '⬆️',
        'ادارة': '👑',
        'تنظيف': '🧹',
        'حذف': '🗑️',
        'مسح': '🧹',
        'تثبيت': '📌',
        'الغاء': '❌',
        'قفل': '🔒',
        'قفل-توقيت': '⏰',
        'فتح': '🔓',
        'كتم': '🔇',
        'منع': '🚫',
        'رابط': '🔗',
        'لينك': '🔗',
        'لرابط': '🔗',
        'باتش': '📦',
        'نسخة': '📋',
        'نشر': '📤',
        'تشغيل': '▶️',
        'شغل': '▶️',
        'ريستارت': '🔄',
        'تحديث': '🔄',
        'نسخ': '📋',
        'جلب': '📥',
        'استخراج': '📥',
        'قائمة': '📋',
        'لعبة': '🎮',
        'العاب': '🎮',
        'تسلية': '🎯',
        'ترفيه': '🎪',
        'مرح': '😄',
        'نكتة': '😂',
        'مزح': '😜',
        'تحدي': '⚔️',
        'مسابقة': '🏆',
        'احجية': '🧩',
        'لغز': '🧩',
        'تخمين': '🤔',
        'تخمين صور': '🖼️',
        'تخمين_الشخصية': '👤',
        'اكس_او': '❌⭕',
        'نرد': '🎲',
        'قرعة': '🎲',
        'حظ': '🍀',
        'حظي': '🍀',
        'تست': '🧪',
        'تست اسرع': '⚡',
        'اسال': '❓',
        'سوال': '❓',
        'سؤال عشوائي': '❓',
        'احكي': '💬',
        'شاتي': '💬',
        'نقاشي': '💬',
        'توك': '🎞️',
        'تيك': '📺',
        'تك': '🎧',
        'توست': '🍞',
        'ديث نوت': '📓',
        'انمي': '🎌',
        'انميات': '🎌',
        'لانمي': '🎌',
        'مياو': '🐱',
        'بوسة': '😘',
        'حب': '❤️',
        'مدح': '👍',
        'قرآن': '📖',
        'اذكار': '🕌',
        'دعاء': '🤲',
        'صلاه': '🕌',
        'ديني': '🕌',
        'حديث': '📜',
        'تفسير': '📚',
        'فقه': '📚',
        'سيره': '📖',
        'صحابة': '👥',
        'انبياء': '👤',
        'اسماء الله': '🕌',
        'ابتهالات': '🎵',
        'اذان': '🔊',
        'موعظه': '📢',
        'كفاره': '🕋',
        'بدعة': '⚠️',
        'تعويذ': '🛡️',
        'اسلام': '☪️',
        'اية': '📖',
        'سنن': '📜',
        'دولة': '🏳️',
        'عاصمة': '🏛️',
        'صورة': '🖼️',
        'صوره': '🖼️',
        'لصوره': '🖼️',
        'فيديو': '🎬',
        'لفيديو': '🎬',
        'بحث-فيديو-يوتيوب': '▶️',
        'يوتيوب': '▶️',
        'اغنيه': '🎵',
        'اغنية': '🎵',
        'موسيقى': '🎶',
        'صوت': '🎤',
        'لصوت': '🎤',
        'فيلم': '🎥',
        'مسلسل': '📺',
        'ملصق': '🏷️',
        'ملصقات': '🏷️',
        'ايموجي': '😊',
        'زخرف': '✨',
        'نص-فني': '🎨',
        'كتابة': '✍️',
        'شعر': '📝',
        'قصة': '📖',
        'مال': '💰',
        'فلوس': '💰',
        'حساب': '🧮',
        'تحويل': '💸',
        'رصيد': '💳',
        'ايداع': '🏦',
        'سحب': '🏦',
        'سداد': '💳',
        'سلفني': '🤝',
        'شراء': '🛍️',
        'بيع': '🏪',
        'متجر': '🛒',
        'مخزن': '📦',
        'بنك': '🏦',
        'عملات': '🪙',
        'ضريبة': '💰',
        'بوت': '🤖',
        'فانتوم': '👻',
        'المطور': '💻',
        'تطوير': '⚙️',
        'تحسين': '🔧',
        'تصحيح': '✅',
        'كونيكت': '🕹️',
        'معلومات': 'ℹ️',
        'مساعدة': '❓',
        'حالة': '📊',
        'تقييم': '⭐',
        'تصنيف': '📊',
        'تصنيفي': '📊',
        'بروفايل': '👤',
        'رتب': '🏅',
        'نقاط': '⭐',
        'مهامي': '📋',
        'مهمة': '📋',
        'مملكة': '🏰',
        'مملكتي': '🏰',
        'بحث عن مملكة': '🔍',
        'تغير_اسم_المملكة': '✏️',
        'استعادة مملكة': '🔄',
        'انشاء فريق': '👥',
        'فريقي': '👥',
        'غزو': '⚔️',
        'هجوم': '⚔️',
        'دفاع': '🛡️',
        'معاهده': '📜',
        'ولاء': '🤝',
        'خنق': '😤',
        'ضرب': '👊',
        'ركل': '🦶',
        'صفع': '✋',
        'عض': '🦷',
        'لحس': '👅',
        'عبد': '🧎',
        'سرقة': '🦹',
        'تهكير': '💻',
        'اختراق': '💻',
        'قتل': '🔪',
        'قاتل': '🔪',
        'اغتصاب': '👅',
        'تحرش': '🫦',
        'تنمر': '🫣',
        'شاذ': '🥵',
        'زنجي': '👁️',
        'ارسم': '🎨',
        'رسم': '🎨',
        'صياغه': '✍️',
        'حكمة': '💡',
        'نصيحة': '💡',
        'معاني': '📖',
        'علم': '🇪🇬',
        'حيوان': '🐾',
        'فاكهة': '🍎',
        'طيور': '🐦',
        'سمك': '🐟',
        'وحش': '👹',
        'خروف': '🐑',
        'عجلة': '🎡',
        'تواصل': '📞',
        'اتصل': '📞',
        'خاص': '🔒',
        'سرية': '🔐',
        'مفرد': '📝',
        'جمع': '📝',
        'عكس': '🔄',
        'حرف': '🔤',
        'حروف': '🔤',
        'معجزة': '✨',
        'فعالية_اعلام': '📢',
        'استطلاع': '📊',
        'استمارة': '📋',
        'قوانين': '📜',
        'حقوق': '⚖️',
        'شكوى': '📝',
        'شغلي': '📋',
        'خطيبتي': '💍',
        'زواج': '💑',
        'طلاق': '💔',
        'زوجني': '💍',
        'زوجهم': '💑',
        'انضمام': '🥳',
        'خروج': '🚪',
        'دخل': '💰',
        'خش': '🚪',
        'عين': '👁️',
        'تامل': '🧘',
        'جمال': '✨',
        'انوثه': '👩',
        'ذكوره': '👨',
        'ابكي': '😢',
        'زحلق': '🛝',
        'قنابل': '💣',
        'مؤبد': '⛓️',
        'سجن': '⛓️',
        'اعدام': '💀',
        'هش للطرد': '⚠️',
        'هيروغليفي': '🪐'
    };
    
    if (emojiMap[commandName]) return emojiMap[commandName];
    for (const [key, emoji] of Object.entries(emojiMap)) {
        if (commandName.includes(key) || key.includes(commandName)) return emoji;
    }
    const defaultEmojis = {
        'ا': '📌', 'ب': '📌', 'ت': '🎯', 'ث': '📌', 'ج': '📌',
        'ح': '🛡️', 'خ': '📌', 'د': '🕌', 'ذ': '📌', 'ر': '📌',
        'ز': '📌', 'س': '📌', 'ش': '📌', 'ص': '📌', 'ض': '📌',
        'ط': '🚫', 'ظ': '📌', 'ع': '🌐', 'غ': '📌', 'ف': '📌',
        'ق': '📋', 'ك': '📌', 'ل': '🎮', 'م': '📌', 'ن': '📌',
        'ه': '📌', 'و': '📌', 'ي': '▶️',
    };
    return defaultEmojis[commandName.charAt(0)] || '◉';
}

// ============================================================
// 📋 الأمر الرئيسي
// ============================================================

let cachedCategories = null;

// أسماء الأقسام العربية لأوامر PHANTOM الأصلية
const CAT_AR = {
    achievements: 'إنجازات', advanced: 'متقدم', ai: 'AI', basic: 'عام', diplomacy: 'مملكة',
    economy: 'مالية', fun: 'ترفيه', group: 'ادارة', help: 'عام', info: 'عام', kingdom: 'مملكة',
    market: 'متجر', media: 'وسائط', missions: 'مهام', personal: 'عام', system: 'نظام',
    text: 'أدوات', tools: 'أدوات', user: 'عام'
};

// القائمة بتتبني من الأوامر المحمّلة فعلاً (مفيش قائمة ثابتة)
function loadCommands() {
    const { getAllCommands, getCommand } = require('./core-loader');
    const categories = {};
    const seen = new Set();

    for (const [, plugin] of getAllCommands()) {
        if (plugin.hidden) continue;
        const all = [].concat(plugin.name || [], plugin.aliases || []).filter(Boolean);
        // نعرض بس الأسماء اللي فعلاً تابعة للأمر ده (مش اللي اتغطت بأمر تاني)
        const names = all.filter(n => {
            const c = getCommand(n);
            return c && c.run === plugin.run;
        });
        if (!names.length) continue;
        const key = names[0];
        if (seen.has(key)) continue;
        seen.add(key);

        const cmdDisplay = `✦ ${names.map(c => `${getCommandEmoji(c)} \`${c}\``).join(' ✦ ')}`
            + (plugin.description ? `\n ${plugin.description}` : '');

        const categoryName = plugin.arCategory || CAT_AR[plugin.category] || 'أخرى';
        if (!categories[categoryName]) categories[categoryName] = [];
        categories[categoryName].push(cmdDisplay);
    }

    for (const cat in categories) {
        categories[cat].sort((a, b) => a.localeCompare(b, 'ar'));
    }
    return categories;
}

module.exports = {
    status: "on",
    name: 'قائمة الأوامر',
    // نضع أسماء الأقسام هنا لتعمل مباشرة
    command: [
        'اوامر', 'قائمة', 'menu', 'قسم', 'اقسام', 'الاوامر',
        'خاصة', 'عام', 'العاب', 'تحرش', 'تسلية',
        'ديني', 'نظام', 'نقابات', 'وسائط', 'فعاليات', 'عرس', 'ترفيه',
        'يوتيوب', 'خدمات', 'مالية', 'مرح', 'ملصقات', 'أدوات', 'أخرى'
    ],
    category: 'نظام',
    description: '📋 قائمة الأوامر بحسب الفئة',
    hidden: false,
    version: '7.2',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const number = sender.split('@')[0];
            const pushName = msg.pushName || "Unknown";

            const body = msg.message?.extendedTextMessage?.text || 
                        msg.message?.conversation || '';
            const parts = body.trim().split(' ');
            const commandName = parts[0]?.replace('.', '') || '';
            const args = parts.slice(1);

            const categories = loadCommands();
            // ترتيب الأقسام
            const sortedCategories = Object.keys(categories).sort((a, b) => a.localeCompare(b, 'ar'));

            const now = new Date();
            const timeStr = now.toLocaleTimeString('ar-EG');
            const dateStr = now.toISOString().split('T')[0];

            let requestedCategory = null;

            // ========== 1. الأمر المباشر (مثل .خاصة) ==========
            if (sortedCategories.includes(commandName)) {
                requestedCategory = commandName;
            }

            // ========== 2. الأوامر الرئيسية (مثل .اوامر) ==========
            const mainCommands = ['اوامر', 'قائمة', 'menu', 'قسم', 'اقسام', 'الاوامر'];
            if (!requestedCategory && mainCommands.includes(commandName)) {
                if (args.length === 0) {
                    await showMainMenu(sock, chatId, sender, number, pushName, timeStr, dateStr, sortedCategories);
                    return;
                } else {
                    let search = args.join(' ').trim();
                    if (!isNaN(search)) {
                        const index = parseInt(search) - 1;
                        if (index >= 0 && index < sortedCategories.length) {
                            requestedCategory = sortedCategories[index];
                        }
                    } else {
                        // البحث عن قسم
                        const found = sortedCategories.find(cat => cat === search || cat.includes(search));
                        if (found) requestedCategory = found;
                    }
                }
            }

            // ========== 3. إذا تم تحديد فئة، اعرضها ==========
            if (requestedCategory && categories[requestedCategory]) {
                await showCategory(sock, chatId, sender, number, pushName, timeStr, dateStr, requestedCategory, categories);
                return;
            }

            // ========== 4. إذا كان هناك اسم فئة ولكن غير موجود ==========
            if (requestedCategory) {
                let errorMsg = `❌ *القسم "${requestedCategory}" غير موجود*\n\n`;
                errorMsg += `📋 الأقسام المتاحة:\n`;
                let i = 1;
                for (const cat of sortedCategories) {
                    const icon = categoryIcons[cat] || '📌';
                    errorMsg += ` ${i} ➺ ${icon} ${cat}\n`;
                    i++;
                }
                errorMsg += `\n💡 استخدم .اوامر لعرض الأقسام بشكل منظم.`;
                await sock.sendMessage(chatId, {
                    text: errorMsg,
                    mentions: [sender]
                }, { quoted: msg });
                return;
            }

            // ========== 5. أمر غير معروف ==========
            await sock.sendMessage(chatId, {
                text: `❌ *أمر غير معروف*\n\n💡 استخدم .اوامر لعرض قائمة الأقسام.`,
                mentions: [sender]
            }, { quoted: msg });

        } catch (error) {
            console.error('❌ خطأ في عرض الأوامر:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حدث خطأ أثناء عرض الأوامر:\n${error.message}`
            }, { quoted: msg });
        }
    }
};

// ===== دوال مساعدة =====

async function showMainMenu(sock, chatId, sender, number, pushName, timeStr, dateStr, sortedCategories) {
    let menu = `╔══════ ≪ °❈° ≫ ══════╗
       𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻      
╚══════ ≪ °❈° ≫ ══════╝

✧ المستخدم: @${number}
✧ الاسم: ${pushName}
✧ الوقت: ${timeStr}
✧ التاريخ: ${dateStr}

❖ ── *قائمة الأقسام* ── ❖\n`;

    let i = 1;
    for (const cat of sortedCategories) {
        const icon = categoryIcons[cat] || '📌';
        const count = loadCommands()[cat]?.length || 0;
        menu += ` ${i} ◎ ${icon} ${cat}\n`;
        i++;
    }
    
    menu += `\n❖ ──────────────── ❖\n\n`;
    menu += `⚡ *كيفية الاستخدام:*\n`;
    menu += `• .قسم [اسم القسم]\n`;
    menu += `• .قسم [رقم القسم]\n`;
    menu += `• .[اسم القسم] مباشرة\n\n`;
    menu += `📌 أمثلة:\n`;
    menu += `• .قسم تسلية\n`;
    menu += `• .قسم 1\n`;
    menu += `• .فعاليات`;

    menu += `
❖ ──────────────── ❖

╔══════ ≪ °❈° ≫ ══════╗
      𝑷𝑯𝑨𝑵𝑻𝑶𝑴      
╚══════ ≪ °❈° ≫ ══════╝`;

    const imgBuf = getMenuImage();
    if (imgBuf) {
        try {
            const imageBuffer = imgBuf;
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: menu,
                mentions: [sender]
            }, { quoted: null });
        } catch (uploadErr) {
            console.error('❌ فشل رفع الصورة:', uploadErr.message);
            await sock.sendMessage(chatId, {
                text: menu,
                mentions: [sender]
            }, { quoted: null });
        }
    } else {
        await sock.sendMessage(chatId, {
            text: menu,
            mentions: [sender]
        }, { quoted: null });
    }
}

async function showCategory(sock, chatId, sender, number, pushName, timeStr, dateStr, categoryName, categories) {
    const icon = categoryIcons[categoryName] || '📌';
    let menu = `╔══════ ≪ °❈° ≫ ══════╗
       𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻      
╚══════ ≪ °❈° ≫ ══════╝

✧ المستخدم: @${number}
✧ الاسم: ${pushName}
✧ الوقت: ${timeStr}
✧ التاريخ: ${dateStr}

❖ ── *${icon} قسم: ${categoryName}* ── ❖\n`;
    menu += `────────────────────\n`;
    menu += categories[categoryName].join('\n\n');

    menu += `
❖ ──────────────── ❖

⚡ الأوامر التي تحمل علامة ⚡ تعمل بدون نقطة (مثل: اتكلم، اكتم)

╔══════ ≪ °❈° ≫ ══════╗
      𝑷𝑯𝑨𝑵𝑻𝑶𝑴      
╚══════ ≪ °❈° ≫ ══════╝`;

    const imgBuf = getMenuImage();
    if (imgBuf) {
        try {
            const imageBuffer = imgBuf;
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: menu,
                mentions: [sender]
            }, { quoted: null });
        } catch (uploadErr) {
            console.error('❌ فشل رفع الصورة:', uploadErr.message);
            await sock.sendMessage(chatId, {
                text: menu,
                mentions: [sender]
            }, { quoted: null });
        }
    } else {
        await sock.sendMessage(chatId, {
            text: menu,
            mentions: [sender]
        }, { quoted: null });
    }
}