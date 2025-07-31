// ✅ Commande /unmute avec confirmation et log dans le salon d'archives
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

// ID du rôle muet à retirer
const MUTE_ROLE_ID = '1399139621845078046';
// ID du salon d'archives pour les logs
const LOG_CHANNEL_ID = '1399133165414649866';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('🔈 Rétablit la parole d’un membre muet.')
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Le membre à démuet')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const { guild, options, user } = interaction;
    const target = options.getMember('membre');

    if (!target) {
      return interaction.reply({
        content: '❌ Membre introuvable sur ce serveur.',
        ephemeral: true,
      });
    }

    if (!target.roles.cache.has(MUTE_ROLE_ID)) {
      return interaction.reply({
        content: 'ℹ️ Ce membre n’est pas muet.',
        ephemeral: true,
      });
    }

    // Embed de confirmation
    const confirmEmbed = new EmbedBuilder()
      .setTitle('Confirmation du unmute')
      .setDescription(`Souhaitez-vous vraiment retirer le mute de **${target.user.tag}** ?`)
      .setColor('White')
      .setFooter({ text: 'Appuyez sur un bouton pour confirmer ou annuler.' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_unmute')
        .setLabel('Confirmer')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('cancel_unmute')
        .setLabel('Annuler')
        .setStyle(ButtonStyle.Danger)
    );

    const reply = await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      ephemeral: true,
    });

    const collector = reply.createMessageComponentCollector({ time: 15000 });

    collector.on('collect', async i => {
      if (i.user.id !== user.id) {
        return i.reply({ content: '❌ Vous ne pouvez pas interagir avec ce bouton.', ephemeral: true });
      }

      if (i.customId === 'cancel_unmute') {
        await i.update({ content: '❌ Unmute annulé.', embeds: [], components: [] });
        return collector.stop();
      }

      if (i.customId === 'confirm_unmute') {
        await target.roles.remove(MUTE_ROLE_ID);

        const successEmbed = new EmbedBuilder()
          .setTitle('✅ Membre démuet')
          .setDescription(`**${target.user.tag}** peut de nouveau parler.`)
          .setColor('Green');

        await i.update({ embeds: [successEmbed], components: [] });

        // Log
        const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
        if (logChannel && logChannel.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setTitle('📣 Unmute effectué')
            .addFields(
              { name: '👤 Membre', value: `${target.user.tag} (\`${target.id}\`)` },
              { name: '🛡️ Par', value: `${user.tag}` },
              { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:f>` },
            )
            .setColor('Blue');

          await logChannel.send({ embeds: [logEmbed] });
        }

        return collector.stop();
      }
    });

    collector.on('end', () => {
      if (!reply.editable) return;
      reply.edit({ components: [] }).catch(() => {});
    });
  }
};