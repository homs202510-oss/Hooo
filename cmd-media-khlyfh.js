// خلفيات.js - بحث عن صور وخلفيات من Pinterest مع نظام نقاط ونشر في جروبات الملصقات

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ========== استيراد دوال نظام التبادل ==========
let loadData, getGroupName;
try {
    const exchangeModule = require('./cmd-guilds-exchange');
    loadData = exchangeModule.loadData;
    getGroupName = exchangeModule.getGroupName;
} catch (e) {
    console.error('❌ فشل استيراد دوال التبادل:', e.message);
    loadData = () => ({});
    getGroupName = async () => 'جروب غير معروف';
}

const commandPrice = 50;
const pointsPath = path.join(__dirname, 'db-points.json');

// ========== التأكد من وجود المجلدات ==========
if (!fs.existsSync(__dirname)) {
    fs.mkdirSync(__dirname, { recursive: true });
}
if (!fs.existsSync(pointsPath)) {
    fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
}

// ========== دوال النقاط ==========
function loadPoints() {
    try {
        return JSON.parse(fs.readFileSync(pointsPath));
    } catch {
        return {};
    }
}

function savePoints(data) {
    fs.writeFileSync(pointsPath, JSON.stringify(data, null, 2));
}

function getPoints(user) {
    const points = loadPoints();
    return points[user] || 0;
}

function deductPoints(user, amount) {
    const points = loadPoints();
    const current = points[user] || 0;

    if (current < amount) {
        return { success: false, message: `رصيدك ${current} نقطة، تحتاج ${amount} نقطة` };
    }

    points[user] = current - amount;
    savePoints(points);
    return { success: true };
}

function addPoints(user, amount) {
    const points = loadPoints();
    points[user] = (points[user] || 0) + amount;
    savePoints(points);
    return { success: true };
}

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🖼️ خـلـفـيـات 🖼️\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`;
    
    await sock.sendMessage(chatId, { 
        text: msg, 
        mentions 
    }, { 
        quoted: quoted 
    });
}

// ========== بناء رسالة جروب الملصقات للخلفيات ==========
function buildStickerGroupMessage(type, searchText, senderName, count) {
    const lines = [
        `تنفيذ طــلــب""`,
        `──꯭ׂ─꯭─ׅ─ׂ𓂃̼𝆬. ~🍃~  𓂃─ׅ──꯭ׂ─꯭──ׅ`,
        `╾ نــوع الطلـ𝅄ـب⤢ \`『${type}』\``,
        ``,
        `╾ الـــطـ  ໋֢ ـلــب ⤢ \`『${searchText}』\``,
        ``,
        `╾ صــاحـب الـطلـ𝇁𝇃𝇂ــب ⤢ \`『@${senderName}』\``,
        ``,
        `╾ عـدد الـخـلـفـيـات ⤢ \`『${count}』\``,
        ``,
        `╾ المـسـ∙∙∙ــؤول ⤢ \`『𝑷𝑯𝑨𝑵𝑻𝑶𝑴』\``,
        `──꯭ׂ─꯭─ׅ─ׂ𓂃̼𝆬. ~🍃~  𓂃─ׅ──꯭ׂ─꯭──`,
        `[ 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻 ]`,
        ``,
        `*⚡︎ ─── ❖ ── ✦ ── ❖ ─── ⚡︎*`,
        `*└🔱 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 🔱┐*`
    ];
    return lines.join('\n');
}

// ========== دالة النشر في جروبات الملصقات ==========
async function publishToStickerGroups(sock, sourceChatId, imageBuffers, searchText, sender, senderName) {
    try {
        const exchangeData = loadData();
        const stickerGroups = exchangeData['ملصقات'] || [];

        if (stickerGroups.length === 0 || imageBuffers.length === 0) return;

        const caption = buildStickerGroupMessage('خلفيات', searchText, senderName, imageBuffers.length);

        for (const groupJid of stickerGroups) {
            if (groupJid === sourceChatId) continue;
            try {
                // إرسال الصورة الأولى مع الكابتشن
                await sock.sendMessage(groupJid, {
                    image: imageBuffers[0],
                    caption: caption
                });

                // إرسال باقي الصور (إن وجدت)
                for (let i = 1; i < imageBuffers.length; i++) {
                    await sock.sendMessage(groupJid, {
                        image: imageBuffers[i]
                    });
                    await new Promise(r => setTimeout(r, 80));
                }

                console.log(`✅ نشر الخلفيات في جروب الملصقات: ${groupJid}`);
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e) {
                console.error(`❌ فشل النشر في ${groupJid}:`, e.message);
            }
        }
    } catch (e) {
        console.error('❌ خطأ في نشر الخلفيات في جروبات الملصقات:', e.message);
    }
}

