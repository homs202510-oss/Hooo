const pointsController = require('./lib-points-legacy');

const games = {};
const timeouts = {};
const gameTimers = {}; // تايمرات حذف الجلسات التلقائية

const ROWS = 6;
const COLS = 7;
const EMPTY = '⚪';
const P1_SYMBOL = '🔴';
const P2_SYMBOL = '🔵';
const TURN_SECONDS = 120;
const AUTO_DELETE_MINUTES = 2; // حذف تلقائي بعد دقيقتين
const BOT_SYMBOL = '🤖';

const pointsConfig = {
  winBase: 200,       // نقاط الفوز الأساسية ضد لاعب
  perMove: 50,        // نقاط لكل حركة ناجحة ضد لاعب
  draw: 500,          // نقاط لكل لاعب في حالة التعادل
  botWin: 250,        // نقاط للفوز ضد البوت
  botMove: 60         // نقاط لكل حركة ضد البوت
};

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function renderBoard(board) {
  return board.map(row => row.join(' ')).join('\n') + '\n\n1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣';
}

function dropPiece(board, colIndex, symbol) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][colIndex] === EMPTY) {
      board[r][colIndex] = symbol;
      return r;
    }
  }
  return -1;
}

function checkWin(board, symbol) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (board[r][c] === symbol && board[r][c+1] === symbol && 
          board[r][c+2] === symbol && board[r][c+3] === symbol) return true;
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      if (board[r][c] === symbol && board[r+1][c] === symbol && 
          board[r+2][c] === symbol && board[r+3][c] === symbol) return true;
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (board[r][c] === symbol && board[r+1][c+1] === symbol && 
          board[r+2][c+2] === symbol && board[r+3][c+3] === symbol) return true;
    }
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (board[r][c] === symbol && board[r-1][c+1] === symbol && 
          board[r-2][c+2] === symbol && board[r-3][c+3] === symbol) return true;
    }
  }
  return false;
}

function getTextFromMsg(m) {
  return (m.message?.conversation ||
          m.message?.extendedTextMessage?.text ||
          m.message?.imageMessage?.caption ||
          m.message?.videoMessage?.caption || '').toString().trim();
}

function getDisplayName(jid) {
  try {
    const parts = jid.split('@');
    if (parts.length > 0) {
      const num = parts[0];
      if (num.startsWith('+')) {
        return num;
      }
      return num;
    }
    return jid;
  } catch (e) {
    return jid;
  }
}

function botMove(board) {
  const availableCols = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === EMPTY) availableCols.push(c);
  }
  
  for (const col of availableCols) {
    const testBoard = board.map(row => [...row]);
    const row = dropPiece(testBoard, col, P2_SYMBOL);
    if (row !== -1 && checkWin(testBoard, P2_SYMBOL)) return col;
  }
  
  for (const col of availableCols) {
    const testBoard = board.map(row => [...row]);
    const row = dropPiece(testBoard, col, P1_SYMBOL);
    if (row !== -1 && checkWin(testBoard, P1_SYMBOL)) return col;
  }
  
  if (availableCols.includes(3)) return 3;
  
  const middleCols = [2, 3, 4];
  for (const col of middleCols) {
    if (availableCols.includes(col)) return col;
  }
  
  return availableCols[Math.floor(Math.random() * availableCols.length)];
}

function calculatePoints(game, winnerIndex, isDraw = false, isBotGame = false) {
  const points = {};
  
  if (isDraw) {
    game.players.forEach(player => {
      if (player !== 'BOT') {
        points[player] = pointsConfig.draw;
      }
    });
  } else if (isBotGame) {
    if (winnerIndex === 0) {
      points[game.players[0]] = pointsConfig.botWin + 
        (game.moveCount * pointsConfig.botMove);
    }
  } else {
    const winner = game.players[winnerIndex];
    const loser = game.players[1 - winnerIndex];
    
    points[winner] = pointsConfig.winBase + 
      (game.moveCount * pointsConfig.perMove);
    
    points[loser] = 0;
  }
  
  return points;
}

