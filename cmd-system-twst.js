const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  command: 'توست',
  description: '📊 عرض حالة البوت بأسلوب عصري مع شريط طاقة',
  category: 'نظام',

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    const mention = msg.key.participant || jid;

    try {
      // معلومات البوت (يمكن تحديثها ديناميكياً)
      const botName = `${require('./config').botName} BOT`;
      const version = '5.0';
      const uptime = process.uptime();
      const uptimeStr = formatUptime(uptime);
      const groupsCount = '12';
      const usersCount = '245';

      // مراحل شريط الطاقة (12 مرحلة)
      const stages = [
  { filled: 0,  bar: '~🐍≈≈≈≈≈≈≈≈~ 🍎', pct: 0 },
  { filled: 1,  bar: '~≈≈≈🐍≈≈≈≈≈~ 🍎', pct: 10 },
  { filled: 2,  bar: '~≈≈≈≈≈≈🐍≈≈~ 🍎', pct: 20 },
  { filled: 3,  bar: '~≈≈≈≈≈≈≈≈🐍~ 🍎', pct: 50 },
  { filled: 4,  bar: '~≈≈≈≈≈≈≈≈~🐲 🍎', pct: 80 },
  { filled: 5,  bar: '~≈≈≈≈≈≈≈≈≈≈~ 🐸', pct: 100 }
];
      function formatUptime(seconds) {
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${d}d ${h}h ${m}m ${s}s`;
      }

      function buildMessage(stage) {
        const bar = stage.bar;
        const pct = stage.pct;
        // تحديد لون الطاقة (رموز تعبيرية)
        let powerEmoji = '🔋';
        if (pct >= 80) powerEmoji = '⚡';
        else if (pct >= 50) powerEmoji = '🔆';
        else if (pct >= 20) powerEmoji = '🔅';
        else powerEmoji = '🪫';

        return `
┌────────────────┐
│          ${botName}          
├────────────────┤
│ 👤 المستخدم : @${mention.split('@')[0]}
│ 📡 الحالة    : 🟢 نشط
│ ⚡ الطاقة    : ${bar}  ${pct}%
│ ${powerEmoji} الشحن     : ${pct >= 100 ? '✅ مكتمل' : '⏳ جاري...'}
│ 🛰️ الاتصال   : مستقر ✓
│ 🕒 مدة التشغيل: ${uptimeStr}
│ 📊 المجموعات : ${groupsCount}
│ 👥 المستخدمين: ${usersCount}
│ 🏷️ الإصدار   : v${version}
│ 🛡️ المالك     : +${require('./config').ownerNumber}
│ 🔰 النمط      : 『⚕️ 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ⚘️』
└────────────────┘
        `;
      }

      // إرسال الرسالة الأولى
      const sent = await sock.sendMessage(
        jid,
        {
          text: buildMessage(stages[0]),
          mentions: [mention]
        },
        { quoted: msg }
      );

      // تحديث شريط الطاقة تدريجياً
      for (let i = 1; i < stages.length; i++) {
        await sleep(500);
        await sock.sendMessage(
          jid,
          {
            edit: sent.key,
            text: buildMessage(stages[i]),
            mentions: [mention]
          }
        );
      }

      // رسالة نهائية بعد اكتمال الشحن
      await sleep(400);
      await sock.sendMessage(
        jid,
        {
          edit: sent.key,
          text: `
┌───────────────────┐
│          🎉 تم الشحن!         
├───────────────────┤
│  🚀 البوت جاهز بكامل طاقته   
│  ⚡ شحن 100% 🔋             
│  ✨ جميع الخدمات متاحة الآن   
│  📢 استمتع بالتجربة المميزة   
└───────────────────┘
`,
          mentions: [mention]
        }
      );

    } catch (err) {
      console.error(err);
      await sock.sendMessage(
        jid,
        { text: '❌ حدث خطأ أثناء تنفيذ الأمر.' },
        { quoted: msg }
      );
    }
  }
};