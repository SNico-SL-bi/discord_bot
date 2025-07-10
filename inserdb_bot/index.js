import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  console.log(`📨 Nhận tin nhắn từ ${message.author.tag}: ${message.content}`);

  if (message.author.bot) return;

  const hasAttachment = message.attachments.size > 0;
  const isMentioned = message.mentions.has(client.user);

  if (!hasAttachment && isMentioned) {
    message.reply('❌ Bạn cần đính kèm file .csv để xử lý.');
    return;
  }

  if (hasAttachment && isMentioned) {
    const attachment = message.attachments.first();

    if (!attachment.name.endsWith('.csv')) {
      message.reply('⚠️ File phải là định dạng `.csv`.');
      return;
    }

    console.log('📥 Nhận file CSV:', attachment.url);

    try {
      const response = await axios.post(process.env.WEBHOOK_URL, {
        file_url: attachment.url
      });

      console.log('✅ Đã gửi file tới webhook:', response.status);
      message.reply('✅ File đã được gửi đến hệ thống xử lý.');
    } catch (err) {
      console.error('❌ Lỗi khi gửi webhook:', err.message);
      message.reply('❌ Gửi file đến hệ thống thất bại.');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
