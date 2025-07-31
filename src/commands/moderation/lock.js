// 📁 src/commands/moderation/lock.js

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('🔒 Verrouille le salon actuel pour empêcher les messages.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels), // Permission requise

  async execute(interaction) {
    const channel = interaction.channel;
    const everyoneRole = interaction.guild.roles.everyone;

    try {
      await channel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: false,
      });

      // ✅ Embed de confirmation (vert)
      const embed = new EmbedBuilder()
        .setTitle('🔒 Salon verrouillé')
        .setDescription(`Les membres ne peuvent plus envoyer de messages dans ${channel}.`)
        .setColor('Green');

      await interaction.reply({ embeds: [embed] });

      // 📥 Log dans #🧾archives-du-conseil
      const logChannel = interaction.guild.channels.cache.get('1399133165414649866');
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('🔐 Salon verrouillé')
          .addFields(
            { name: '🛡️ Modérateur', value: interaction.user.tag },
            { name: '📍 Salon', value: `${channel}` },
            { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:f>` }
          )
          .setColor('White');
        logChannel.send({ embeds: [logEmbed] });
      }
    } catch (err) {
      console.error(err);
      interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
    }
  },
};