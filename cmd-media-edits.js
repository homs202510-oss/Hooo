// edit.js - نظام الإيديت المتكامل (تحميل + دائري) مع رسالة وجودة عالية + نشر في جروب الملصقات بتنسيق مخصص

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');

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

// ========== المسارات ==========
const dataDir = __dirname;
const pointsFile = path.join(__dirname, 'db-points.json');
const tempDir = (() => { const d = path.join(require('os').tmpdir(), 'phantom-tmp'); require('fs').mkdirSync(d, { recursive: true }); return d; })();

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(pointsFile)) fs.writeFileSync(pointsFile, JSON.stringify({}, null, 2));
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// ========== دوال النقاط ==========
function loadPoints() {
    return JSON.parse(fs.readFileSync(pointsFile));
}

function savePoints(data) {
    fs.writeFileSync(pointsFile, JSON.stringify(data, null, 2));
}

// ========== تحويل فيديو إلى دائري (Video Note) بجودة عالية ==========
async function convertToCircle(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .videoCodec('libx264')
            .size('320x320')
            .aspect('1:1')
            .videoBitrate('1000k')
            .audioBitrate('128k')
            .audioCodec('aac')
            .outputOptions([
                '-vf', 'scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:black,crop=320:320',
                '-movflags', '+faststart',
                '-crf', '18',
                '-preset', 'slow'
            ])
            .on('end', resolve)
            .on('error', reject)
            .save(outputPath);
    });
}

// ========== تحميل فيديو بجودة عالية ==========
async function downloadVideo(url) {
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'video/mp4'
        }
    });
    return Buffer.from(response.data);
}

// ========== تنسيق الأرقام ==========
function formatNumber(num) {
    if (num >= 1e24) return '∞';
    if (num >= 1e21) return (num / 1e21).toFixed(1) + 'س';
    if (num >= 1e18) return (num / 1e18).toFixed(1) + 'ك';
    if (num >= 1e15) return (num / 1e15).toFixed(1) + 'م';
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'ت';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'ج';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'مليون';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'ألف';
    return num.toString();
}

// ========== بناء رسالة الطلب في الجروب الحالي (مع النقاط والتفاصيل) ==========
function buildRequestMessage(type, searchText, senderName, points, price) {
    const lines = [
        `🎬 *فيديو إيديت*`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `📌 *النوع:* ${type}`,
        `🔍 *البحث:* ${searchText}`,
        `✅ تم إرسال الفيديو`,
        `💰 تم خصم ${price} نقطة`,
        `🪙 رصيدك الآن: ${formatNumber(points)}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `〔 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻 〕`
    ];
    return lines.join('\n');
}

// ========== بناء رسالة جروب الملصقات (بالتنسيق المخصص) ==========
function buildStickerGroupMessage(type, searchText, senderName) {
    const lines = [
        `تنفيذ طــلــب""`,
        `──꯭ׂ─꯭─ׅ─ׂ𓂃̼𝆬. ~🍃~  𓂃─ׅ──꯭ׂ─꯭──ׅ`,
        `╾ نــوع الطلـ𝅄ـب⤢ \`『${type}』\``,
        ``,
        `╾ الـــطـ  ໋֢ ـلــب ⤢ \`『${searchText}』\``,
        ``,
        `╾ صــاحـب الـطلـ𝇁𝇃𝇂ــب ⤢ \`『@${senderName}』\``,
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

// ========== دالة إعادة المحاولة للرفع ==========
async function sendWithRetry(sock, chatId, content, options = {}, retries = 3) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await sock.sendMessage(chatId, content, options);
        } catch (err) {
            lastError = err;
            const isUploadError = err.message?.includes('Media upload failed') || 
                                  err.message?.includes('upload failed') ||
                                  err.message?.includes('Internal Server Error') ||
                                  err.isBoom;
            if (isUploadError) {
                console.log(`⚠️ محاولة رفع ${i + 1}/${retries} فشلت، إعادة المحاولة بعد ${(i + 1) * 2000}ms`);
                await new Promise(r => setTimeout(r, (i + 1) * 2000));
                continue;
            }
            throw err;
        }
    }
    throw lastError || new Error('فشل الرفع بعد عدة محاولات');
}