// ========== البحث من Pinterest ==========
async function searchPinterest(query, targetCount, maxAttempts = 5) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            // محاولة الحصول على كوكيز
            const cookieRes = await axios.get('https://www.pinterest.com', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                maxRedirects: 0
            });
            const cookies = cookieRes.headers['set-cookie'];
            let cookieString = '';
            if (cookies) {
                cookieString = cookies.map(c => c.split(';')[0]).join('; ');
            }

            if (!cookieString) continue;

            const params = {
                source_url: `/search/pins/?q=${encodeURIComponent(query)}`,
                data: JSON.stringify({
                    options: {
                        isPrefetch: false,
                        query: query,
                        scope: "pins",
                        bookmarks: [""],
                        page_size: Math.min(targetCount + 50, 200),
                        field_set_key: "react_story_pin_detail",
                        include_unified_content: true,
                        personalization_info: false
                    },
                    context: {}
                }),
                _: Date.now()
            };

            const url = `https://www.pinterest.com/resource/BaseSearchResource/get/?${new URLSearchParams(params).toString()}`;
            const response = await axios.get(url, {
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'ar,en;q=0.9',
                    'referer': 'https://www.pinterest.com/',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'x-app-version': 'a9522f',
                    'x-pinterest-appstate': 'active',
                    'x-pinterest-pws-handler': 'www/[username]/[slug].js',
                    'x-requested-with': 'XMLHttpRequest',
                    cookie: cookieString
                }
            });

            if (response.status !== 200) continue;
            const data = response.data;

            let results = data.resource_response?.data?.results?.filter(v => v.images?.orig) || [];
            results = results.filter(item => {
                const hasGoodImage = item.images?.orig?.url && !item.images.orig.url.includes('default');
                const isAd = item.type === 'ad' || item.is_ad || item.ad;
                return hasGoodImage && !isAd;
            });

            if (results.length === 0) continue;

            const pins = results.slice(0, targetCount).map(v => {
                let imageUrl = v.images.orig.url;
                if (v.images["736x"]?.url) imageUrl = v.images["736x"].url;
                if (v.images["orig"]?.url) imageUrl = v.images["orig"].url;
                imageUrl = imageUrl.replace("/736x/", "/originals/");
                imageUrl = imageUrl.replace("/564x/", "/originals/");
                return {
                    id: v.id,
                    image: imageUrl,
                    title: v.title || v.description || 'No title'
                };
            });

            return {
                status: true,
                total: pins.length,
                pins
            };
        } catch (e) {
            console.warn(`محاولة ${attempt + 1} فشلت:`, e.message);
            if (attempt < maxAttempts - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
            }
        }
    }
    return { status: false, message: "لم يتم العثور على نتائج.", pins: [] };
}

// ========== تحميل الصور ==========
async function downloadImage(url) {
    try {
        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.pinterest.com/'
            }
        });
        return Buffer.from(response.data);
    } catch (err) {
        console.error('Download error:', err.message);
        return null;
    }
}

