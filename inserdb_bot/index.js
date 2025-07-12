import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Bot đã chạy: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.mentions.has(client.user)) return;

  const attachment = message.attachments.first();
  if (!attachment) return message.reply('❌ Vui lòng đính kèm file CSV.');

  const filename = attachment.name.toLowerCase();

  let type = null;
  if (filename.includes('brand')) type = 'brand';
  else if (filename.includes('keyword')) type = 'keyword';
  else if (filename.includes('domain')) type = 'domain';

  if (!type) {
    return message.reply('❌ Không xác định được loại file. Tên file phải chứa "brand", "keyword" hoặc "domain".');
  }

  console.log(`[Webhook URL đang dùng]: ${process.env.N8N_WEBHOOK_URL}`);

  try {
    await axios.post(process.env.N8N_WEBHOOK_URL, {
      file_url: attachment.url,
      type,
      uploaded_by: message.author.username,
      user_id: message.author.id
    });

    await message.reply(`📤 Đã gửi file đến hệ thống xử lý.\n• Loại: **${type}**`);
  } catch (error) {
    console.error('❌ Lỗi gửi webhook:', error.message);
    await message.reply('❌ Gửi file đến hệ thống thất bại.');
  }
});

client.login(process.env.DISCORD_TOKEN);
