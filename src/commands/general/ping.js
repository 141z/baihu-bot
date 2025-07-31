const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Interroge Bai Hu, le Tigre Blanc, sur l’équilibre des énergies.'),
  async execute(interaction) {
    try {
      const replyMessage = await interaction.reply({ content: '🐅 Bai Hu médite...', ephemeral: true });

      // Fetch la réponse complète pour calculer la latence
      const fetchedReply = await interaction.fetchReply();

      const botLatency = fetchedReply.createdTimestamp - interaction.createdTimestamp;
      const apiLatency = interaction.client.ws.ping;

      const uptime = process.uptime();
      const uptimeFormatted = new Date(uptime * 1000).toISOString().substr(11, 8);
      const memoryUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      const nodeVersion = process.version;
      const discordVersion = require('discord.js').version;

      const getChiEmoji = (latency) => {
        if (latency < 100) return '🟢 Qi fluide';
        if (latency < 300) return '🟠 Qi instable';
        return '🔴 Qi perturbé';
      };

      const embed = new EmbedBuilder()
        .setTitle('🀄 Bai Hu révèle les flux du Ciel')
        .setColor('#FFFFFF')
        .addFields(
          { name: '🐉 Latence céleste', value: `${getChiEmoji(botLatency)}\n\`${botLatency} ms\``, inline: true },
          { name: '🧧 Latence du temple (API)', value: `\`${apiLatency} ms\``, inline: true },
          { name: '🕯️ Méditation (Uptime)', value: `\`${uptimeFormatted}\``, inline: true },
          { name: '🍵 Souffle consommé (RAM)', value: `\`${memoryUsed} MB\``, inline: true },
          { name: '📜 Parchemins', value: `Node.js: \`${nodeVersion}\`\nDiscord.js: \`${discordVersion}\`` }
        )
        .setFooter({ text: `Énergies consultées le ${new Date().toLocaleString('fr-FR')}` });

      await interaction.editReply({ content: '', embeds: [embed] });

    } catch (error) {
      console.error('💥 Erreur dans ping :', error);
      if (!interaction.replied) {
        await interaction.reply({ content: '⚠️ Une erreur est survenue pendant la méditation de Bai Hu.', ephemeral: true });
      }
    }
  },
};