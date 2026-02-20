const axios = require("axios");
const moment = require("moment-timezone");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "azan",
    version: "19.0.0",
    author: "milon",
    countDown: 5,
    role: 0, 
    description: "Fixed Precision Azan for Bangladesh",
    category: "Islamic",
    guide: "{pn} [district]"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    try {
      let district = args[0] || "Dhaka";
      const now = moment().tz("Asia/Dhaka");
      
      // Islamic Foundation Bangladesh (Method 13)
      const res = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=${district}&country=Bangladesh&method=13`);
      const p = res.data.data.timings;

      const prayerOrder = [
        { name: "Fajr", time: p.Fajr },
        { name: "Dhuhr", time: p.Dhuhr },
        { name: "Asr", time: p.Asr },
        { name: "Maghrib", time: p.Maghrib },
        { name: "Isha", time: p.Isha }
      ];

      let nextP = null;
      let targetT = null;

      for (let i = 0; i < prayerOrder.length; i++) {
        let pT = moment.tz(now.format("YYYY-MM-DD") + " " + prayerOrder[i].time, "YYYY-MM-DD HH:mm", "Asia/Dhaka");
        if (pT.isAfter(now)) {
          nextP = prayerOrder[i];
          targetT = pT;
          break;
        }
      }

      if (!nextP) {
        nextP = { name: "Fajr", time: p.Fajr };
        targetT = moment.tz(now.format("YYYY-MM-DD") + " " + p.Fajr, "YYYY-MM-DD HH:mm", "Asia/Dhaka").add(1, 'days');
      }

      const diffMs = targetT.diff(now);
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);

      const canvas = createCanvas(900, 500);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, 900, 500);
      ctx.strokeStyle = "#f1c40f"; ctx.lineWidth = 10; ctx.strokeRect(20, 20, 860, 460);
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 45px Arial"; ctx.textAlign = "center";
      ctx.fillText(`🕋 Next Azan: ${nextP.name}`, 450, 120);
      ctx.font = "bold 110px Arial"; ctx.fillStyle = "#f1c40f"; 
      ctx.fillText(`${hours}h ${minutes}m ${seconds}s`, 450, 280);
      ctx.font = "30px Arial"; ctx.fillStyle = "#bdc3c7";
      ctx.fillText(`📍 ${district} | ⏰ Time: ${targetT.format("h:mm A")}`, 450, 400);

      const imgPath = path.join(__dirname, "cache", `azan_search_${threadID}.png`);
      fs.ensureDirSync(path.join(__dirname, "cache"));
      fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

      api.sendMessage({ 
        body: `🕌 ${district} Prayer Schedule\n━━━━━━━━━━━━━━━━━━\nAuto-delete in 10s`, 
        attachment: fs.createReadStream(imgPath) 
      }, threadID, (err, info) => {
        if(fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        setTimeout(() => { api.unsendMessage(info.messageID); }, 10000); 
      }, messageID);
    } catch (e) { api.sendMessage("❌ Error loading prayer times!", threadID); }
  },

  onLoad: async function ({ api }) {
    if (!global.azanInterval) {
      global.azanInterval = setInterval(async () => {
        const now = moment().tz("Asia/Dhaka");
        const currentTime = now.format("HH:mm");
        const alertTime = now.clone().add(1, 'minutes').format("HH:mm");

        try {
          const res = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=Dhaka&country=Bangladesh&method=13`);
          const p = res.data.data.timings;
          
          // সময়ের নিখুঁত তালিকা
          const prayerTimes = {
            "Fajr": p.Fajr,
            "Dhuhr": p.Dhuhr,
            "Asr": p.Asr,
            "Maghrib": p.Maghrib,
            "Isha": p.Isha
          };

          const allThreads = await api.getThreadList(100, null, ["INBOX"]);

          for (const thread of allThreads) {
            if (!thread.isGroup) continue;
            const threadID = thread.threadID;

            for (const [name, time] of Object.entries(prayerTimes)) {
              // ১ মিনিট আগে অ্যালার্ট
              if (time === alertTime) {
                api.sendMessage({ 
                  body: `⚠️ @everyone Get Ready! ${name} Azan in 1 minute.`, 
                  mentions: [{ tag: "@everyone", id: threadID }] 
                }, threadID);
              }

              // সঠিক সময়ে আজান ভিডিও
              if (time === currentTime) {
                const vidUrl = "https://files.catbox.moe/cvv4ni.mp4";
                const vidPath = path.join(__dirname, "cache", `azan_v_${threadID}.mp4`);
                const { data } = await axios.get(vidUrl, { responseType: "arraybuffer" });
                fs.writeFileSync(vidPath, Buffer.from(data));

                api.sendMessage({ 
                  body: `🕌 It's time for ${name} prayer.\n━━━━━━━━━━━━━━━━━━\nPray for everyone. ✨`, 
                  attachment: fs.createReadStream(vidPath) 
                }, threadID, () => { if(fs.existsSync(vidPath)) fs.unlinkSync(vidPath); });
              }
            }
          }
        } catch (err) { console.error(err); }
      }, 60000); // প্রতি মিনিটে চেক করবে
    }
  }
};