// ========== معالج الإيديت العادي ==========
async function handleNormalEdit(sock, chatId, msg, searchText, sender) {
    const points = loadPoints();
    const userPoints = points[sender] || 0;
    const commandPrice = 200;

    if (userPoints < commandPrice) {
        await sock.sendMessage(chatId, {
            text: `❌ نقاطك غير كافية\n\n💰 السعر: ${commandPrice}\n🪙 رصيدك: ${formatNumber(userPoints)}`
        }, { quoted: msg });
        return false;
    }

    try {
        await sock.sendMessage(chatId, {
            react: { text: '⏳', key: msg.key }
        });

        const keywords = `${searchText} edit montage amv 4k`;
        const apiUrl = `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(keywords)}&count=30`;

        const res = await axios.get(apiUrl, {
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (res.status !== 200 || res.data.code !== 0 || !res.data.data?.videos?.length) {
            await sock.sendMessage(chatId, {
                react: { text: '❌', key: msg.key }
            });
            await sock.sendMessage(chatId, {
                text: '❌ لم يتم العثور على فيديو إيديت'
            }, { quoted: msg });
            return false;
        }

        const videos = res.data.data.videos.filter(v => v.play && v.duration < 60);
        if (!videos.length) {
            await sock.sendMessage(chatId, {
                react: { text: '❌', key: msg.key }
            });
            await sock.sendMessage(chatId, {
                text: '❌ لم يتم العثور على فيديو مناسب'
            }, { quoted: msg });
            return false;
        }

        const video = videos[Math.floor(Math.random() * videos.length)];
        const videoBuffer = await downloadVideo(video.play);

        if (!videoBuffer || videoBuffer.length < 1000) {
            await sock.sendMessage(chatId, {
                react: { text: '❌', key: msg.key }
            });
            await sock.sendMessage(chatId, {
                text: '❌ فشل تحميل الفيديو'
            }, { quoted: msg });
            return false;
        }

        // خصم النقاط
        const newPoints = userPoints - commandPrice;
        points[sender] = newPoints;
        savePoints(points);

        const senderName = msg.pushName || sender.split('@')[0];
        const caption = buildRequestMessage('عادي', searchText, senderName, newPoints, commandPrice);

        // ===== إرسال الفيديو مع إعادة المحاولة =====
        await sendWithRetry(sock, chatId, {
            video: videoBuffer,
            caption: caption,
            mimetype: 'video/mp4'
        }, { quoted: msg });

        await sock.sendMessage(chatId, {
            react: { text: '✅', key: msg.key }
        });

        // ===== نشر في جروب الملصقات بالتنسيق المخصص =====
        try {
            await publishToStickerGroups(sock, chatId, videoBuffer, searchText, sender, senderName, 'normal');
        } catch (e) {
            console.error('⚠️ فشل النشر في جروبات الملصقات (لكن تم الإرسال في الجروب الحالي):', e.message);
        }

        return true;

    } catch (err) {
        console.error('❌ خطأ ايديت:', err);
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: msg.key }
        });
        await sock.sendMessage(chatId, {
            text: `❌ حدث خطأ: ${err.message || 'خطأ غير معروف'}\nلم يتم خصم نقاط`
        }, { quoted: msg });
        return false;
    }
}

// ========== معالج الإيديت الدائري ==========
async function handleCircleEdit(sock, chatId, msg, searchText, sender) {
    const points = loadPoints();
    const userPoints = points[sender] || 0;
    const commandPrice = 200;

    if (userPoints < commandPrice) {
        await sock.sendMessage(chatId, {
            text: `❌ نقاطك غير كافية\n\n💰 السعر: ${commandPrice}\n🪙 رصيدك: ${formatNumber(userPoints)}`
        }, { quoted: msg });
        return false;
    }

    try {
        await sock.sendMessage(chatId, {
            react: { text: '⏳', key: msg.key }
        });

        const keywords = `${searchText} edit montage amv 4k`;
        const apiUrl = `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(keywords)}&count=30`;

        const res = await axios.get(apiUrl, {
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (res.status !== 200 || res.data.code !== 0 || !res.data.data?.videos?.length) {
            await sock.sendMessage(chatId, {
                react: { text: '❌', key: msg.key }
            });
            await sock.sendMessage(chatId, {
                text: '❌ لم يتم العثور على فيديو إيديت'
            }, { quoted: msg });
            return false;
        }

        const videos = res.data.data.videos.filter(v => v.play && v.duration < 60);
        if (!videos.length) {
            await sock.sendMessage(chatId, {
                react: { text: '❌', key: msg.key }
            });
            await sock.sendMessage(chatId, {
                text: '❌ لم يتم العثور على فيديو مناسب'
            }, { quoted: msg });
            return false;
        }

        const video = videos[Math.floor(Math.random() * videos.length)];
        const videoBuffer = await downloadVideo(video.play);

        if (!videoBuffer || videoBuffer.length < 1000) {
            await sock.sendMessage(chatId, {
                react: { text: '❌', key: msg.key }
            });
            await sock.sendMessage(chatId, {
                text: '❌ فشل تحميل الفيديو'
            }, { quoted: msg });
            return false;
        }

        // حفظ مؤقت
        const inputPath = path.join(tempDir, `input_${Date.now()}.mp4`);
        const outputPath = path.join(tempDir, `output_${Date.now()}.mp4`);
        fs.writeFileSync(inputPath, videoBuffer);

        // تحويل إلى دائري
        await convertToCircle(inputPath, outputPath);

        if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1000) {
            throw new Error('فشل إنشاء الفيديو الدائري');
        }

        const outputBuffer = fs.readFileSync(outputPath);

        // خصم النقاط
        const newPoints = userPoints - commandPrice;
        points[sender] = newPoints;
        savePoints(points);

        const senderName = msg.pushName || sender.split('@')[0];
        const caption = buildRequestMessage('دائري', searchText, senderName, newPoints, commandPrice);

        // ===== إرسال الفيديو الدائري مع إعادة المحاولة =====
        await sendWithRetry(sock, chatId, {
            video: outputBuffer,
            mimetype: 'video/mp4',
            ptv: true,
            caption: caption
        }, { quoted: msg });

        // تنظيف الملفات
        try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (e) {}

        await sock.sendMessage(chatId, {
            react: { text: '✅', key: msg.key }
        });

        // ===== نشر في جروب الملصقات بالتنسيق المخصص =====
        try {
            await publishToStickerGroups(sock, chatId, outputBuffer, searchText, sender, senderName, 'circle');
        } catch (e) {
            console.error('⚠️ فشل النشر في جروبات الملصقات (لكن تم الإرسال في الجروب الحالي):', e.message);
        }

        return true;

    } catch (err) {
        console.error('❌ خطأ ايديت دائري:', err);
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: msg.key }
        });
        await sock.sendMessage(chatId, {
            text: `❌ حدث خطأ: ${err.message || 'خطأ غير معروف'}\nلم يتم خصم نقاط`
        }, { quoted: msg });
        return false;
    }
}

