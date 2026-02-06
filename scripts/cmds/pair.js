const axios = require("axios");

module.exports = {
  name: "pair",
  aliases: ["autopair"],
  description: "Boy Girl auto pair with image",
  cooldown: 15,

  run: async ({ api, event }) => {
    const { threadID, messageID } = event;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const ids = threadInfo.participantIDs;

      if (ids.length < 2) {
        return api.sendMessage("❌ Pair করার মতো member নেই", threadID, messageID);
      }

      const users = await api.getUserInfo(ids);
      const boys = [];
      const girls = [];

      for (const id in users) {
        if (users[id].gender === 2) boys.push(id);   // 👦 male
        if (users[id].gender === 1) girls.push(id);  // 👧 female
      }

      if (boys.length === 0 || girls.length === 0) {
        return api.sendMessage(
          "❌ Boy / Girl detect করা যায়নি",
          threadID,
          messageID
        );
      }

      const boy = boys[Math.floor(Math.random() * boys.length)];
      const girl = girls[Math.floor(Math.random() * girls.length)];

      // ✅ তোমার দেওয়া image link
      const imageURL = "https://i.imgur.com/xipCvL0.jpeg";

      const img = (await axios.get(imageURL, {
        responseType: "stream"
      })).data;

      return api.sendMessage(
        {
          body:
            "💞 your love 💞\n\n" +
            `👦 @${boy}\n` +
            `👧 @${girl}\n\n` +
            "🔥 Perfect Match 🔥",
          attachment: img,
          mentions: [
            { tag: `@${boy}`, id: boy },
            { tag: `@${girl}`, id: girl }
          ]
        },
        threadID,
        messageID
      );
    } catch (err) {
      api.sendMessage("❌ Pair error", threadID, messageID);
    }
  }
};
