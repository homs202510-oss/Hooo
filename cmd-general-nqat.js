const fs = require('fs');
const path = require('path');

const {
  isFounder,
  isOwnerbot,
  isDeveloper
} = require('./lib-roles');

const pointsPath = path.join(__dirname, 'db-points.json');
const hiddenPath = path.join(__dirname, 'db-hidden-points.json');

// ===== helpers =====
function load(file, fallback) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
  }
  return JSON.parse(fs.readFileSync(file));
}

function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ===== rank system =====
function getRank(jid) {
  if (isFounder(jid)) return 4;
  if (isOwnerbot(jid)) return 3;
  if (isDeveloper(jid)) return 2;
  return 0;
}

function getRankEmoji(rank) {
  if (rank === 4) return '👑';
  if (rank === 3) return '💎';
  if (rank === 2) return '💠';
  return '👤';
}

function getRankName(rank) {
  if (rank === 4) return 'مالك';
  if (rank === 3) return 'مالك البوت';
  if (rank === 2) return 'مطور';
  return 'عضو';
}

function getRankDisplay(rank) {
  if (rank === 4) return 'المالك 👑';
  if (rank === 3) return 'مالك البوت 💎';
  if (rank === 2) return 'مطور 💠';
  return null;
}

// تحويل lid إلى Jid حقيقي
function toRealJid(jid) {
  if (!jid) return null;
  if (jid.includes('@s.whatsapp.net')) return jid;
  if (jid.includes('lid')) {
    const match = jid.match(/lid\/(\d+):/);
    if (match) return `${match[1]}@s.whatsapp.net`;
  }
  return jid;
}

// ===== hidden system =====
function getHidden() {
  return load(hiddenPath, []);
}

function isHidden(user) {
  return getHidden().includes(user);
}

function hideUser(user) {
  const list = getHidden();
  if (!list.includes(user)) {
    list.push(user);
    save(hiddenPath, list);
  }
}

function unhideUser(user) {
  save(hiddenPath, getHidden().filter(x => x !== user));
}

// ===== level =====
function getLevel(points) {
  if (points >= 1e9) return '👑 DEVELOPER';
  if (points >= 1e8) return '🌀 KING OF POINTS';
  if (points >= 1e7) return '💀 BIG BOSS';
  if (points >= 1e6) return '🔥 WTF';
  if (points >= 1e5) return '🔪 KILLER';
  if (points >= 1e4) return '🦁 LEGEND';
  if (points >= 1e3) return '💎 PRO';
  if (points >= 500) return '⚡ ADVANCED';
  if (points >= 200) return '🌱 JUNIOR';
  return '🐣 NEWBIE';
}

