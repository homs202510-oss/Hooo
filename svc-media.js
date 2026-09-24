/**
 * 👻 PHANTOM — Media Service
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const config = require('./mod-mediaConfig');

const TMP_ROOT = path.join(require('os').tmpdir(), 'phantom-media');
if (!fs.existsSync(TMP_ROOT)) fs.mkdirSync(TMP_ROOT, { recursive: true });

let ffmpegAvailable = null;
async function checkFFmpeg() {
    if (ffmpegAvailable !== null) return ffmpegAvailable;
    try {
        await execFileAsync('ffmpeg', ['-version'], { timeout: 5000 });
        ffmpegAvailable = true;
    } catch (_) { ffmpegAvailable = false; }
    return ffmpegAvailable;
}

function createJobDir(jobId) {
    const dir = path.join(TMP_ROOT, jobId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

function cleanupJobDir(jobId) {
    try {
        const dir = path.join(TMP_ROOT, jobId);
        if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    } catch (_) {}
}

function newJobId() { return crypto.randomBytes(8).toString('hex'); }

// ═══ فلتر النص ═══
function getBrandFilter(text = null) {
    const s = config.sticker;
    const w = config.watermark;

    let fontPath = null;
    for (const f of w.fontCandidates) {
        if (fs.existsSync(f)) { fontPath = f; break; }
    }

    const txt = (text || s.brandText).replace(/'/g, "\\'").replace(/:/g, '\\:');
    const fs_ = s.brandFontSize;
    const mg = s.brandMargin;
    const op = s.brandOpacity;

    const pos = `x=w-tw-${mg}:y=h-th-${mg}`;
    const style = `fontcolor=white@${op}:fontsize=${fs_}:box=1:boxcolor=black@0.6:boxborderw=12`;

    return fontPath
        ? `drawtext=fontfile='${fontPath}':text='${txt}':${style}:${pos}`
        : `drawtext=text='${txt}':${style}:${pos}`;
}

// ═══ Download ═══
async function downloadMedia(sock, msg, jobDir) {
    const { downloadMediaMessage } = require('@whiskeysockets/baileys');

    const mediaMsg = msg.message?.imageMessage
        || msg.message?.videoMessage
        || msg.message?.audioMessage
        || msg.message?.documentMessage
        || msg.message?.stickerMessage
        || null;

    if (!mediaMsg) return { ok: false, reason: 'no_media' };

    const buffer = await downloadMediaMessage(msg, 'buffer', {}, {
        logger: { level: 'silent', info: () => {}, error: () => {}, warn: () => {}, debug: () => {}, trace: () => {}, fatal: () => {}, child: () => ({}) },
        reuploadRequest: sock.updateMediaMessage,
    });

    const ext = detectExt(mediaMsg);
    const filePath = path.join(jobDir, 'input.' + ext);
    fs.writeFileSync(filePath, buffer);

    return {
        ok: true, buffer, path: filePath, size: buffer.length,
        mimetype: mediaMsg.mimetype, duration: mediaMsg.seconds || 0, ext,
    };
}

function detectExt(mediaMsg) {
    const mime = mediaMsg.mimetype || '';
    if (mime.includes('jpeg')) return 'jpg';
    if (mime.includes('png')) return 'png';
    if (mime.includes('webp')) return 'webp';
    if (mime.includes('mp4')) return 'mp4';
    if (mime.includes('gif')) return 'gif';
    if (mime.includes('webm')) return 'webm';
    if (mime.includes('mpeg')) return 'mp3';
    if (mime.includes('ogg')) return 'ogg';
    if (mime.includes('m4a')) return 'm4a';
    return 'bin';
}

async function runFFmpeg(args, timeoutMs = null) {
    const timeout = timeoutMs || config.limits.processingTimeoutMs;
    try {
        const { stdout, stderr } = await execFileAsync('ffmpeg', args, {
            timeout, maxBuffer: 10 * 1024 * 1024, encoding: 'utf8',
        });
        return { ok: true, stdout, stderr };
    } catch (e) {
        return { ok: false, error: e.message, stderr: (e.stderr || '').substring(0, 500) };
    }
}

async function runFFprobe(args, timeoutMs = 10000) {
    try {
        const { stdout } = await execFileAsync('ffprobe', args, {
            timeout: timeoutMs, maxBuffer: 5 * 1024 * 1024, encoding: 'utf8',
        });
        return { ok: true, stdout };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

async function getMediaInfo(filePath) {
    const r = await runFFprobe([
        '-v', 'error',
        '-show_entries', 'format=duration,size,format_name',
        '-show_entries', 'stream=codec_type,width,height,duration',
        '-of', 'json', filePath,
    ]);
    if (!r.ok) return null;
    try { return JSON.parse(r.stdout); } catch (_) { return null; }
}

function detectMediaType(msg) {
    const m = msg.message || {};
    if (m.imageMessage) return 'image';
    if (m.videoMessage) return 'video';
    if (m.audioMessage) return 'audio';
    if (m.stickerMessage) return 'sticker';
    if (m.documentMessage) {
        const mime = m.documentMessage.mimetype || '';
        if (mime.startsWith('image/')) return 'image';
        if (mime.startsWith('video/')) return 'video';
        if (mime.startsWith('audio/')) return 'audio';
        return 'document';
    }
    return null;
}

function validateMedia(info, kind) {
    if (!info) return { ok: false, reason: 'no_info' };
    const sizeMB = (info.size || 0) / (1024 * 1024);

    if (kind === 'image' && sizeMB > config.limits.maxImageSizeMB)
        return { ok: false, reason: 'too_large', sizeMB, max: config.limits.maxImageSizeMB };
    if (kind === 'video') {
        if (sizeMB > config.limits.maxVideoSizeMB)
            return { ok: false, reason: 'too_large', sizeMB, max: config.limits.maxVideoSizeMB };
        if ((info.duration || 0) > config.limits.maxVideoDurationSec)
            return { ok: false, reason: 'too_long', duration: info.duration, max: config.limits.maxVideoDurationSec };
    }
    if (kind === 'audio' && sizeMB > config.limits.maxAudioSizeMB)
        return { ok: false, reason: 'too_large', sizeMB };

    return { ok: true, sizeMB, duration: info.duration || 0 };
}

// ═══════════════════════════════════════════
// Image → Sticker (مع نص PHANTOM)
// ═══════════════════════════════════════════
async function imageToSticker(inputPath, jobDir, brand = true) {
    const output = path.join(jobDir, 'sticker.webp');
    const s = config.sticker;

    // ✅ padding أسود شفاف + الحفاظ على الجودة
    let vf = `scale='min(${s.maxDimension},iw)':'min(${s.maxDimension},ih)':force_original_aspect_ratio=decrease:flags=lanczos,pad=${s.maxDimension}:${s.maxDimension}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`;
    if (brand) vf += ',' + getBrandFilter();

    const args = [
        '-y',
        '-i', inputPath,
        '-vf', vf,
        '-c:v', 'libwebp',
        '-lossless', '0',
        '-q:v', String(s.quality),
        '-preset', 'default',
        '-an',
        '-vsync', '0',
        output,
    ];

    const r = await runFFmpeg(args);
    if (!r.ok || !fs.existsSync(output)) return { ok: false, error: r.error || 'ffmpeg failed' };
    return { ok: true, path: output };
}

// ═══════════════════════════════════════════
// Video → Sticker (جودة أعلى)
// ═══════════════════════════════════════════
async function videoToSticker(inputPath, jobDir, brand = true) {
    const output = path.join(jobDir, 'sticker.webp');
    const s = config.sticker;

    // ✅ جودة أعلى + حجم أصغر للـ webp
    let vf = `fps=${s.fps},scale='min(${s.maxDimension},iw)':'min(${s.maxDimension},ih)':force_original_aspect_ratio=decrease:flags=lanczos,pad=${s.maxDimension}:${s.maxDimension}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`;
    if (brand) vf += ',' + getBrandFilter();

    const args = [
        '-y',
        '-i', inputPath,
        '-t', String(s.maxDurationSec),
        '-vf', vf,
        '-c:v', 'libwebp',
        '-lossless', '0',
        '-q:v', String(s.quality),
        '-preset', 'default',
        '-loop', '0',
        '-an',
        '-vsync', '0',
        '-compression_level', '6',      // ✅ ضغط أعلى
        '-quality', String(s.quality),   // ✅ double-tap للجودة
        output,
    ];

    const r = await runFFmpeg(args, 120000);
    if (!r.ok || !fs.existsSync(output)) return { ok: false, error: r.error || 'ffmpeg failed' };

    // ✅ فحص الحجم لو أكبر من الحد → نحاول تاني بجودة أقل
    const sizeMB = fs.statSync(output).size / (1024 * 1024);
    if (sizeMB > config.limits.maxStickerSizeMB) {
        console.log(`⚠️ Sticker كبير (${sizeMB.toFixed(2)}MB) — محاولة تانية`);
        const output2 = path.join(jobDir, 'sticker2.webp');
        const args2 = [
            '-y', '-i', inputPath,
            '-t', String(Math.min(4, s.maxDurationSec)),
            '-vf', `fps=10,scale=320:320:force_original_aspect_ratio=decrease:flags=lanczos,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=0x00000000${brand ? ',' + getBrandFilter() : ''}`,
            '-c:v', 'libwebp',
            '-lossless', '0',
            '-q:v', '75',
            '-loop', '0',
            '-an', '-vsync', '0',
            '-compression_level', '6',
            output2,
        ];
        const r2 = await runFFmpeg(args2, 90000);
        if (r2.ok && fs.existsSync(output2)) {
            return { ok: true, path: output2, quality: 'reduced' };
        }
    }

    return { ok: true, path: output };
}

// ═══ إضافة metadata للـ webp ═══
async function addStickerMetadata(webpPath) {
    try {
        const { Image } = require('node-webpmux');
        const img = new Image();
        await img.load(webpPath);

        const s = config.sticker;
        const json = {
            'sticker-pack-id': 'phantom-' + Date.now(),
            'sticker-pack-name': s.packName,
            'sticker-pack-publisher': s.packPublisher,
            'emojis': [s.emoji || '👻'],
        };

        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
        ]);
        const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
        const exif = Buffer.concat([exifAttr, jsonBuff]);
        exif.writeUIntLE(jsonBuff.length, 14, 4);

        img.exif = exif;
        await img.save(webpPath);
        return { ok: true };
    } catch (e) {
        console.log('⚠️ metadata failed:', e.message);
        return { ok: false, error: e.message };
    }
}

// ═══ Sticker → Image ═══
async function stickerToImage(inputPath, jobDir) {
    const output = path.join(jobDir, 'image.png');
    const args = ['-y', '-i', inputPath, '-vf', `scale='min(${config.image.maxDimension},iw)':-1`, output];
    const r = await runFFmpeg(args);
    if (!r.ok || !fs.existsSync(output)) return { ok: false, error: r.error };
    return { ok: true, path: output };
}

// ═══ Watermark ═══
async function addPhantomWatermark(inputPath, jobDir, isVideo = false) {
    const ext = isVideo ? 'mp4' : 'png';
    const output = path.join(jobDir, 'watermarked.' + ext);
    const drawtext = getBrandFilter('👻 PHANTOM');

    const args = isVideo
        ? ['-y', '-i', inputPath, '-vf', drawtext, '-c:a', 'copy', '-preset', 'ultrafast', output]
        : ['-y', '-i', inputPath, '-vf', drawtext, output];

    const r = await runFFmpeg(args);
    if (!r.ok || !fs.existsSync(output)) return { ok: false, error: r.error };
    return { ok: true, path: output };
}

// ═══════════════════════════════════════════
// ✅ Video → Circular (Video Note) — إصلاح كامل
// ═══════════════════════════════════════════
async function toVideoNote(inputPath, jobDir) {
    const output = path.join(jobDir, 'circle.mp4');
    const vn = config.videoNote;

    // ✅ الشروط الصح للـ WhatsApp Video Note:
    // - 480x480 (مربع)
    // - mp4 container
    // - h264 codec
    // - yuv420p pixel format
    // - aac audio (أو صامت)
    // - faststart
    const args = [
        '-y',
        '-i', inputPath,
        '-t', String(vn.maxDurationSec),
        '-vf', `crop='min(iw,ih)':'min(iw,ih)',scale=${vn.size}:${vn.size}:flags=lanczos`,
        '-r', String(vn.fps),
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-profile:v', 'baseline',      // ✅ baseline للأجهزة القديمة
        '-level', '3.1',
        '-b:v', vn.videoBitrate,
        '-maxrate', vn.videoBitrate,
        '-bufsize', '1200k',
        '-pix_fmt', 'yuv420p',         // ✅ مطلوب
        '-c:a', 'aac',
        '-b:a', vn.audioBitrate,
        '-ar', '44100',
        '-ac', '1',                    // ✅ mono
        '-movflags', '+faststart',
        '-an',  // ✅ مؤقتاً بدون صوت لتجنب مشاكل sync
        output,
    ];

    const r = await runFFmpeg(args, 120000);
    if (!r.ok || !fs.existsSync(output)) {
        console.log('❌ video note error:', r.error);
        return { ok: false, error: r.error };
    }

    const sizeMB = fs.statSync(output).size / (1024 * 1024);
    if (sizeMB > 16) {
        return { ok: false, error: 'too_large', sizeMB };
    }
    return { ok: true, path: output, sizeMB };
}

// ═══ Audio ═══
async function extractAudio(inputPath, jobDir) {
    const output = path.join(jobDir, 'audio.mp3');
    const args = ['-y', '-i', inputPath, '-vn', '-c:a', 'libmp3lame', '-b:a', '128k', output];
    const r = await runFFmpeg(args);
    if (!r.ok || !fs.existsSync(output)) return { ok: false, error: r.error };
    return { ok: true, path: output };
}

// ═══ GIF ═══
async function toGif(inputPath, jobDir) {
    const output = path.join(jobDir, 'output.gif');
    const args = [
        '-y', '-i', inputPath, '-t', String(config.limits.maxGifDurationSec),
        '-vf', 'fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
        '-loop', '0', output,
    ];
    const r = await runFFmpeg(args, 120000);
    if (!r.ok || !fs.existsSync(output)) return { ok: false, error: r.error };
    const sizeMB = fs.statSync(output).size / (1024 * 1024);
    if (sizeMB > config.limits.maxGifSizeMB) return { ok: false, error: 'gif_too_large', sizeMB };
    return { ok: true, path: output };
}

// ═══ Compression ═══
async function compressMedia(inputPath, jobDir, isVideo = false) {
    const c = config.compression;
    const inputSize = fs.statSync(inputPath).size;

    if (isVideo) {
        const output = path.join(jobDir, 'compressed.mp4');
        const args = ['-y', '-i', inputPath, '-c:v', 'libx264', '-preset', c.videoPreset, '-crf', String(c.videoCrf), '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', output];
        const r = await runFFmpeg(args, 120000);
        if (!r.ok || !fs.existsSync(output)) return { ok: false, error: r.error };
        return { ok: true, path: output, inputSize, outputSize: fs.statSync(output).size };
    } else {
        const output = path.join(jobDir, 'compressed.jpg');
        const args = ['-y', '-i', inputPath, '-q:v', String(Math.floor(c.imageQuality / 10)), output];
        const r = await runFFmpeg(args);
        if (!r.ok || !fs.existsSync(output)) return { ok: false, error: r.error };
        return { ok: true, path: output, inputSize, outputSize: fs.statSync(output).size };
    }
}

// ═══ Trim ═══
async function trimMedia(inputPath, jobDir, startSec, endSec) {
    const output = path.join(jobDir, 'trimmed.mp4');
    const duration = endSec - startSec;
    if (duration <= 0) return { ok: false, error: 'bad_range' };
    const args = ['-y', '-ss', String(startSec), '-i', inputPath, '-t', String(duration), '-c', 'copy', output];
    const r = await runFFmpeg(args, 60000);
    if (!r.ok || !fs.existsSync(output)) return { ok: false, error: r.error };
    return { ok: true, path: output, duration };
}

function parseTime(str) {
    if (!str) return null;
    const parts = String(str).split(':').map(x => parseInt(x));
    if (parts.some(x => isNaN(x) || x < 0)) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 1) return parts[0];
    return null;
}

function readFile(filePath) { return fs.readFileSync(filePath); }

module.exports = {
    checkFFmpeg, createJobDir, cleanupJobDir, newJobId,
    downloadMedia, detectMediaType, detectExt, getMediaInfo, validateMedia,
    imageToSticker, videoToSticker, stickerToImage,
    addPhantomWatermark, addStickerMetadata,
    toVideoNote, extractAudio, toGif, compressMedia, trimMedia,
    parseTime, readFile, runFFmpeg,
};
