// شغل.js - تحميل صوت من تيك توك (يدعم الروابط والبحث)
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const audioPrice = 50;

function loadPoints() {
    try {
        if (!fs.existsSync(pointsPath)) {
            fs.writeFileSync(pointsPath, '{}');
        }
        return JSON.parse(fs.readFileSync(pointsPath));
    } catch {
        return {};
    }
}

function savePoints(data) {
    fs.writeFileSync(pointsPath, JSON.stringify(data, null, 2));
}

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return 'غير معروف';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function isTikTokLink(text) {
    return /https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/\S+/i.test(text);
}

async function downloadThumbnail(url) {
    try {
        if (!url) return null;
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        return Buffer.from(response.data);
    } catch (error) {
        console.error('Thumbnail download error:', error);
        return null;
    }
}

module.exports = {
    command: 'شغل',
    category: 'وسائط',
    price: audioPrice,
    description: 'تحميل الصوت الأصلي من تيك توك (البحث أو الرابط)',
    usage: '.شغل [كلمة البحث] أو .شغل [رابط الفيديو]',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        try {
            let inputText = '';
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            inputText = body.replace(/^\.شغل\s*/i, '').trim();

            if (!inputText) {
                return await sock.sendMessage(
                    chatId,
                    {
                        text: `╭───≪ 🎵 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑻𝑰𝑲𝑻𝑶𝑲 🎵 ≫───╮\n` +
                            `│ ⌬ أهـلاً 🫠 نسيت تكتب كلمة البحث!\n` +
                            `│ ⌬ استخدم: .شغل [كلمة البحث]\n` +
                            `│ ⌬ أو: .شغل [رابط الفيديو]\n` +
                            `│ ⌬ مثال: .شغل انا واخي\n` +
                            `╰───≪ 🌿🍉🍡 ≫───╯\n\n` +
                            `> *𝑩𝒀┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻*`
                    },
                    { quoted: msg }
                );
            }

            let pointsData = loadPoints();
            let userPoints = pointsData[sender] || 0;

            if (userPoints < audioPrice) {
                return await sock.sendMessage(
                    chatId,
                    {
                        text: `❌ نقاطك غير كافية.\n💰 السعر: ${audioPrice}\n🪙 رصيدك: ${userPoints}`
                    },
                    { quoted: msg }
                );
            }

            await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });

            const isLink = isTikTokLink(inputText);

            let apiUrl;
            if (isLink) {
                apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(inputText)}`;
            } else {
                apiUrl = `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(inputText)}`;
            }

            const res = await axios.get(apiUrl, {
                timeout: 30000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (res.status !== 200 || res.data.code !== 0) {
                throw new Error('فشل الاتصال بالخادم');
            }

            let video;
            let videoUrl;

            if (isLink) {
                video = res.data.data;
                if (!video) throw new Error('لا يوجد فيديو');
                videoUrl = inputText;
            } else {
                const videos = res.data.data?.videos;
                if (!videos || !videos.length) throw new Error('لا توجد نتائج');
                const sortedVideos = videos.sort((a, b) => (b.duration || 0) - (a.duration || 0));
                video = sortedVideos[0];
                if (!video) throw new Error('لا يوجد فيديو');
                videoUrl = `https://www.tiktok.com/@${video.author?.unique_id}/video/${video.video_id}`;
            }

            const title = video.title || video.music_info?.title || 'بدون عنوان';
            const duration = formatDuration(video.duration);
            const thumbUrl = video.cover || video.origin_cover || '';
            const audioUrl = video.music || video.music_info?.play || video.music_info?.url;

            if (!audioUrl) {
                throw new Error('لا يوجد صوت متاح');
            }

            console.log('✅ تم جلب الفيديو:', videoUrl);

            const thumbBuffer = await downloadThumbnail(thumbUrl);

            pointsData[sender] = userPoints - audioPrice;
            savePoints(pointsData);

            // الكابتشن بدون رابط الصورة
            const caption = `『⏯️┇𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐁𝐎𝐓 𝐓𝐈𝐊𝐓𝐎𝐊┇⏯️』

*❐═━━━━═╊⊰🪐⊱╉═━━━━═❐*
*❐↞┇الـعـنـوان📇↞ ${title.slice(0, 50)}${title.length > 50 ? '...' : ''} ┇*
*❐↞┇الـرابـط🖇️↞ ${videoUrl} ┇*
*❐↞┇الـمـدة⏱️↞ ${duration} ┇*
*❐↞┇الـنـقـاط💰↞ -${audioPrice} ┇*
*❐↞┇رصيدك🪙↞ ${pointsData[sender]} ┇*
*❐═━━━━═╊⊰🪐⊱╉═━━━━═❐*
> *𝑩𝒀┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻*`;

            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });

            // تحميل الصوت
            let audioBuffer;
            try {
                const audioRes = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                audioBuffer = Buffer.from(audioRes.data);
            } catch (error) {
                console.error('❌ فشل تحميل الصوت:', error.message);
                await sock.sendMessage(chatId, {
                    text: `${caption}\n\n⚠️ تعذر تحميل الصوت، إليك الرابط:\n${audioUrl}`
                }, { quoted: msg });
                return;
            }

            // ===== إرسال الصورة مع الكابتشن (رسالة 1) =====
            if (thumbBuffer) {
                await sock.sendMessage(chatId, {
                    image: thumbBuffer,
                    caption: caption
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: caption
                }, { quoted: msg });
            }

            // ===== إرسال الصوت (رسالة 2) =====
            await sock.sendMessage(chatId, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${title.slice(0, 50)}.mp3`
            }, { quoted: msg });

        } catch (err) {
            console.error('❌ خطأ في شغل:', err);

            try {
                const pointsData = loadPoints();
                pointsData[sender] = (pointsData[sender] || 0) + audioPrice;
                savePoints(pointsData);
            } catch (saveError) {
                console.error('Points restoration error:', saveError);
            }

            await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });

            let errorMsg = '❌ حدث خطأ أثناء التحميل';
            if (err.code === 'ECONNABORTED') errorMsg = '⏰ انتهت المهلة، حاول مرة أخرى';
            else if (err.response?.status === 404) errorMsg = '🔍 لا توجد نتائج';
            else if (err.response?.status >= 500) errorMsg = '🚫 الخدمة غير متاحة';
            else if (err.message.includes('لا يوجد صوت')) errorMsg = '❌ لا يوجد صوت متاح';
            else if (err.message.includes('لا توجد نتائج')) errorMsg = '🔍 لا توجد نتائج للبحث';

            await sock.sendMessage(
                chatId,
                { text: `${errorMsg}\nتم استرجاع نقاطك.` },
                { quoted: msg }
            );
        }
    }
};