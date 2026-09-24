// اكس.js - لعبة إكس-أو مع نظام انضمام ونقاط (فوز=250، خسارة=150، تعادل=50)
const fs = require('fs');
const path = require('path');

const activeDir = __dirname;
const activeFile = path.join(activeDir, 'activeGames.json');

if (!fs.existsSync(activeDir)) fs.mkdirSync(activeDir);
if (!fs.existsSync(activeFile)) fs.writeFileSync(activeFile, JSON.stringify({}));

function loadActiveGames() {
    return JSON.parse(fs.readFileSync(activeFile));
}

function saveActiveGames(data) {
    fs.writeFileSync(activeFile, JSON.stringify(data, null, 2));
}

const pendingGames = {};

class TicTacToe {
    constructor(playerX, playerO, isBot = false) {
        this.board = Array(9).fill('⬜');
        this.playerX = playerX;
        this.playerO = playerO;
        this.turn = 'X';
        this.isBot = isBot;
        this.gameOver = false;
        this.winningCells = [];
        this.winnerSymbol = null;
    }

    getBoard() {
        const emojiMap = {
            1: '1️⃣', 2: '2️⃣', 3: '3️⃣',
            4: '4️⃣', 5: '5️⃣', 6: '6️⃣',
            7: '7️⃣', 8: '8️⃣', 9: '9️⃣'
        };

        // 🔥 بناء اللوحة
        let b = this.board.map((cell, idx) => {
            if (cell === '⬜') {
                return emojiMap[idx + 1];
            }
            return cell;
        });
        
        // 🔥 إذا انتهت اللعبة: فقط خانات الفوز تتغير
        if (this.gameOver && this.winningCells.length > 0) {
            const winSymbol = this.board[this.winningCells[0]]; // ❌ أو ⭕
            const winMark = winSymbol === '❌' ? '❎' : '✅';
            
            for (let i = 0; i < b.length; i++) {
                // 🔥 فقط الخانات الفائزة تتحول إلى علامة الفوز
                if (this.winningCells.includes(i)) {
                    b[i] = winMark;
                }
                // 🔥 باقي الخانات تبقى كما هي (الأرقام أو الرموز العادية)
            }
        }
        
        let boardStr = `${b[0]} ${b[1]} ${b[2]}\n${b[3]} ${b[4]} ${b[5]}\n${b[6]} ${b[7]} ${b[8]}`;

        // 🔥 إضافة الفائز
        let winnerLine = '';
        if (this.gameOver) {
            const winner = this.checkWinner();
            if (winner) {
                const winnerEmoji = winner === '❌' ? '❌' : '⭕';
                const winMark = winner === '❌' ? '❎' : '✅';
                winnerLine = `\n🏆 *الفائز: ${winnerEmoji} (${winMark})*`;
            } else {
                winnerLine = '\n🏁 *انتهت اللعبة!*';
            }
        }

        let instruction;
        if (this.gameOver) {
            instruction = winnerLine || '🏁 *انتهت اللعبة!*';
        } else {
            instruction = '📩 أرسل رقم الخانة (1 - 9) للعب أو اكتب "انسحب" للانسحاب.';
        }

        return `
╭─🎮 *لعبة إكس-أو* 🎮
│ 👥 اللاعب ❌: @${this.playerX.split('@')[0]}
│ 👥 اللاعب ⭕: ${this.playerO === 'BOT' ? '🤖 البوت (صعب)' : '@' + this.playerO.split('@')[0]}
│ 🎯 الدور على: *${this.turn === 'X' ? '❌' : '⭕'}*
│ ⏳ لديك 30 ثانية للرد!
╰─────────────────

${boardStr}

${instruction}
`.trim();
    }

    play(position, player) {
        if (this.gameOver) return { error: '❗ اللعبة انتهت بالفعل.' };

        if (this.turn === 'X' && player !== this.playerX) return null;
        if (this.turn === 'O' && this.playerO !== 'BOT' && player !== this.playerO) return null;

        if (isNaN(position) || position < 1 || position > 9)
            return { error: '❗ اختر رقم من 1 إلى 9.' };

        const idx = position - 1;
        if (this.board[idx] !== '⬜')
            return { error: '❗ هذه الخانة مشغولة.' };

        this.board[idx] = this.turn === 'X' ? '❌' : '⭕';

        const winner = this.checkWinner();
        if (winner) {
            this.gameOver = true;
            return { win: winner };
        }

        if (this.board.every(cell => cell !== '⬜')) {
            this.gameOver = true;
            return { draw: true };
        }

        this.turn = this.turn === 'X' ? 'O' : 'X';
        return { ok: true };
    }

