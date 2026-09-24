// plugins/tit.js - محاكاة الكتابة الذكية لكل الجروبات (تبديل عام)

const fs = require('fs');
const path = require('path');
const hay = require('./lib-roles'); // استيراد دوال الصلاحيات

// ============================================================
// إعدادات
// ============================================================

const STATE_FILE = path.join(__dirname, '..', 'tit_state.json');
const CHECK_INTERVAL = 3000; // 3 ثواني
const ACTIVITY_TIMEOUT = 30000; // 30 ثانية

// ============================================================
// دوال حفظ واستعادة الحالة
// ============================================================

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      return data;
    }
  } catch (e) {
    console.log('⚠️ خطأ في قراءة حالة تيت:', e.message);
  }
  return {};
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    return true;
  } catch (e) {
    console.log('⚠️ خطأ في حفظ حالة تيت:', e.message);
    return false;
  }
}

// تحميل الحالة
let savedState = loadState();

// ============================================================
// نظام التايت العالمي
// ============================================================

if (!global.titSystem) {
  global.titSystem = {
    chats: {}, // { chatId: { lastActivity, intervalId, listener } }
    isRestoring: false,
    enabled: false // حالة النظام (تشغيل / إيقاف)
  };
}

// ============================================================
// تفعيل التايت لجروب معين
// ============================================================

function activateTypingForChat(sock, chatId) {
  // إذا كان موجوداً، نلغيه أولاً
  if (global.titSystem.chats[chatId]) {
    deactivateTypingForChat(sock, chatId);
  }

  const chatData = {
    lastActivity: Date.now(),
    intervalId: null,
    listener: null
  };

  // مستمع للرسائل
  const messageListener = ({ messages }) => {
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      if (msg.key.remoteJid === chatId) {
        chatData.lastActivity = Date.now();
        savedState[chatId] = Date.now();
        saveState(savedState);
      }
    }
  };

  try {
    sock.ev.on('messages.upsert', messageListener);
    chatData.listener = messageListener;
  } catch (e) {
    console.log(`⚠️ فشل إضافة مستمع للجروب ${chatId}:`, e.message);
  }

  // المؤقت
  const intervalId = setInterval(async () => {
    try {
      // نتحقق من حالة النظام العامة
      if (!global.titSystem.enabled) return;

      const now = Date.now();
      const diff = now - chatData.lastActivity;
      if (diff < ACTIVITY_TIMEOUT && diff > 1000) {
        await sock.sendPresenceUpdate('composing', chatId);
      }
    } catch (err) {
      if (err.message?.includes('not-authorized') || err.message?.includes('disappear')) {
        console.log(`⚠️ إزالة الجروب ${chatId} بسبب خطأ`);
        deactivateTypingForChat(sock, chatId);
      }
    }
  }, CHECK_INTERVAL);

  chatData.intervalId = intervalId;
  global.titSystem.chats[chatId] = chatData;
  console.log(`✅ تم تفعيل التايت للجروب ${chatId}`);
  return true;
}

// ============================================================
// إلغاء تفعيل التايت لجروب معين
// ============================================================

function deactivateTypingForChat(sock, chatId) {
  const chatData = global.titSystem.chats[chatId];
  if (!chatData) return false;

  if (chatData.intervalId) {
    clearInterval(chatData.intervalId);
  }
  if (chatData.listener) {
    try {
      sock.ev.off('messages.upsert', chatData.listener);
    } catch (e) {}
  }

  delete global.titSystem.chats[chatId];
  delete savedState[chatId];
  saveState(savedState);
  console.log(`⏹ تم إيقاف التايت للجروب ${chatId}`);
  return true;
}

// ============================================================
// تفعيل التايت لكل الجروبات التي البوت عضو فيها
// ============================================================

async function activateTypingForAllGroups(sock) {
  if (global.titSystem.enabled) {
    console.log('ℹ️ النظام مفعل بالفعل.');
    return 0;
  }

  try {
    const groups = await sock.groupFetchAllParticipating();
    const groupIds = Object.keys(groups);
    if (groupIds.length === 0) {
      console.log('ℹ️ لا يوجد جروبات للبوت.');
      return 0;
    }

    let activatedCount = 0;
    for (const id of groupIds) {
      if (!global.titSystem.chats[id]) {
        activateTypingForChat(sock, id);
        activatedCount++;
        savedState[id] = Date.now();
        saveState(savedState);
      }
    }

    global.titSystem.enabled = true;
    console.log(`✅ تم تفعيل التايت في ${activatedCount} جروب.`);
    return activatedCount;
  } catch (err) {
    console.log('⚠️ فشل في جلب الجروبات:', err.message);
    return 0;
  }
}

// ============================================================
// إيقاف التايت عن كل الجروبات
// ============================================================

function deactivateTypingForAllGroups(sock) {
  const chatIds = Object.keys(global.titSystem.chats);
  if (chatIds.length === 0) {
    global.titSystem.enabled = false;
    return 0;
  }

  let stoppedCount = 0;
  for (const id of chatIds) {
    if (deactivateTypingForChat(sock, id)) stoppedCount++;
  }

  global.titSystem.enabled = false;
  console.log(`✅ تم إيقاف التايت عن ${stoppedCount} جروب.`);
  return stoppedCount;
}

