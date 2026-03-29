const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "bot_voice",
    version: "2.0.1",
    author: "Farhan-Khan",
    countDown: 1,
    role: 0,
    shortDescription: "Ultra Smart Voice Reply",
    category: "system"
  },

  onStart: async function () {},

  onChat: async function ({ event, message }) {
    if (!event.body) return;

    const input = event.body.toLowerCase().trim();

    // Bot trigger words
    const botVoices = [
      "https://files.catbox.moe/b5l6nz.mp3",
      "https://files.catbox.moe/gzq54t.mp3",
      "https://files.catbox.moe/uwg21p.mp3",
      "https://files.catbox.moe/x8ina4.mp3",
      "https://files.catbox.moe/3u6shs.mp3"
    ];

    const voiceMap = {
      "bot": botVoices,
      "বট": botVoices,
      "baby": botVoices,
      "bby": botVoices,
      "বেবি": botVoices
    };

    // প্রথম শব্দ পরীক্ষা করা
    const firstWord = input.split(" ")[0]; // শুধু প্রথম শব্দ
    if (!voiceMap[firstWord]) return; // যদি প্রথম শব্দ bot/baby না হয়, রিপ্লাই না দেয়

    // Cache folder
    const cacheDir = path.join(__dirname, "cache", "voices");
    fs.ensureDirSync(cacheDir);

    try {
      let audioUrl = voiceMap[firstWord];
      if (Array.isArray(audioUrl)) {
        audioUrl = audioUrl[Math.floor(Math.random() * audioUrl.length)];
      }

      const fileName = `${Buffer.from(audioUrl).toString('hex')}.mp3`;
      const filePath = path.join(cacheDir, fileName);

      let stream;
      if (fs.existsSync(filePath)) {
        stream = fs.createReadStream(filePath);
      } else {
        const res = await axios.get(audioUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(filePath, Buffer.from(res.data));
        stream = fs.createReadStream(filePath);
      }

      await message.reply({ attachment: stream });

    } catch (err) {
      console.error("Voice error:", err);
    }
  }
};