    checkWinner() {
        const wins = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (const [a, b, c] of wins) {
            if (this.board[a] !== '⬜' && this.board[a] === this.board[b] && this.board[b] === this.board[c]) {
                this.winningCells = [a, b, c];
                return this.board[a];
            }
        }
        return null;
    }

    botMove() {
        const availableMoves = this.board.map((v, i) => v === '⬜' ? i : null).filter(v => v !== null);
        if (availableMoves.length === 0) return null;

        for (const idx of availableMoves) {
            const testBoard = [...this.board];
            testBoard[idx] = '⭕';
            if (this.checkWinnerOnBoard(testBoard) === '⭕') return idx + 1;
        }
        for (const idx of availableMoves) {
            const testBoard = [...this.board];
            testBoard[idx] = '❌';
            if (this.checkWinnerOnBoard(testBoard) === '❌') return idx + 1;
        }
        if (this.board[4] === '⬜') return 5;
        const corners = [0, 2, 6, 8].filter(i => this.board[i] === '⬜');
        if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)] + 1;

        return availableMoves[Math.floor(Math.random() * availableMoves.length)] + 1;
    }

    checkWinnerOnBoard(board) {
        const wins = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (const [a, b, c] of wins) {
            if (board[a] !== '⬜' && board[a] === board[b] && board[b] === board[c]) {
                return board[a];
            }
        }
        return null;
    }
}

const games = {};
const timeouts = {};

// ===== دالة إرسال مع فوتر PHANTOM =====
async function sendFormatted(sock, chatId, text, quoted = null, mentions = []) {
    const finalText = text + '\n\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️';
    await sock.sendMessage(chatId, { text: finalText, mentions }, { quoted: quoted });
}

async function sendBoard(sock, chatId, game, extra = '') {
    const boardText = game.getBoard() + (extra ? '\n\n' + extra : '');
    const mentions = game.playerO !== 'BOT' ? [game.playerX, game.playerO] : [game.playerX];
    await sendFormatted(sock, chatId, boardText, null, mentions);
}

// ===== إنهاء اللعبة مع تحديث النقاط والرموز =====
async function endGame(sock, chatId, resultMessage, isDraw = false, winnerPlayer = null, loserPlayer = null) {
    clearTimeout(timeouts[chatId]);
    delete games[chatId];
    delete timeouts[chatId];
    const activeGames = loadActiveGames();
    delete activeGames[chatId];
    saveActiveGames(activeGames);

    const pointsPath = path.join(__dirname, 'db-points.json');
    const points = fs.existsSync(pointsPath) ? JSON.parse(fs.readFileSync(pointsPath)) : {};

    let finalMessage = resultMessage;
    let emojiLine = '';

    if (isDraw) {
        const players = [];
        if (winnerPlayer && winnerPlayer !== 'BOT') players.push(winnerPlayer);
        if (loserPlayer && loserPlayer !== 'BOT' && loserPlayer !== winnerPlayer) players.push(loserPlayer);
        players.forEach(p => {
            points[p] = (points[p] || 0) + 50;
        });
        fs.writeFileSync(pointsPath, JSON.stringify(points, null, 2));
        finalMessage += '\n🤝 تم منح 50 نقطة لكل لاعب للتعادل!';
        emojiLine = '⚖️⚖️⚖️';
        await sendFormatted(sock, chatId, finalMessage + '\n' + emojiLine, null, players);
    } else if (winnerPlayer && winnerPlayer !== 'BOT') {
        points[winnerPlayer] = (points[winnerPlayer] || 0) + 250;
        if (loserPlayer && loserPlayer !== 'BOT') {
            points[loserPlayer] = (points[loserPlayer] || 0) - 150;
        }
        fs.writeFileSync(pointsPath, JSON.stringify(points, null, 2));
        const mentions = [winnerPlayer];
        if (loserPlayer && loserPlayer !== 'BOT') mentions.push(loserPlayer);
        finalMessage += `\n🎉 تم منح 250 نقطة للفائز @${winnerPlayer.split('@')[0]}!\n💔 تم خصم 150 نقطة من الخاسر ${loserPlayer && loserPlayer !== 'BOT' ? '@' + loserPlayer.split('@')[0] : '🤖 البوت'}.`;
        emojiLine = '✅✅✅';
        await sendFormatted(sock, chatId, finalMessage + '\n' + emojiLine, null, mentions);
    } else if (winnerPlayer === 'BOT') {
        if (loserPlayer && loserPlayer !== 'BOT') {
            points[loserPlayer] = (points[loserPlayer] || 0) - 150;
            fs.writeFileSync(pointsPath, JSON.stringify(points, null, 2));
            finalMessage += `\n💔 تم خصم 150 نقطة من الخاسر @${loserPlayer.split('@')[0]}.`;
            emojiLine = '❎❎❎';
            await sendFormatted(sock, chatId, finalMessage + '\n' + emojiLine, null, [loserPlayer]);
        } else {
            emojiLine = '❎❎❎';
            await sendFormatted(sock, chatId, finalMessage + '\n' + emojiLine, null, []);
        }
    } else {
        await sendFormatted(sock, chatId, finalMessage, null, []);
    }
}

