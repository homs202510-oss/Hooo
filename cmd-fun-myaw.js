const fs = require('fs');
const path = require('path');
const { isElite } = require('./lib-roles');
const { isFounder, isOwnerbot, isDeveloper } = require('./lib-roles');

const dataDir = __dirname;
const muteFilePath = path.join(dataDir, 'meowed.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(muteFilePath)) fs.writeFileSync(muteFilePath, JSON.stringify([]));

// ===== تحميل وحفظ =====
const loadMuted = () => {
  try {
    const data = JSON.parse(fs.readFileSync(muteFilePath));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const saveMuted = (data) => {
  try {
    fs.writeFileSync(muteFilePath, JSON.stringify(data, null, 2));
  } catch {}
};

let unwatch = null;

// ===== تنظيف النص =====
const cleanText = (t = '') =>
  t.toString().trim().replace(/\s+/g, '').toLowerCase();

// ===== صلاحيات البوت =====
const isFounderOrOwnerOrDev = async (jid) =>
  (await isFounder(jid)) || (await isOwnerbot(jid)) || (await isDeveloper(jid));

// ===== التحقق من أن المستخدم هو مشرف في المجموعة =====
const isGroupAdmin = async (sock, chatId, jid) => {
  try {
    const groupMetadata = await sock.groupMetadata(chatId);
    const participant = groupMetadata.participants.find(p => p.id === jid);
    return participant?.admin === 'superadmin' || participant?.admin === 'admin';
  } catch {
    return false;
  }
};

// ===== تحديد من يمكنه كتم من =====
const canMute = async (sock, chatId, actor, target) => {
  // ترتيب الصلاحيات من الأعلى للأدنى
  const targetIsFounder = await isFounder(target);
  const targetIsOwner = await isOwnerbot(target);
  const targetIsDev = await isDeveloper(target);
  const targetIsElite = await isElite(target);
  const targetIsAdmin = await isGroupAdmin(sock, chatId, target);

  const actorIsFounder = await isFounder(actor);
  const actorIsOwner = await isOwnerbot(actor);
  const actorIsDev = await isDeveloper(actor);
  const actorIsElite = await isElite(actor);
  const actorIsAdmin = await isGroupAdmin(sock, chatId, actor);
  const actorIsNormal = !actorIsFounder && !actorIsOwner && !actorIsDev && !actorIsElite && !actorIsAdmin;

  // 1. الاونر بوت يستطيع كتم الكل
  if (actorIsFounder) return true;

  // 2. الأونر يستطيع كتم الكل إلا الاونر
  if (actorIsOwner) return !targetIsFounder;

  // 3. المطور يستطيع كتم الكل إلا الأونر 
  if (actorIsDev) return !targetIsOwner && !targetIsFounder;

  // 4. النخبة (Elite) تستطيع كتم الكل إلا المشرفين والمطور والأونر 
  if (actorIsElite) {
    return !targetIsAdmin && !targetIsDev && !targetIsOwner && !targetIsFounder;
  }

  // 5. المشرف العادي (Admin في المجموعة) يستطيع كتم الكل إلا المشرفين الآخرين والمطور والأونر
  if (actorIsAdmin) {
    return !targetIsAdmin && !targetIsDev && !targetIsOwner && !targetIsFounder;
  }

  // 6. العضو العادي يستطيع كتم أي أحد إلا المشرفين والمطور والأونر
  if (actorIsNormal) {
    return !targetIsAdmin && !targetIsDev && !targetIsOwner && !targetIsFounder;
  }

  return false;
};

// ===== صلاحية أوامر الإدارة (حالة، تحرير، حرر) =====
const canManageMute = async (jid) => await isElite(jid);

module.exports = {
  command: 'مياو',
    description: '👑 امر مياو للتسلية جعل العضو الاخر قطة لك 😼',
    
  category: 'تسلية',

  async execute(sock, m) {
    const chatId = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;

    const body = m.message?.extendedTextMessage?.text || m.message?.conversation || '';
    const args = body.trim().split(/\s+/).slice(1);
    const action = args[0]?.toLowerCase();

    const ctx = m.message?.extendedTextMessage?.contextInfo;
    let target = ctx?.mentionedJid?.[0] || ctx?.participant;

    let muted = loadMuted();

    // ===== حالة ===== (فقط للنخبة)
    if (action === 'حالة') {
      if (!await canManageMute(sender)) {
        return sock.sendMessage(chatId, {
          text: `🐱✋ هذه الخاصية فقط للنخبة 😼`
        }, { quoted: m });
      }
      return sock.sendMessage(chatId, {
        text: muted.length
          ? `🐱 القطط المكتومة 😼\n\n` +
            muted.map(j => `🐾 @${j.split('@')[0]}`).join('\n')
          : `🐱 لا يوجد قطط مكتومة 😼`,
        mentions: muted
      }, { quoted: m });
    }

    // ===== تحرير (مسح الكل) ===== (فقط للنخبة)
    if (action === 'تحرير') {
      if (!await canManageMute(sender)) {
        return sock.sendMessage(chatId, {
          text: `🐱✋ هذه الخاصية فقط للنخبة 😼`
        }, { quoted: m });
      }
      saveMuted([]);
      if (unwatch) {
        unwatch();
        unwatch = null;
      }
      return sock.sendMessage(chatId, {
        text: `🐱✨ تم تحرير جميع القطط 😼`
      }, { quoted: m });
    }

    // ===== إلغاء (حرر الكتم) ===== (فقط للنخبة)
    if (action === 'حرر') {
      if (!await canManageMute(sender)) {
        return sock.sendMessage(chatId, {
          text: `🐱✋ هذه الخاصية فقط للنخبة 😼`
        }, { quoted: m });
      }
      if (!target) {
        return sock.sendMessage(chatId, {
          text: `🐱 اعمل منشن أو رد 😼`
        }, { quoted: m });
      }
      muted = muted.filter(j => j !== target);
      saveMuted(muted);
      return sock.sendMessage(chatId, {
        text: `@${target.split('@')[0]} تم تحريرك ايها القطة المطيعة 🐱💖`,
        mentions: [target]
      }, { quoted: m });
    }

    // ===== كتم شخص (الأمر الأساسي) =====
    if (!target) {
      // إذا لم يحدد هدف، نحاول جلب الرقم من الأمر مباشرة (بدون منشن)
      const possibleNumber = args[0]?.match(/\d+/);
      if (possibleNumber) {
        target = possibleNumber[0] + '@s.whatsapp.net';
      } else {
        return sock.sendMessage(chatId, {
          text: `🐱 اعمل منشن أو رد على الشخص المراد كتمه 😼`
        }, { quoted: m });
      }
    }

    // التحقق من صلاحية الكتم
    const canMuteTarget = await canMute(sock, chatId, sender, target);
    if (!canMuteTarget) {
      let reason = '';
      const targetIsAdmin = await isGroupAdmin(sock, chatId, target);
      const targetIsFounder = await isFounder(target);
      const targetIsOwner = await isOwnerbot(target);
      const targetIsDev = await isDeveloper(target);
      if (targetIsFounder) reason = 'لا يمكن كتم ملك البوت 👑';
      else if (targetIsOwner) reason = 'لا يمكن كتم مالك البوت 👑';
      else if (targetIsDev) reason = 'لا يمكن كتم المطور 👑';
      else if (targetIsAdmin) reason = 'لا يمكن كتم مشرف المجموعة 👮';
      else reason = 'ليس لديك صلاحية لكتم هذا الشخص';
      return sock.sendMessage(chatId, {
        text: `🚫 ${reason} 😼`
      }, { quoted: m });
    }

    // تنفيذ الكتم
    if (!muted.includes(target)) {
      muted.push(target);
      saveMuted(muted);
    }

    await sock.sendMessage(chatId, {
      text:
        `@${target.split('@')[0]} 🐱💢 انت الان اصبحت قطة \n` +
        `👤 عند @${sender.split('@')[0]}\n` +
        `وسيتم حذف رسائلك حتى تقول: "*مياو*"`,
      mentions: [target, sender]
    }, { quoted: m });

    if (!unwatch) {
      unwatch = watch(sock);
    }
  }
};

// ===== المراقبة =====
function watch(sock) {
  const listener = async ({ messages }) => {
    let muted = loadMuted();
    if (!muted.length) return;

    for (const msg of messages) {
      const chatId = msg.key.remoteJid;
      const sender = msg.key.participant || msg.key.remoteJid;

      if (!muted.includes(sender)) continue;

      const text = cleanText(
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        ''
      );

      if (text === 'مياو') {
        muted = muted.filter(j => j !== sender);
        saveMuted(muted);

        await sock.sendMessage(chatId, {
          text: `😼 @${sender.split('@')[0]} انت الأن قطة مطيعة وتم تحريرك 😂🫵`,
          mentions: [sender]
        }, { quoted: msg });

        continue;
      }

      try {
        await sock.sendMessage(chatId, {
          delete: {
            remoteJid: chatId,
            fromMe: false,
            id: msg.key.id,
            participant: sender
          }
        });
      } catch (e) {
        console.log("delete error:", e?.message);
      }
    }
  };

  sock.ev.on('messages.upsert', listener);
  return () => sock.ev.off('messages.upsert', listener);
}