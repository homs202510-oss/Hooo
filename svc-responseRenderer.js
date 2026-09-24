/**
 * 👻 PHANTOM — Response Renderer
 * الطبقة المركزية لكل الردود
 */
const botProfile = require('./svc-botProfile');

/**
 * الرد العادي — نص
 */
function textResponse(text) {
    return { type: 'text', text };
}

/**
 * الرد مع هوية البوت (للردود المهمة فقط)
 */
function identityResponse(text, kind = 'info') {
    const id = botProfile.getIdentity();
    return { type: 'text', text };
}

/**
 * رد بـ media + caption
 */
function mediaResponse(mediaPath, caption, kind = 'media') {
    return { type: 'media', path: mediaPath, caption };
}

/**
 * يرسل رد باستخدام الهوية عند الحاجة
 * @param {Object} ctx
 * @param {Object} response
 * @param {Object} opts { withIdentity: bool, asSticker: bool, asImage: bool, asVideo: bool, asAudio: bool, asVoice: bool, asGif: bool }
 */
async function send(ctx, response, opts = {}) {
    const { sock, jid, msg } = ctx;

    if (response.type === 'text') {
        if (opts.withIdentity && botProfile.hasImage()) {
            // أرسل النص (هوية نصية)
            const id = botProfile.getIdentity();
            return sock.sendMessage(jid, { text: response.text }, { quoted: msg });
        }
        return sock.sendMessage(jid, { text: response.text }, { quoted: msg });
    }

    if (response.type === 'media') {
        const buf = require('fs').readFileSync(response.path);

        if (opts.asSticker) {
            return sock.sendMessage(jid, { sticker: buf }, { quoted: msg });
        }
        if (opts.asImage) {
            return sock.sendMessage(jid, { image: buf, caption: response.caption || '' }, { quoted: msg });
        }
        if (opts.asVideo) {
            return sock.sendMessage(jid, { video: buf, caption: response.caption || '', gifPlayback: !!opts.asGif }, { quoted: msg });
        }
        if (opts.asAudio) {
            return sock.sendMessage(jid, { audio: buf, mimetype: 'audio/mp4', ptt: false }, { quoted: msg });
        }
        if (opts.asVoice) {
            return sock.sendMessage(jid, { audio: buf, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: msg });
        }
    }

    return null;
}

module.exports = { textResponse, identityResponse, mediaResponse, send };
