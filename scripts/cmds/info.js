const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "info",
    author: "Farhan",
    role: 0,
    shortDescription: "Shows bot and owner info",
    longDescription: "Sends bot stats along with a random image",
    category: "admin",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, prefix, commands }) {
    try {
      prefix = prefix || "/";
      commands = commands || new Map();

      // --- Step 1: Send initial loading message ---
      const loadingMsgText = `
🌸━━━━━━━━━━━━━━🌸
   ⏳>ʟᴏᴀᴅɪɴɢ ʙᴏᴛ ꜱᴛᴀᴛꜱ...
          ᴘʟᴇᴀꜱᴇ ᴡᴀɪᴛ...
🌸━━━━━━━━━━━━━━🌸
`;
      const loadingMsg = await api.sendMessage(loadingMsgText, event.threadID, event.messageID);

      // --- Step 2: Gather stats asynchronously ---
      let totalUsers = 0, totalThreads = 0;
      try {
        const threads = await api.getThreadList(100, null, []);
        totalThreads = threads.length;
        totalUsers = threads.reduce((sum, t) => sum + (t.participantIDs?.length || 0), 0);
      } catch (err) {
        console.log("Could not fetch threads/users:", err.message);
      }

      // --- Uptime calculation ---
      const uptimeSec = process.uptime();
      const hoursUp = Math.floor(uptimeSec / 3600);
      const minutesUp = Math.floor((uptimeSec % 3600) / 60);
      const secondsUp = Math.floor(uptimeSec % 60);

      // --- Bangladesh time ---
      const nowUTC = new Date();
      const nowBangladesh = new Date(nowUTC.getTime() + 6 * 60 * 60 * 1000);
      let hours = nowBangladesh.getHours();
      const minutes = nowBangladesh.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const minutesStr = minutes.toString().padStart(2, '0');
      const time = `${hours}:${minutesStr} ${ampm}`;

      // --- Random image selection ---
      const imgLinks = [
        "https://files.catbox.moe/7fy6p9.jpg",
        "https://files.catbox.moe/p1tlz2.jpg",
        "https://files.catbox.moe/as641j.jpg"
      ];
      const randomImage = imgLinks[Math.floor(Math.random() * imgLinks.length)];
      const tmpPath = path.join(__dirname, `temp_image_${Date.now()}.jpg`);

      // --- Step 3: Download image using streaming ---
      try {
        const writer = fs.createWriteStream(tmpPath);
        const response = await axios({
          url: randomImage,
          method: 'GET',
          responseType: 'stream'
        });
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
      } catch (err) {
        console.log("Failed to download image:", err.message);
      }

      // --- Step 4: Prepare full message ---
      const fullMessage = `‎⋆✦⋆⎯⎯⎯⎯⎯⎯⎯⎯⎯⋆✦⋆
‎    ╭•┄┅══❁🌺❁══┅┄•╮
‎•—»✨𝗢𝗪𝗡𝗘𝗥 𝗜𝗡𝗙𝗢✨«—•
‎    ╰•┄┅══❁🌺❁══┅┄•╯
‎⋆✦⋆⎯⎯⎯⎯⎯⎯⎯⎯⎯⋆✦⋆
‎╔══════════════════╗
‎║[𝗢𝗪𝗡𝗘𝗥:-[𝗙𝗔𝗥𝗛𝗔𝗡-𝗞𝗛𝗔𝗡] ║
‎║
‎║🤖>𝗕𝗢𝗧-𝗡𝗔𝗠𝗘:-[>𝗦𝗜𝗭𝗨𝗞𝗔<]
╠══════════════════╣
‎║♻️>𝗥𝗲𝗹𝗶𝗴𝗶𝗼𝗻:- [>𝗜𝘀𝗹𝗮𝗺<]
‎║ 
‎║📝>𝗔𝗴𝗲:-  [>𝟮𝟬<]
‎║
‎║🚻>𝗚𝗲𝗻𝗱𝗲𝗿:-  [>𝗠𝗮𝗹𝗲<]
‎‎╠══════════════════╣
‎║🌐>𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸:-↓facebook.com/
‎║                     DEVIL.FARHAN.420                              
‎║
‎║💬>𝗠𝗲𝘀𝘀𝗲𝗻𝗴𝗲𝗿:-↓
‎║ [>m.me/DARK.XAIKO.420<]
‎║
‎║📞>𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽:-↓
‎║ [>wa.me/+8801934640061<]        
‎║
‎╠══════════════════╣
‎║🤖>𝗕𝗢𝗧-𝗡𝗔𝗠𝗘:-𝗦𝗜𝗭𝗨𝗞𝗔-𝗕𝗢𝗧
‎║
‎║⚡>𝗣𝗿𝗲𝗳𝗶𝘅:- ${prefix}
‎║
‎║📦>𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀:- ${commands.size}
‎║
‎║🚀>𝗣𝗶𝗻𝗴:- N/A
‎╠══════════════════╣
‎║
‎║⏳>𝗨𝗽𝘁𝗶𝗺𝗲:- ${hoursUp}h ${minutesUp}m ${secondsUp}s
‎║
‎║🕒>𝗕𝗱→𝗧𝗶𝗺𝗲:- ${time}
‎║
‎╠══════════════════╣
‎║🏠>𝐀𝐃𝐃𝐑𝐄𝐒𝐒:-[𝐂𝐇𝐔𝐀𝐃𝐀𝐍𝐆𝐀]
‎║             [𝐁𝐀𝐍𝐆𝐋𝐀𝐃𝐄𝐒𝐇]
‎║
‎║👩‍❤️‍👨↓
║ >𝐑𝐄𝐋𝐀𝐓𝐈𝐎𝐍𝐒𝐇𝐈𝐏:-[>𝐒𝐈𝐍𝐆𝐋𝐄<]
‎║
‎║🧑‍🔧>𝐖𝐎𝐑𝐊:- [>𝐉𝐎𝐁<]
‎╠══════════════════╣
‎║
‎⊱༅༎😽💚༅༎⊱ ]
‎-আমি ভদ্র, বেয়াদব দুটোই🥱✌️
‎
‎-তুমি যেটা ডি'জার্ভ করো, আমি সেটাই দেখাবো! 
⊱༅༎😽💚༅༎⊱ ]
‎║
‎╠══════════════════╣
  ‎♡𝗧𝗛𝗔𝗡𝗞𝗦 𝗙𝗢𝗥 𝗨𝗦𝗜𝗡𝗚 𝗠𝗬♡
             ♡𝗦𝗜𝗭𝗨𝗞𝗔>𝗕𝗢𝗧♡
‎╚══════════════════╝`;

      // --- Step 5: Send full message with image ---
      if (fs.existsSync(tmpPath)) {
        await api.sendMessage(
          { body: fullMessage, attachment: fs.createReadStream(tmpPath) },
          event.threadID
        );
        await fs.promises.unlink(tmpPath);
      } else {
        await api.sendMessage(fullMessage, event.threadID);
      }

      // --- Step 6: Delete loading message ---
      if (loadingMsg?.messageID) {
        await api.deleteMessage(loadingMsg.threadID, loadingMsg.messageID);
      }

    } catch (err) {
      console.error(err);
      await api.sendMessage('An error occurred while sending info.', event.threadID);
    }
  }
};
