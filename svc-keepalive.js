/**
 * 🌐 PHANTOM — سيرفر بسيط يخلي الاستضافات المجانية (زي Render) تعتبر البوت "شغال"
 * وميدخلوش في وضع النوم. مش لازم لو مستضيف على Termux أو VPS.
 */
const http = require('http');
const https = require('https');
const config = require('./config');

function start() {
    const port = process.env.PORT || 3000;

    http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('👻 PHANTOM BOT شغال');
    }).listen(port, () => {
        console.log(`🌐 سيرفر keep-alive شغال على المنفذ ${port}`);
    });

    // لو حطيت PING_URL في .env (رابط الاستضافة العام بتاعك)، البوت هيبعتلنفسه كل 10 دقايق
    // عشان الاستضافات اللي بتنيم بعد فترة خمول متنامش
    if (config.pingUrl) {
        setInterval(() => {
            try {
                const client = config.pingUrl.startsWith('https') ? https : http;
                client.get(config.pingUrl, (res) => res.resume()).on('error', () => {});
            } catch (_) {}
        }, 10 * 60 * 1000);
    }
}

module.exports = { start };
