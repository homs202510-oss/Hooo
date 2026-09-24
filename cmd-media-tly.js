// plugins/tg.js - تحميل حزمة ملصقات تيليجرام (الحد الأقصى 150 ملصق، تقسيم 60 لكل حزمة، مع نقاط ورد)
// مع النشر التلقائي في جروب الملصقات

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const JSZip = require('jszip');
const webp = require('node-webpmux');
const { exec, execSync } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

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

// ============================================================
// ⚠️ ضع توكن البوت الخاص بك هنا
// ============================================================

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// ============================================================
// إعدادات الحزمة والنقاط
// ============================================================

const PACK_NAME = '『⚕️ 𝑂⃝⃕ ╏ 𝐅𝐑𝐈𝐄𝐍𝐃𝐒 ⚘️ 𝑺𝑻𝑰𝑪𝑲𝑬𝑹𝑺 』';
const PUBLISHER = '𝑷𝑯𝑨𝑵𝑻𝑶𝑴';
const EMOJIS = ['⚕️', '🔥'];

// نقاط
const PRICE_PER_PACK = 200;
const POINTS_FILE = path.join(__dirname, 'db-points.json');

if (!fs.existsSync(path.dirname(POINTS_FILE))) {
  fs.mkdirSync(path.dirname(POINTS_FILE), { recursive: true });
}
if (!fs.existsSync(POINTS_FILE)) {
  fs.writeFileSync(POINTS_FILE, JSON.stringify({}, null, 2));
}

function loadPoints() {
  return JSON.parse(fs.readFileSync(POINTS_FILE));
}

function savePoints(data) {
  fs.writeFileSync(POINTS_FILE, JSON.stringify(data, null, 2));
}

// ============================================================
// المسارات المؤقتة
// ============================================================

const TEMP_DIR = path.join(require('os').tmpdir(), 'phantom-tmp', 'telegram');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ============================================================
// دوال مساعدة وإعادة المحاولة
// ============================================================

function toB64Url(buffer) {
  return Buffer.from(buffer).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest();
}

function generatePackId() {
  return crypto.randomBytes(16).toString('hex');
}

function generateStickerID() {
  return crypto.randomBytes(8).toString('hex');
}