function getLevelBar(points) {
  const maxPoints = 10000;
  let percent = Math.min(100, (points / maxPoints) * 100);
  const filled = Math.floor(percent / 10);
  const empty = 10 - filled;
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

// تنسيق الأرقام
function formatPoints(points, rank) {
  if (points === undefined || points === null) return '0';
  if (typeof points !== 'number') points = Number(points);
  if (isNaN(points)) return '0';
  
  if (rank >= 2) {
    if (points >= 1e15) return '💰 ثروة خرافية 💰';
    if (points >= 1e12) return '💰 ثروة خيالية 💰';
    if (points >= 1e9) return '💰 ملياردير 💰';
    if (points >= 1e6) return '💰 مليونير 💰';
    return '💰 غني جداً 💰';
  }
  
  const num = points;
  if (num >= 1e15) return (num / 1e15).toFixed(2) + ' كوادريليون';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + ' تريليون';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + ' مليار';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + ' مليون';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + ' ألف';
  
  return num.toString();
}

// الحصول على نص المنشن للعرض
function getMentionText(jid, rank) {
  if (rank >= 2) {
    return getRankDisplay(rank);
  }
  const number = jid.split('@')[0];
  return `@${number}`;
}

// ===== دالة الإرسال =====
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `📊 نـقـاطـي 📊\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ===== عرض نقاط جميع الأعضاء في الجروب =====
async function showAllPoints(sock, chatId, sender, senderRank) {
  if (senderRank < 2) {
    await sendMessage(sock, chatId, [
      '🔒 هذا الأمر للمطورين فقط'
    ]);
    return;
  }

  const points = load(pointsPath, {});
  const hiddenList = getHidden();
  
  const groupMetadata = await sock.groupMetadata(chatId);
  const participants = groupMetadata.participants;
  
  const lines = [
    '📊 قائمة نقاط الأعضاء',
    ''
  ];
  
  let hasPoints = false;
  const mentions = [];
  
  const membersWithPoints = [];
  for (const member of participants) {
    const jid = toRealJid(member.id);
    const userPoints = points[jid] || 0;
    if (userPoints > 0) {
      membersWithPoints.push({ jid, points: userPoints });
    }
  }
  
  membersWithPoints.sort((a, b) => b.points - a.points);
  
  for (let i = 0; i < membersWithPoints.length; i++) {
    const member = membersWithPoints[i];
    hasPoints = true;
    const memberRank = getRank(member.jid);
    const isUserHidden = hiddenList.includes(member.jid);
    const hiddenMark = isUserHidden ? '🔒' : '📌';
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•';
    const formatted = formatPoints(member.points, memberRank);
    
    const displayText = getMentionText(member.jid, memberRank);
    
    lines.push(`${medal} ${displayText} : ${formatted} نقطة ${hiddenMark}`);
    
    if (memberRank < 2) {
      mentions.push(member.jid);
    }
  }
  
  if (!hasPoints) {
    lines.push('لا يوجد أعضاء لديهم نقاط في هذا الجروب');
  }

  await sendMessage(sock, chatId, lines, null, mentions);
}

// ===== عرض حالة الإخفاء =====
async function showHideStatus(sock, chatId, target, targetNumber, senderRank, isSelf) {
  const hidden = isHidden(target);
  
  if (!isSelf && senderRank < 2 && hidden) {
    await sendMessage(sock, chatId, [
      '🔒 لا يمكنك معرفة حالة هذا الشخص'
    ]);
    return;
  }
  
  const status = hidden ? '🔒 مخفي' : '🔓 ظاهر';
  const response = isSelf
    ? `📊 حالة نقاطك: ${status}`
    : `📊 حالة نقاط @${targetNumber}: ${status}`;
  
  await sendMessage(sock, chatId, [response], null, [target]);
}

module.exports = {
  command: ['نقاط', 'نقاطي'],
  description: '(عرض رصيد الشخص)',
    category: "عام",

  async execute(sock, m) {
    const chatId = m.key.remoteJid;
    const senderRaw = m.key.participant || m.key.remoteJid;
    const sender = toRealJid(senderRaw);
    const senderNumber = sender.split('@')[0];

    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
    const args = text.trim().split(/\s+/).slice(1);
    const action = args[0];

    const points = load(pointsPath, {});

    let mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    mentioned = mentioned.map(j => toRealJid(j));
    
    const quotedRaw = m.message?.extendedTextMessage?.contextInfo?.participant;
    const quoted = quotedRaw ? toRealJid(quotedRaw) : null;

    const senderRank = getRank(sender);
    const validActions = ['شرح', 'اخفي', 'اظهر', 'عرض', 'حالة'];
    
    const hasMention = mentioned.length > 0;
    const hasQuoted = !!quoted;

    // =========================
    // عرض نقاط شخص معين (منشن أو رد)
    // =========================
    if (hasMention || hasQuoted) {
      let target = sender;
      
      if (hasMention) {
        target = mentioned[0];
      } else if (hasQuoted) {
        target = quoted;
      }
      
      const targetNumber = target.split('@')[0];
      const targetRank = getRank(target);
      const userPoints = points[target] || 0;
      const rank = getLevel(userPoints);
      const levelBar = getLevelBar(userPoints);
      const hidden = isHidden(target);
      const isSelf = target === sender;
      const rankEmoji = getRankEmoji(targetRank);
      const rankName = getRankName(targetRank);
      const formattedPoints = formatPoints(userPoints, targetRank);
      const hiddenStatus = hidden ? '🔒 مخفي' : '🔓 ظاهر';
      
      const targetDisplay = getMentionText(target, targetRank);
      const senderDisplay = getMentionText(sender, senderRank);
      
      // منع عرض نقاط الرتب العليا
      if (!isSelf && targetRank >= 2 && senderRank < 2) {
        await sendMessage(sock, chatId, [
          `🔒 لا يمكنك عرض نقاط ${rankEmoji} ${rankName}`
        ]);
        return;
      }
      
      if (!isSelf && targetRank > senderRank) {
        await sendMessage(sock, chatId, [
          '🔒 لا يمكنك عرض نقاط هذا الشخص'
        ]);
        return;
      }
      
      if (!isSelf && hidden && senderRank < 2) {
        await sendMessage(sock, chatId, [
          '🔒 هذا المستخدم أخفى نقاطه'
        ]);
        return;
      }
      
      const lines = [
        `👤 نقاط ${targetDisplay}`,
        `💰 النقاط : ${formattedPoints}`,
        `🏆 المستوى : ${rank}`,
        `📊 ${levelBar}`,
        `👑 الرتبة : ${rankEmoji} ${rankName}`,
        `🔒 الحالة : ${hiddenStatus}`
      ];
      
      if (!isSelf) {
        lines.push(``);
        lines.push(`📩 طلب من : ${senderDisplay}`);
      }
      
      const mentions = [sender];
      if (targetRank < 2) mentions.push(target);
      
      await sendMessage(sock, chatId, lines, null, mentions);
      return;
    }
    
    // =========================
    // شرح الأوامر
    // =========================
    if (action === 'شرح') {
      const lines = [
        '📚 قائمة أوامر النقاط',
        ``,
        '📌 .نقاط → عرض نقاطك',
        '📌 .نقاط @شخص → عرض نقاط شخص',
        '📌 (رد) .نقاط → عرض نقاط المرسل',
        '📌 .نقاط اخفي → إخفاء نقاطك',
        '📌 .نقاط اظهر → إظهار نقاطك',
        '📌 .نقاط حالة → حالة الخصوصية',
        '📌 .نقاط شرح → هذه القائمة',
        ``,
        '🔒 الأعضاء لا يستطيعون عرض نقاط المطورين'
      ];
      
      if (senderRank >= 2) {
        lines.push(``);
        lines.push('⚙️ أوامر المطورين');
        lines.push('📌 .نقاط عرض → كل الأعضاء');
      }
      
      await sendMessage(sock, chatId, lines);
      return;
    }
    
    // =========================
    // عرض جميع النقاط (للمطور)
    // =========================
    if (action === 'عرض') {
      return await showAllPoints(sock, chatId, sender, senderRank);
    }
    
    // =========================
    // إخفاء النقاط
    // =========================
    if (action === 'اخفي' || action === 'اخفاء') {
      hideUser(sender);
      await sendMessage(sock, chatId, [
        '🔒 تم إخفاء نقاطك بنجاح',
        '📌 انت والمطورون فقط يمكنهم رؤيتها'
      ]);
      return;
    }
    
    // =========================
    // إظهار النقاط
    // =========================
    if (action === 'اظهر' || action === 'اظهار' || action === 'أظهر') {
      unhideUser(sender);
      await sendMessage(sock, chatId, [
        '🔓 تم إظهار نقاطك للجميع'
      ]);
      return;
    }
    
    // =========================
    // حالة الخصوصية
    // =========================
    if (action === 'حالة') {
      const statusMention = args[1] ? args[1].replace(/[@]/g, '') : null;
      
      if (statusMention && senderRank >= 2) {
        let targetJid = statusMention.includes('@') ? statusMention : `${statusMention}@s.whatsapp.net`;
        targetJid = toRealJid(targetJid);
        const targetNumber = targetJid.split('@')[0];
        return await showHideStatus(sock, chatId, targetJid, targetNumber, senderRank, false);
      } else {
        return await showHideStatus(sock, chatId, sender, senderNumber, senderRank, true);
      }
    }
    
    // =========================
    // عرض نقاط النفس (بدون أوامر)
    // =========================
    if (!action) {
      const userPoints = points[sender] || 0;
      const rank = getLevel(userPoints);
      const levelBar = getLevelBar(userPoints);
      const rankEmoji = getRankEmoji(senderRank);
      const rankName = getRankName(senderRank);
      const formattedPoints = formatPoints(userPoints, senderRank);
      const hiddenStatus = isHidden(sender) ? '🔒 مخفي' : '🔓 ظاهر';
      
      const senderDisplay = getMentionText(sender, senderRank);
      
      const lines = [
        `👤 نقاط ${senderDisplay}`,
        `💰 النقاط : ${formattedPoints}`,
        `🏆 المستوى : ${rank}`,
        `📊 ${levelBar}`,
        `👑 الرتبة : ${rankEmoji} ${rankName}`,
        `🔒 الحالة : ${hiddenStatus}`
      ];
      
      await sendMessage(sock, chatId, lines, null, [sender]);
      return;
    }
    
    // =========================
    // أمر غير معروف - عرض الشرح
    // =========================
    if (action && !validActions.includes(action)) {
      const lines = [
        '📚 قائمة أوامر النقاط',
        ``,
        '📌 .نقاط → عرض نقاطك',
        '📌 .نقاط @شخص → عرض نقاط شخص',
        '📌 (رد) .نقاط → عرض نقاط المرسل',
        '📌 .نقاط اخفي → إخفاء نقاطك',
        '📌 .نقاط اظهر → إظهار نقاطك',
        '📌 .نقاط حالة → حالة الخصوصية',
        '📌 .نقاط شرح → هذه القائمة',
        ``,
        '🔒 الأعضاء لا يستطيعون عرض نقاط المطورين'
      ];
      
      if (senderRank >= 2) {
        lines.push(``);
        lines.push('⚙️ أوامر المطورين');
        lines.push('📌 .نقاط عرض → كل الأعضاء');
      }
      
      await sendMessage(sock, chatId, lines);
      return;
    }
  }
};