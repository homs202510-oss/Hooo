const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

const pointsPath = path.join(__dirname, 'db-points.json');
const audioPrice = 100;
const YTDLP = '/data/data/com.termux/files/usr/bin/yt-dlp';

// أضف node كـ JS runtime
const JS_RUNTIME = 'node';

function loadPoints() {
  if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, '{}');
  return JSON.parse(fs.readFileSync(pointsPath));
}

function savePoints(data) {
  fs.writeFileSync(pointsPath, JSON.stringify(data, null, 2));
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return 'غير معروف';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return `${m}:${String(s).padStart(2, '0')}`;
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    https.get(url, (res) => {
      if (
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        return downloadImage(res.headers.location, dest)
          .then(resolve)
          .catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error('فشل تحميل الصورة'));
      }

      res.pipe(file);

      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', reject);
  });
}

// تشغيل yt-dlp مع JS runtime
function runYTDLP(args = []) {
  return new Promise((resolve, reject) => {
    const fullArgs = [
      '--js-runtimes',
      JS_RUNTIME,
      ...args
    ];

    const process = spawn(YTDLP, fullArgs);

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('error', (err) => {
      reject(err);
    });

    process.on('close', (code) => {
      // تجاهل التحذيرات لو البيانات موجودة
      if (code === 0 || stdout.trim()) {
        resolve(stdout.trim());
      } else {
        reject(stderr || stdout);
      }
    });
  });
}

// دالة للتحقق إذا كان الرابط يوتيوب
function isYouTubeLink(text) {
  return /https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\/\S+/i.test(text);
}

