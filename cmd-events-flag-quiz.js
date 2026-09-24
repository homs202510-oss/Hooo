// plugins/علم.js - لعبة تخمين الأعلام (نسخة ملكية فرعونية)

const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const ranksPath = path.join(__dirname, 'db-ranks.json');

if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, '{}');
if (!fs.existsSync(ranksPath)) fs.writeFileSync(ranksPath, '{}');

function loadJSON(file, fallback) {
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
  if (points >= 1000000000) return '👑 ملك النقاط';
  if (points >= 100000000) return '🌀 أسطورة النقاط';
  if (points >= 10000000) return '💀 زعيم العمالقة';
  if (points >= 1000000) return '🔥🔥 خرافي';
  if (points >= 100000) return '🔪🩸 قاتل النقاط';
  if (points >= 10000) return '🦁 أسد النقاط';
  if (points >= 1000) return '💎 محترف';
  if (points >= 500) return '🔥 متقدم';
  if (points >= 200) return '🌱 مبتدئ';
  if (points < -10) return '🪫 ضعيف';
  return '🌱 مبتدئ';
}

const rewardMap = { سهل: 50, متوسط: 100, صعب: 200 };
const penaltyMap = { سهل: 50, متوسط: 100, صعب: 200 };
const timeMap = { سهل: 10000, متوسط: 15000, صعب: 20000 };

const flags = {
  سهل: [
    { country: 'مصر', url: 'https://flagcdn.com/w320/eg.png' },
    { country: 'السعودية', url: 'https://flagcdn.com/w320/sa.png' },
    { country: 'الجزائر', url: 'https://flagcdn.com/w320/dz.png' },
    { country: 'تونس', url: 'https://flagcdn.com/w320/tn.png' },
    { country: 'المغرب', url: 'https://flagcdn.com/w320/ma.png' },
    { country: 'العراق', url: 'https://flagcdn.com/w320/iq.png' },
    { country: 'سوريا', url: 'https://flagcdn.com/w320/sy.png' },
    { country: 'الإمارات', url: 'https://flagcdn.com/w320/ae.png' },
    { country: 'فلسطين', url: 'https://flagcdn.com/w320/ps.png' },
    { country: 'الأردن', url: 'https://flagcdn.com/w320/jo.png' },
  ],
  متوسط: [
    { country: 'فرنسا', url: 'https://flagcdn.com/w320/fr.png' },
    { country: 'إيطاليا', url: 'https://flagcdn.com/w320/it.png' },
    { country: 'إسبانيا', url: 'https://flagcdn.com/w320/es.png' },
    { country: 'ألمانيا', url: 'https://flagcdn.com/w320/de.png' },
    { country: 'بريطانيا', url: 'https://flagcdn.com/w320/gb.png' },
    { country: 'تركيا', url: 'https://flagcdn.com/w320/tr.png' },
    { country: 'اليابان', url: 'https://flagcdn.com/w320/jp.png' },
    { country: 'كوريا الجنوبية', url: 'https://flagcdn.com/w320/kr.png' },
    { country: 'البرازيل', url: 'https://flagcdn.com/w320/br.png' },
    { country: 'الأرجنتين', url: 'https://flagcdn.com/w320/ar.png' },
  ],
  صعب: [
    { country: 'سريلانكا', url: 'https://flagcdn.com/w320/lk.png' },
    { country: 'كازاخستان', url: 'https://flagcdn.com/w320/kz.png' },
    { country: 'جورجيا', url: 'https://flagcdn.com/w320/ge.png' },
    { country: 'بوركينا فاسو', url: 'https://flagcdn.com/w320/bf.png' },
    { country: 'غواتيمالا', url: 'https://flagcdn.com/w320/gt.png' },
    { country: 'نيبال', url: 'https://flagcdn.com/w320/np.png' },
    { country: 'أوزبكستان', url: 'https://flagcdn.com/w320/uz.png' },
    { country: 'ليسوتو', url: 'https://flagcdn.com/w320/ls.png' },
    { country: 'مولدوفا', url: 'https://flagcdn.com/w320/md.png' },
    { country: 'إريتريا', url: 'https://flagcdn.com/w320/er.png' },
  ]
};

