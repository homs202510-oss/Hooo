/**
 * 👻 Auction Scheduler
 */
const auction = require('./mod-auction');

let intervalId = null;

async function tick(sock) {
    try {
        await auction.settleExpired(sock);
    } catch (e) {
        console.error('Auction scheduler error:', e.message);
    }
}

function start(sock) {
    if (intervalId) return;
    // كل 2 دقيقة
    intervalId = setInterval(() => tick(sock), 120 * 1000);
    console.log('✅ Auction Scheduler started (every 120s)');
    // شغل مرة عند البدء
    setTimeout(() => tick(sock), 5000);
}

function stop() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
}

module.exports = { start, stop };
