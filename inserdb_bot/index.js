import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const pendingUploads = new Map();

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

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('option_a')
        .setLabel('Option A')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('option_b')
        .setLabel('Option B')
        .setStyle(ButtonStyle.Secondary)
    );

    const reply = await message.reply({
      content: '📑 Chọn phương án xử lý file:',
      components: [row]
    });

    pendingUploads.set(reply.id, attachment.url);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const fileUrl = pendingUploads.get(interaction.message.id);
  if (!fileUrl) {
    await interaction.reply({
      content: '❌ Không tìm thấy dữ liệu để xử lý.',
      ephemeral: true
    });
    return;
  }

  try {
    await axios.post(process.env.WEBHOOK_URL, {
      file_url: fileUrl,
      choice: interaction.customId,
      user: interaction.user.id
    });

    await interaction.reply({
      content: '✅ Dữ liệu đã được gửi đến hệ thống.',
      ephemeral: true
    });
    await interaction.message.edit({ components: [] });
  } catch (err) {
    console.error('❌ Lỗi khi gửi webhook:', err.message);
    await interaction.reply({
      content: '❌ Gửi dữ liệu thất bại.',
      ephemeral: true
    });
  } finally {
    pendingUploads.delete(interaction.message.id);
  }
});

client.login(process.env.DISCORD_TOKEN);
