const { jidDecode } = require('@whiskeysockets/baileys');
const hay = require('./lib-roles');

// استخراج الرقم فقط من أي JID (للمقارنات فقط)
function getPureNumber(jid) {
  if (!jid) return '';
  try {
    const decoded = jidDecode(jid);
    if (decoded && decoded.user) {
      return decoded.user.replace(/\D/g, '');
    }
  } catch(e) {}
  const match = String(jid).match(/(\d+)@/);
  return match ? match[1] : '';
}

// الحصول على JID صالح للمنشن
function getMentionJid(jid) {
  if (!jid) return null;
  if (typeof jid === 'string' && jid.includes('@')) {
    return jid;
  }
  const num = getPureNumber(jid);
  return num ? num + '@s.whatsapp.net' : null;
}

// دالة لتحديد مستوى الرتبة (تعتمد على الرقم فقط)
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

module.exports = {
  command: 'عبدي',
  description: 'يمنع شخصًا معينًا من الكتابة، وإذا كتب يتم طرده.',
  usage: '.عبدي @المستخدم | رد على رسالة',
  category: 'خاصة',

  async execute(sock, msg) {
    try {
      const groupJid = msg.key.remoteJid;
      if (!groupJid.endsWith('@g.us')) {
        return sock.sendMessage(groupJid, { text: '❗ هذا الأمر يعمل فقط داخل المجموعات.' }, { quoted: msg });
      }

      const senderRaw = msg.key.participant || groupJid;
      const senderNumber = getPureNumber(senderRaw);

      // جلب بيانات المجموعة للتحقق من المشرفين
      const groupMetadata = await sock.groupMetadata(groupJid);

      // تحديد صلاحيات المرسل
      const isFounder = hay.isFounder(senderNumber);
      const isOwnerbot = hay.isOwnerbot(senderNumber);
      const isDeveloper = hay.isDeveloper(senderNumber);
      
      // التحقق من كونه مشرفاً في المجموعة
      const senderParticipant = groupMetadata.participants.find(p => getPureNumber(p.id) === senderNumber);
      const isAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');

      // السماح ، مالك البوت، المطورين، والمشرفين
      if (!(isFounder || isOwnerbot || isDeveloper || isAdmin)) {
        return sock.sendMessage(groupJid, { text: 'ذل من لا صلاحيات له 😂🫵' }, { quoted: msg });
      }

      const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
      let targetJid = contextInfo?.mentionedJid?.[0] || contextInfo?.participant;

      if (!targetJid) {
        return sock.sendMessage(groupJid, { text: '❗ اعمل منشن أو رد على رسالة الشخص.' }, { quoted: msg });
      }

      const targetMention = getMentionJid(targetJid);
      if (!targetMention) {
        return sock.sendMessage(groupJid, { text: '❌ لم أتمكن من تحديد العضو.' }, { quoted: msg });
      }

      const targetNumber = getPureNumber(targetJid);
      if (!targetNumber) {
        return sock.sendMessage(groupJid, { text: '❌ لم أتمكن من استخراج رقم العضو.' }, { quoted: msg });
      }

      // منع استهداف البوت
      const botNumber = getPureNumber(sock.user.id);
      if (targetNumber === botNumber) {
        return sock.sendMessage(groupJid, { text: '❌ لا يمكنك استخدام الأمر على البوت.' }, { quoted: msg });
      }

      const senderLevel = getRankLevel(senderRaw, groupMetadata);
      const targetLevel = getRankLevel(targetJid, groupMetadata);

      // منع استخدام الأمر على من هم أعلى رتبة (مع استثناء الاونر)
      if (!isFounder && targetLevel >= senderLevel) {
        let rankName = '';
        if (targetLevel === 5) rankName = 'الاونر';
        else if (targetLevel === 4) rankName = 'أونر البوت';
        else if (targetLevel === 3) rankName = 'مطور';
        else if (targetLevel === 2) rankName = 'نخبة';
        else if (targetLevel === 1) rankName = 'مشرف';
        else rankName = 'عضو';
        return sock.sendMessage(groupJid, { text: `❗ لا يمكنك استخدام الأمر على ${rankName}.` }, { quoted: msg });
      }

      // التحقق من وجود العضو في المجموعة
      const exists = groupMetadata.participants.some(p => getPureNumber(p.id) === targetNumber);
      if (!exists) {
        return sock.sendMessage(groupJid, { text: '❌ العضو غير موجود في هذه المجموعة.' }, { quoted: msg });
      }

      // إرسال التقييد مع منشن
      await sock.sendMessage(groupJid, {
        text: `🫦 @${targetNumber} تم تقييدك مؤقتًا.\nأي رسالة قبل انتهاء المدة = طرد.`,
        mentions: [targetMention]
      }, { quoted: msg });

      const startTime = Date.now();
      const duration = 60000;

      const listener = async (update) => {
        const m = update.messages?.[0];
        if (!m) return;
        if (m.key.remoteJid !== groupJid) return;
        const msgNumber = getPureNumber(m.key.participant);
        if (msgNumber !== targetNumber) return;

        const remaining = duration - (Date.now() - startTime);
        if (remaining > 0) {
          sock.ev.off('messages.upsert', listener);
          await sock.groupParticipantsUpdate(groupJid, [targetMention], 'remove').catch(() => {});
          await sock.sendMessage(groupJid, {
            text: `🚨 @${targetNumber} خالفت التعليمات وتم طردك.`,
            mentions: [targetMention]
          });
        }
      };
      sock.ev.on('messages.upsert', listener);

      const interval = setInterval(async () => {
        const remaining = duration - (Date.now() - startTime);
        if (remaining <= 0) {
          clearInterval(interval);
          sock.ev.off('messages.upsert', listener);
          await sock.sendMessage(groupJid, {
            text: `✅ انتهى التقييد، يمكنك الكتابة الآن @${targetNumber}.`,
            mentions: [targetMention]
          });
          return;
        }
        const seconds = Math.floor(remaining / 1000);
        await sock.sendMessage(groupJid, {
          text: `⏰ @${targetNumber} متبقي ${seconds} ثانية.`,
          mentions: [targetMention]
        });
      }, 10000);

    } catch (err) {
      console.error('❌ خطأ في أمر عبدي:', err);
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ حدث خطأ أثناء تنفيذ الأمر.' }, { quoted: msg });
    }
  }
};