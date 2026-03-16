const axios = require("axios");
const moment = require("moment-timezone");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "azan",
    version: "23.5.0",
    author: "milon",
    countDown: 5,
    role: 0,
    description: "Multi-group Fixed Auto Azan & Mentions",
    category: "Islamic",
    guide: "{pn} [district]"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

    try {
      let district = args[0] || "Dhaka";
      const now = moment().tz("Asia/Dhaka");
      
      const res = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=${district}&country=Bangladesh&method=13`);
      if (!res.data || !res.data.data) throw new Error("API response error");
      
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
        // টাইম ফরম্যাট ফিক্স করা হয়েছে (HH:mm)
        let pTime = moment.tz(`${now.format("YYYY-MM-DD")} ${prayerOrder[i].time}`, "YYYY-MM-DD HH:mm", "Asia/Dhaka");
        
        if (pTime.isAfter(now)) {
          nextP = prayerOrder[i];
          targetT = pTime;
          break;
        }
      }

      // যদি দিনের সব নামাজ শেষ হয়ে যায়, তবে পরের দিনের ফজর দেখাবে
      if (!nextP) {
        nextP = { name: "Fajr", time: p.Fajr };
        targetT = moment.tz(`${now.clone().add(1, 'days').format("YYYY-MM-DD")} ${p.Fajr}`, "YYYY-MM-DD HH:mm", "Asia/Dhaka");
      }

      const diffMs = targetT.diff(now);
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);

      const canvas = createCanvas(900, 500);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, 900, 500);
      ctx.strokeStyle = "#f1c40f";
      ctx.lineWidth = 10;
      ctx.strokeRect(20, 20, 860, 460);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 45px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`🕋 Next Azan: ${nextP.name}`, 450, 120);

      ctx.font = "bold 110px Arial";
      ctx.fillStyle = "#f1c40f";
      ctx.fillText(`${hours}h ${minutes}m ${seconds}s`, 450, 280);

      ctx.font = "30px Arial";
      ctx.fillStyle = "#bdc3c7";
      ctx.fillText(`📍 ${district} | ⏰ Time: ${targetT.format("h:mm A")}`, 450, 400);

      const imgPath = path.join(cacheDir, `azan_${threadID}_${Date.now()}.png`);
      fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

      return api.sendMessage({
        body: `🕌 ${district} নামাজের সময়সূচী\n(১০ সেকেন্ড পর ডিলিট হবে)`,
        attachment: fs.createReadStream(imgPath)
      }, threadID, (err, info) => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        if (info) setTimeout(() => api.unsendMessage(info.messageID), 10000);
      }, messageID);

    } catch (e) {
      return api.sendMessage(`❌ Error: ${e.message}`, threadID);
    }
  },

  onLoad: async function ({ api }) {
    const azanVidUrl = "https://files.catbox.moe/cvv4ni.mp4";
    if (global.azanInterval) clearInterval(global.azanInterval);

    global.azanInterval = setInterval(async () => {
      const now = moment().tz("Asia/Dhaka");
      const currentTime = now.format("HH:mm");
      const nextMin = now.clone().add(1, 'minutes').format("HH:mm");

      try {
        const res = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=Dhaka&country=Bangladesh&method=13`);
        const p = res.data.data.timings;
        
        // এপিআই টাইম ফরম্যাট ক্লিন করা (কখনো কখনো টাইমের সাথে (BST) লেখা থাকে)
        const cleanTime = (t) => t.split(" ")[0];

        const prayerList = {
          "Fajr": cleanTime(p.Fajr),
          "Dhuhr": cleanTime(p.Dhuhr),
          "Asr": cleanTime(p.Asr),
          "Maghrib": cleanTime(p.Maghrib),
          "Isha": cleanTime(p.Isha)
        };

        const sehriAlertTime = moment(cleanTime(p.Fajr), "HH:mm").subtract(10, 'minutes').format("HH:mm");
        const allThreads = await api.getThreadList(200, null, ["INBOX"]);
        const groupThreads = allThreads.filter(t => t.isGroup);

        for (const [name, time] of Object.entries(prayerList)) {
          // ১. ১ মিনিট আগে মেনশন
          if (time === nextMin) {
            for (const thread of groupThreads) {
              api.sendMessage({
                body: `⚠️ @everyone Attention! ${name} Azan in 1 minute.`,
                mentions: [{ tag: "@everyone", id: thread.threadID }]
              }, thread.threadID);
            }
          }

          // ২. আজান ভিডিও
          if (time === currentTime) {
            const vidPath = path.join(__dirname, "cache", `azan_global.mp4`);
            const response = await axios.get(azanVidUrl, { responseType: "arraybuffer" });
            fs.writeFileSync(vidPath, Buffer.from(response.data));

            for (const thread of groupThreads) {
              api.sendMessage({
                body: `🕌 It's time for ${name} prayer. ✨`,
                attachment: fs.createReadStream(vidPath)
              }, thread.threadID);
            }
            setTimeout(() => { if (fs.existsSync(vidPath)) fs.unlinkSync(vidPath); }, 60000);
          }
        }

        // ৩. ইফতার মেনশন
        if (cleanTime(p.Maghrib) === currentTime) {
          groupThreads.forEach(thread => {
            api.sendMessage({
              body: `🌙 Alhamdulillah, it's Iftar time! @everyone ✨`,
              mentions: [{ tag: "@everyone", id: thread.threadID }]
            }, thread.threadID);
          });
        }

        // ৪. সেহরি সতর্কবার্তা
        if (sehriAlertTime === currentTime) {
          groupThreads.forEach(thread => {
            api.sendMessage({
              body: `🌙 @everyone Warning! Only 10 mins left for Sehri to end. ✨`,
              mentions: [{ tag: "@everyone", id: thread.threadID }]
            }, thread.threadID);
          });
        }

      } catch (err) {
        console.error("Azan Interval Error:", err);
      }
    }, 60000); // প্রতি ১ মিনিটে চেক করবে
  }
};