// ========== دالة النشر في جروبات الملصقات بالتنسيق المخصص ==========
async function publishToStickerGroups(sock, sourceChatId, videoBuffer, searchText, sender, senderName, type) {
    try {
        const exchangeData = loadData();
        const stickerGroups = exchangeData['ملصقات'] || [];

        if (stickerGroups.length === 0) return;

        const isCircle = type === 'circle';
        const displayType = isCircle ? 'ايديت دائري' : 'ايديت';
        
        // بناء الرسالة المخصصة لجروب الملصقات
        const caption = buildStickerGroupMessage(displayType, searchText, senderName);

        for (const groupJid of stickerGroups) {
            if (groupJid === sourceChatId) continue;
            try {
                if (isCircle) {
                    await sock.sendMessage(groupJid, {
                        video: videoBuffer,
                        mimetype: 'video/mp4',
                        ptv: true,
                        caption: caption
                    });
                } else {
                    await sock.sendMessage(groupJid, {
                        video: videoBuffer,
                        caption: caption,
                        mimetype: 'video/mp4'
                    });
                }
                console.log(`✅ نشر الإيديت في جروب الملصقات: ${groupJid}`);
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e) {
                console.error(`❌ فشل النشر في ${groupJid}:`, e.message);
            }
        }
    } catch (e) {
        console.error('❌ خطأ في نشر الإيديت في جروبات الملصقات:', e.message);
        throw e;
    }
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['ايديت'],
    category: 'وسائط',
    description: '🎬 تحميل فيديوهات إيديت (عادي أو دائري) مقابل نقاط',
    usage: '.ايديت <كلمة> - إيديت عادي\n.ايديت دائري <كلمة> - إيديت دائري',

    async execute(sock, msg, args) {
        try {
            const chatId = msg.key.remoteJid;
            const sender = msg.key.participant || msg.key.remoteJid;

            // استخراج النص
            let searchText = '';
            let isCircle = false;

            if (args?.length) {
                const firstArg = args[0].toLowerCase();
                if (firstArg === 'دائري') {
                    isCircle = true;
                    searchText = args.slice(1).join(' ').trim();
                } else {
                    searchText = args.join(' ').trim();
                }
            }

            // محاولة استخراج من الرسالة
            if (!searchText && msg.message?.conversation) {
                const text = msg.message.conversation.replace(/^\.ايديت\s*/i, '').trim();
                if (text.toLowerCase().startsWith('دائري ')) {
                    isCircle = true;
                    searchText = text.replace(/^دائري\s*/i, '').trim();
                } else {
                    searchText = text;
                }
            }

            if (!searchText && msg.message?.extendedTextMessage?.text) {
                const text = msg.message.extendedTextMessage.text.replace(/^\.ايديت\s*/i, '').trim();
                if (text.toLowerCase().startsWith('دائري ')) {
                    isCircle = true;
                    searchText = text.replace(/^دائري\s*/i, '').trim();
                } else {
                    searchText = text;
                }
            }

            if (!searchText) {
                return await sock.sendMessage(chatId, {
                    text: `🎬 *أمر الإيديت*\n━━━━━━━━━━━━━━━━━━━━\n📌 *الاستخدام:*\n.ايديت <كلمة> - إيديت عادي\n.ايديت دائري <كلمة> - إيديت دائري\n\n📌 *مثال:*\n.ايديت انمي\n.ايديت دائري انمي\n\n💰 *السعر:* 200 نقطة`
                }, { quoted: msg });
            }

            // تنفيذ حسب النوع
            if (isCircle) {
                await handleCircleEdit(sock, chatId, msg, searchText, sender);
            } else {
                await handleNormalEdit(sock, chatId, msg, searchText, sender);
            }

        } catch (err) {
            console.error('❌ خطأ:', err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حدث خطأ: ${err.message || 'خطأ غير معروف'}`
            }, { quoted: msg });
        }
    }
};