// ============================================================
// استعادة الجروبات النشطة عند بدء التشغيل
// ============================================================

function restoreActiveChats(sock) {
  if (global.titSystem.isRestoring) return;
  global.titSystem.isRestoring = true;

  try {
    const activeChats = Object.keys(savedState);
    if (activeChats.length === 0) {
      global.titSystem.isRestoring = false;
      return;
    }

    console.log(`🔄 استعادة ${activeChats.length} جروب نشط...`);
    for (const chatId of activeChats) {
      if (!global.titSystem.chats[chatId]) {
        activateTypingForChat(sock, chatId);
      }
    }
    global.titSystem.enabled = true;
    console.log('✅ تم استعادة الجروبات النشطة');
  } catch (e) {
    console.log('⚠️ فشل الاستعادة:', e.message);
  } finally {
    global.titSystem.isRestoring = false;
  }
}

// ============================================================
// التفعيل التلقائي عند بدء التشغيل
// ============================================================

let restoreAttempts = 0;
const maxRestoreAttempts = 20;
const restoreInterval = setInterval(() => {
  try {
    if (global.sock && !global.titSystem.isRestoring) {
      restoreActiveChats(global.sock);
      clearInterval(restoreInterval);
    }
    restoreAttempts++;
    if (restoreAttempts > maxRestoreAttempts) {
      clearInterval(restoreInterval);
    }
  } catch (e) {}
}, 5000);

// ============================================================
// معالجة انضمام البوت إلى جروب جديد
// ============================================================

function handleGroupJoin(sock) {
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const { id, participants, action } = update;
      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      if (action === 'add' && participants.includes(botNumber)) {
        console.log(`🆕 البوت أُضيف إلى جروب جديد: ${id}`);
        if (global.titSystem.enabled && !global.titSystem.chats[id]) {
          activateTypingForChat(sock, id);
          savedState[id] = Date.now();
          saveState(savedState);
        }
      }
    } catch (err) {
      console.log('⚠️ خطأ في معالجة انضمام الجروب:', err.message);
    }
  });
}

// ============================================================
// الأمر الرئيسي (تبديل عام)
// ============================================================

module.exports = {
  command: ['تيت', 'محاكاة'],
  description: 'تشغيل / إيقاف محاكاة الكتابة في جميع الجروبات',
  category: 'خاصة',
  group: true,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    global.sock = sock;

    // تفعيل معالج انضمام الجروبات مرة واحدة
    if (!global._titGroupJoinHandler) {
      handleGroupJoin(sock);
      global._titGroupJoinHandler = true;
    }

    // ================= التحقق من الصلاحيات =================
    const isAuthorized = hay.isFounder(sender) || hay.isOwnerbot(sender) || hay.isDeveloper(sender);
    if (!isAuthorized) {
      return sock.sendMessage(chatId, { 
        text: `❌ *غير مصرح*\n━━━━━━━━━━━━━━━\nهذا الأمر للمطور والمالك فقط.\n━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️` 
      }, { quoted: msg });
    }

    const isActive = global.titSystem.enabled;

    if (isActive) {
      // إيقاف التايت عن كل الجروبات
      const count = deactivateTypingForAllGroups(sock);
      const deactivationMsg = 
        `⏹ *تم إيقاف محاكاة الكتابة في جميع الجروبات*\n` +
        `━━━━━━━━━━━━━━━\n` +
        `✅ تم إيقاف التايت عن ${count} جروب\n` +
        `━━━━━━━━━━━━━━━\n` +
        `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
      return await sock.sendMessage(chatId, { text: deactivationMsg }, { quoted: msg });
    } else {
      // تشغيل التايت في كل الجروبات
      const count = await activateTypingForAllGroups(sock);
      if (count === 0) {
        return await sock.sendMessage(chatId, { 
          text: `❌ *لا يوجد جروبات*\n━━━━━━━━━━━━━━━\nالبوت ليس عضواً في أي جروب.\n━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️` 
        }, { quoted: msg });
      }

      const activationMsg = 
        `✅ *تم تشغيل محاكاة الكتابة الذكية في جميع الجروبات*\n` +
        `━━━━━━━━━━━━━━━\n` +
        `📡 البوت سيظهر كأنه يكتب في كل الجروبات التي هو عضو فيها\n` +
        `⏱ عند وجود نشاط خلال 30 ثانية\n` +
        `💾 *تم حفظ الحالة* - ستعمل حتى بعد إعادة التشغيل\n` +
        `📊 عدد الجروبات المفعلة: ${count}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

      await sock.sendMessage(chatId, { text: activationMsg }, { quoted: msg });
    }
  }
};

// ============================================================
// تصدير الدوال المساعدة
// ============================================================

module.exports.activateAll = activateTypingForAllGroups;
module.exports.deactivateAll = deactivateTypingForAllGroups;
module.exports.activate = activateTypingForChat;
module.exports.deactivate = deactivateTypingForChat;
module.exports.restore = restoreActiveChats;