function startTurnTimer(sock, chatId) {
  if (timeouts[chatId]) clearTimeout(timeouts[chatId]);
  timeouts[chatId] = setTimeout(async () => {
    const g = games[chatId];
    if (!g || !g.started) return;
    
    const loserIndex = g.turnIndex;
    const winnerIndex = 1 - loserIndex;
    const winnerJid = g.players[winnerIndex];
    const loserJid = g.players[loserIndex];
    
    const pointsToAdd = calculatePoints(g, winnerIndex);
    
    if (pointsController.isSystemEnabled && pointsToAdd[winnerJid] > 0) {
      pointsController.processAddition(winnerJid, pointsToAdd[winnerJid], 
        `فوز بالوقت في كونيكت ضد @${getDisplayName(loserJid)}`);
    }
    
    await sock.sendMessage(chatId, {
      text: `⌛ *انتهى وقت الدور (${TURN_SECONDS/60} دقيقة)!*\n\n🏆 @${getDisplayName(winnerJid)} فاز بالانقضاء.\n💰 ${pointsController.isSystemEnabled ? `حصل على ${pointsToAdd[winnerJid]} نقطة` : 'النقاط معطلة'}\n${g.isBotGame ? '🤖 لعبة ضد البوت' : ''}`,
      mentions: [winnerJid]
    });
    
    cleanupGame(chatId, sock);
  }, TURN_SECONDS * 1000);
}

function startAutoDeleteTimer(sock, chatId) {
  if (gameTimers[chatId]) clearTimeout(gameTimers[chatId]);
  gameTimers[chatId] = setTimeout(async () => {
    if (games[chatId]) {
      await sock.sendMessage(chatId, {
        text: `⏰ *انتهت مهلة الجلسة!*\n\nتم حذف جلسة الكونيكت تلقائياً بعد ${AUTO_DELETE_MINUTES} دقيقة من عدم النشاط.\n\nاكتب ".كونيكت" لإنشاء جلسة جديدة.`
      });
      cleanupGame(chatId, sock);
    }
  }, AUTO_DELETE_MINUTES * 60 * 1000);
}

function resetAutoDeleteTimer(sock, chatId) {
  if (games[chatId]) {
    startAutoDeleteTimer(sock, chatId);
  }
}

function cleanupGame(chatId, sock) {
  try {
    const g = games[chatId];
    if (g?.listener) sock.ev.off('messages.upsert', g.listener);
  } catch (e) {}
  delete games[chatId];
  if (timeouts[chatId]) { clearTimeout(timeouts[chatId]); delete timeouts[chatId]; }
  if (gameTimers[chatId]) { clearTimeout(gameTimers[chatId]); delete gameTimers[chatId]; }
}

