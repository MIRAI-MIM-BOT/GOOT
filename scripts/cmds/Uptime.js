const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "up",
    version: "26.0.0",
    author: "Milon",
    countDown: 5,
    role: 0,
    category: "system",
    description: "Uptime: No Prefix for Admin | English Version",
    usePrefix: true
  },

  onStart: async function ({ api, event }) {
    // Normal users with prefix will trigger this
    return this.handleUptime({ api, event });
  },

  onChat: async function ({ api, event }) {
    const { body, senderID } = event;
    if (!body) return;

    // Admin UID for No Prefix
    const adminUID = "61588452928616","61583610247347";
    const msg = body.toLowerCase();

    // Trigger without prefix if sender is Admin
    if (senderID == adminUID && (msg == "up" || msg == "uptime")) {
      return this.handleUptime({ api, event });
    }
  },

  handleUptime: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

    const imgPath = path.join(cacheDir, `up_milon_${Date.now()}.png`);

    try {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      const ping = Date.now() - event.timestamp;

      // Random Background Images
      const imageUrls = [
        "https://i.imgur.com/0rVoz4z.jpeg",
        "https://i.imgur.com/yOksx4I.jpeg"
      ];
      const backgroundUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];

      const bgImg = await loadImage(backgroundUrl);
      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      // --- Box Design ---
      const boxWidth = canvas.width - 80;
      const boxHeight = canvas.height - 120;
      const boxX = (canvas.width / 2) - (boxWidth / 2); 
      const boxY = (canvas.height / 2) - (boxHeight / 2); 

      ctx.fillStyle = "rgba(0, 0, 0, 0.85)"; 
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

      // Rainbow Border
      ctx.lineWidth = 12;
      const gradient = ctx.createLinearGradient(boxX, boxY, boxX + boxWidth, boxY + boxHeight);
      gradient.addColorStop(0, "violet");
      gradient.addColorStop(0.5, "cyan");
      gradient.addColorStop(1, "magenta");
      ctx.strokeStyle = gradient;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

      // --- English Text Design ---
      ctx.textAlign = "center";
      
      // Title
      ctx.font = "bold 50px Arial";
      ctx.fillStyle = "#00FFCC"; 
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00FFCC";
      ctx.fillText("SYSTEM UPTIME STATUS", canvas.width / 2, boxY + 80);
      ctx.shadowBlur = 0;

      // Uptime Text
      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(`RUNNING: ${hours}h ${minutes}m ${seconds}s`, canvas.width / 2, boxY + 160);

      // RAM & PING
      ctx.font = "30px Arial";
      ctx.fillStyle = "#FFCC00"; 
      ctx.fillText(`RAM USAGE: ${ram} MB`, canvas.width / 2, boxY + 230);
      
      ctx.fillStyle = "#FF3366"; 
      ctx.fillText(`LATENCY: ${ping}ms`, canvas.width / 2, boxY + 290);

      // Footer
      ctx.font = "italic 20px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillText("Developed by Farhan Khan", canvas.width / 2, boxY + boxHeight - 30);

      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(imgPath, buffer);

      return api.sendMessage({
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, messageID);

    } catch (error) {
      console.log(error);
      return api.sendMessage("Error: Failed to generate uptime image.", threadID, messageID);
    }
  }
};
