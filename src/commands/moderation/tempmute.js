const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');
const ms = require('ms'); // 📦 Pour convertir des durées comme "5m" ou "2h"
const MUTE_ROLE_ID = '1399139621845078046';
const LOG_CHANNEL_ID = '1399133165414649866';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tempmute')
    .setDescription('⏳ Rend un membre muet temporairement.')
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Le membre à rendre muet.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('durée')
        .setDescription('Durée du mute (ex: 10m, 2h, 1d)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('Raison du mute')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const member = interaction.options.getMember('membre');
    const durationRaw = interaction.options.getString('durée');
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';
    const durationMs = ms(durationRaw);

    // ⛔ Vérif 1 : mauvaise durée ?
    if (!durationMs || durationMs > ms('28d')) {
      return interaction.reply({
        content: '❌ Durée invalide. Utilise un format comme `10m`, `2h`, `1d` (max 28j).',
        ephemeral: true,
      });
    }

    // ⛔ Vérif 2 : membre introuvable
    if (!member) {
      return interaction.reply({
        content: '❌ Membre introuvable sur ce serveur.',
        ephemeral: true,
      });
    }

    // ⛔ Vérif 3 : déjà mute ?
    if (member.roles.cache.has(MUTE_ROLE_ID)) {
      return interaction.reply({
        content: '⚠️ Ce membre est déjà muet.',
        ephemeral: true,
      });
    }

    try {
      // 🔇 Ajouter le rôle muet
      await member.roles.add(MUTE_ROLE_ID, reason);

      // ✅ Embed de confirmation (blanc)
      const confirmEmbed = new EmbedBuilder()
        .setTitle('⏳ Membre temporairement muet')
        .addFields(
          { name: '👤 Membre', value: `${member.user.tag} (\`${member.id}\`)` },
          { name: '⏱️ Durée', value: durationRaw },
          { name: '📌 Raison', value: reason },
        )
        .setColor('White');

      await interaction.reply({ embeds: [confirmEmbed] });

      // 📥 Log dans le salon "archives-du-conseil"
      const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel && logChannel.isTextBased()) {
        const logEmbed = new EmbedBuilder()
          .setTitle('📄 Mute temporaire')
          .addFields(
            { name: '👤 Membre', value: `${member.user.tag} (\`${member.id}\`)` },
            { name: '👮‍♂️ Par', value: interaction.user.tag },
            { name: '⏱️ Durée', value: durationRaw },
            { name: '📌 Raison', value: reason },
            { name: '🕒 Date', value: `<t:${Math.floor(Date.now() / 1000)}:f>` }
          )
          .setColor('White');

        await logChannel.send({ embeds: [logEmbed] });
      }

      // ⏰ Planifie le unmute automatique
      setTimeout(async () => {
        const stillMuted = member.roles.cache.has(MUTE_ROLE_ID);
        if (stillMuted) {
          await member.roles.remove(MUTE_ROLE_ID, 'Fin du mute temporaire');

          // ✅ Embed de fin de mute (vert fluo)
          const unmuteEmbed = new EmbedBuilder()
            .setTitle('🔔 Membre rétabli')
            .setDescription(`Le mute de **${member.user.tag}** est terminé.`)
            .setColor('Green');

          if (logChannel && logChannel.isTextBased()) {
            await logChannel.send({ embeds: [unmuteEmbed] });
          }
        }
      }, durationMs);

    } catch (err) {
      console.error('❌ Erreur dans /tempmute :', err);
      return interaction.reply({
        content: '❌ Une erreur est survenue lors du mute.',
        ephemeral: true,
      });
    }
  }
};