// ========== دالة مستمع اللاعبين (قابلة لإعادة الاستخدام) ==========
function createPlayerListener(sock, chatId) {
  return async (ev) => {
    if (ev.type !== 'notify') return;
    const m = ev.messages[0];
    if (!m || !m.message || m.key.remoteJid !== chatId) return;
    
    resetAutoDeleteTimer(sock, chatId);
    
    const msgText = getTextFromMsg(m).toLowerCase();
    const who = m.key.participant || m.key.remoteJid;
    const game = games[chatId];
    
    if (!game) return;
    
    if (msgText === 'كونيكت حذف' || msgText === '.كونيكت حذف') {
      await sock.sendMessage(chatId, { 
        text: '⛔ لا يمكن حذف الجلسة أثناء اللعب! استخدم "انسحاب" للانسحاب.' 
      }, { quoted: m });
      return;
    }
    
    if (msgText === 'انسحاب' || msgText === '.انسحاب') {
      const idx = game.players.findIndex(p => p === who);
      if (idx === -1) {
        await sock.sendMessage(chatId, { text: '❗ أنت غير مشارك.' }, { quoted: m });
        return;
      }
      const other = game.players[1 - idx];
      if (!other) {
        await sock.sendMessage(chatId, { text: `🏳️ @${getDisplayName(who)} انسحب. تم إلغاء الجلسة.`, mentions: [who] }, { quoted: m });
        cleanupGame(chatId, sock);
        return;
      }
      
      const winnerIndex = 1 - idx;
      const pointsToAdd = calculatePoints(game, winnerIndex);
      
      const systemEnabled = pointsController.isSystemEnabled ? pointsController.isSystemEnabled() : true;
      if (systemEnabled && pointsToAdd[other] > 0 && pointsController.processAddition) {
        pointsController.processAddition(other, pointsToAdd[other], 
          `فوز بالانسحاب في كونيكت ضد @${getDisplayName(who)}`);
      }

      await sock.sendMessage(chatId, {
        text: `🏳️ @${getDisplayName(who)} انسحب!\n🏆 الفائز: @${getDisplayName(other)}\n💰 ${systemEnabled && pointsToAdd[other] > 0 ? `تلقى ${pointsToAdd[other]} نقطة` : 'النقاط معطلة'}`,
        mentions: [other]
      }, { quoted: m });

      cleanupGame(chatId, sock);
      return;
    }
    
    if (!game.started && (msgText === 'انضم' || msgText === '.انضم')) {
      if (who === game.players[0]) {
        await sock.sendMessage(chatId, { text: '❌ لا يمكنك الانضمام للعبة التي أنشأتها.' }, { quoted: m });
        return;
      }
      if (game.players[1]) {
        await sock.sendMessage(chatId, { text: '⚠️ لاعب آخر انضم بالفعل.' }, { quoted: m });
        return;
      }

      game.players[1] = who;
      game.started = true;
      game.turnIndex = 0;
      startTurnTimer(sock, chatId);

      const systemEnabled = pointsController.isSystemEnabled ? pointsController.isSystemEnabled() : true;
      await sock.sendMessage(chatId, {
        text: `✅ *بدأت اللعبة!*\n\n${renderBoard(game.board)}\n\n🔴 @${getDisplayName(game.players[0])}  —  🔵 @${getDisplayName(game.players[1])}\n⏳ مدة الدور: ${TURN_SECONDS/60} دقيقة\n⏰ الحذف التلقائي: بعد ${AUTO_DELETE_MINUTES} دقيقة من عدم النشاط\n🏆 *نقاط الفوز:* ${pointsConfig.winBase} + (${pointsConfig.perMove} لكل حركة)\n🎯 *النقاط:* ${systemEnabled ? '🟢 مفعلة' : '🔴 معطلة'}\n\nدور الآن: @${getDisplayName(game.players[game.turnIndex])}`,
        mentions: [game.players[0], game.players[1]]
      }, { quoted: m });

      return;
    }

    if (!game.started) return;

    const num = parseInt(msgText);
    if (!num || num < 1 || num > 7) {
      if (!isNaN(Number(msgText))) {
        await sock.sendMessage(chatId, { text: '❗ اختر رقم من 1 إلى 7 فقط!', mentions: [who] }, { quoted: m });
      }
      return;
    }

    const expected = game.players[game.turnIndex];
    if (who !== expected) {
      await sock.sendMessage(chatId, { text: '⛔ ليس دورك الآن!', mentions: [who] }, { quoted: m });
      return;
    }

    const colIdx = num - 1;
    const symbol = game.turnIndex === 0 ? P1_SYMBOL : P2_SYMBOL;
    const row = dropPiece(game.board, colIdx, symbol);
    if (row === -1) {
      await sock.sendMessage(chatId, { text: '❗ هذا العمود ممتلئ، اختر آخر من 1 إلى 7.', mentions: [who] }, { quoted: m });
      return;
    }

    game.moveCount++;
    const boardText = renderBoard(game.board);
    const systemEnabled = pointsController.isSystemEnabled ? pointsController.isSystemEnabled() : true;

    if (checkWin(game.board, symbol)) {
      const pointsToAdd = calculatePoints(game, game.turnIndex);
      
      if (systemEnabled && pointsToAdd[expected] > 0 && pointsController.processAddition) {
        const otherPlayer = game.players[1 - game.turnIndex];
        pointsController.processAddition(expected, pointsToAdd[expected], 
          `فوز في كونيكت ضد @${getDisplayName(otherPlayer)} (${game.moveCount} حركات)`);
      }

      await sock.sendMessage(chatId, {
        text: `🏆 *انتهت اللعبة!*\n${boardText}\n\nالفائز: @${getDisplayName(expected)}\n💰 ${systemEnabled && pointsToAdd[expected] > 0 ? `حصل على ${pointsToAdd[expected]} نقطة (${pointsConfig.winBase} أساسية + ${pointsConfig.perMove} لكل من ${game.moveCount} حركات)` : 'النقاط معطلة'}\n🔄 عدد الحركات: ${game.moveCount}`,
        mentions: [expected]
      }, { quoted: m });

      cleanupGame(chatId, sock);
      return;
    }

    if (game.board.every(r => r.every(c => c !== EMPTY))) {
      const pointsToAdd = calculatePoints(game, 0, true);
      
      if (systemEnabled && pointsController.processAddition) {
        Object.keys(pointsToAdd).forEach(player => {
          if (pointsToAdd[player] > 0) {
            pointsController.processAddition(player, pointsToAdd[player], 
              `تعادل في كونيكت (${game.moveCount} حركات)`);
          }
        });
      }

      await sock.sendMessage(chatId, {
        text: `⚖️ *انتهت اللعبة بتعادل!*\n${boardText}\n\n💰 ${systemEnabled ? `كل لاعب حصل على ${pointsConfig.draw} نقطة` : 'النقاط معطلة'}\n🔄 عدد الحركات: ${game.moveCount}`,
        mentions: [game.players[0], game.players[1]]
      }, { quoted: m });

      cleanupGame(chatId, sock);
      return;
    }

    game.turnIndex = 1 - game.turnIndex;
    startTurnTimer(sock, chatId);

    await sock.sendMessage(chatId, {
      text: `${boardText}\n\n⏳ *الدور على:* @${getDisplayName(game.players[game.turnIndex])}\n⏱️ مدة الدور: ${TURN_SECONDS/60} دقيقة\n⏰ الحذف التلقائي: بعد ${AUTO_DELETE_MINUTES} دقيقة من عدم النشاط\n🔄 الحركة: ${game.moveCount}\n💰 ${systemEnabled ? `+${pointsConfig.perMove} نقطة للحركة الناجحة` : ''}`,
      mentions: [game.players[0], game.players[1]]
    }, { quoted: m });
  };
}