async function retry(fn, retries = 3, baseDelay = 1000) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRetryable = err.message?.includes('Connection Closed') ||
                          err.message?.includes('Precondition Required') ||
                          err.message?.includes('BadRequest') ||
                          err.isBoom ||
                          (err.output?.statusCode === 428);
      if (isRetryable) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`⚠️ إعادة محاولة (${i + 1}/${retries}) بعد ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// ============================================================
// دوال التشفير والرفع (نفس السابق، لم تتغير)
// ============================================================

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

let cachedMediaConn = null;
let cachedMediaConnTime = 0;
const MEDIA_CONN_TTL = 5 * 60 * 1000;

async function getMediaConn(sock) {
  const now = Date.now();
  if (cachedMediaConn && (now - cachedMediaConnTime) < MEDIA_CONN_TTL) {
    return cachedMediaConn;
  }
  const iq = await retry(async () => {
    return await sock.query({
      tag: 'iq',
      attrs: { id: Date.now().toString(), to: 's.whatsapp.net', type: 'set', xmlns: 'w:m' },
      content: [{ tag: 'media_conn', attrs: {} }]
    });
  }, 3, 2000);
  const mediaConn = iq.content?.find(v => v.tag === 'media_conn');
  if (!mediaConn) throw new Error('media_conn غير موجود');
  cachedMediaConn = mediaConn;
  cachedMediaConnTime = now;
  return mediaConn;
}

async function uploadToServer(sock, buffer, { hkdf, mediaPath, mediaKey = crypto.randomBytes(32) }) {
  const mediaConn = await getMediaConn(sock);
  const auth = mediaConn.attrs?.auth;
  if (!auth) throw new Error('auth غير موجود');

  const hosts = (mediaConn.content || []).filter(v => v.tag === 'host').map(v => v.attrs?.hostname).filter(Boolean);
  if (!hosts.length) throw new Error('لا يوجد host للرفع');

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

  const token = encodeURIComponent(fileEncSha256.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''));

  let lastError;
  for (const host of hosts) {
    try {
      const json = await retry(async () => {
        return await new Promise((resolve, reject) => {
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
      }, 2, 2000);
      const directPath = json.direct_path ?? json.directPath ?? json.url ?? json.path;
      if (!directPath) throw new Error('directPath غير موجود');
      return { mediaKey, fileLength: buffer.length, fileSha256, fileEncSha256, directPath, ...json };
    } catch (e) { lastError = e; }
  }
  throw lastError ?? new Error('جميع محاولات الرفع فشلت');
}

// ============================================================
// دوال تحويل إلى WebP باستخدام exec غير متزامن
// ============================================================

function ffmpegAvailable() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch { return false; }
}

function imagemagickAvailable() {
  try {
    execSync('convert -version', { stdio: 'ignore' });
    return true;
  } catch { return false; }
}

async function convertWithFFmpegAsync(inputPath, outputPath, isAnimated = false) {
  const scale = '512:512';
  const pad = `scale=${scale}:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000`;
  let cmd;
  if (isAnimated) {
    cmd = `ffmpeg -y -i "${inputPath}" -vf "${pad},fps=15" -loop 0 -q:v 80 -preset default -an "${outputPath}"`;
  } else {
    cmd = `ffmpeg -y -i "${inputPath}" -vf "${pad}" -c:v libwebp -compression_level 6 -q:v 80 "${outputPath}"`;
  }
  await execPromise(cmd, { timeout: 30000 });
}

async function convertWithMagickAsync(inputPath, outputPath) {
  const cmd = `convert "${inputPath}" -strip -resize 512x512 -background none -gravity center -extent 512x512 "${outputPath}"`;
  await execPromise(cmd, { timeout: 30000 });
}

async function toWebp(buffer, isAnimated = false) {
  const ts = Date.now();
  const ext = isAnimated ? '.gif' : '.jpg';
  const inputPath = path.join(TEMP_DIR, `input_${ts}${ext}`);
  const outputPath = path.join(TEMP_DIR, `output_${ts}.webp`);
  
  try {
    fs.writeFileSync(inputPath, buffer);
    
    if (ffmpegAvailable()) {
      await convertWithFFmpegAsync(inputPath, outputPath, isAnimated);
    } else if (imagemagickAvailable() && !isAnimated) {
      await convertWithMagickAsync(inputPath, outputPath);
    } else {
      throw new Error('لا يوجد FFmpeg ولا ImageMagick');
    }
    
    if (!fs.existsSync(outputPath)) throw new Error('فشل التحويل');
    return fs.readFileSync(outputPath);
    
  } finally {
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
    if (global.gc) global.gc();
  }
}

// ============================================================
// دوال EXIF للملصقات
// ============================================================

async function addExifToIndividualSticker(buffer) {
  try {
    const img = new webp.Image();
    await img.load(buffer);
    const json = {
      'sticker-pack-id': generateStickerID(),
      'sticker-pack-name': PACK_NAME,
      'sticker-pack-publisher': PUBLISHER,
      'emojis': ['🔥']
    };
    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    img.exif = exif;
    return await img.save(null);
  } catch (e) {
    console.warn('⚠️ فشل إضافة EXIF للملصق الفردي:', e.message);
    return buffer;
  }
}

async function addExifToPackSticker(webpBuffer, packId) {
  try {
    const img = new webp.Image();
    await img.load(webpBuffer);
    const json = {
      'sticker-pack-id': packId,
      'sticker-pack-name': PACK_NAME,
      'sticker-pack-publisher': PUBLISHER,
      'emojis': EMOJIS
    };
    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    img.exif = exif;
    return await img.save(null);
  } catch (e) {
    console.warn('⚠️ فشل إضافة EXIF للحزمة:', e.message);
    return webpBuffer;
  }
}

// ============================================================
// إنشاء أيقونة الحزمة والتصغير (غير متزامن)
// ============================================================

async function makeTrayWebp(buffer) {
  const ts = Date.now();
  const inputPath = path.join(TEMP_DIR, `tray_${ts}.jpg`);
  const outputPath = path.join(TEMP_DIR, `tray_${ts}.webp`);
  
  try {
    fs.writeFileSync(inputPath, buffer);
    
    if (ffmpegAvailable()) {
      try {
        await execPromise(`ffmpeg -y -i "${inputPath}" -vf "crop=iw:ih" -c:v libwebp -compression_level 6 "${outputPath}"`, { timeout: 30000 });
        if (fs.existsSync(outputPath)) return fs.readFileSync(outputPath);
      } catch {}
    }
    
    if (imagemagickAvailable()) {
      try {
        const outMagick = path.join(TEMP_DIR, `tray_${ts}_magick.webp`);
        await execPromise(`convert "${inputPath}" -strip "${outMagick}"`, { timeout: 30000 });
        if (fs.existsSync(outMagick)) {
          const result = fs.readFileSync(outMagick);
          fs.unlinkSync(outMagick);
          return result;
        }
      } catch {}
    }
    
    const blankPath = path.join(TEMP_DIR, `blank_${ts}.webp`);
    if (ffmpegAvailable()) {
      await execPromise(`ffmpeg -y -f lavfi -i "color=black:size=252x252:duration=1" -vf "format=rgba,colorchannelmixer=aa=0" -frames:v 1 "${blankPath}"`, { timeout: 10000 });
      if (fs.existsSync(blankPath)) return fs.readFileSync(blankPath);
    }
    return Buffer.from([]);
    
  } finally {
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
  }
}

async function makeThumbnailJpeg(buffer) {
  const ts = Date.now();
  const inputPath = path.join(TEMP_DIR, `thumb_${ts}.jpg`);
  const outputPath = path.join(TEMP_DIR, `thumb_${ts}.jpeg`);
  
  try {
    fs.writeFileSync(inputPath, buffer);
    
    if (ffmpegAvailable()) {
      try {
        await execPromise(`ffmpeg -y -i "${inputPath}" -q:v 2 "${outputPath}"`, { timeout: 30000 });
        if (fs.existsSync(outputPath)) return fs.readFileSync(outputPath);
      } catch {}
    }
    
    if (imagemagickAvailable()) {
      try {
        const outMagick = path.join(TEMP_DIR, `thumb_${ts}_magick.jpg`);
        await execPromise(`convert "${inputPath}" -strip "${outMagick}"`, { timeout: 30000 });
        if (fs.existsSync(outMagick)) {
          const result = fs.readFileSync(outMagick);
          fs.unlinkSync(outMagick);
          return result;
        }
      } catch {}
    }
    
    return buffer;
    
  } finally {
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
  }
}

async function makeBlankTrayWebp() {
  const ts = Date.now();
  const outputPath = path.join(TEMP_DIR, `blank_${ts}.webp`);
  try {
    if (ffmpegAvailable()) {
      await execPromise(`ffmpeg -y -f lavfi -i "color=black:size=252x252:duration=1" -vf "format=rgba,colorchannelmixer=aa=0" -frames:v 1 "${outputPath}"`, { timeout: 10000 });
      if (fs.existsSync(outputPath)) return fs.readFileSync(outputPath);
    }
    return Buffer.from([]);
  } finally {
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
  }
}

// ============================================================
// التحميل من تيليجرام (الحد الأقصى 150)
// ============================================================

async function downloadStickerPack(url) {
  try {
    const packMatch = url.match(/t\.me\/addstickers\/([^\/\s]+)/);
    if (!packMatch) throw new Error('رابط غير صحيح');
    
    const packName = packMatch[1];
    console.log('📦 تحميل الحزمة:', packName);

    if (!BOT_TOKEN || BOT_TOKEN === 'ضع_التوكن_هنا') {
      throw new Error('❌ لم تقم بإدخال توكن البوت!');
    }

    const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getStickerSet?name=${packName}`;
    const response = await axios.get(apiUrl, { timeout: 30000 });
    
    if (!response.data?.ok) throw new Error('استجابة غير صالحة من Telegram');
    
    const stickers = response.data.result.stickers || [];
    if (stickers.length === 0) throw new Error('لا توجد ملصقات في هذه الحزمة');
    
    console.log(`✅ تم العثور على ${stickers.length} ملصق`);
    
    const results = [];
    const maxStickers = Math.min(stickers.length, 150);
    
    for (let i = 0; i < maxStickers; i++) {
      try {
        const sticker = stickers[i];
        const fileId = sticker.file_id;
        
        const fileInfo = await axios.get(
          `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`,
          { timeout: 10000 }
        );
        
        if (fileInfo.data?.ok) {
          const filePath = fileInfo.data.result.file_path;
          const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
          
          const imgResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 15000
          });
          
          if (imgResponse.data && imgResponse.data.length > 1000) {
            const isAnimated = filePath.endsWith('.gif') || 
                              filePath.endsWith('.webm') ||
                              sticker.is_animated ||
                              sticker.is_video;
            
            results.push({
              buffer: Buffer.from(imgResponse.data),
              isAnimated: isAnimated,
              emoji: sticker.emoji || '🔥'
            });
            console.log(`✅ تحميل ${results.length}/${maxStickers}`);
          }
        }
      } catch (e) {
        console.log('⚠️ فشل تحميل ملصق:', e.message);
      }
      await new Promise(r => setTimeout(r, 100));
    }
    
    if (results.length === 0) throw new Error('فشل تحميل أي ملصق');
    return results;
    
  } catch (e) {
    throw new Error(`فشل التحميل: ${e.message}`);
  }
}

