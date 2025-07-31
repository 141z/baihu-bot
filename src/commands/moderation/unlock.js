// 📁 src/commands/moderation/unlock.js

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('🔓 Déverrouille le salon pour autoriser les messages.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.channel;
    const everyoneRole = interaction.guild.roles.everyone;

    try {
      await channel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: null,
      });

      const embed = new EmbedBuilder()
        .setTitle('🔓 Salon déverrouillé')
        .setDescription(`Les membres peuvent à nouveau écrire dans ${channel}.`)
        .setColor('Green');

      await interaction.reply({ embeds: [embed] });

      // 🔁 Log dans #archives
      const logChannel = interaction.guild.channels.cache.get('1399133165414649866');
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('🔐 Salon déverrouillé')
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