module.exports = {
    command: 'اكس',
    category: 'العاب',
    description: 'لعبة إكس أو مع نظام انضمام ونقاط (فوز=250، خسارة=150، تعادل=50)',
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const body = (msg.body || msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant;

        // ===== عرض الشرح =====
        if ((body === '.اكس' || body === 'اكس') && mentioned.length === 0 && !quotedSender && !body.toLowerCase().includes('بوت')) {
            const helpText = `
🎮 *شرح لعبة إكس-أو (XO)* 🎮

📖 *طريقة البدء:*
1️⃣ للعب مع شخص: منشن اللاعب أو رد على رسالته واكتب الأمر.
   مثال: \`.اكس @منشن\` أو بالرد على رسالته.
2️⃣ للعب مع البوت (مستوى صعب):
   مثال: \`.اكس بوت\`

💰 *نظام النقاط:*
🏆 الفوز: 250 نقطة.
💔 الخسارة: 150 نقطة (تُخصم).
🤝 التعادل: 50 نقطة لكل لاعب.

⏳ *تنبيه:* لديك 30 ثانية لكل دور، وإلا ستخسر تلقائياً!
`;
            return sendFormatted(sock, chatId, helpText, msg);
        }

        const activeGames = loadActiveGames();
        if (activeGames[chatId]) {
            return sendFormatted(sock, chatId, '⚠️ هناك لعبة إكس-أو قيد التشغيل في هذه المجموعة بالفعل.', msg);
        }

        let opponent;

        if (body.toLowerCase().includes('بوت')) {
            opponent = 'BOT';
        } else if (mentioned.length > 0) {
            opponent = mentioned[0];
        } else if (quotedSender) {
            opponent = quotedSender;
        } else {
            return sendFormatted(sock, chatId, '❗ من تريد أن تلعب معه؟ منشنه أو رد على رسالته أو اكتب ".اكس بوت".', msg);
        }

        if (opponent === sender) {
            return sendFormatted(sock, chatId, '❌ لا يمكنك اللعب مع نفسك!', msg);
        }

        // ===== التحقق من وجود طلب معلق =====
        if (pendingGames[chatId]) {
            return sendFormatted(sock, chatId, '⚠️ يوجد طلب لعبة معلق. انتظر انضمام الخصم.', msg);
        }

        // ===== إنشاء اللعبة (إذا كان بوت) =====
        if (opponent === 'BOT') {
            const game = new TicTacToe(sender, opponent, true);
            games[chatId] = game;
            activeGames[chatId] = true;
            saveActiveGames(activeGames);

            await sendBoard(sock, chatId, game);

            function startTimer() {
                clearTimeout(timeouts[chatId]);
                timeouts[chatId] = setTimeout(async () => {
                    if (!games[chatId]) return;
                    const winner = game.turn === 'X' ? game.playerO : game.playerX;
                    const loser = game.turn === 'X' ? game.playerX : game.playerO;
                    await endGame(sock, chatId, `⌛ انتهى وقت الجولة!\n🏆 الفائز هو: ${winner === 'BOT' ? '🤖 البوت' : '@' + winner.split('@')[0]}`, false, winner, loser);
                }, 30 * 1000);
            }

            startTimer();

            const listener = async (event) => {
                try {
                    if (event.type !== 'notify') return;
                    const msg2 = event.messages[0];
                    if (!msg2.message) return;
                    if (msg2.key.remoteJid !== chatId) return;

                    const from = msg2.key.participant || msg2.key.remoteJid;
                    const text = msg2.message.conversation || msg2.message?.extendedTextMessage?.text || '';

                    if (!games[chatId] || game.gameOver) return;

                    if (text.trim().toLowerCase() === 'انسحب') {
                        if (from !== game.playerX && from !== game.playerO) {
                            await sendFormatted(sock, chatId, '⚠️ أنت لست لاعباً في هذه اللعبة.', msg2, [from]);
                            return;
                        }
                        clearTimeout(timeouts[chatId]);
                        const winner = from === game.playerX ? game.playerO : game.playerX;
                        const loser = from;
                        game.gameOver = true;
                        await endGame(sock, chatId, `🚪 انسحب @${from.split('@')[0]}\n🏆 الفائز هو: ${winner === 'BOT' ? '🤖 البوت' : '@' + winner.split('@')[0]}`, false, winner, loser);
                        return;
                    }

                    const move = parseInt(text);
                    if (isNaN(move)) return;

                    const result = game.play(move, from);
                    if (!result) return;

                    if (result.error) {
                        await sendFormatted(sock, chatId, result.error, msg2, [from]);
                        return;
                    }

                    if (game.gameOver) {
                        await sendBoard(sock, chatId, game);
                        const winnerPlayer = (result.win === '❌') ? game.playerX : game.playerO;
                        const loserPlayer = (result.win === '❌') ? game.playerO : game.playerX;
                        const msgText = result.draw ? '⚠️ انتهت اللعبة بتعادل.' : `🏆 الفائز هو: ${winnerPlayer === 'BOT' ? '🤖 البوت' : '@' + winnerPlayer.split('@')[0]}`;
                        await endGame(sock, chatId, msgText, result.draw, winnerPlayer, loserPlayer);
                        return;
                    }

                    if (game.isBot && game.turn === 'O' && !game.gameOver) {
                        const botMove = game.botMove();
                        const botResult = game.play(botMove, 'BOT');
                        await sendBoard(sock, chatId, game);
                        startTimer();
                        if (game.gameOver) {
                            const winnerPlayer = (botResult.win === '❌') ? game.playerX : game.playerO;
                            const loserPlayer = (botResult.win === '❌') ? game.playerO : game.playerX;
                            const msgText = botResult.draw ? '⚠️ انتهت اللعبة بتعادل.' : `🏆 الفائز هو: ${winnerPlayer === 'BOT' ? '🤖 البوت' : '@' + winnerPlayer.split('@')[0]}`;
                            await endGame(sock, chatId, msgText, botResult.draw, winnerPlayer, loserPlayer);
                        }
                    } else {
                        await sendBoard(sock, chatId, game);
                        startTimer();
                    }
                } catch (err) {
                    console.error('خطأ في لعبة xo:', err);
                }
            };
            sock.ev.on('messages.upsert', listener);
            return;
        }

        // ===== اللعب مع شخص: إنشاء طلب =====
        pendingGames[chatId] = {
            creator: sender,
            target: opponent,
            timeout: null
        };

        pendingGames[chatId].timeout = setTimeout(() => {
            if (pendingGames[chatId]) {
                delete pendingGames[chatId];
                sendFormatted(sock, chatId, `⏰ انتهى وقت الانتظار. لم ينضم @${opponent.split('@')[0]}.`, null, [opponent]);
            }
        }, 60000);

        const inviteMessage = `🎮 @${sender.split('@')[0]} يدعوك يا @${opponent.split('@')[0]} للعب إكس-أو!\n📝 اكتب \`انضم\` للقبول.\n⏳ لديك 60 ثانية.`;
        await sendFormatted(sock, chatId, inviteMessage, msg, [sender, opponent]);

        const joinListener = async (event) => {
            try {
                if (event.type !== 'notify') return;
                const msg2 = event.messages[0];
                if (!msg2.message) return;
                if (msg2.key.remoteJid !== chatId) return;

                const from = msg2.key.participant || msg2.key.remoteJid;
                const text = msg2.message.conversation || msg2.message?.extendedTextMessage?.text || '';

                const pending = pendingGames[chatId];
                if (!pending) return;

                if (text.trim().toLowerCase() === 'انضم' || text.trim().toLowerCase() === 'انضمام') {
                    if (from !== pending.target) {
                        await sendFormatted(sock, chatId, '❌ هذه الدعوة ليست لك!', msg2, [from]);
                        return;
                    }
                    if (from === pending.creator) {
                        await sendFormatted(sock, chatId, '❌ لا يمكنك الانضمام للعبة التي أنشأتها.', msg2, [from]);
                        return;
                    }

                    clearTimeout(pending.timeout);
                    delete pendingGames[chatId];

                    const playerX = pending.creator;
                    const playerO = from;
                    const game = new TicTacToe(playerX, playerO, false);
                    games[chatId] = game;
                    activeGames[chatId] = true;
                    saveActiveGames(activeGames);

                    await sendBoard(sock, chatId, game);

                    function startTimer() {
                        clearTimeout(timeouts[chatId]);
                        timeouts[chatId] = setTimeout(async () => {
                            if (!games[chatId]) return;
                            const winner = game.turn === 'X' ? game.playerO : game.playerX;
                            const loser = game.turn === 'X' ? game.playerX : game.playerO;
                            await endGame(sock, chatId, `⌛ انتهى وقت الجولة!\n🏆 الفائز هو: ${winner === 'BOT' ? '🤖 البوت' : '@' + winner.split('@')[0]}`, false, winner, loser);
                        }, 30 * 1000);
                    }

                    startTimer();

                    const gameListener = async (event) => {
                        try {
                            if (event.type !== 'notify') return;
                            const m = event.messages[0];
                            if (!m.message) return;
                            if (m.key.remoteJid !== chatId) return;

                            const fromPlayer = m.key.participant || m.key.remoteJid;
                            const msgText = m.message.conversation || m.message?.extendedTextMessage?.text || '';

                            if (!games[chatId] || game.gameOver) return;

                            if (msgText.trim().toLowerCase() === 'انسحب') {
                                if (fromPlayer !== game.playerX && fromPlayer !== game.playerO) {
                                    await sendFormatted(sock, chatId, '⚠️ أنت لست لاعباً في هذه اللعبة.', m, [fromPlayer]);
                                    return;
                                }
                                clearTimeout(timeouts[chatId]);
                                const winner = fromPlayer === game.playerX ? game.playerO : game.playerX;
                                const loser = fromPlayer;
                                game.gameOver = true;
                                await endGame(sock, chatId, `🚪 انسحب @${fromPlayer.split('@')[0]}\n🏆 الفائز هو: ${winner === 'BOT' ? '🤖 البوت' : '@' + winner.split('@')[0]}`, false, winner, loser);
                                return;
                            }

                            const move = parseInt(msgText);
                            if (isNaN(move)) return;

                            const result = game.play(move, fromPlayer);
                            if (!result) return;

                            if (result.error) {
                                await sendFormatted(sock, chatId, result.error, m, [fromPlayer]);
                                return;
                            }

                            if (game.gameOver) {
                                await sendBoard(sock, chatId, game);
                                const winnerPlayer = (result.win === '❌') ? game.playerX : game.playerO;
                                const loserPlayer = (result.win === '❌') ? game.playerO : game.playerX;
                                const msgText = result.draw ? '⚠️ انتهت اللعبة بتعادل.' : `🏆 الفائز هو: ${winnerPlayer === 'BOT' ? '🤖 البوت' : '@' + winnerPlayer.split('@')[0]}`;
                                await endGame(sock, chatId, msgText, result.draw, winnerPlayer, loserPlayer);
                                return;
                            }

                            await sendBoard(sock, chatId, game);
                            startTimer();
                        } catch (err) {
                            console.error('خطأ في لعبة xo:', err);
                        }
                    };
                    sock.ev.on('messages.upsert', gameListener);
                }
            } catch (err) {
                console.error('خطأ في معالج الانضمام:', err);
            }
        };

        sock.ev.on('messages.upsert', joinListener);
    }
};