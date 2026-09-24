/**
 * 👻 PHANTOM — Media System Config
 */
module.exports = {
    MEDIA_TOOL_COST: 15,

    limits: {
        maxImageSizeMB: 10,
        maxVideoSizeMB: 25,
        maxVideoDurationSec: 60,
        maxAudioSizeMB: 15,
        maxStickerSizeMB: 1,
        maxGifDurationSec: 15,
        maxGifSizeMB: 10,
        maxConcurrentJobs: 5,
        processingTimeoutMs: 180 * 1000,
        jobTimeoutMs: 240 * 1000,
    },

    heavyRate: {
        minGapSec: 20,
        maxPerDay: 50,
        heavyCommands: ['gif', 'دائري', 'ضغط', 'قص', 'ملصق_video'],
    },

    watermark: {
        text: 'PHANTOM',
        opacity: 0.9,
        fontSize: 28,
        position: 'bottom-right',
        margin: 20,
        fontCandidates: [
            '/system/fonts/Roboto-Bold.ttf',
            '/system/fonts/Roboto-Regular.ttf',
            '/system/fonts/NotoSansArabic-Bold.ttf',
            '/system/fonts/NotoSansArabic-Regular.ttf',
            '/system/fonts/DroidSansArabic.ttf',
            '/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
            '/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans.ttf',
        ],
    },

    sticker: {
        maxDimension: 512,
        quality: 90,          // ✅ جودة أعلى
        fps: 12,              // ✅ فريمات أخف
        maxDurationSec: 6,    // ✅ أقصر = أخف + جودة أعلى
        emoji: '👻',

        // ═══ اسم الحزمة (أقل من 60 حرف) ═══
        packName: `👻 PHANTOM • ${require('./config').ownerNumber}`,
        packPublisher: '👻 PHANTOM MEDIA STUDIO',
        packEmoji: '👻',

        brandText: 'PHANTOM',
        brandFontSize: 28,
        brandMargin: 20,
        brandOpacity: 0.9,
    },

    image: {
        jpegQuality: 90,
        maxDimension: 2048,
    },

    compression: {
        imageQuality: 75,
        videoCrf: 26,
        videoPreset: 'ultrafast',
    },

    // ═══ الفيديو الدائري (Video Note) ═══
    videoNote: {
        size: 480,            // مربع 480x480
        fps: 25,
        maxDurationSec: 60,
        videoBitrate: '800k', // ✅ bitrate واضح
        audioBitrate: '64k',
    },
};
