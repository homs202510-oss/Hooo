const config = require('./config');
const logger = require('./svc-logger');
const { startSocket } = require('./core-socket');
const { loadPlugins } = require('./core-loader');
const keepAlive = require('./svc-keepalive');
require('./core-database');

async function main() {
    console.log(`
    👻 ═══════════════════════════════ 👻
         PHANTOM BOT — شبح يعرف كل حاجة
    👻 ═══════════════════════════════ 👻
    `);

    logger.info(`🤖 بدء تشغيل ${config.botName}`);
    logger.info(`⚙️ البادئة: ${config.prefix}`);
    logger.info(`👤 المالك: ${config.ownerNumber}`);

    loadPlugins();
    keepAlive.start();
    await startSocket();
}

process.on('uncaughtException', (err) => {
    logger.error('💥 خطأ غير متوقع:', err.message);
});

process.on('unhandledRejection', (err) => {
    logger.error('💥 Promise مرفوض:', err?.message || err);
});

main().catch((err) => {
    logger.error('❌ فشل التشغيل:', err);
    process.exit(1);
});
