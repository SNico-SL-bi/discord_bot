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
  if (message.author.bot || !message.mentions.has(client.user)) return;

  const attachment = message.attachments.first();
  if (!attachment || !attachment.name.endsWith('.csv')) {
    message.reply('❌ Vui lòng đính kèm 1 file CSV.');
    return;
  }

  try {
    await axios.post(process.env.WEBHOOK_URL, {
      file_url: attachment.url
    });
    message.reply('📤 File đã được gửi đến hệ thống xử lý.');
  } catch (err) {
    console.error(err);
    message.reply('❌ Gửi webhook thất bại: ' + err.message);
  }
});

client.login(process.env.DISCORD_TOKEN);
