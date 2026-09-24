// مين.js - اختيار عشوائي لصفات (نسخة متطورة مع إصدارات متعددة)
// أي كلمة بعد الأمر تصبح لقباً للشخص المختار

module.exports = {
  command: ["مين", "اختار"],
  category: "تسلية",
  description: "اختيار عشوائي لأعضاء المجموعة مع صفات (يدعم الأرقام والكلمات المخصصة)",

  async execute(sock, msg, args) {
    try {
      const from = msg.key.remoteJid;
      if (!from.endsWith('@g.us')) {
        return sock.sendMessage(from, { text: '⚠️ هذا الأمر مخصص للمجموعات فقط' }, { quoted: msg });
      }

      const sender = msg.key.participant || msg.key.remoteJid;
      const group = await sock.groupMetadata(from);
      
      let users = group.participants.map(p => p.id)
        .filter(id => id !== sock.user.id);

      if (users.length === 0) {
        return sock.sendMessage(from, { text: '❌ لا يوجد أعضاء في الجروب!' }, { quoted: msg });
      }

      // ===== استخراج النص الكامل =====
      const fullText = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').toLowerCase();
      
      // ===== استخراج العدد والكلمة المخصصة =====
      let count = 1;
      let customType = null;

      // تقسيم النص إلى أجزاء
      const parts = fullText.split(/\s+/);
      // إزالة الأمر نفسه (أول جزء)
      const argsParts = parts.slice(1);

      // البحث عن رقم في الأجزاء
      let numberIndex = -1;
      for (let i = 0; i < argsParts.length; i++) {
        if (!isNaN(argsParts[i]) && parseInt(argsParts[i]) > 0) {
          numberIndex = i;
          count = Math.min(parseInt(argsParts[i]), 10);
          break;
        }
      }

      // إذا وجد رقم، نزيله من الأجزاء
      let wordParts = [];
      if (numberIndex !== -1) {
        wordParts = argsParts.slice(0, numberIndex).concat(argsParts.slice(numberIndex + 1));
      } else {
        wordParts = argsParts;
      }

      // الكلمة المخصصة هي أول كلمة بعد إزالة الرقم (إن وجد)
      if (wordParts.length > 0) {
        customType = wordParts[0];
        // إذا كان هناك أكثر من كلمة، نجمعها كلقب
        if (wordParts.length > 1) {
          customType = wordParts.join(' ');
        }
      }

      // ===== تحديد الإصدار =====
      let version = 'normal';
      if (fullText.includes('اختار')) version = 'choose';
      else if (fullText.includes('عشوائي')) version = 'random';

      // ===== الصفات حسب الإصدار =====
      const typesData = {
        normal: [
          "👑 الملك", "🧠 العبقري", "😂 الأهبل", "🤥 الكذاب", 
          "🤪 المجنون", "🍀 المحظوظ", "⚡ الأسطورة", "🦥 الكسول",
          "😈 الشرير", "🧩 الذكي", "🎭 الممثل", "🎯 القناص",
          "💪 الأقوى", "🎤 المغني", "🔥 النار", "🐺 الذئب",
          "🍉 البطيخة", "🌙 القمر", "⭐ النجم", "🦊 الماكر",
          "🐻 الدب", "🦅 الصقر", "🐍 الثعبان", "🐉 التنين"
        ],
        choose: [
          "🎯 المختار", "🏆 الفائز", "👑 الأفضل", "⭐ المميز",
          "💎 النادر", "🔥 الأسطورة", "🌟 النجم", "🎖️ البطل"
        ],
        random: [
          "🌀 الغامض", "✨ الساحر", "🎲 المحظوظ", "🔮 المتنبئ",
          "🎪 المهرج", "🎭 المتعدد", "🌈 الملون", "🎇 البراق"
        ]
      };

      const types = typesData[version] || typesData.normal;

      // ===== التفاعلات =====
      const reactions = [
        "ماحدش فاهم هو عمل إيه 😂🫵",
        "واضح إنه عايش في عالم تاني 😂",
        "النتيجة دي محسومة من زمان 😏",
        "هو فعلاً يستاهل اللقب ده 👀",
        "الاختيار جه في مكانه تمام 🔥",
        "الجروب كله بيضحك عليه دلوقتي 😂",
        "دي حقيقة مش هزار 😎",
        "البوت قال كلمته خلاص ⚖️",
        "مش مصدقين بس دي الحقيقة 🤯",
        "كله عارف إنه يستاهل 😂",
        "هاهاها اختيار موفق 👏",
        "مفيش حد يختلف على ده 🫡"
      ];

      const extras = [
        "🎉 الف مبروك للشخص المختار",
        "🤣 محدش يتوقع كان ده هيطلع",
        "😏 خلاص بقى رسمي كدة",
        "🔥 البوت بيقول كلمته بجد",
        "💀 اتفقنا ان مفيش نقاش في ده"
      ];

      // ===== اختيار الأشخاص =====
      const selectedUsers = [];
      let tempUsers = [...users];
      
      for (let i = 0; i < count; i++) {
        if (tempUsers.length === 0) break;
        const idx = Math.floor(Math.random() * tempUsers.length);
        selectedUsers.push(tempUsers[idx]);
        tempUsers.splice(idx, 1);
      }

      // ===== بناء الرسالة =====
      let msgText = `╗═══≪ 🎲≫═══╔\n`;
      
      if (count === 1) {
        // استخدام الكلمة المخصصة إذا وجدت، وإلا اختيار عشوائي
        let finalType = customType || types[Math.floor(Math.random() * types.length)];
        
        // إذا كان هناك كلمة مخصصة، نضيف لها إيموجي (نحاول إيجاد إيموجي مناسب)
        if (customType) {
          // قائمة إيموجيات للكلمات الشائعة
          const emojis = {
            'حمار': '🐴', 'بغل': '🐴', 'بعبص': '🦊', 'كذاب': '🤥', 
            'ملك': '👑', 'عبقري': '🧠', 'مجنون': '🤪', 'شرير': '😈', 
            'قوي': '💪', 'أسطورة': '⚡', 'نذل': '😤', 'غبي': '😵', 
            'ذكي': '🧩', 'كسول': '🦥', 'مشاكس': '😜', 'لطيف': '🥰', 
            'وسيم': '😎', 'جميل': '🌸', 'مضحك': '😂', 'جاد': '🧐', 
            'رومانسي': '💕', 'شجاع': '🦁', 'جبان': '🐣', 'كريم': '🎁', 
            'بخيل': '💰', 'مبدع': '🎨', 'مفكر': '💡', 'قائد': '🚀'
          };
          // نبحث عن أول كلمة من الكلمة المخصصة (قد تكون مركبة)
          const firstWord = customType.split(' ')[0];
          const emoji = emojis[firstWord] || '🏷️';
          finalType = `${emoji} الـ${customType}`;
        }
        
        const react = reactions[Math.floor(Math.random() * reactions.length)];
        const extra = extras[Math.floor(Math.random() * extras.length)];
        
        msgText += `✨ *اختيار شخص عشوائي*\n\n`;
        msgText += `┊ 👤 @${selectedUsers[0].split("@")[0]}\n`;
        msgText += `┊ 🏷️ لقبه *${finalType}*\n`;
        msgText += `┊\n`;
        msgText += `┊ 💬 ${react}\n`;
        msgText += `┊\n`;
        msgText += `┊ ${extra}\n`;
      } else {
        msgText += `✨ *اختيار ${count} أشخاص عشوائيين*\n\n`;
        selectedUsers.forEach((u, i) => {
          let type = customType || types[Math.floor(Math.random() * types.length)];
          if (customType) {
            const emojis = {
              'حمار': '🐴', 'بغل': '🐴', 'بعبص': '🦊', 'كذاب': '🤥', 
              'ملك': '👑', 'عبقري': '🧠', 'مجنون': '🤪', 'شرير': '😈', 
              'قوي': '💪', 'أسطورة': '⚡', 'نذل': '😤', 'غبي': '😵', 
              'ذكي': '🧩', 'كسول': '🦥', 'مشاكس': '😜', 'لطيف': '🥰', 
              'وسيم': '😎', 'جميل': '🌸', 'مضحك': '😂', 'جاد': '🧐', 
              'رومانسي': '💕', 'شجاع': '🦁', 'جبان': '🐣', 'كريم': '🎁', 
              'بخيل': '💰', 'مبدع': '🎨', 'مفكر': '💡', 'قائد': '🚀'
            };
            const firstWord = customType.split(' ')[0];
            const emoji = emojis[firstWord] || '🏷️';
            type = `${emoji} الـ${customType}`;
          }
          msgText += `┊ ${i+1}. @${u.split("@")[0]} → ${type}\n`;
        });
        msgText += `┊\n`;
        msgText += `┊ 🎯 *تم الاختيار بنجاح*\n`;
      }
      
      msgText += `┊\n`;
      msgText += `┊ 📊 *عدد الأعضاء:* ${group.participants.length}\n`;
      msgText += `╝═══≪ 🎲≫═══╚`;

      await sock.sendMessage(from, {
        text: msgText,
        mentions: selectedUsers
      }, { quoted: msg });

    } catch (err) {
      console.error('❌ مين error:', err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ *حدث خطأ*\n${err.message || 'خطأ غير معروف'}`
      }, { quoted: msg });
    }
  }
};