// ============================================================
// إرسال حزمة الملصقات (تقسيم إلى مجموعات 60)
// ============================================================

async function sendStickerPack(sock, chatId, pack, packName, quoted, sender, senderName) {
  const MAX_STICKERS_PER_PACK = 60;
  const MAX_PACK_SIZE_BYTES = 7 * 1024 * 1024;

  function splitPackIntoGroups(stickers) {
    const groups = [];
    let currentGroup = [];
    let currentSize = 0;
    for (const sticker of stickers) {
      const stickerSize = sticker.buffer.length;
      if (currentGroup.length >= MAX_STICKERS_PER_PACK || (currentSize + stickerSize) > MAX_PACK_SIZE_BYTES) {
        if (currentGroup.length > 0) groups.push([...currentGroup]);
        currentGroup = [];
        currentSize = 0;
      }
      currentGroup.push(sticker);
      currentSize += stickerSize;
    }
    if (currentGroup.length > 0) groups.push(currentGroup);
    return groups;
  }

  const stickerGroups = splitPackIntoGroups(pack);
  if (stickerGroups.length === 0) throw new Error('لا توجد ملصقات صالحة للإرسال');

  let sent = 0;
  const packId = generatePackId();

  for (let i = 0; i < stickerGroups.length; i++) {
    const group = stickerGroups[i];
    const packNumber = i + 1;
    const totalGroups = stickerGroups.length;

    await retry(async () => {
      const zip = new JSZip();
      const stickersMetadata = [];

      for (const item of group) {
        try {
          let webpBuffer = await toWebp(item.buffer, item.isAnimated);
          webpBuffer = await addExifToPackSticker(webpBuffer, packId);
          const fileName = `${toB64Url(sha256(webpBuffer))}.webp`;
          zip.file(fileName, webpBuffer);
          stickersMetadata.push({
            fileName,
            isAnimated: item.isAnimated || false,
            emojis: [item.emoji || '🔥'],
            accessibilityLabel: '',
            isLottie: false,
            mimetype: 'image/webp'
          });
        } catch (e) {
          console.warn('⚠️ فشل تحويل ملصق:', e.message);
        }
        await new Promise(r => setTimeout(r, 500));
      }

      if (stickersMetadata.length === 0) throw new Error('لا توجد ملصقات صالحة بعد التحويل');

      const traySource = group.find(v => !v.isAnimated)?.buffer || group[0]?.buffer;
      const trayBuffer = traySource ? await makeTrayWebp(traySource) : await makeBlankTrayWebp();
      const trayIconFileName = 'tray_icon.webp';
      zip.file(trayIconFileName, trayBuffer);

      const archive = await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });
      const packUpload = await uploadToServer(sock, archive, {
        hkdf: 'WhatsApp Sticker Pack Keys',
        mediaPath: '/mms/sticker-pack'
      });

      const thumbnailBuffer = await makeThumbnailJpeg(trayBuffer.length > 0 ? trayBuffer : group[0]?.buffer || Buffer.from([]));
      const thumbUpload = await uploadToServer(sock, thumbnailBuffer, {
        hkdf: 'WhatsApp Sticker Pack Thumbnail Keys',
        mediaPath: '/mms/thumbnail-sticker-pack',
        mediaKey: packUpload.mediaKey
      });

      let groupPackName = PACK_NAME;
      if (totalGroups > 1) {
        groupPackName += ` (${packNumber}/${totalGroups})`;
      }

      await sock.relayMessage(chatId, {
        stickerPackMessage: {
          stickerPackId: packId,
          name: groupPackName,
          publisher: PUBLISHER,
          packDescription: `📦 ${packName}`,
          stickers: stickersMetadata,
          fileLength: packUpload.fileLength,
          fileSha256: packUpload.fileSha256,
          fileEncSha256: packUpload.fileEncSha256,
          mediaKey: packUpload.mediaKey,
          directPath: packUpload.directPath,
          mediaKeyTimestamp: Math.floor(Date.now() / 1000),
          stickerPackSize: packUpload.fileLength,
          stickerPackOrigin: 2,
          trayIconFileName,
          thumbnailDirectPath: thumbUpload.directPath,
          thumbnailSha256: thumbUpload.fileSha256,
          thumbnailEncSha256: thumbUpload.fileEncSha256,
          thumbnailHeight: 252,
          thumbnailWidth: 252,
          imageDataHash: thumbUpload.fileSha256.toString('base64')
        }
      }, { quoted });
    }, 3, 5000);

    sent++;
    await new Promise(r => setTimeout(r, 2000));
    if (global.gc) global.gc();
  }

  // ====== نشر الحزمة في جروب الملصقات ======
  try {
    const exchangeData = loadData();
    const stickerGroups = exchangeData['ملصقات'] || [];

    if (stickerGroups.length > 0 && chatId) {
      const senderNameFinal = senderName || sender?.split('@')[0] || 'مستخدم';
      const notifyMsg = `📦 *حزمة جديدة من ${senderNameFinal}*\n📌 *اسم الحزمة:* ${packName}`;

      for (const groupJid of stickerGroups) {
        if (groupJid === chatId) continue;
        try {
          // إعادة إرسال الحزمة كاملة إلى جروب الملصقات
          // نعيد استخدام نفس الدالة مع quoted = null (بدون رد)
          await sendStickerPackToGroup(sock, groupJid, pack, packName, null, sender, senderNameFinal);
          console.log(`✅ نشر الحزمة في جروب الملصقات: ${groupJid}`);
          await new Promise(r => setTimeout(r, 500));
        } catch (e) {
          console.error(`❌ فشل نشر الحزمة في ${groupJid}:`, e.message);
        }
      }
    }
  } catch (e) {
    console.error('❌ خطأ في نشر الحزمة في جروب الملصقات:', e.message);
  }

  return sent;
}