// ========== الدالة الرئيسية execute ==========
async function execute(sock, msg) {
  try {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const text = getTextFromMsg(msg).toLowerCase();
    const systemEnabled = pointsController.isSystemEnabled ? pointsController.isSystemEnabled() : true;
    
    console.log('🔍 كونيكت مستدعى:', text, 'من:', sender.split('@')[0]);

    if (text === 'كونيكت حذف' || text === '.كونيكت حذف') {
      if (games[chatId]) {
        await sock.sendMessage(chatId, {
          text: `❌ *لا يمكن حذف الجلسة أثناء اللعب!*\n\nإذا كنت تريد إنهاء اللعبة، استخدم "انسحاب" للانسحاب.`
        });
      } else {
        await sock.sendMessage(chatId, {
          text: '⚠️ لا توجد جلسة كونيكت نشطة للحذف.\n\nاكتب ".كونيكت" لإنشاء جلسة جديدة.'
        });
      }
      return;
    }

    // التعامل مع المنشن أو الرد لبدء لعبة مباشرة
    let mentionedJid = null;

    // 1. البحث عن منشن في النص
    const mentionMatch = text.match(/@(\d+)/);
    if (mentionMatch) {
      mentionedJid = mentionMatch[1] + '@s.whatsapp.net';
    }

    // 2. إذا لم يوجد منشن، حاول استخراج المشارك من الرد
    if (!mentionedJid) {
      const quotedMsg = msg.message?.extendedTextMessage?.contextInfo;
      if (quotedMsg) {
        mentionedJid = quotedMsg.participant || quotedMsg.mentionedJid?.[0] || null;
      }
    }

    // إذا تم العثور على مرسل إليه، بدء اللعبة مباشرة
    if (mentionedJid && (text.startsWith('كونيكت') || text.startsWith('.كونيكت'))) {
      if (!text.includes('بوت') && !text.includes('لاعب') && !text.includes('حذف')) {
        if (mentionedJid === sender) {
          await sock.sendMessage(chatId, { text: '❌ لا يمكنك اللعب مع نفسك.' }, { quoted: msg });
          return;
        }

        if (games[chatId]) {
          await sock.sendMessage(chatId, { text: '⚠️ يوجد جلسة كونيكت نشطة بالفعل.' }, { quoted: msg });
          return;
        }

        // إنشاء اللعبة مباشرة
        games[chatId] = {
          players: [sender, mentionedJid],
          board: createBoard(),
          turnIndex: 0,
          started: true,
          moveCount: 0,
          isBotGame: false,
          listener: null
        };

        startAutoDeleteTimer(sock, chatId);
        startTurnTimer(sock, chatId);

        const listener = createPlayerListener(sock, chatId);
        games[chatId].listener = listener;
        sock.ev.on('messages.upsert', listener);

        await sock.sendMessage(chatId, {
          text: `🎮 @${getDisplayName(sender)} يدعوك يا @${getDisplayName(mentionedJid)} للعب كونيكت!\n\n📝 اكتب \`انضم\` للقبول.\n⏳ لديك 60 ثانية.\n\n𝙎𝙏𝙊𝙍𝙈┇𝗣𝗛𝗔𝗡𝗧𝗢𝗠`,
          mentions: [sender, mentionedJid]
        }, { quoted: msg });

        return;
      }
    }

    // عرض المساعدة
    if (text === 'كونيكت' || text === '.كونيكت') {
      await sock.sendMessage(chatId, {
        text: `🎮 *كونيكت - PHANTOM GAMES*\n\nاختر نوع اللعبة:\n\n1. .كونيكت لاعب ➕ للعب مع لاعب آخر\n2. .كونيكت بوت 🤖 للعب ضد البوت\n3. .كونيكت @منشن للعب مع شخص معين\n\n⏰ *معلومات مهمة:*\n• الجلسة تُحذف تلقائياً بعد ${AUTO_DELETE_MINUTES} دقائق من عدم النشاط\n• مدة كل دور: ${TURN_SECONDS/60} دقيقة\n\n⚡ *أوامر داخل اللعبة:*\n- انسحاب ← للانسحاب من اللعبة\n- ارسل رقم (1-7) ← للعب\n\n💰 *نقاط البوت:* ${pointsConfig.botWin} أساسية + ${pointsConfig.botMove} لكل حركة\n\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`,
        mentions: [sender]
      }, { quoted: msg });
      return;
    }

    // لعبة مع لاعب (طريقة الانضمام)
    if (text === 'كونيكت لاعب' || text === '.كونيكت لاعب') {
      if (games[chatId]) {
        await sock.sendMessage(chatId, {
          text: '⚠️ يوجد جلسة كونيكت نشطة بالفعل في هذه المجموعة!'
        }, { quoted: msg });
        return;
      }
      
      games[chatId] = {
        players: [sender, null],
        board: createBoard(),
        turnIndex: 0,
        started: false,
        moveCount: 0,
        isBotGame: false,
        listener: null
      };
      
      startAutoDeleteTimer(sock, chatId);
      
      await sock.sendMessage(chatId, {
        text: `🎮 *كونيكت 4 مع لاعب - PHANTOM GAMES*\n\n🔴 المنشئ: @${getDisplayName(sender)}\n🔵 في انتظار اللاعب الثاني\n\n⏰ *تنبيه:* الجلسة ستُحذف تلقائياً بعد ${AUTO_DELETE_MINUTES} دقائق من عدم النشاط\n\n📩 للانضمام: اكتب "انضم"`,
        mentions: [sender]
      }, { quoted: msg });
      
      const listener = createPlayerListener(sock, chatId);
      games[chatId].listener = listener;
      sock.ev.on('messages.upsert', listener);
      return;
    }

   // لعبة مع البوت
    if (text === 'كونيكت بوت' || text === '.كونيكت بوت') {
      if (games[chatId]) {
        await sock.sendMessage(chatId, {
          text: '⚠️ يوجد جلسة كونيكت نشطة بالفعل!'
        }, { quoted: msg });
        return;
      }
      
      games[chatId] = {
        players: [sender, 'BOT'],
        board: createBoard(),
        turnIndex: 0,
        started: true,
        moveCount: 0,
        isBotGame: true,
        listener: null
      };
      
      startAutoDeleteTimer(sock, chatId);
      
      await sock.sendMessage(chatId, {
        text: `🎮 *كونيكت 4 ضد البوت - STORM GAMES*\n\n👤 اللاعب: @${getDisplayName(sender)}\n🤖 البوت: صعب المستوى\n\n⏰ *تنبيه:* الجلسة ستُحذف تلقائياً بعد ${AUTO_DELETE_MINUTES} دقائق من عدم النشاط\n\n⏳ *مدة الدور:* ${TURN_SECONDS/60} دقيقة\n🏆 *نظام النقاط:*\n• الفوز ضد البوت: ${pointsConfig.botWin} + (${pointsConfig.botMove} لكل حركة)\n• التعادل مع البوت: ${pointsConfig.draw} نقطة\n• الخسارة: لا خصم نقاط\n\nدورك الآن! أرسل رقم العمود (1-7)\n\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`,
        mentions: [sender]
      }, { quoted: msg });
      
      const listener = async (ev) => {
        if (ev.type !== 'notify') return;
        const m = ev.messages[0];
        if (!m || !m.message || m.key.remoteJid !== chatId) return;
        
        resetAutoDeleteTimer(sock, chatId);
        
        const msgText = getTextFromMsg(m).toLowerCase();
        const who = m.key.participant || m.key.remoteJid;
        const game = games[chatId];
        
        if (!game) return;
        
        if (msgText === 'كونيكت حذف' || msgText === '.كونيكت حذف') {
          await sock.sendMessage(chatId, { 
            text: '⛔ لا يمكن حذف الجلسة أثناء اللعب! استخدم "انسحاب" للانسحاب.' 
          }, { quoted: m });
          return;
        }
        
        if (msgText === 'انسحاب' || msgText === '.انسحاب') {
          if (who !== game.players[0]) {
            await sock.sendMessage(chatId, { text: '❗ أنت غير مشارك.' }, { quoted: m });
            return;
          }
          
          await sock.sendMessage(chatId, {
            text: `🏳️ @${getDisplayName(who)} انسحب من اللعبة ضد البوت.`,
            mentions: [who]
          }, { quoted: m });
          
          cleanupGame(chatId, sock);
          return;
        }

        if (!game.started) return;
        
        if (who !== game.players[0]) return;

        const num = parseInt(msgText);
        if (!num || num < 1 || num > 7) {
          if (!isNaN(Number(msgText))) {
            await sock.sendMessage(chatId, { text: '❗ اختر رقم من 1 إلى 7 فقط!', mentions: [who] }, { quoted: m });
          }
          return;
        }

        if (game.turnIndex !== 0) {
          await sock.sendMessage(chatId, { text: '⛔ ليس دورك الآن!', mentions: [who] }, { quoted: m });
          return;
        }

        const colIdx = num - 1;
        const row = dropPiece(game.board, colIdx, P1_SYMBOL);
        if (row === -1) {
          await sock.sendMessage(chatId, { text: '❗ هذا العمود ممتلئ، اختر آخر من 1 إلى 7.', mentions: [who] }, { quoted: m });
          return;
        }

        game.moveCount++;
        let boardText = renderBoard(game.board);
        const systemEnabled = pointsController.isSystemEnabled ? pointsController.isSystemEnabled() : true;

        if (checkWin(game.board, P1_SYMBOL)) {
          const pointsToAdd = calculatePoints(game, 0, false, true);
          
          if (systemEnabled && pointsToAdd[who] > 0 && pointsController.processAddition) {
            pointsController.processAddition(who, pointsToAdd[who], 
              `فوز ضد البوت في كونيكت (${game.moveCount} حركات)`);
          }

          await sock.sendMessage(chatId, {
            text: `🏆 *مبروك! لقد فزت ضد البوت!*\n${boardText}\n\n💰 ${systemEnabled && pointsToAdd[who] > 0 ? `حصلت على ${pointsToAdd[who]} نقطة (${pointsConfig.botWin} أساسية + ${pointsConfig.botMove} لكل من ${game.moveCount} حركات)` : 'النقاط معطلة'}\n🔄 عدد الحركات: ${game.moveCount}\n🤖 مستوى البوت: صعب`,
            mentions: [who]
          }, { quoted: m });

          cleanupGame(chatId, sock);
          return;
        }

        if (game.board.every(r => r.every(c => c !== EMPTY))) {
          const pointsToAdd = calculatePoints(game, 0, true, true);
          
          if (systemEnabled && pointsToAdd[who] > 0 && pointsController.processAddition) {
            pointsController.processAddition(who, pointsToAdd[who], 
              `تعادل مع البوت في كونيكت (${game.moveCount} حركات)`);
          }

          await sock.sendMessage(chatId, {
            text: `⚖️ *تعادل مع البوت!*\n${boardText}\n\n💰 ${systemEnabled && pointsToAdd[who] > 0 ? `حصلت على ${pointsConfig.draw} نقطة` : 'النقاط معطلة'}\n🔄 عدد الحركات: ${game.moveCount}\n🤖 مستوى البوت: صعب`,
            mentions: [who]
          }, { quoted: m });

          cleanupGame(chatId, sock);
          return;
        }

        // حذف رسالة "البوت يفكر"
        setTimeout(async () => {
          const botCol = botMove(game.board);
          dropPiece(game.board, botCol, P2_SYMBOL);
          game.moveCount++;
          
          boardText = renderBoard(game.board);

          if (checkWin(game.board, P2_SYMBOL)) {
            await sock.sendMessage(chatId, {
              text: `💔 *لقد خسرت ضد البوت!*\n${boardText}\n\n🤖 البوت فاز باللعبة\n🔄 عدد الحركات: ${game.moveCount}\n🎯 حاول مرة أخرى!`,
              mentions: [who]
            });
            
            cleanupGame(chatId, sock);
            return;
          }

          if (game.board.every(r => r.every(c => c !== EMPTY))) {
            const pointsToAdd = calculatePoints(game, 0, true, true);
            
            if (systemEnabled && pointsToAdd[who] > 0 && pointsController.processAddition) {
              pointsController.processAddition(who, pointsToAdd[who], 
                `تعادل مع البوت في كونيكت (${game.moveCount} حركات)`);
            }

            await sock.sendMessage(chatId, {
              text: `⚖️ *تعادل مع البوت!*\n${boardText}\n\n💰 ${systemEnabled && pointsToAdd[who] > 0 ? `حصلت على ${pointsConfig.draw} نقطة` : 'النقاط معطلة'}\n🔄 عدد الحركات: ${game.moveCount}\n🤖 مستوى البوت: صعب`,
              mentions: [who]
            });
            
            cleanupGame(chatId, sock);
            return;
          }

          await sock.sendMessage(chatId, {
            text: `${boardText}\n\n⏳ *دورك الآن:* @${getDisplayName(who)}\n🤖 البوت وضع في العمود ${botCol + 1}\n💰 ${systemEnabled ? `+${pointsConfig.botMove} نقطة للحركة الناجحة` : ''}\n🔄 الحركة: ${game.moveCount}`,
            mentions: [who]
          });
        }, 1500);
      };

      games[chatId].listener = listener;
      sock.ev.on('messages.upsert', listener);
      return;
    }

  } catch (err) {
    console.error('خطأ في كونيكت:', err);
    if (msg?.key?.remoteJid) {
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ حصل خطأ في اللعبة.' });
    }
  }
}

module.exports = {
  name: 'كونيكت',
  command: 'كونيكت',
  description: 'لعبة كونيكت',
  category: 'العاب',
  execute: execute
};

if (typeof global.cmd === 'function') {
  global.cmd({
    name: 'كونيكت',
    exec: execute
  });
}