// ========== الأمر الرئيسي ==========
module.exports = {
    category: 'وسائط',
    command: ['خلفيات', 'خلفية'],
    description: '🖼️ بحث عن صور وخلفيات من Pinterest مع نظام نقاط ونشر في جروبات الملصقات',
    usage: '.خلفيات [كلمة البحث] [العدد]',

    async execute(sock, msg) {
        try {
            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const input = fullText.replace(/^([،.\/!#])?(خلفيات|خلفية|wallpaper|بنتريست)\s*/i, '').trim();
            const args = input.split(' ');

            const sender = msg.key.participant || msg.key.remoteJid;
            const chatId = msg.key.remoteJid;
            const senderName = msg.pushName || sender.split('@')[0];

            // ===== عرض المساعدة =====
            if (!input) {
                const userPoints = getPoints(sender);
                const lines = [
                    '🖼️ *البحث عن الخلفيات*',
                    '',
                    `💰 السعر: 50 نقطة لكل خلفية`,
                    `🪙 رصيدك: ${userPoints} نقطة`,
                    '',
                    '📖 *الاستخدام:*',
                    '.خلفيات كلمة البحث [العدد]',
                    '',
                    '📝 *أمثلة:*',
                    '.خلفيات ناروتو 3',
                    '.خلفيات طبيعة 5',
                    '.خلفيات سيارات'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // ===== استخراج العدد =====
            let count = 3; // القيمة الافتراضية
            let query = input;

            const lastArg = args[args.length - 1];
            if (!isNaN(lastArg) && parseInt(lastArg) > 0) {
                count = Math.min(parseInt(lastArg), 10); // الحد الأقصى 10
                args.pop();
                query = args.join(' ');
            }

            if (!query) {
                await sendMessage(sock, chatId, [
                    '❌ *يرجى إدخال كلمة البحث*',
                    '',
                    '📌 مثال: `.خلفيات ناروتو 3`'
                ], msg);
                return;
            }

            // ===== حساب التكلفة =====
            const cost = count * commandPrice;
            const userPoints = getPoints(sender);

            if (userPoints < cost) {
                const lines = [
                    '❌ *رصيدك غير كافٍ*',
                    '',
                    `🪙 رصيدك: ${userPoints} نقطة`,
                    `💰 المطلوب: ${cost} نقطة (${count} × ${commandPrice})`,
                    `💔 تحتاج: ${cost - userPoints} نقطة إضافية`
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // ===== رسالة البحث =====
            await sendMessage(sock, chatId, [
                `🔍 *جاري البحث عن:* "${query}"`,
                `📊 *عدد الخلفيات:* ${count}`,
                `💰 *التكلفة:* ${cost} نقطة`
            ], msg);

            // ===== البحث عن الخلفيات =====
            const result = await searchPinterest(query, count);

            if (!result.status || result.pins.length === 0) {
                await sendMessage(sock, chatId, [
                    '❌ *لم يتم العثور على خلفيات*',
                    '',
                    `🔍 كلمة البحث: "${query}"`,
                    '',
                    '💡 *اقتراحات:*',
                    '• استخدم كلمات مختلفة',
                    '• ابحث بموضوع أكثر تحديداً'
                ], msg);
                return;
            }

            // ===== خصم النقاط =====
            const deductionResult = deductPoints(sender, cost);
            if (!deductionResult.success) {
                await sendMessage(sock, chatId, [
                    `❌ فشل الخصم: ${deductionResult.message}`
                ], msg);
                return;
            }

            // ===== تحميل الخلفيات =====
            const pins = result.pins.slice(0, count);
            const imageBuffers = [];

            for (let i = 0; i < pins.length; i++) {
                const buffer = await downloadImage(pins[i].image);
                if (buffer && buffer.length > 5000) {
                    imageBuffers.push(buffer);
                }
            }

            if (imageBuffers.length === 0) {
                // استرجاع النقاط في حالة الفشل
                addPoints(sender, cost);
                await sendMessage(sock, chatId, [
                    '❌ *فشل تحميل جميع الخلفيات*',
                    '',
                    '💔 تم استرجاع نقاطك',
                    `🪙 رصيدك: ${getPoints(sender)} نقطة`,
                    '',
                    '🔄 حاول مرة أخرى بكلمة بحث مختلفة'
                ], msg);
                return;
            }

            // ===== إرسال الخلفيات في الجروب الحالي =====
            // الصورة الأولى مع الكابتشن
            await sock.sendMessage(chatId, {
                image: imageBuffers[0],
                caption: `🖼️ *${query}*\n📊 عدد الخلفيات: ${imageBuffers.length}`
            }, { quoted: msg });

            // باقي الصور بدون كابتشن
            for (let i = 1; i < imageBuffers.length; i++) {
                await sock.sendMessage(chatId, {
                    image: imageBuffers[i]
                });
                await new Promise(r => setTimeout(r, 80));
            }

            // ===== تقرير النقاط =====
            const remainingPoints = getPoints(sender);
            const lines = [
                `✅ *تم إرسال ${imageBuffers.length} خلفية*`,
                `📊 المصدر: Pinterest`,
                `💰 تم خصم ${cost} نقطة (${count} × ${commandPrice})`,
                `🪙 رصيدك المتبقي: ${remainingPoints} نقطة`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

            // ===== نشر الخلفيات في جروبات الملصقات =====
            await publishToStickerGroups(sock, chatId, imageBuffers, query, sender, senderName);

        } catch (err) {
            console.error('❌ خطأ في البحث:', err.message);

            const chatId = msg.key.remoteJid;
            await sendMessage(sock, chatId, [
                '❌ *حدث خطأ أثناء البحث*',
                '',
                `📝 ${err.message}`,
                '',
                '🔄 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};