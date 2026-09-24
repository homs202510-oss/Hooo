const { jidDecode } = require('@whiskeysockets/baileys');
const hay = require('./lib-roles');

// استخراج الرقم النقي (للمقارنات فقط)
function getPureNumber(jid) {
  if (!jid) return '';
  try {
    const decoded = jidDecode(jid);
    if (decoded?.user) return decoded.user.replace(/\D/g, '');
  } catch {}
  const match = String(jid).match(/(\d+)@/);
  return match ? match[1] : '';
}

// الحصول على JID صالح للمنشن (يحافظ على الصيغة الأصلية إذا كانت صالحة)
function getMentionJid(jid) {
  if (!jid) return null;
  if (typeof jid === 'string' && jid.includes('@')) return jid;
  const num = getPureNumber(jid);
  return num ? num + '@s.whatsapp.net' : null;
}

// تحديد مستوى الرتبة (تعتمد على الرقم فقط)
function getRankLevel(userJid, groupMetadata) {
  const userNumber = getPureNumber(userJid);
  if (!userNumber) return 0;
  if (hay.isFounder(userNumber)) return 5;
  if (hay.isOwnerbot(userNumber)) return 4;
  if (hay.isDeveloper(userNumber)) return 3;
  if (hay.isElite && hay.isElite(userNumber)) return 2;

  const participant = groupMetadata?.participants?.find(p => 
    getPureNumber(p.id) === userNumber
  );
  if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) return 1;
  return 0;
}

const active = new Map(); // منع تكرار التحدي

module.exports = {
  command: 'قول',
  description: '⏳ قول "مياو" خلال 10 ثواني أو تطرد ( الأونر، المطور فقط)',
  category: 'ادارة',
  group: true,

  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) return;

    const senderRaw = msg.key.participant || from;
    const senderNumber = getPureNumber(senderRaw);
    const isFounder = hay.isFounder(senderNumber);
    const isOwnerbot = hay.isOwnerbot(senderNumber);
    const isDeveloper = hay.isDeveloper(senderNumber);

    // صلاحية الأمر (فقط، الأونر، المطور)
    if (!(isFounder || isOwnerbot || isDeveloper)) {
      return sock.sendMessage(from, {
        text: 'ذل من لا صلاحيات له 😂🫵'
      }, { quoted: msg });
    }

    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    let targetJid = ctx?.mentionedJid?.[0] || ctx?.participant;

    if (!targetJid) {
      return sock.sendMessage(from, {
        text: '🚫 لازم تمنشن شخص واحد أو ترد على رسالته'
      }, { quoted: msg });
    }

    const targetMention = getMentionJid(targetJid);
    if (!targetMention) {
      return sock.sendMessage(from, { text: '❌ لم أتمكن من تحديد العضو.' }, { quoted: msg });
    }

    const targetNumber = getPureNumber(targetJid);
    if (!targetNumber) {
      return sock.sendMessage(from, { text: '❌ رقم العضو غير صالح.' }, { quoted: msg });
    }

    // منع استهداف البوت نفسه
    const botNumber = getPureNumber(sock.user.id);
    if (targetNumber === botNumber) {
      return sock.sendMessage(from, { text: '❌ لا يمكنك استخدام الأمر على البوت.' }, { quoted: msg });
    }

    const groupMetadata = await sock.groupMetadata(from);
    const senderLevel = getRankLevel(senderRaw, groupMetadata);
    const targetLevel = getRankLevel(targetJid, groupMetadata);

    // منع استهداف الأعلى رتبة (إلا إذا كان المرسل الاونر)
    if (!isFounder && targetLevel >= senderLevel) {
      let rankName = '';
      if (targetLevel === 5) rankName = 'الاونر';
      else if (targetLevel === 4) rankName = 'أونر البوت';
      else if (targetLevel === 3) rankName = 'مطور';
      else if (targetLevel === 2) rankName = 'نخبة';
      else if (targetLevel === 1) rankName = 'مشرف';
      else rankName = 'عضو';
      return sock.sendMessage(from, {
        text: `❗ لا يمكنك استخدام الأمر على ${rankName}.`
      }, { quoted: msg });
    }

    // التأكد من وجود الهدف في المجموعة
    const exists = groupMetadata.participants.some(p => getPureNumber(p.id) === targetNumber);
    if (!exists) {
      return sock.sendMessage(from, { text: '❌ العضو غير موجود في هذه المجموعة.' }, { quoted: msg });
    }

    if (active.has(targetNumber)) {
      return sock.sendMessage(from, {
        text: '⚠️ الشخص ده عليه تحدي شغال بالفعل'
      }, { quoted: msg });
    }

    // رد فعل 🐱
    await sock.sendMessage(from, {
      react: { text: '🐱', key: msg.key }
    });

    await sock.sendMessage(from, {
      text: `😼 @${targetNumber}  
معاك 10 ثواني تقول "*مياو*" او سيتم طردك 😼`,
      mentions: [targetMention]
    });

    active.set(targetNumber, { escaped: false });

    // مستمع الرسائل
    const listener = async (update) => {
      const m = update.messages?.[0];
      if (!m) return;

      const text =
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        '';

      if (!text) return;

      const senderMsg = m.key.participant || m.key.remoteJid;
      const senderMsgNumber = getPureNumber(senderMsg);

      if (
        m.key.remoteJid === from &&
        senderMsgNumber === targetNumber &&
        text.toLowerCase().includes('مياو')
      ) {
        const data = active.get(targetNumber);
        if (data && !data.escaped) {
          data.escaped = true;
          await sock.sendMessage(from, {
            text: `😼 أحسنت @${targetNumber} قط مطيع نجوت من الطرد!`,
            mentions: [targetMention]
          });
          active.delete(targetNumber);
          sock.ev.off('messages.upsert', listener);
        }
      }
    };

    sock.ev.on('messages.upsert', listener);

    // مهلة 10 ثوانٍ
    setTimeout(async () => {
      const data = active.get(targetNumber);
      if (!data) return;

      if (!data.escaped) {
        try {
          await sock.groupParticipantsUpdate(from, [targetMention], 'remove');
          await sock.sendMessage(from, {
            text: `💥 تم طرد @${targetNumber} لأنه ما قال "مياو"!`,
            mentions: [targetMention]
          });
        } catch {
          await sock.sendMessage(from, {
            text: '⚠️ ما قدرت أطرد العضو (تأكد إن البوت أدمن)'
          });
        }
      }
      active.delete(targetNumber);
      sock.ev.off('messages.upsert', listener);
    }, 10000);
  }
};