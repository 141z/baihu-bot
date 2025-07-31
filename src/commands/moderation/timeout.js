// 📁 src/commands/moderation/timeout.js

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  time,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('⏳ Met un membre en timeout temporaire.')
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Le membre à mettre en timeout')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('durée')
        .setDescription('Durée du timeout (ex: 10m, 1h, 1d)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('Raison du timeout')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('membre');
    const durationRaw = interaction.options.getString('durée');
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';

    // ⏱ Conversion (supporte m/h/d uniquement)
    const regex = /^(\d+)([mhd])$/;
    const match = durationRaw.match(regex);
    if (!match) {
      return interaction.reply({ content: '❌ Format invalide. Utilise par exemple : `10m`, `2h`, `1d`.', ephemeral: true });
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const durationMs = unit === 'm' ? value * 60000
      : unit === 'h' ? value * 3600000
      : value * 86400000; // 'd'

    // 🔒 Vérifie permissions
    if (!target || !target.moderatable) {
      return interaction.reply({ content: '❌ Impossible de timeout ce membre.', ephemeral: true });
    }

    try {
      await target.timeout(durationMs, reason);

      const embed = new EmbedBuilder()
        .setTitle('⏳ Timeout appliqué')
        .setDescription(`✅ **${target.user.tag}** a été mis en timeout pour **${durationRaw}**.`)
        .setColor('Green');

      await interaction.reply({ embeds: [embed] });

      // 🧾 Log
      const logChannel = interaction.guild.channels.cache.get('1399133165414649866');
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('⏳ Timeout appliqué')
          .addFields(
            { name: '👤 Membre', value: `${target.user.tag} (\`${target.id}\`)` },
            { name: '🛡️ Modérateur', value: interaction.user.tag },
            { name: '⏱ Durée', value: durationRaw },
            { name: '📌 Raison', value: reason },
            { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:f>` }
          )
          .setColor('White');
        logChannel.send({ embeds: [logEmbed] });
      }

    } catch (error) {
      console.error('Erreur timeout :', error);
      interaction.reply({ content: '❌ Une erreur est survenue pendant le timeout.', ephemeral: true });
    }
  }
};