module.exports = {
  command: 'شغلي',
  category: 'وسائط',
  price: audioPrice,
  description: 'تحميل صوت من يوتيوب (يدعم البحث والرابط)',
  usage: '.شغلي [اسم الفيديو أو الرابط]',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    try {
      const body =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';

      const query = body.trim().split(/\s+/).slice(1).join(' ');

      if (!query) {
        return await sock.sendMessage(
          chatId,
          { 
            text: `╭───≪ 🎵 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑴𝑼𝑺𝑰𝑪 🎵 ≫───╮\n` +
              `│ ⌬ أهـلاً 🫠 نسيت تكتب اسم الأغنية!\n` +
              `│ ⌬ استخدم: .شغلي [اسم أو رابط]\n` +
              `│ ⌬ مثال: .شغلي سكن الليل فيروز\n` +
              `│ ⌬ أو: .شغلي https://youtu.be/xxxxx\n` +
              `╰───≪ 🌿🍉🍡 ≫───╯\n\n` +
              `> *𝑩𝒀┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻*`
          },
          { quoted: msg }
        );
      }

      let pointsData = loadPoints();
      let userPoints = pointsData[sender] || 0;

      if (userPoints < audioPrice) {
        return await sock.sendMessage(
          chatId,
          {
            text: `❌ نقاطك غير كافية.\n💰 السعر: ${audioPrice}\n🪙 رصيدك: ${userPoints}`
          },
          { quoted: msg }
        );
      }

      await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });

      const tempDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'ytaudio-')
      );

      const thumbPath = path.join(tempDir, 'thumb.jpg');
      const audioTemplate = path.join(
        tempDir,
        'audio.%(ext)s'
      );

      let videoUrl;
      let title;
      let durationRaw;
      let thumbnail;

      // التحقق إذا كان الرابط
      const isLink = isYouTubeLink(query);

      if (isLink) {
        // معالجة الرابط مباشرة
        const result = await runYTDLP([
          '--print',
          '%(title)s|||%(webpage_url)s|||%(duration)s|||%(thumbnail)s',
          '--skip-download',
          '--no-playlist',
          query
        ]);

        if (!result) {
          fs.rmSync(tempDir, { recursive: true, force: true });
          return await sock.sendMessage(
            chatId,
            { text: '❌ لم يتم العثور على الفيديو.' },
            { quoted: msg }
          );
        }

        const [titleResult, urlResult, durationResult, thumbResult] = result.split('|||');
        title = titleResult;
        videoUrl = urlResult;
        durationRaw = durationResult;
        thumbnail = thumbResult;
      } else {
        // بحث عادي
        const result = await runYTDLP([
          `ytsearch1:${query}`,
          '--default-search',
          'ytsearch',
          '--print',
          '%(title)s|||%(webpage_url)s|||%(duration)s|||%(thumbnail)s',
          '--skip-download',
          '--no-playlist'
        ]);

        if (!result) {
          fs.rmSync(tempDir, { recursive: true, force: true });
          return await sock.sendMessage(
            chatId,
            { text: '❌ لم يتم العثور على نتائج.' },
            { quoted: msg }
          );
        }

        const [titleResult, urlResult, durationResult, thumbResult] = result.split('|||');
        title = titleResult;
        videoUrl = urlResult;
        durationRaw = durationResult;
        thumbnail = thumbResult;
      }

      const duration = formatDuration(parseInt(durationRaw));

      // تحميل الصورة
      if (thumbnail) {
        try {
          await downloadImage(thumbnail, thumbPath);
        } catch {}
      }

      // تحميل الصوت
      await runYTDLP([
        '-x',
        '--audio-format',
        'mp3',
        '--audio-quality',
        '0',
        '--extract-audio',
        '--no-playlist',
        videoUrl,
        '-o',
        audioTemplate
      ]);

      const audioFile = fs
        .readdirSync(tempDir)
        .find((f) => f.endsWith('.mp3'));

      if (!audioFile) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        return await sock.sendMessage(
          chatId,
          {
            text: '❌ فشل تحميل الصوت.\n📌 ثبت nodejs داخل termux:\npkg install nodejs'
          },
          { quoted: msg }
        );
      }

      // خصم النقاط
      pointsData[sender] = userPoints - audioPrice;
      savePoints(pointsData);

      const newBalance = pointsData[sender];

      const caption = `『⏯️┇𝐏𝐇𝐀𝐍𝐓𝐎𝐌 𝐁𝐎𝐓 𝐘𝐎𝐔𝐓𝐔𝐁𝐄┇⏯️』

*❐═━━━━═╊⊰🪐⊱╉═━━━━═❐*
*❐↞┇الـعـنـوان📇↞ ${title} ┇*
*❐↞┇الـرابـط🖇️↞ ${videoUrl} ┇*
*❐↞┇الـمـدة⏱️↞ ${duration} ┇*
*❐↞┇الـنـقـاط💰↞ -${audioPrice} ┇*
*❐↞┇رصيدك🪙↞ ${newBalance} ┇*
*❐═━━━━═╊⊰🪐⊱╉═━━━━═❐*
> *𝑩𝒀┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻*`;

      await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });

      // إرسال الصورة مع الكابتشن
      if (fs.existsSync(thumbPath)) {
        await sock.sendMessage(
          chatId,
          {
            image: fs.readFileSync(thumbPath),
            caption
          },
          { quoted: msg }
        );
      } else {
        await sock.sendMessage(
          chatId,
          { text: caption },
          { quoted: msg }
        );
      }

      // إرسال الصوت
      await sock.sendMessage(
        chatId,
        {
          audio: fs.readFileSync(path.join(tempDir, audioFile)),
          mimetype: 'audio/mpeg',
          fileName: `${title}.mp3`,
          ptt: false
        },
        { quoted: msg }
      );

      fs.rmSync(tempDir, { recursive: true, force: true });

    } catch (err) {
      console.error('YT ERROR:', err);

      // استرجاع النقاط في حالة الفشل
      try {
        const pointsData = loadPoints();
        pointsData[sender] = (pointsData[sender] || 0) + audioPrice;
        savePoints(pointsData);
      } catch (saveError) {
        console.error('Points restoration error:', saveError);
      }

      await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });

      let errorMsg = '❌ حدث خطأ أثناء التحميل';
      if (err.message?.includes('ytsearch')) errorMsg = '🔍 لا توجد نتائج للبحث';
      else if (err.message?.includes('timeout')) errorMsg = '⏰ انتهت المهلة، حاول مرة أخرى';

      return await sock.sendMessage(
        chatId,
        {
          text: `${errorMsg}\nتم استرجاع نقاطك.`
        },
        { quoted: msg }
      );
    }
  }
};