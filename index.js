const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const recrutamentos = new Map();

client.once('ready', () => {
  console.log(`Bot online: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!nick ')) {
    if (message.channel.name !== 'recrutamento') return;

    const nick = message.content.slice(6).trim();
    recrutamentos.set(message.author.id, nick);

    const logs = message.guild.channels.cache.find(
      c => c.name === 'logs-recrutamento'
    );

    if (logs) {
      logs.send(
        `📋 Novo recrutamento\nUsuário: <@${message.author.id}>\nNick Albion: **${nick}**`
      );
    }

    message.reply('Nick registrado. Aguarde aprovação.');
  }

  if (message.content.startsWith('!aceitar ')) {
    const membroStaff = message.member;

    const permitido =
      membroStaff.roles.cache.some(r => r.name === 'Líder') ||
      membroStaff.roles.cache.some(r => r.name === 'Comandante');

    if (!permitido) {
      return message.reply('Sem permissão.');
    }

    const usuarioId = message.content.split(' ')[1].replace(/[^0-9]/g, '');
    const membro = await message.guild.members.fetch(usuarioId).catch(() => null);

    if (!membro) return message.reply('Usuário não encontrado.');

    const nick = recrutamentos.get(usuarioId);
    if (!nick) return message.reply('Recrutamento não encontrado.');

    const cargoRecruta = message.guild.roles.cache.find(r => r.name === 'Recruta');
    const cargoGuarda = message.guild.roles.cache.find(r => r.name === 'Guarda');

    await membro.setNickname(nick).catch(() => {});

    if (cargoRecruta) await membro.roles.remove(cargoRecruta).catch(() => {});
    if (cargoGuarda) await membro.roles.add(cargoGuarda).catch(() => {});

    recrutamentos.delete(usuarioId);

    const logs = message.guild.channels.cache.find(
      c => c.name === 'logs-recrutamento'
    );

    if (logs) {
      logs.send(`✅ ${membro.user.tag} aprovado por ${message.author.tag}`);
    }

    message.reply('Recrutamento aprovado.');
  }
});

client.login(process.env.TOKEN);
