/**
 * 👻 PHANTOM — AI Message Queue (Debounce)
 * يجمّع رسائل المستخدم المتتالية ويرد رد واحد شامل
 */
const pending = new Map(); // jid → { texts: [], timer, meta }

const DEBOUNCE_MS = 5000; // 5 ثواني بعد آخر رسالة
const MAX_WAIT_MS = 15000; // أقصى وقت انتظار حتى لو الرسائل مستمرة
const MAX_TEXTS = 10;

/**
 * ضيف رسالة للـ queue
 * @param {string} jid
 * @param {string} text
 * @param {Object} meta معلومات إضافية (sock, msg, sender, pushName, isGroup)
 * @param {Function} handler callback يستقبل (allTexts, meta)
 */
function enqueue(jid, text, meta, handler) {
    let entry = pending.get(jid);

    if (!entry) {
        entry = {
            texts: [text],
            meta,
            handler,
            firstAt: Date.now(),
            timer: null,
        };
        pending.set(jid, entry);
    } else {
        entry.texts.push(text);
        entry.meta = meta; // حدّث meta بآخر رسالة
        if (entry.texts.length > MAX_TEXTS) {
            entry.texts = entry.texts.slice(-MAX_TEXTS);
        }
    }

    // امسح الـ timer القديم
    if (entry.timer) clearTimeout(entry.timer);

    // احسب الوقت المتبقي
    const elapsed = Date.now() - entry.firstAt;
    const maxWaitLeft = Math.max(0, MAX_WAIT_MS - elapsed);
    const delay = Math.min(DEBOUNCE_MS, maxWaitLeft || DEBOUNCE_MS);

    entry.timer = setTimeout(() => {
        const allTexts = entry.texts.slice();
        const finalMeta = entry.meta;
        const finalHandler = entry.handler;
        pending.delete(jid);
        finalHandler(allTexts, finalMeta);
    }, delay);
}

function clear(jid) {
    const e = pending.get(jid);
    if (e?.timer) clearTimeout(e.timer);
    pending.delete(jid);
}

module.exports = { enqueue, clear, DEBOUNCE_MS, MAX_WAIT_MS };
