const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "adminmention",
    version: "7.0.0",
    author: "Farhan-Khan", // ⚠️ এটা change করলে bot বন্ধ হয়ে যাবে
    countDown: 0,
    role: 0,
    shortDescription: "Admin mention reply styled",
    category: "system"
  },

  onStart: async function () {},

  onChat: async function ({ event, message }) {

    // 🔒 AUTHOR LOCK
    if (this.config.author !== "Farhan-Khan") {
      console.log("⚠️ Author changed! Module stopped.");
      return;
    }

    // 👑 ADMINS
    const admins = [
      {
        uid: "61573366160918",
        names: ["মিৃঁ'স্টাৃঁ'রৃঁ ফাৃঁ'রৃঁ'হা্ঁ'নৃঁ"]
      },
      {
        uid: "61583610247347",
        names: ["ヽ｟ᏟᎬϴ｠▁▁ዐዐዐ 🙁😚☺️👿"]
      }
    ];

    const senderID = String(event.senderID);

    // ❌ Admin নিজে লিখলে reply দিবে না
    if (admins.some(a => a.uid === senderID)) return;

    const text = (event.body || "").toLowerCase().trim();
    const mentionedIDs = event.mentions ? Object.keys(event.mentions) : [];

    // 🔍 MENTION DETECT
    const isMentioning = admins.some(admin =>
      mentionedIDs.includes(admin.uid) ||
      text.includes(admin.uid) ||
      admin.names.some(name => text.includes(name.toLowerCase()))
    );

    if (!isMentioning) return;

    // 🎬 VIDEO LIST
    const videos = [
      "https://files.catbox.moe/y9irm8.mp4",
      "https://files.catbox.moe/gitfya.mp4",
      "https://files.catbox.moe/9aavty.mp4",
      "https://files.catbox.moe/p78siw.mp4",
      "https://files.catbox.moe/9uvit1.mp4",
      "https://files.catbox.moe/34etgc.mp4",
      "https://files.catbox.moe/stk4lq.mp4",
      "https://files.catbox.moe/ladp3x.mp4",
      "https://files.catbox.moe/l8vx40.mp4",
      "https://files.catbox.moe/hgo8gp.mp4",
      "https://files.catbox.moe/ejx7a6.mp4",
      "https://files.catbox.moe/gogfic.mp4",
      "https://files.catbox.moe/ilmb5j.mp4",
      "https://files.catbox.moe/bq7ngm.mp4",
      "https://files.catbox.moe/27mwt2.mp4",
      "https://files.catbox.moe/eyqcud.mp4",
      "https://files.catbox.moe/vlgjrp.mp4",
      "https://files.catbox.moe/bjjtmk.mp4",
      "https://files.catbox.moe/22enjn.mp4",
      "https://files.catbox.moe/j7fh66.mp4",
      "https://files.catbox.moe/btrwyg.mp4",
      "https://files.catbox.moe/qb2mq3.mp4",
      "https://files.catbox.moe/l15d8y.mp4",
      "https://files.catbox.moe/rnsdlb.mp4"
    ];

    // 💬 RAW CAPTIONS
    const captions = [
      "Mantion_দিস না _ফারহান বস এর মন মন ভালো নেই আস্কে-!💔🥀",
      "- আমার বস ফারহান এর সাথে কেউ সেক্স করে না থুক্কু টেক্স করে নাহ🫂💔",
      "👉আমার বস ♻️ 𝐑𝐉 𝐅𝐀𝐑𝐇𝐀𝐍 এখন বিজি আছে । তার ইনবক্সে এ মেসেজ দিয়ে রাখো https://www.facebook.com/MR.FARHAN.420 🔰 ♪√বস ফ্রি হলে আসবে🧡😁😜🐒",
      "বস ফারহান কে এত মেনশন না দিয়ে বক্স আসো হট করে দিবো🤷‍ঝাং 😘🥒",
      "বস ফারহান কে Mantion_দিলে চুম্মাইয়া ঠুটের কালার change কইরা,লামু 💋😾😾🔨",
      "ফারহান বস এখন বিজি জা বলার আমাকে বলতে পারেন_!!😼🥰",
      "ফারহান বস কে এতো মেনশন নাহ দিয়া বস কে একটা জি এফ দে 😒 😏",
      "Mantion_না দিয়ে বস ফারহান এর সাথে সিরিয়াস প্রেম করতে চাইলে ইনবক্স",
      "বস ফারহান কে মেনশন দিসনা পারলে একটা জি এফ দে",
      "বাল পাকনা Mantion_দিস না বস ফারহান প্রচুর বিজি আছে 🥵🥀🤐",
      "চুমু খাওয়ার বয়স টা আমার বস ফারহান চকলেট🍫খেয়ে উড়িয়ে দিল 🤗"
    ];

    // 🔹 Style Wrapper Function
    const formatCaption = (text) => {
      return `
━━━━━━━━━━━━━━━━━━━━
- ${text}
━━━━━━━━━━━━━━━━━━━━
   [>ʙᴏᴛ ᴏᴡɴᴇʀ:-ꜰᴀʀʜᴀɴ-ᴋʜᴀɴ<]
━━━━━━━━━━━━━━━━━━━━
      `;
    };

    const rawCaption = captions[Math.floor(Math.random() * captions.length)];
    const styledCaption = formatCaption(rawCaption);

    const videoUrl = videos[Math.floor(Math.random() * videos.length)];
    const filePath = path.join(__dirname, "cache", `admin_${Date.now()}.mp4`);

    try {
      // ⬇️ Download video
      const res = await axios.get(videoUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(res.data, "utf-8"));

      // 📤 Reply to original message (SMS + Video)
      await message.reply({
        body: styledCaption,
        attachment: fs.createReadStream(filePath)
      });

      // 🧹 Delete cached file
      fs.unlinkSync(filePath);

    } catch (err) {
      console.log("Error sending admin reply:", err);
    }
  }
};
