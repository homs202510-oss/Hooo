// اذان.js - مواقيت الصلاة مع صوت الأذان (نسخة محسنة)

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🕌 مـواقـيـت الـصـلاة 🕌\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== دالة تحويل الوقت لصيغة 12 ساعة ==========
function toArabic12HourFormat(time24) {
    if (!time24) return 'غير محدد';
    const [hourStr, minute] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const period = hour >= 12 ? 'م' : 'ص';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${period}`;
}

// ========== شرح الصلوات ==========
const prayerExplanations = {
    'الفجر': `🌅 *صلاة الفجر*\n━━━━━━━━━━━━━━━━━━━━\n• عدد الركعات: 2 ركعة فرض\n• السنة القبلية: 2 ركعة سنة مؤكدة\n• الوقت: من الفجر الصادق حتى شروق الشمس\n• فضلها: خير من الدنيا وما فيها`,
    'الظهر': `🕛 *صلاة الظهر*\n━━━━━━━━━━━━━━━━━━━━\n• عدد الركعات: 4 ركعات فرض\n• السنة القبلية: 4 ركعات\n• السنة البعدية: 2 ركعات\n• الوقت: بعد زوال الشمس حتى دخول العصر`,
    'العصر': `🕒 *صلاة العصر*\n━━━━━━━━━━━━━━━━━━━━\n• عدد الركعات: 4 ركعات فرض\n• السنة: لا سنة راتبة مؤكدة قبلها أو بعدها\n• الوقت: من بعد الظهر حتى غروب الشمس`,
    'المغرب': `🌆 *صلاة المغرب*\n━━━━━━━━━━━━━━━━━━━━\n• عدد الركعات: 3 ركعات فرض\n• السنة البعدية: 2 ركعات\n• الوقت: من غروب الشمس حتى غياب الشفق الأحمر`,
    'العشاء': `🌙 *صلاة العشاء*\n━━━━━━━━━━━━━━━━━━━━\n• عدد الركعات: 4 ركعات فرض\n• السنة البعدية: 2 ركعات\n• الوتر: مستحب بعد العشاء\n• الوقت: من الشفق الأحمر حتى الفجر`
};

// ========== شرح الوضوء ==========
const wuduExplanation = `🧼 *كيفية الوضوء*\n━━━━━━━━━━━━━━━━━━━━\n1. النية في القلب\n2. التسمية: بسم الله\n3. غسل اليدين 3 مرات\n4. المضمضة 3 مرات\n5. الاستنشاق 3 مرات\n6. غسل الوجه 3 مرات\n7. غسل اليدين إلى المرفقين 3 مرات\n8. مسح الرأس مرة واحدة\n9. مسح الأذنين\n10. غسل القدمين إلى الكعبين 3 مرات\n\n📌 *سنن الوضوء:* الترتيب، الموالاة، التثليث (الغسل ثلاثاً)`;

// ========== تحميل صوت الأذان ==========
async function getAzanAudio(country, city) {
    try {
        // استخدام API لجلب صوت الأذان (مثال: من Aladhan API)
        const apiUrl = `https://api.aladhan.com/v1/audio/${encodeURIComponent(city)}/${encodeURIComponent(country)}`;
        const response = await axios.get(apiUrl, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (response.data && response.data.audio_url) {
            return response.data.audio_url;
        }
        return null;
    } catch (error) {
        console.error('❌ فشل جلب صوت الأذان:', error.message);
        return null;
    }
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['اذان', 'مواقيت'],
    category: 'ديني',
    description: '🕌 جلب مواقيت الصلاة مع صوت الأذان (اختياري)',
    usage: '.اذان [الدولة المدينة]\n.اذان صوت [الدولة المدينة]\n.اذان شرح صلاه [اسم الصلاة]\n.اذان شرح الوضوء',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = text.trim().split(/\s+/);
            const command = args[0]?.replace('.', '') || '';

            if (command !== 'اذان' && command !== 'أذان' && command !== 'مواقيت') {
                return;
            }

            // ===== عرض المساعدة =====
            if (args.length === 1) {
                const lines = [
                    '📖 *كيفية الاستخدام:*',
                    '',
                    '📍 `.اذان [الدولة المدينة]` ── جلب مواقيت الصلاة',
                    '   مثال: `.اذان مصر القاهرة`',
                    '',
                    '🔊 `.اذان صوت [الدولة المدينة]` ── جلب مواقيت الصلاة مع صوت الأذان',
                    '   مثال: `.اذان صوت مصر القاهرة`',
                    '',
                    '📚 `.اذان شرح صلاه [اسم الصلاة]` ── شرح الصلاة',
                    '   مثال: `.اذان شرح صلاه الفجر`',
                    '',
                    '🧼 `.اذان شرح الوضوء` ── شرح الوضوء',
                    '',
                    '🕌 الصلوات: الفجر، الظهر، العصر، المغرب، العشاء'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // ===== معالجة "صوت" =====
            let withAudio = false;
            let locationStartIndex = 1;

            if (args[1]?.toLowerCase() === 'صوت') {
                withAudio = true;
                locationStartIndex = 2;
            }

            // ===== معالجة "شرح" =====
            if (args[locationStartIndex]?.toLowerCase() === 'شرح') {
                const type = args[locationStartIndex + 1]?.toLowerCase();

                if (type === 'صلاه' || type === 'صلاة') {
                    const prayerName = args[locationStartIndex + 2]?.toLowerCase();
                    if (!prayerName) {
                        const lines = [
                            '📚 *شرح الصلوات*',
                            '',
                            '📌 اختر الصلاة:',
                            '   • `.اذان شرح صلاه الفجر`',
                            '   • `.اذان شرح صلاه الظهر`',
                            '   • `.اذان شرح صلاه العصر`',
                            '   • `.اذان شرح صلاه المغرب`',
                            '   • `.اذان شرح صلاه العشاء`'
                        ];
                        await sendMessage(sock, chatId, lines, msg, [sender]);
                        return;
                    }

                    const explanation = prayerExplanations[prayerName];
                    if (explanation) {
                        await sock.sendMessage(chatId, { text: explanation }, { quoted: msg });
                    } else {
                        await sendMessage(sock, chatId, [
                            `❌ *الصلاة غير معروفة*`,
                            '',
                            `📌 "${prayerName}" غير موجود`,
                            '📌 الصلوات المتاحة: الفجر، الظهر، العصر، المغرب، العشاء'
                        ], msg, [sender]);
                    }
                    return;
                }

                if (type === 'الوضوء' || type === 'وضوء') {
                    await sock.sendMessage(chatId, { text: wuduExplanation }, { quoted: msg });
                    return;
                }

                await sendMessage(sock, chatId, [
                    '❌ *نوع الشرح غير معروف*',
                    '',
                    '📌 الأوامر المتاحة:',
                    '   • `.اذان شرح صلاه [اسم الصلاة]`',
                    '   • `.اذان شرح الوضوء`'
                ], msg, [sender]);
                return;
            }

            // ===== جلب مواقيت الصلاة =====
            const locationWords = args.slice(locationStartIndex);
            if (locationWords.length === 0) {
                const lines = [
                    '❌ *يرجى كتابة اسم الدولة والمدينة*',
                    '',
                    '📌 مثال: `.اذان مصر القاهرة`',
                    '📌 مثال: `.اذان صوت مصر القاهرة`'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            const queryLocation = locationWords.join(' ');

            // رد فعل مؤقت
            try {
                await sock.sendMessage(chatId, { react: { text: '🕌', key: msg.key } });
            } catch {}

            // ===== البحث عن الموقع =====
            let geo;
            try {
                geo = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                    params: { format: 'json', q: queryLocation },
                    headers: { 'User-Agent': 'Mozilla/5.0 (PrayerBot)' },
                    timeout: 10000
                });
            } catch {
                await sendMessage(sock, chatId, [
                    '❌ *فشل الاتصال بخدمة الموقع*',
                    '',
                    '📌 تأكد من اتصالك بالإنترنت وحاول مرة أخرى'
                ], msg, [sender]);
                return;
            }

            if (!geo.data || geo.data.length === 0) {
                await sendMessage(sock, chatId, [
                    '❌ *لم يتم العثور على الموقع*',
                    '',
                    `📌 "${queryLocation}" غير موجود`,
                    '📌 تأكد من صحة اسم الدولة أو المدينة'
                ], msg, [sender]);
                return;
            }

            const { lat, lon, display_name } = geo.data[0];

            // ===== جلب مواقيت الصلاة =====
            let prayer;
            try {
                prayer = await axios.get(`https://api.aladhan.com/v1/timings`, {
                    params: {
                        latitude: lat,
                        longitude: lon,
                        method: 5
                    },
                    timeout: 10000
                });
            } catch {
                await sendMessage(sock, chatId, [
                    '❌ *فشل جلب مواقيت الصلاة*',
                    '',
                    '📌 تأكد من اتصالك بالإنترنت وحاول مرة أخرى'
                ], msg, [sender]);
                return;
            }

            if (!prayer.data || !prayer.data.data || !prayer.data.data.timings) {
                await sendMessage(sock, chatId, [
                    '❌ *بيانات الصلاة غير متاحة*',
                    '',
                    '📌 حاول مرة أخرى لاحقاً'
                ], msg, [sender]);
                return;
            }

            const t = prayer.data.data.timings;
            const now = new Date();
            const time = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
            const date = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            // ===== بناء الرسالة =====
            const lines = [
                `📅 *التاريخ:* ${date}`,
                `🕰️ *الساعة الآن:* ${time}`,
                `🕌 *مواقيت الصلاة في:* ${queryLocation}`,
                '',
                `🌅 *الفجر:* ${toArabic12HourFormat(t.Fajr)}`,
                `🌇 *الشروق:* ${toArabic12HourFormat(t.Sunrise)}`,
                `🕛 *الظهر:* ${toArabic12HourFormat(t.Dhuhr)}`,
                `🕒 *العصر:* ${toArabic12HourFormat(t.Asr)}`,
                `🌆 *المغرب:* ${toArabic12HourFormat(t.Maghrib)}`,
                `🌙 *العشاء:* ${toArabic12HourFormat(t.Isha)}`,
                '',
                `📍 *الموقع:* ${display_name}`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

            // ===== إرسال صوت الأذان إذا طلب المستخدم =====
            if (withAudio) {
                // استخراج اسم المدينة والدولة من queryLocation
                const parts = queryLocation.split(' ');
                const city = parts[parts.length - 1] || queryLocation;
                const country = parts[0] || queryLocation;

                const audioUrl = await getAzanAudio(country, city);
                if (audioUrl) {
                    try {
                        await sock.sendMessage(chatId, {
                            audio: { url: audioUrl },
                            mimetype: 'audio/mpeg',
                            ptt: false,
                            caption: `🔊 *صوت الأذان لـ ${queryLocation}*`
                        }, { quoted: msg });
                    } catch (error) {
                        console.error('❌ فشل إرسال صوت الأذان:', error.message);
                        await sendMessage(sock, chatId, [
                            '⚠️ *فشل إرسال صوت الأذان*',
                            '',
                            '📌 قد يكون الملف غير متاح حالياً'
                        ], msg, [sender]);
                    }
                } else {
                    await sendMessage(sock, chatId, [
                        '⚠️ *صوت الأذان غير متاح حالياً*',
                        '',
                        '📌 قد لا يوجد تسجيل لهذه المنطقة'
                    ], msg, [sender]);
                }
            }

        } catch (error) {
            console.error('❌ خطأ في أمر اذان:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};