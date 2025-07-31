// 📁 src/commands/moderation/close.js

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  // 🔧 Définition de la commande slash
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('🔒 Ferme le ticket actuel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels), // Permission requise

  async execute(interaction) {
    const { channel, guild, user } = interaction;

    // 🔍 Vérifie que le salon est bien un ticket
    if (!channel.name.startsWith('ticket-')) {
      return interaction.reply({
        content: '❌ Cette commande ne peut être utilisée que dans un salon de ticket.',
        ephemeral: true,
      });
    }

    // 📤 Log dans #archives-du-conseil
    const logChannel = guild.channels.cache.get('1399133165414649866'); // ID du salon log

    if (logChannel && logChannel.isTextBased()) {
      const logEmbed = new EmbedBuilder()
        .setTitle('📪 Ticket fermé')
        .addFields(
          { name: '🔒 Salon', value: `${channel.name} (\`${channel.id}\`)` },
          { name: '🛡️ Fermé par', value: `${user.tag}` },
          { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:f>` }
        )
        .setColor('White');

      await logChannel.send({ embeds: [logEmbed] });
    }

    // ✅ Confirme à l’utilisateur puis supprime le salon
    const confirmEmbed = new EmbedBuilder()
      .setDescription('✅ Ce salon sera supprimé dans quelques secondes.')
      .setColor('Green');

    await interaction.reply({ embeds: [confirmEmbed] });

    // 💣 Supprime le salon après 2 secondes
    setTimeout(() => {
      channel.delete().catch(() => {});
    }, 2000);
  }
};