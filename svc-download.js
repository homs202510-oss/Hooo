/**
 * 👻 Download Service — روابط عامة فقط
 */
const axios = require('axios');

const MAX_SIZE_MB = 50;

function detectPlatform(url) {
    if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
    if (/tiktok\.com/.test(url)) return 'tiktok';
    if (/instagram\.com/.test(url)) return 'instagram';
    if (/twitter\.com|x\.com/.test(url)) return 'twitter';
    if (/facebook\.com|fb\.watch/.test(url)) return 'facebook';
    if (/pinterest\.com/.test(url)) return 'pinterest';
    if (/soundcloud\.com/.test(url)) return 'soundcloud';
    return null;
}

function isValidUrl(url) {
    try {
        const u = new URL(url);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (_) { return false; }
}

async function getVideoInfo(url) {
    try {
        // استخدم cobalt.tools API (مجاني ومفتوح)
        const res = await axios.post('https://api.cobalt.tools/api/json', {
            url,
            vQuality: '720',
        }, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            timeout: 20000,
        });

        if (res.data?.url) {
            return { ok: true, url: res.data.url, filename: res.data.filename };
        }
        return { ok: false, reason: 'no_url', data: res.data };
    } catch (e) {
        return { ok: false, reason: 'request_failed', error: e.message };
    }
}

async function downloadFile(url, maxSizeMB = MAX_SIZE_MB) {
    try {
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            maxContentLength: maxSizeMB * 1024 * 1024,
            maxBodyLength: maxSizeMB * 1024 * 1024,
        });
        return { ok: true, buffer: Buffer.from(res.data), size: res.data.byteLength };
    } catch (e) {
        return { ok: false, reason: 'download_failed', error: e.message };
    }
}

module.exports = { detectPlatform, isValidUrl, getVideoInfo, downloadFile, MAX_SIZE_MB };
