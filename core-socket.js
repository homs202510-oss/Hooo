const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const config = require('./config');
const logger = require('./svc-logger');
const { handleMessage } = require('./handler-message');
const welcome = require('./mod-group-welcome');
const unmuteScheduler = require('./mod-group-unmuteScheduler');
const auctionScheduler = require('./mod-auction-scheduler');

let sock = null;

function extractNumber(jid) {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0];
}

async function startSocket() {
    const { state, saveCreds } = await useMultiFileAuthState(config.paths.auth);

    // وضع pairing code: البوت لسه مش مسجل (auth فاضي) وفيه رقم في PAIRING_NUMBER بالـ .env
    const usePairing = !state.creds.registered && !!config.pairingNumber;

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        // pairing code بيحتاج اسم متصفح معروف عند واتساب، غير كده الجلسة بتتقفل بعد الكود على طول
        browser: usePairing ? Browsers.ubuntu('Chrome') : ['PHANTOM', 'Chrome', '1.0.0'],
        syncFullHistory: false,
    });

    sock.ev.on('creds.update', saveCreds);

    if (usePairing) {
        // لازم نستنى شوية لحد ما الاتصال يبدأ فعلياً قبل ما نطلب الكود، غير كده بيفشل بصمت
        setTimeout(async function() {
            try {
                if (sock.authState.creds.registered) return; // اترابط قبل ما نوصل هنا
                const code = await sock.requestPairingCode(config.pairingNumber.replace(/[^0-9]/g, ''));
                console.log('\n👻 كود الربط بتاعك: ' + code.match(/.{1,4}/g).join('-') + '\n');
                console.log('افتح واتساب على رقم ' + config.pairingNumber + ' ← الأجهزة المرتبطة ← ربط جهاز برقم الهاتف\n');
            } catch (e) {
                logger.error('❌ فشل توليد كود الربط: ' + (e.message || e));
            }
        }, 3000);
    }

    sock.ev.on('connection.update', function(info) {
        const connection = info.connection;
        const lastDisconnect = info.lastDisconnect;
        const qr = info.qr;

        if (qr && !usePairing) {
            console.log('\n👻 امسح الكود ده من واتساب:\n');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const code = new Boom(lastDisconnect && lastDisconnect.error)?.output?.statusCode;
            if (code !== DisconnectReason.loggedOut) {
                if (usePairing && !sock.authState.creds.registered) {
                    // ده طبيعي بعد إدخال كود الربط: واتساب بيقفل الاتصال مرة عشان يعيد فتحه مسجّل
                    logger.info('🔄 إعادة اتصال طبيعية بعد إدخال كود الربط...');
                } else {
                    logger.warn('❌ اتقطع (' + code + ') — إعادة بعد 3 ثواني');
                }
                setTimeout(startSocket, 3000);
            } else {
                logger.error('🚫 تم تسجيل الخروج');
            }
        } else if (connection === 'open') {
            logger.info('✅ PHANTOM اشتغل بنجاح 👻');
            try { unmuteScheduler.start(sock); } catch (_) {}
            try { auctionScheduler.start(sock); } catch (_) {}
            logger.info('📱 رقم البوت: ' + (sock.user && sock.user.id ? sock.user.id : 'unknown'));
        }
    });

    sock.ev.on('group-participants.update', async function(update) {
        try {
            await welcome.handleParticipantsUpdate(sock, update);
        } catch (e) {
            logger.error('participants update error: ' + (e.message || e.toString()));
        }
    });

    sock.ev.on('messages.upsert', async function(data) {
        const messages = data.messages;
        const type = data.type;

        if (type !== 'notify') return;

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (!msg.message) continue;

            const jid = msg.key.remoteJid;
            if (jid === 'status@broadcast') continue;

            if (msg.key.fromMe) {
                const remoteNum = extractNumber(jid);
                const botNum = extractNumber(sock.user && sock.user.id ? sock.user.id : '');
                if (remoteNum !== botNum) continue;

                const text = (msg.message.conversation || (msg.message.extendedTextMessage && msg.message.extendedTextMessage.text) || '').slice(0, 60);
                logger.info('📝 Self-Chat: ' + text);

                try {
                    await handleMessage(sock, msg);
                } catch (err) {
                    logger.error('Self-chat error: ' + (err.message || err.toString()));
                    logger.error('Stack: ' + (err.stack || 'no stack'));
                }
                continue;
            }

            try {
                await handleMessage(sock, msg);
            } catch (err) {
                logger.error('خطأ: ' + (err.message || err.toString()));
                logger.error('Stack: ' + (err.stack || 'no stack'));
            }
        }
    });

    return sock;
}

function getSocket() { return sock; }

module.exports = { startSocket, getSocket };