module.exports = {
  command: 'علم',
  description: '🏳 خمن الدولة من العلم',
  usage: '.علم سهل | متوسط | صعب',
  category: 'فعاليات',

  async execute(sock, m) {
    try {
      const chatId = m.key.remoteJid;
      const sender = m.key.participant || m.participant || m.key.remoteJid;
      const args = m.args || [];

      const validLevels = ['سهل', 'متوسط', 'صعب'];
      const inputLevel = (args?.[0] || '').trim();

      if (!validLevels.includes(inputLevel)) {
        await sock.sendMessage(chatId, {
          text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐅𝐋𝐀𝐆 𝐆𝐀𝐌𝐄 👑\n━━━━━━━━━━━━━━━━━━━━\n❌ مستوى غير صحيح\nاختر من: سهل | متوسط | صعب\n\n◈ .علم سهل\n◈ .علم متوسط\n◈ .علم صعب\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`,
          mentions: [sender]
        });
        return;
      }

      const flagList = flags[inputLevel];
      const selected = flagList[Math.floor(Math.random() * flagList.length)];

      const correctAnswer = selected.country.trim();
      const ranks = loadJSON(ranksPath, {});
      const points = loadJSON(pointsPath, {});
      const mention = [sender];
      const username = `@${sender.split('@')[0]}`;

      await sock.sendMessage(chatId, {
        image: { url: selected.url },
        caption: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐅𝐋𝐀𝐆 𝐆𝐀𝐌𝐄 👑\n━━━━━━━━━━━━━━━━━━━━\n🏳 خمن اسم الدولة من العلم\n⏳ لديك ${timeMap[inputLevel] / 1000} ثواني\n🎯 المستوى: ${inputLevel}\n🙋‍♂️ اللاعب: ${username}\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`,
        mentions: mention
      });

      const handler = async ({ messages }) => {
        for (const msg of messages) {
          if (msg.key.remoteJid !== chatId) continue;

          const txt = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
          const userAnswer = txt.trim();

          if (userAnswer === correctAnswer) {
            clearTimeout(timeout);
            sock.ev.off('messages.upsert', handler);

            const winner = msg.key.participant || msg.participant || msg.key.remoteJid;
            ranks[winner] = (ranks[winner] || 0) + 1;
            points[winner] = (points[winner] || 0) + rewardMap[inputLevel];

            saveJSON(ranksPath, ranks);
            saveJSON(pointsPath, points);

            await sock.sendMessage(chatId, {
              text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐅𝐋𝐀𝐆 𝐆𝐀𝐌𝐄 👑\n━━━━━━━━━━━━━━━━━━━━\n✅ إجابة صحيحة! 🎉\n🏁 الدولة: ${correctAnswer}\n🏆 الفائز: @${winner.split('@')[0]}\n📊 النقاط: ${points[winner]} (+${rewardMap[inputLevel]})\n🎖️ التصنيف: ${getLevel(points[winner])}\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`,
              mentions: [winner]
            });

            break;
          }
        }
      };

      sock.ev.on('messages.upsert', handler);

      const timeout = setTimeout(() => {
        sock.ev.off('messages.upsert', handler);
        points[sender] = (points[sender] || 0) - penaltyMap[inputLevel];
        saveJSON(pointsPath, points);

        sock.sendMessage(chatId, {
          text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐅𝐋𝐀𝐆 𝐆𝐀𝐌𝐄 👑\n━━━━━━━━━━━━━━━━━━━━\n❌ انتهى الوقت! ⏰\n🏳 الدولة كانت: ${correctAnswer}\n➖ تم خصم ${penaltyMap[inputLevel]} نقطة\n📊 نقاطك: ${points[sender]}\n🎖️ تصنيفك: ${getLevel(points[sender])}\n🙋‍♂️ اللاعب: @${sender.split('@')[0]}\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`,
          mentions: [sender]
        });
      }, timeMap[inputLevel]);

    } catch (خطأ) {
      console.error('علم error:', خطأ);
      return sock.sendMessage(m.key.remoteJid, {
        text: `👑 𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐅𝐋𝐀𝐆 𝐆𝐀𝐌𝐄 👑\n━━━━━━━━━━━━━━━━━━━━\n❌ خطأ غير متوقع\n${خطأ.message}\n━━━━━━━━━━━━━━━━━━━━\n𓃥 𝐁𝐘 ┇ 𝐏𝐇𝐀𝐍𝐓𝐎𝐌`
      }, { quoted: m });
    }
  }
};