// ====== دالة مساعدة لإرسال الحزمة إلى جروب معين (بدون رسالة إشعار إضافية) ======
async function sendStickerPackToGroup(sock, chatId, pack, packName, quoted, sender, senderName) {
  const MAX_STICKERS_PER_PACK = 60;
  const MAX_PACK_SIZE_BYTES = 7 * 1024 * 1024;

  function splitPackIntoGroups(stickers) {
    const groups = [];
    let currentGroup = [];
    let currentSize = 0;
    for (const sticker of stickers) {
      const stickerSize = sticker.buffer.length;
      if (currentGroup.length >= MAX_STICKERS_PER_PACK || (currentSize + stickerSize) > MAX_PACK_SIZE_BYTES) {
        if (currentGroup.length > 0) groups.push([...currentGroup]);
        currentGroup = [];
        currentSize = 0;
      }
      currentGroup.push(sticker);
      currentSize += stickerSize;
    }
    if (currentGroup.length > 0) groups.push(currentGroup);
    return groups;
  }

  const stickerGroups = splitPackIntoGroups(pack);
  if (stickerGroups.length === 0) throw new Error('لا توجد ملصقات صالحة للإرسال');

  let sent = 0;
  const packId = generatePackId();

  for (let i = 0; i < stickerGroups.length; i++) {
    const group = stickerGroups[i];
    const packNumber = i + 1;
    const totalGroups = stickerGroups.length;

    await retry(async () => {
      const zip = new JSZip();
      const stickersMetadata = [];

      for (const item of group) {
        try {
          let webpBuffer = await toWebp(item.buffer, item.isAnimated);
          webpBuffer = await addExifToPackSticker(webpBuffer, packId);
          const fileName = `${toB64Url(sha256(webpBuffer))}.webp`;
          zip.file(fileName, webpBuffer);
          stickersMetadata.push({
            fileName,
            isAnimated: item.isAnimated || false,
            emojis: [item.emoji || '🔥'],
            accessibilityLabel: '',
            isLottie: false,
            mimetype: 'image/webp'
          });
        } catch (e) {
          console.warn('⚠️ فشل تحويل ملصق:', e.message);
        }
        await new Promise(r => setTimeout(r, 500));
      }

      if (stickersMetadata.length === 0) throw new Error('لا توجد ملصقات صالحة بعد التحويل');

      const traySource = group.find(v => !v.isAnimated)?.buffer || group[0]?.buffer;
      const trayBuffer = traySource ? await makeTrayWebp(traySource) : await makeBlankTrayWebp();
      const trayIconFileName = 'tray_icon.webp';
      zip.file(trayIconFileName, trayBuffer);

      const archive = await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });
      const packUpload = await uploadToServer(sock, archive, {
        hkdf: 'WhatsApp Sticker Pack Keys',
        mediaPath: '/mms/sticker-pack'
      });

      const thumbnailBuffer = await makeThumbnailJpeg(trayBuffer.length > 0 ? trayBuffer : group[0]?.buffer || Buffer.from([]));
      const thumbUpload = await uploadToServer(sock, thumbnailBuffer, {
        hkdf: 'WhatsApp Sticker Pack Thumbnail Keys',
        mediaPath: '/mms/thumbnail-sticker-pack',
        mediaKey: packUpload.mediaKey
      });

      let groupPackName = PACK_NAME;
      if (totalGroups > 1) {
        groupPackName += ` (${packNumber}/${totalGroups})`;
      }

      await sock.relayMessage(chatId, {
        stickerPackMessage: {
          stickerPackId: packId,
          name: groupPackName,
          publisher: PUBLISHER,
          packDescription: `📦 ${packName}`,
          stickers: stickersMetadata,
          fileLength: packUpload.fileLength,
          fileSha256: packUpload.fileSha256,
          fileEncSha256: packUpload.fileEncSha256,
          mediaKey: packUpload.mediaKey,
          directPath: packUpload.directPath,
          mediaKeyTimestamp: Math.floor(Date.now() / 1000),
          stickerPackSize: packUpload.fileLength,
          stickerPackOrigin: 2,
          trayIconFileName,
          thumbnailDirectPath: thumbUpload.directPath,
          thumbnailSha256: thumbUpload.fileSha256,
          thumbnailEncSha256: thumbUpload.fileEncSha256,
          thumbnailHeight: 252,
          thumbnailWidth: 252,
          imageDataHash: thumbUpload.fileSha256.toString('base64')
        }
      }, { quoted });
    }, 3, 5000);

    sent++;
    await new Promise(r => setTimeout(r, 2000));
    if (global.gc) global.gc();
  }

  return sent;
}

