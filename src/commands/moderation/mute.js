// ==========================
// ✅ COMMANDE /mute
// ==========================

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('🔇 Rend muet un membre en lui assignant le rôle Muet.')
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Le membre à rendre muet')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('La raison du mute')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison');
    const roleId = '1399139621845078046';
    const muteRole = interaction.guild.roles.cache.get(roleId);

    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!muteRole) return interaction.reply({ content: '❌ Le rôle Muet est introuvable.', ephemeral: true });

    // Déjà muet ?
    if (target.roles.cache.has(roleId)) {
      return interaction.reply({
        content: '⚠️ Ce membre est déjà muet.',
        ephemeral: true
      });
    }

    // Embed de confirmation
    const confirmEmbed = new EmbedBuilder()
      .setTitle('Confirmation de mute')
      .setDescription(`Souhaitez-vous vraiment rendre muet **${target.user.tag}** ?`)
      .setColor('White')
      .addFields({ name: 'Raison', value: reason });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('mute_confirm').setLabel('Confirmer').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('mute_cancel').setLabel('Annuler').setStyle(ButtonStyle.Danger)
    );

    const reply = await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });

    const collector = reply.createMessageComponentCollector({ time: 15000 });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id)
        return i.reply({ content: '⛔ Tu ne peux pas interagir ici.', ephemeral: true });

      if (i.customId === 'mute_cancel') {
        await i.update({ content: '❌ Mute annulé.', embeds: [], components: [] });
        return collector.stop();
      }

      if (i.customId === 'mute_confirm') {
        await target.roles.add(muteRole);

        const confirm = new EmbedBuilder()
          .setTitle('🔇 Membre rendu muet')
          .setDescription(`**${target.user.tag}** est maintenant muet.`)
          .setColor('Green');

        await i.update({ embeds: [confirm], components: [] });

        // Log dans le salon archives
        const logChannel = interaction.guild.channels.cache.get('1399133165414649866');
        if (logChannel && logChannel.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setTitle('🪧 Mute appliqué')
            .addFields(
              { name: '👤 Membre', value: `${target.user.tag} (\`${target.id}\`)` },
              { name: '🛡️ Par', value: `${interaction.user.tag}` },
              { name: '📌 Raison', value: reason },
              { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:f>` },
            )
            .setColor('White');

          await logChannel.send({ embeds: [logEmbed] });
        }
        collector.stop();
      }
    });
  }
};