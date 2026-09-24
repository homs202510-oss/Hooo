const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');
const JSZip = require('jszip');
const https = require('https');
const axios = require('axios');

// ========== استيراد دوال نظام التبادل ==========
let loadData;
try {
    const exchangeModule = require('./cmd-guilds-exchange');
    loadData = exchangeModule.loadData;
} catch (e) {
    console.error('❌ فشل استيراد دوال التبادل:', e.message);
    loadData = () => ({});
}

// ========== دوال التشفير والرفع ==========
function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
}

function toB64Url(buffer) {
    return Buffer.from(buffer).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function getHkdf(ikm, salt, info, length) {
    try {
        if (typeof crypto.hkdfSync === 'function') {
            const result = crypto.hkdfSync('sha256', ikm, salt, info, length);
            return Buffer.isBuffer(result) ? result : Buffer.from(result);
        }
    } catch {}
    const mac = crypto.createHmac('sha256', salt);
    const prk = mac.update(ikm).digest();
    const N = Math.ceil(length / 32);
    let okm = Buffer.alloc(0);
    let t = Buffer.alloc(0);
    for (let i = 1; i <= N; i++) {
        const hmac = crypto.createHmac('sha256', prk);
        hmac.update(t);
        hmac.update(info);
        hmac.update(Buffer.from([i]));
        t = hmac.digest();
        okm = Buffer.concat([okm, t.slice(0, Math.min(t.length, length - okm.length))]);
        if (okm.length >= length) break;
    }
    return okm;
}

async function getMediaConnAuth(sock) {
    const iq = await sock.query({
        tag: 'iq',
        attrs: { id: Date.now().toString(), to: 's.whatsapp.net', type: 'set', xmlns: 'w:m' },
        content: [{ tag: 'media_conn', attrs: {} }]
    });
    const mediaConn = iq.content?.find(v => v.tag === 'media_conn');
    if (!mediaConn) throw new Error('media_conn غير موجود');
    const auth = mediaConn.attrs?.auth;
    if (!auth) throw new Error('auth غير موجود');
    return auth;
}

// ========== تحميل الحزمة يدوياً ==========
async function downloadStickerPack(sock, quotedMsg) {
    // إذا كانت الدالة موجودة
    if (typeof sock.downloadMediaMessage === 'function') {
        try {
            const buffer = await sock.downloadMediaMessage(quotedMsg);
            if (buffer && buffer.length > 0) return buffer;
        } catch (e) {}
    }

    // استخراج بيانات الحزمة
    const pack = quotedMsg.stickerPackMessage || quotedMsg;
    if (pack.directPath && pack.mediaKey && pack.fileEncSha256 && pack.fileSha256) {
        try {
            const auth = await getMediaConnAuth(sock);
            const token = toB64Url(pack.fileEncSha256);
            const url = `https://mmg.whatsapp.net${pack.directPath}?auth=${encodeURIComponent(auth)}&token=${token}`;
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const encBuffer = Buffer.from(response.data);
            // فك التشفير
            const expanded = getHkdf(pack.mediaKey, Buffer.alloc(32), Buffer.from('WhatsApp Sticker Pack Keys'), 112);
            const iv = expanded.subarray(0, 16);
            const cipherKey = expanded.subarray(16, 48);
            const macKey = expanded.subarray(48, 80);
            const mac = encBuffer.slice(-10);
            const encrypted = encBuffer.slice(0, -10);
            const computedMac = crypto.createHmac('sha256', macKey).update(iv).update(encrypted).digest().subarray(0, 10);
            if (!computedMac.equals(mac)) throw new Error('MAC mismatch');
            const decipher = crypto.createDecipheriv('aes-256-cbc', cipherKey, iv);
            const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
            const hash = sha256(decrypted);
            if (!hash.equals(pack.fileSha256)) throw new Error('SHA256 mismatch');
            return decrypted;
        } catch (e) {
            console.error('❌ فشل التنزيل اليدوي:', e.message);
        }
    }

    // محاولة عبر downloadContentFromMessage
    try {
        const stream = await downloadContentFromMessage(quotedMsg, 'stickerPack');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return Buffer.concat(chunks);
    } catch (e) {}

    throw new Error('فشل تحميل الحزمة بجميع الطرق');
}

// ========== باقي دوال الكود (نفس السابق) ==========
async function uploadToServer(sock, buffer, { hkdf, mediaPath, mediaKey = crypto.randomBytes(32) }) {
    const expanded = getHkdf(mediaKey, Buffer.alloc(32), Buffer.from(hkdf), 112);
    const iv = expanded.subarray(0, 16);
    const cipherKey = expanded.subarray(16, 48);
    const macKey = expanded.subarray(48, 80);
    const cipher = crypto.createCipheriv('aes-256-cbc', cipherKey, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const mac = crypto.createHmac('sha256', macKey).update(iv).update(encrypted).digest().subarray(0, 10);
    const encBuffer = Buffer.concat([encrypted, mac]);
    const fileSha256 = sha256(buffer);
    const fileEncSha256 = sha256(encBuffer);
    const iq = await sock.query({
        tag: 'iq',
        attrs: { id: Date.now().toString(), to: 's.whatsapp.net', type: 'set', xmlns: 'w:m' },
        content: [{ tag: 'media_conn', attrs: {} }]
    });
    const mediaConn = iq.content?.find(v => v.tag === 'media_conn');
    if (!mediaConn) throw new Error('media_conn غير موجود');
    const auth = mediaConn.attrs?.auth;
    if (!auth) throw new Error('auth غير موجود');
    const hosts = (mediaConn.content || []).filter(v => v.tag === 'host').map(v => v.attrs?.hostname).filter(Boolean);
    if (!hosts.length) throw new Error('لا يوجد host للرفع');
    const token = encodeURIComponent(fileEncSha256.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''));
    let lastError;
    for (const host of hosts) {
        try {
            const json = await new Promise((resolve, reject) => {
                const url = new URL(`https://${host}${mediaPath}/${token}?auth=${encodeURIComponent(auth)}&token=${token}`);
                const req = https.request({
                    hostname: url.hostname,
                    port: 443,
                    path: url.pathname + url.search,
                    method: 'POST',
                    headers: {
                        Origin: 'https://web.whatsapp.com',
                        Referer: 'https://web.whatsapp.com/',
                        'Content-Type': 'application/octet-stream',
                        'Content-Length': encBuffer.length
                    }
                }, (res) => {
                    let body = '';
                    res.on('data', c => body += c);
                    res.on('end', () => {
                        if (res.statusCode < 200 || res.statusCode >= 300) {
                            return reject(new Error(`فشل الرفع ${res.statusCode}`));
                        }
                        try { resolve(JSON.parse(body)); } catch { reject(new Error('رد غير JSON')); }
                    });
                });
                req.on('error', reject);
                req.write(encBuffer);
                req.end();
            });
            const directPath = json.direct_path ?? json.directPath ?? json.url ?? json.path;
            if (!directPath) throw new Error('directPath غير موجود');
            return { mediaKey, fileLength: buffer.length, fileSha256, fileEncSha256, directPath, ...json };
        } catch (e) { lastError = e; }
    }
    throw lastError ?? new Error('جميع محاولات الرفع فشلت');
}

function generateStickerID() {
    return crypto.randomBytes(16).toString('hex');
}

function buildExifBuffer(packname, author, id, emojis = ['✨']) {
    const raw = {
        'sticker-pack-id': id,
        'sticker-pack-name': packname || '',
        'sticker-pack-publisher': author || '',
        emojis
    };
    const data = JSON.stringify(raw);
    const dataBuf = Buffer.from(data, 'utf8');
    const header = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);
    const exif = Buffer.concat([header, dataBuf]);
    exif.writeUIntLE(dataBuf.length, 14, 4);
    return exif;
}