// ============================================================
// إرسال الملصقات فردياً (كحل بديل) - الحد 150
// ============================================================

async function sendIndividualStickers(sock, chatId, stickers, packName, quoted) {
  let sent = 0;
  let failed = 0;
  const total = Math.min(stickers.length, 150);
  
  const sendSingleSticker = async (item, index) => {
    return await retry(async () => {
      let webpBuffer = await toWebp(item.buffer, item.isAnimated);
      webpBuffer = await addExifToIndividualSticker(webpBuffer);
      await sock.sendMessage(chatId, { sticker: webpBuffer }, { quoted });
      console.log(`✅ إرسال ملصق ${index+1}/${total}`);
      return true;
    }, 3, 3000);
  };
  
  for (let i = 0; i < total; i++) {
    try {
      await sendSingleSticker(stickers[i], i);
      sent++;
    } catch (e) {
      failed++;
      console.log(`❌ فشل إرسال ملصق ${i+1} بعد المحاولات:`, e.message);
    }
    await new Promise(r => setTimeout(r, 2000));
    if (global.gc) global.gc();
  }
  
  return { sent, failed };
}

// ============================================================
// الأمر الرئيسي (مع نقاط ورد)
// ============================================================

module.exports = {
  name: 'تلي',
  command: ['تلي', 'تليجرام'],
  category: 'وسائط',

  async execute(sock, msg) {
    try {
      const jid = msg.key.remoteJid;
      const sender = msg.key.participant || msg.key.remoteJid;
      const senderName = msg.pushName || sender.split('@')[0];
      
      let body = '';
      if (msg.message?.conversation) body = msg.message.conversation;
      else if (msg.message?.extendedTextMessage?.text) body = msg.message.extendedTextMessage.text;
      else body = '';
      
      if (!body) {
        const helpMsg = 
          `📦 *تحميل حزمة ملصقات من تيليجرام*\n` +
          `━━━━━━━━━━━━━━━\n` +
          `▸ .تلي https://t.me/addstickers/Doge\n` +
          `▸ .تلي https://t.me/addstickers/AttackOntitanS4\n` +
          `━━━━━━━━━━━━━━━\n` +
          `⚠️ الحد الأقصى 150 ملصق\n` +
          `📦 *تُرسل كحزمة واحدة* (تقسيم 60 ملصق لكل حزمة)\n` +
          `💰 *السعر:* ${PRICE_PER_PACK} نقطة\n` +
          `━━━━━━━━━━━━━━━\n` +
          `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
        
        return await sock.sendMessage(jid, { text: helpMsg, quoted: msg });
      }

      const urlMatch = body.match(/https?:\/\/t\.me\/addstickers\/[^\s]+/);
      if (!urlMatch) {
        const errorMsg = 
          `❌ *رابط غير صحيح*\n` +
          `━━━━━━━━━━━━━━━\n` +
          `.تلي https://t.me/addstickers/اسم_الحزمة\n` +
          `━━━━━━━━━━━━━━━\n` +
          `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
        return await sock.sendMessage(jid, { text: errorMsg, quoted: msg });
      }

      const url = urlMatch[0];
      const packName = url.split('/').pop();

      // === نظام النقاط ===
      const points = loadPoints();
      const userPoints = points[sender] || 0;
      if (userPoints < PRICE_PER_PACK) {
        const insufficientMsg = 
          `❌ *رصيد غير كافٍ*\n` +
          `━━━━━━━━━━━━━━━\n` +
          `💰 سعر الحزمة: *${PRICE_PER_PACK} نقطة*\n` +
          `💰 رصيدك الحالي: *${userPoints} نقطة*\n` +
          `💰 المتبقي: *${PRICE_PER_PACK - userPoints} نقطة*\n` +
          `━━━━━━━━━━━━━━━\n` +
          `💡 يمكنك كسب النقاط عبر التفاعل اليومي.`;
        return await sock.sendMessage(jid, { text: insufficientMsg, quoted: msg });
      }

      points[sender] -= PRICE_PER_PACK;
      savePoints(points);

      await sock.sendMessage(jid, {
        text: `📦 *جاري تحميل الحزمة:* ${packName}\n⏳ قد يستغرق هذا بعض الوقت...\n💰 *تم خصم ${PRICE_PER_PACK} نقطة* (الرصيد المتبقي: ${points[sender]} نقطة)`,
        quoted: msg
      });

      const stickers = await downloadStickerPack(url);
      
      if (!stickers || stickers.length === 0) {
        points[sender] += PRICE_PER_PACK;
        savePoints(points);
        throw new Error('فشل تحميل الملصقات');
      }

      await sock.sendMessage(jid, {
        text: `✅ *تم تحميل ${stickers.length} ملصق*\n🔄 جاري تجهيز الحزمة...`,
        quoted: msg
      });

      let resultMsg = '';

      try {
        const sentGroups = await retry(async () => {
          return await sendStickerPack(sock, jid, stickers, packName, msg, sender, senderName);
        }, 2, 8000);
        
        resultMsg = 
          `🎉 *تم تحميل الحزمة بنجاح!*\n` +
          `━━━━━━━━━━━━━━━\n` +
          `📦 *الحزمة:* ${packName}\n` +
          `📊 *عدد الملصقات:* ${stickers.length}\n` +
          `📦 *عدد الحزم المرسلة:* ${sentGroups} (كل حزمة تحتوي على 60 ملصق كحد أقصى)\n` +
          `💰 *النقاط المتبقية:* ${points[sender]} نقطة\n` +
          `━━━━━━━━━━━━━━━\n` +
          `💡 *نصيحة:* اضغط على أي ملصق ثم "إضافة الحزمة" لحفظها كلها\n` +
          `━━━━━━━━━━━━━━━\n` +
          `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
      } catch (err) {
        console.warn('⚠️ فشل إرسال الحزمة بعد المحاولات، التحويل إلى الإرسال الفردي:', err.message);
        const { sent, failed } = await sendIndividualStickers(sock, jid, stickers, packName, msg);
        resultMsg = 
          `⚠️ *تم الإرسال فردياً بدلاً من الحزمة*\n` +
          `━━━━━━━━━━━━━━━\n` +
          `📦 *الحزمة:* ${packName}\n` +
          `✅ *تم الإرسال:* ${sent}\n` +
          `❌ *فشل:* ${failed}\n` +
          `📊 *الإجمالي:* ${stickers.length}\n` +
          `💰 *النقاط المتبقية:* ${points[sender]} نقطة\n` +
          `━━━━━━━━━━━━━━━\n` +
          `🏷️ *اسم الحزمة:* ${PACK_NAME}\n` +
          `━━━━━━━━━━━━━━━\n` +
          `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
      }

      await sock.sendMessage(jid, { text: resultMsg, quoted: msg });

    } catch (err) {
      console.error('❌ خطأ:', err);
      
      let errorMsg = 
        `❌ *حدث خطأ*\n` +
        `━━━━━━━━━━━━━━━\n` +
        `📝 ${err.message || 'خطأ غير معروف'}\n`;
      
      if (err.message.includes('توكن البوت')) {
        errorMsg += 
          `━━━━━━━━━━━━━━━\n` +
          `💡 *حل المشكلة:*\n` +
          `1. اذهب إلى @BotFather في تيليجرام\n` +
          `2. أرسل /newbot وأنشئ بوت\n` +
          `3. انسخ التوكن\n` +
          `4. ضعه في المتغير BOT_TOKEN\n`;
      } else {
        errorMsg += 
          `━━━━━━━━━━━━━━━\n` +
          `💡 *نصائح:*\n` +
          `• تأكد من صحة الرابط\n` +
          `• تأكد من أن الحزمة عامة\n` +
          `• جرب حزمة معروفة مثل:\n` +
          `  .تلي https://t.me/addstickers/Doge\n`;
      }
      
      errorMsg += 
        `━━━━━━━━━━━━━━━\n` +
        `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
      
      await sock.sendMessage(msg.key.remoteJid, { text: errorMsg, quoted: msg });
    }
  }
};