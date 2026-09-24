/**
 * 👻 PHANTOM — Auction Service
 */
const db = require('./core-database');
const balance = require('./mod-balance-advanced').auction;
const events = require('./mod-events');

function getActive() {
    return db.prepare("SELECT * FROM auctions WHERE status = 'active' AND ends_at > strftime('%s','now') ORDER BY ends_at ASC LIMIT 20").all();
}

function getById(id) {
    return db.prepare('SELECT * FROM auctions WHERE id = ?').get(id);
}

function getUserActiveCount(jid) {
    const r = db.prepare("SELECT COUNT(*) as c FROM auctions WHERE seller_jid = ? AND status = 'active'").get(jid);
    return r ? r.c : 0;
}

/**
 * إنشاء مزاد — يحجز الكمية من Inventory
 */
function create(sellerJid, itemType, itemId, itemName, quantity, startPrice, durationSec = null) {
    if (!Number.isInteger(quantity) || quantity < balance.minQuantity || quantity > balance.maxQuantity)
        return { ok: false, reason: 'bad_quantity' };
    if (!Number.isInteger(startPrice) || startPrice < balance.minStartPrice || startPrice > balance.maxStartPrice)
        return { ok: false, reason: 'bad_price' };

    if (getUserActiveCount(sellerJid) >= balance.maxActivePerUser)
        return { ok: false, reason: 'too_many_active' };

    const duration = durationSec || balance.defaultDuration;
    if (duration < 60 || duration > balance.maxDuration) return { ok: false, reason: 'bad_duration' };

    const user = require('./mod-user');
    const inv = user.getInventoryItem(sellerJid, itemId);
    if (!inv || inv.quantity < quantity) return { ok: false, reason: 'no_item', have: inv ? inv.quantity : 0 };

    try {
        db.exec('BEGIN IMMEDIATE');

        // احجز الكمية (اسحبها من Inventory)
        const recheck = db.prepare('SELECT * FROM inventory WHERE user_jid = ? AND item_name = ?').get(sellerJid, itemId);
        if (!recheck || recheck.quantity < quantity) {
            db.exec('ROLLBACK');
            return { ok: false, reason: 'race' };
        }

        if (recheck.quantity === quantity) {
            db.prepare('DELETE FROM inventory WHERE id = ?').run(recheck.id);
        } else {
            db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE id = ?').run(quantity, recheck.id);
        }

        const endsAt = Math.floor(Date.now() / 1000) + duration;
        const r = db.prepare(
            'INSERT INTO auctions (seller_jid, item_type, item_id, item_name, quantity, start_price, ends_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(sellerJid, itemType, itemId, itemName, quantity, startPrice, endsAt);

        db.exec('COMMIT');

        // سجل التاريخ
        const history = require('./mod-history');
        history.log(sellerJid, 'auction', 'إنشاء مزاد', `${itemName} × ${quantity} — ${startPrice}`, 0);

        events.emit('auction_created', { user_jid: sellerJid, auction_id: r.lastInsertRowid });

        return { ok: true, auctionId: r.lastInsertRowid, endsAt };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

/**
 * مزايدة
 */
function bid(bidderJid, auctionId, amount) {
    if (!Number.isInteger(amount) || amount <= 0) return { ok: false, reason: 'bad_amount' };

    try {
        db.exec('BEGIN IMMEDIATE');

        const a = db.prepare('SELECT * FROM auctions WHERE id = ?').get(auctionId);
        if (!a) { db.exec('ROLLBACK'); return { ok: false, reason: 'not_found' }; }
        if (a.status !== 'active') { db.exec('ROLLBACK'); return { ok: false, reason: 'not_active' }; }
        if (a.ends_at <= Math.floor(Date.now() / 1000)) {
            db.exec('ROLLBACK');
            return { ok: false, reason: 'expired' };
        }
        if (a.seller_jid === bidderJid) { db.exec('ROLLBACK'); return { ok: false, reason: 'own_auction' }; }
        if (a.highest_bidder === bidderJid) { db.exec('ROLLBACK'); return { ok: false, reason: 'already_highest' }; }

        const minBid = a.current_bid > 0 ? a.current_bid + a.min_increment : a.start_price;
        if (amount < minBid) {
            db.exec('ROLLBACK');
            return { ok: false, reason: 'too_low', minBid };
        }

        const user = require('./mod-user');
        const bal = user.getCoins(bidderJid);
        if (bal < amount) {
            db.exec('ROLLBACK');
            return { ok: false, reason: 'no_coins', have: bal, need: amount };
        }

        // خصم من المزايد الجديد
        db.prepare('UPDATE users SET coins = coins - ? WHERE jid = ?').run(amount, bidderJid);

        // رجّع الفلوس للمزايد السابق
        if (a.highest_bidder && a.current_bid > 0) {
            db.prepare('UPDATE users SET coins = coins + ? WHERE jid = ?').run(a.current_bid, a.highest_bidder);
        }

        // سجّل المزايدة
        db.prepare('INSERT INTO auction_bids (auction_id, bidder_jid, amount) VALUES (?, ?, ?)')
          .run(auctionId, bidderJid, amount);

        // حدّث المزاد
        db.prepare('UPDATE auctions SET current_bid = ?, highest_bidder = ? WHERE id = ?')
          .run(amount, bidderJid, auctionId);

        db.exec('COMMIT');

        const history = require('./mod-history');
        history.log(bidderJid, 'auction', 'مزايدة', `مزاد #${auctionId} — ${amount}`, -amount);

        events.emit('auction_bid', { user_jid: bidderJid, auction_id: auctionId, amount });

        return { ok: true, amount };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

/**
 * إغلاق المزادات المنتهية
 */
async function settleExpired(sock) {
    const now = Math.floor(Date.now() / 1000);
    const expired = db.prepare("SELECT * FROM auctions WHERE status = 'active' AND ends_at <= ?").all(now);

    for (const a of expired) {
        try {
            db.exec('BEGIN IMMEDIATE');

            const seller = a.seller_jid;
            const buyer = a.highest_bidder;

            if (buyer && a.current_bid > 0) {
                // ═══ فيه مزايد — نسلّم العنصر ═══
                const user = require('./mod-user');
                user.addItem(buyer, a.item_type, a.item_id, a.quantity);

                // البائع ياخد الفلوس (ناقص رسوم)
                const fee = Math.floor(a.current_bid * balance.feePercent / 100);
                const sellerGets = a.current_bid - fee;
                user.addCoins(seller, sellerGets);

                db.prepare("UPDATE auctions SET status = 'completed', completed_at = strftime('%s','now') WHERE id = ?").run(a.id);

                // سجل
                const history = require('./mod-history');
                history.log(seller, 'auction', 'بيع مزاد', `مزاد #${a.id} — ${sellerGets} (رسوم: ${fee})`, sellerGets);
                history.log(buyer, 'auction', 'شراء مزاد', `مزاد #${a.id} — ${a.item_name} × ${a.quantity}`, -a.current_bid);

                // إشعار
                try {
                    if (sock) {
                        const sellerNum = seller.split('@')[0].split(':')[0];
                        const buyerNum = buyer.split('@')[0].split(':')[0];
                        await sock.sendMessage(seller, {
                            text: `✅ *تم بيع مزادك!*\n\n👤 المشتري: @${buyerNum}\n💰 السعر: ${a.current_bid}\n💸 رسوم: ${fee}\n💵 استلمت: ${sellerGets}\n📦 العنصر: ${a.item_name} × ${a.quantity}`,
                            mentions: [buyer],
                        }).catch(() => {});
                        await sock.sendMessage(buyer, {
                            text: `🎉 *مبروك، كسبت المزاد!*\n\n📦 العنصر: ${a.item_name} × ${a.quantity}\n💰 دفعت: ${a.current_bid}`,
                        }).catch(() => {});
                    }
                } catch (_) {}

                events.emit('auction_completed', { user_jid: buyer, auction_id: a.id });
            } else {
                // ═══ مفيش مزايد — نرجّع العنصر ═══
                const user = require('./mod-user');
                user.addItem(seller, a.item_type, a.item_id, a.quantity);

                db.prepare("UPDATE auctions SET status = 'expired', completed_at = strftime('%s','now') WHERE id = ?").run(a.id);

                const history = require('./mod-history');
                history.log(seller, 'auction', 'مزاد منتهي (بدون مزايد)', `مزاد #${a.id}`, 0);

                events.emit('auction_expired', { user_jid: seller, auction_id: a.id });
            }

            db.exec('COMMIT');
        } catch (e) {
            try { db.exec('ROLLBACK'); } catch (_) {}
            console.error('Auction settle error:', e.message);
        }
    }
}

module.exports = { getActive, getById, create, bid, settleExpired, getUserActiveCount };
