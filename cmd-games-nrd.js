// نرد.js - لعبة رمي النرد (نسخة محسنة بدون خطوط)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

if (!fs.existsSync(path.dirname(pointsPath))) {
  fs.mkdirSync(path.dirname(pointsPath), { recursive: true });
}
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, '{}');

function loadJSON(file, fallback = {}) {
  try {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    return JSON.parse(fs.readFileSync(file));
  } catch {
    return fallback;
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getLevel(points) {
  if (points >= 1000000000) return '👑 DEVELOPER';
  if (points >= 100000000) return '🌀 KING OF POINTS';
  if (points >= 10000000) return '💀 BIG BOSS';
  if (points >= 1000000) return '🔥 WTF';
  if (points >= 100000) return '🔪 KILLER';
  if (points >= 10000) return '🦁 LEGEND';
  if (points >= 1000) return '💎 PRO';
  if (points >= 500) return '⚡ ADVANCED';
  if (points >= 200) return '🌱 JUNIOR';
  if (points < -10) return '🪫 NOOB';
  return '🐣 NEWBIE';
}

const diceFaces = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' };

const comments = {
  1: '😅 حظك وحش أوي، خسرت نقاط!',
  2: '🙃 حظ سيء، خسارة خفيفة.',
  3: '😐 حظك نص نص، خسرت شوية.',
  4: '😊 حظ حلو، كسبت نقاط!',
  5: '🎉 حظك جامد! كسبت كويس!',
  6: '🔥 أسطورة! جاك الحظ الأكبر!'
};

const diceJokes = [
  '🎲 النرد مش معاك النهاردة',
  '🎲 جرب حظك تاني يا بطل',
  '🎲 النرد بيحبك ولا بيكرهك؟',
  '🎲 محدش يعرف النرد هيجيب ايه',
  '🎲 النرد لعبة أرقام وحظوظ'
];

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🎲 لـعـبـة الـنـرد 🎲\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
  command: 'نرد',
  description: '🎲 رمي النرد + كسب أو خسارة نقاط حسب الرقم',
  category: 'العاب',
  usage: '.نرد [@منشن]',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    try {
      const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

      // تحديد الهدف (المنشن)
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
      let target = contextInfo?.mentionedJid?.[0] || contextInfo?.participant || null;
      let targetName = target ? target.split('@')[0] : sender.split('@')[0];
      const playerId = target || sender;

      // 1. تحميل النقاط
      const points = loadJSON(pointsPath);
      let userPoints = points[playerId] || 0;

      // 2. رمي النرد
      const diceValue = Math.floor(Math.random() * 6) + 1;
      const diceEmoji = diceFaces[diceValue];
      const comment = comments[diceValue];

      // 3. حساب التغيير (1-3 خسارة، 4-6 ربح، مضروب ×10)
      let change = 0;
      if (diceValue <= 3) {
        change = -(diceValue * 10);
      } else {
        change = diceValue * 10;
      }

      // 4. تحديث النقاط والرتبة
      userPoints += change;
      points[playerId] = userPoints;
      saveJSON(pointsPath, points);
      const rank = getLevel(userPoints);

      // 5. نكتة عشوائية
      const joke = diceJokes[Math.floor(Math.random() * diceJokes.length)];

      // 6. تجهيز الرسالة
      const statusEmoji = change > 0 ? '✅' : '❌';
      const statusText = change > 0 ? 'ربح' : 'خسارة';
      
      const lines = [
        `👤 @${targetName}`,
        ``,
        `🎲 رميت النرد... ${diceEmoji} طلعلك *${diceValue}*`,
        `📝 ${comment}`,
        ``,
        `${statusEmoji} *${statusText}* ${change > 0 ? '+' : ''}${change} نقطة`,
        `💰 رصيدك: ${userPoints} نقطة`,
        `🏅 المستوى: ${rank}`,
        ``,
        `😂 ${joke}`,
        ``,
        `🎯 جرب تاني: .نرد`
      ];

      await sendMessage(sock, chatId, lines, msg, [playerId]);

    } catch (error) {
      console.error('✗ خطأ في أمر نرد:', error);
      await sendMessage(sock, msg.key.remoteJid, [
        '❌ حدث خطأ أثناء التنفيذ.',
        '📌 حاول مرة أخرى لاحقاً.'
      ], msg);
    }
  }
};