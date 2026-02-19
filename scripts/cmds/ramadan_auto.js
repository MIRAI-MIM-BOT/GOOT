const axios = require('axios');
const moment = require('moment-timezone');

const CITIES = [
  "Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna",
  "Barisal", "Rangpur", "Mymensingh", "Comilla", "Noakhali",
  "Cox's Bazar", "Bogra", "Gazipur", "Narayanganj"
];

const ISLAMIC_QUOTES = [
  "May your fasts be accepted and your duas answered.",
  "Ramadan – the month of mercy and forgiveness.",
  "Fasting purifies the soul and strengthens faith.",
  "Let patience and gratitude guide you this Ramadan."
];

const sentAlerts = {};

// Boldserif Style Font Generator
const boldSerif = (text) => {
  const letters = {
    'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
    'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣', 'k': '𝐤', 'l': '𝐥', 'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭', 'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳',
    '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
  };
  return text.split('').map(char => letters[char] || char).join('');
};

function to12Hour(time24) {
  if (!time24) return "N/A";
  let [hour, minute] = time24.split(":");
  hour = parseInt(hour);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isTimeClose(time1, time2) {
  const t1 = moment(time1, "HH:mm");
  const t2 = moment(time2, "HH:mm");
  return Math.abs(t1.diff(t2, "minutes")) <= 1;
}

async function broadcastToGroups(api, message) {
  try {
    const threads = await api.getThreadList(100, null, ["INBOX"]);
    let sent = 0;
    for (const thread of threads) {
      if (thread.isGroup) {
        await api.sendMessage(message, thread.threadID);
        sent++;
        if (sent % 8 === 0) await delay(3000);
      }
    }
    console.log(`[Broadcast] Sent to ${sent} groups`);
  } catch (err) {
    console.error("[Broadcast Error]", err.message);
  }
}

module.exports = {
  config: {
    name: "ramadan-auto",
    version: "5.5.0",
    author: "Zihad Ahmed",
    countDown: 5,
    role: 2,
    category: "system",
    description: "Automatic Sehri & Iftar alerts with Boldserif style"
  },

  onLoad: async function ({ api }) {
    console.log("[Ramadan-Auto] Monitoring started with Boldserif font...");

    setInterval(async () => {
      const now = moment.tz("Asia/Dhaka");
      const currentTime = now.format("HH:mm");
      const todayKey = now.format("DD-MM-YYYY");

      for (const city of CITIES) {
        try {
          const response = await axios.get(
            "http://api.aladhan.com/v1/timingsByCity",
            {
              params: { city, country: "Bangladesh", method: 1 },
              timeout: 8000
            }
          );

          const { timings } = response.data.data;
          const sehriEnd = timings.Fajr.trim();
          const iftarTime = timings.Maghrib.trim();
          const quote = ISLAMIC_QUOTES[Math.floor(Math.random() * ISLAMIC_QUOTES.length)];

          const sehriKey = `${todayKey}-${city}-SEHRI`;
          const iftarKey = `${todayKey}-${city}-IFTAR`;

          if (isTimeClose(currentTime, sehriEnd) && !sentAlerts[sehriKey]) {
            sentAlerts[sehriKey] = true;
            const msg = `🔔 ${boldSerif("SEHRI ALERT")} • ${boldSerif(city.toUpperCase())}\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `${boldSerif("Sehri time has ended.")}\n` +
                        `⏰ ${boldSerif(to12Hour(sehriEnd))}\n\n` +
                        `✨ ${boldSerif(quote)}\n` +
                        `📅 ${boldSerif(todayKey)}`;
            await broadcastToGroups(api, msg);
          }

          if (isTimeClose(currentTime, iftarTime) && !sentAlerts[iftarKey]) {
            sentAlerts[iftarKey] = true;
            const msg = `🌙 ${boldSerif("IFTAR ALERT")} • ${boldSerif(city.toUpperCase())}\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `${boldSerif("Alhamdulillah! It's Iftar time.")}\n` +
                        `⏰ ${boldSerif(to12Hour(iftarTime))}\n\n` +
                        `🤲 ${boldSerif("Dua:")}\n` +
                        `${boldSerif("Allahumma laka sumtu wa ala rizqika aftartu.")}\n\n` +
                        `✨ ${boldSerif(quote)}`;
            await broadcastToGroups(api, msg);
          }
        } catch (err) {
          // ignore
        }
      }
    }, 60000);
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage("🌙 " + boldSerif("Ramadan Auto-Alert system") + " is now active in Boldserif style for all major cities!", event.threadID, event.messageID);
  }
};