async function addExifToWebp(webpBuffer, packname, author) {
    try {
        const img = new webp.Image();
        await img.load(webpBuffer);
        const id = generateStickerID();
        const exif = buildExifBuffer(packname, author, id);
        img.exif = exif;
        return await img.save(null);
    } catch (err) {
        console.error('❌ خطأ في إضافة EXIF:', err.message);
        return webpBuffer;
    }
}

function isAnimatedWebp(buffer) {
    try {
        return buffer.includes('ANIM') || buffer.includes('ANMF');
    } catch {
        return false;
    }
}

async function processPack(originalBuffer, packname, author) {
    const zip = new JSZip();
    const data = await zip.loadAsync(originalBuffer);
    const files = Object.keys(data.files);
    const webpFiles = files.filter(f => f.endsWith('.webp'));
    const newZip = new JSZip();
    for (const file of webpFiles) {
        const content = await data.files[file].async('nodebuffer');
        const modified = await addExifToWebp(content, packname, author);
        newZip.file(file, modified);
    }
    for (const file of files) {
        if (!file.endsWith('.webp')) {
            const content = await data.files[file].async('nodebuffer');
            newZip.file(file, content);
        }
    }
    return await newZip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });
}

async function sendModifiedPack(sock, chatId, zipBuffer, packDescription, quoted) {
    const packUpload = await uploadToServer(sock, zipBuffer, {
        hkdf: 'WhatsApp Sticker Pack Keys',
        mediaPath: '/mms/sticker-pack'
    });
    const zip = new JSZip();
    await zip.loadAsync(zipBuffer);
    const trayFile = zip.file('tray_icon.webp');
    let trayBuffer;
    if (trayFile) {
        trayBuffer = await trayFile.async('nodebuffer');
    } else {
        trayBuffer = Buffer.from([]);
    }
    const thumbUpload = await uploadToServer(sock, trayBuffer, {
        hkdf: 'WhatsApp Sticker Pack Thumbnail Keys',
        mediaPath: '/mms/thumbnail-sticker-pack',
        mediaKey: packUpload.mediaKey
    });
    const stickerPackId = `Pack_${crypto.randomBytes(8).toString('hex')}`;
    const stickersMetadata = [];
    for (const file of Object.keys(zip.files)) {
        if (file.endsWith('.webp') && file !== 'tray_icon.webp') {
            const content = await zip.files[file].async('nodebuffer');
            const isAnimated = isAnimatedWebp(content);
            stickersMetadata.push({
                fileName: file,
                isAnimated,
                emojis: ['✨'],
                accessibilityLabel: '',
                isLottie: false,
                mimetype: 'image/webp'
            });
        }
    }
    await sock.relayMessage(chatId, {
        stickerPackMessage: {
            stickerPackId,
            name: packDescription || '『👻 ⏐ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 ⚘️ 𝑺𝑻𝑰𝑪𝑲𝑬𝑹𝑺 』',
            publisher: '𝑷𝑯𝑨𝑵𝑻𝑶𝑴',
            packDescription: `⚕️ ${packDescription || ''}`,
            stickers: stickersMetadata,
            fileLength: packUpload.fileLength,
            fileSha256: packUpload.fileSha256,
            fileEncSha256: packUpload.fileEncSha256,
            mediaKey: packUpload.mediaKey,
            directPath: packUpload.directPath,
            mediaKeyTimestamp: Math.floor(Date.now() / 1000),
            stickerPackSize: packUpload.fileLength,
            stickerPackOrigin: 2,
            trayIconFileName: 'tray_icon.webp',
            thumbnailDirectPath: thumbUpload.directPath,
            thumbnailSha256: thumbUpload.fileSha256,
            thumbnailEncSha256: thumbUpload.fileEncSha256,
            thumbnailHeight: 252,
            thumbnailWidth: 252,
            imageDataHash: thumbUpload.fileSha256.toString('base64')
        },
        messageContextInfo: {
            messageSecret: crypto.randomBytes(32),
            forwardingScore: 0,
            isForwarded: true,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 0,
            }
        }
    }, { quoted });
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['حقوق', 'حقوقي'],
    category: 'وسائط',
    description: 'إضافة حقوق على الملصقات (EXIF فقط، بدون كتابة على الصورة) - يدعم الملصق الفردي والحزمة',

    async execute(sock, m) {
        const tempDir = (() => { const d = path.join(require('os').tmpdir(), 'phantom-tmp'); require('fs').mkdirSync(d, { recursive: true }); return d; })();
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        try {
            const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = text.trim().split(/\s+/);
            const contextInfo = m.message?.extendedTextMessage?.contextInfo;
            const quoted = contextInfo?.quotedMessage;
            const sticker = quoted?.stickerMessage;
            const stickerPack = quoted?.stickerPackMessage;

            if ((args[0] === '.حقوق' || args[0] === '.حقوقي') && !quoted) {
                const menu =
                    '📌 *أوامر تعديل الحقوق:*\n' +
                    '━━━━━━━━━━━━━━━━━━\n' +
                    '🔧 `.حقوق`\n' +
                    '   ╰ يضيف الحقوق الافتراضية (بدون كتابة)\n\n' +
                    '🔧 `.حقوق نص`\n' +
                    '   ╰ يضيف النص المطلوب كحقوق فقط\n\n' +
                    '📐 `.حقوق تظبيط`\n' +
                    '   ╰ يضبط الملصق للمقاس مع الحقوق الافتراضية\n\n' +
                    '📐 `.حقوق تظبيط نص`\n' +
                    '   ╰ يضبط مع النص المطلوب كحقوق\n\n' +
                    '📦 `.حقوق (رد على حزمة)`\n' +
                    '   ╰ يعدل حقوق جميع ملصقات الحزمة';
                return await sock.sendMessage(m.key.remoteJid, { text: menu }, { quoted: m });
            }

            if (!quoted) {
                return await sock.sendMessage(m.key.remoteJid, {
                    text: '❌ الرجاء الرد على ملصق أو حزمة ملصقات'
                }, { quoted: m });
            }

          // ========== معالجة الوسائط ==========
            let rightsText = '';
            let isTazbeet = false;
            let userText = '';
            let packName = '';

            if (args.length > 1 && args[1] === 'تظبيط') {
                isTazbeet = true;
                userText = args.slice(2).join(' ');
                if (!userText) {
                    rightsText = '『👻 ⏐ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 ⚘️ 𝑺𝑻𝑰𝑪𝑲𝑬𝑹𝑺 』';
                    packName = '𝑷𝑯𝑨𝑵𝑻𝑶𝑴';
                } else {
                    rightsText = userText;
                    packName = '';
                }
            } else if (args.length > 1) {
                userText = args.slice(1).join(' ');
                rightsText = userText;
                packName = '';
            } else {
                rightsText = '『👻 ⏐ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 ⚘️ 𝑺𝑻𝑰𝑪𝑲𝑬𝑹𝑺 』';
                packName = '𝑷𝑯𝑨𝑵𝑻𝑶𝑴';
            }

            // ========== حالة 1: رد على حزمة ==========
            if (stickerPack) {
                try {
                    const chatId = m.key.remoteJid;
                    const packBuffer = await downloadStickerPack(sock, quoted);
                    if (!packBuffer || packBuffer.length < 100) {
                        return await sock.sendMessage(m.key.remoteJid, {
                            text: '❌ فشل تحميل الحزمة'
                        }, { quoted: m });
                    }

                    const modifiedPack = await processPack(packBuffer, packName, rightsText);
                    await sendModifiedPack(sock, chatId, modifiedPack, rightsText, m);

                    // نشر في جروب الملصقات
                    try {
                        const exchangeData = loadData();
                        const stickerGroups = exchangeData['ملصقات'] || [];
                        if (stickerGroups.length > 0) {
                            const defaultPackName = '『👻 ⏐ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 ⚘️ 𝑺𝑻𝑰𝑪𝑲𝑬𝑹𝑺 』';
                            const defaultAuthor = '𝑷𝑯𝑨𝑵𝑻𝑶𝑴';
                            const defaultModified = await processPack(packBuffer, defaultPackName, defaultAuthor);
                            for (const groupJid of stickerGroups) {
                                if (groupJid === chatId) continue;
                                try {
                                    await sendModifiedPack(sock, groupJid, defaultModified, defaultPackName, null);
                                    console.log(`✅ نشر الحزمة المعدلة في ${groupJid}`);
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                } catch (e) {
                                    console.error(`❌ فشل النشر في ${groupJid}:`, e.message);
                                }
                            }
                        }
                    } catch (e) {
                        console.error('❌ خطأ في نشر الحزمة:', e.message);
                    }

                    return;
                } catch (err) {
                    console.error('❌ خطأ في معالجة الحزمة:', err);
                    return await sock.sendMessage(m.key.remoteJid, {
                        text: `❌ خطأ في معالجة الحزمة: ${err.message}`
                    }, { quoted: m });
                }
            }

            // ========== حالة 2: رد على ملصق فردي ==========
            if (!sticker) {
                return await sock.sendMessage(m.key.remoteJid, {
                    text: '❌ الرجاء الرد على ملصق أو حزمة ملصقات'
                }, { quoted: m });
            }

            // تحميل الملصق الفردي
            const stream = await downloadContentFromMessage(sticker, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            if (!buffer.length) {
                return await sock.sendMessage(m.key.remoteJid, { text: '❌ فشل تحميل الملصق' }, { quoted: m });
            }

            const originalBuffer = buffer;
            const inputPath = path.join(tempDir, `temp-input-${Date.now()}.webp`);
            const outputPath = path.join(tempDir, `temp-output-${Date.now()}.webp`);

            fs.writeFileSync(inputPath, buffer);

            const isAnimated = isAnimatedWebp(buffer);
            let finalBuffer = buffer;

            if (!isAnimated && isTazbeet) {
                try {
                    const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512" -c:v libwebp "${outputPath}"`;
                    console.log('🔄 تشغيل ffmpeg للتظبيط...');
                    await execPromise(ffmpegCmd);
                    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
                        finalBuffer = fs.readFileSync(outputPath);
                    }
                } catch (err) {
                    console.error('❌ خطأ في ffmpeg:', err.message);
                    finalBuffer = buffer;
                }
            } else if (isAnimated) {
                console.log('🔄 ملصق متحرك - نحافظ عليه بدون تعديل');
                finalBuffer = buffer;
            }

            const stickerBuffer = await addExifToWebp(finalBuffer, packName, rightsText);
            await sock.sendMessage(m.key.remoteJid, { sticker: stickerBuffer }, { quoted: m });

            // نشر في جروب الملصقات
            try {
                const exchangeData = loadData();
                const stickerGroups = exchangeData['ملصقات'] || [];
                const chatId = m.key.remoteJid;

                if (stickerGroups.length > 0) {
                    const defaultPackName = '『👻 ⏐ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 ⚘️ 𝑺𝑻𝑰𝑪𝑲𝑬𝑹𝑺 』';
                    const defaultAuthor = '';

                    for (const groupJid of stickerGroups) {
                        if (groupJid === chatId) continue;
                        try {
                            const defaultSticker = await addExifToWebp(originalBuffer, defaultPackName, defaultAuthor);
                            await sock.sendMessage(groupJid, { sticker: defaultSticker });
                            console.log(`✅ نشر الملصق (بالحقوق الافتراضية) في ${groupJid}`);
                            await new Promise(resolve => setTimeout(resolve, 500));
                        } catch (e) {
                            console.error(`❌ فشل النشر في ${groupJid}:`, e.message);
                        }
                    }
                }
            } catch (e) {
                console.error('❌ خطأ في نشر الملصق:', e.message);
            }

            // تنظيف
            try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch { }
            try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch { }

        } catch (err) {
            console.error('❌ خطأ غير متوقع:', err);
            await sock.sendMessage(m.key.remoteJid, {
                text: `❌ خطأ: ${err.message || 'خطأ غير معروف'}`
            }, { quoted: m });
        }
    }
};