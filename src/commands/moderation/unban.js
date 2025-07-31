const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  // Déclaration de la commande slash /unban
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('🔓 Débannir un utilisateur à partir de son ID avec confirmation.')
    .addStringOption(option =>
      option.setName('id')
        .setDescription("L'identifiant de l'utilisateur à débannir")
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const { guild, options, user } = interaction;
    const targetId = options.getString('id'); // Récupère l’ID fourni

    // 🔎 Tente de récupérer l’utilisateur banni avec cet ID
    const ban = await guild.bans.fetch(targetId).catch(() => null);

    if (!ban) {
      // Si aucun bannissement n’est trouvé
      return interaction.reply({
        content: `❌ Aucun utilisateur banni trouvé avec l'ID \`${targetId}\`.`,
        ephemeral: true,
      });
    }

    // 🛑 Création d’un embed de confirmation
    const confirmEmbed = new EmbedBuilder()
      .setTitle('Confirmation du débannissement')
      .setDescription(`Voulez-vous vraiment débannir **${ban.user.tag}** (*${ban.user.id}*) ?`)
      .setColor('White')
      .setFooter({ text: 'Appuyez sur un bouton pour confirmer ou annuler.' });

    // 🔘 Ligne de boutons : Confirmer / Annuler
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_unban')
        .setLabel('Confirmer')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('cancel_unban')
        .setLabel('Annuler')
        .setStyle(ButtonStyle.Danger)
    );

    // 🔁 Envoie l’embed de confirmation avec les boutons
    const reply = await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      ephemeral: true,
    });

    // ⏳ Collecteur de clics sur boutons (15 secondes)
    const collector = reply.createMessageComponentCollector({ time: 15000 });

    collector.on('collect', async i => {
      // ❌ Si un autre utilisateur clique sur le bouton
      if (i.user.id !== user.id) {
        return i.reply({ content: '❌ Vous ne pouvez pas interagir avec ce bouton.', ephemeral: true });
      }

      if (i.customId === 'cancel_unban') {
        // ❎ Si on clique sur Annuler
        await i.update({
          content: '❌ Débannissement annulé.',
          embeds: [],
          components: [],
        });
        collector.stop();
        return;
      }

      if (i.customId === 'confirm_unban') {
        // ✅ Si on clique sur Confirmer
        await guild.members.unban(targetId);

        // ✔️ Embed de succès envoyé à l’utilisateur
        const successEmbed = new EmbedBuilder()
          .setTitle('✅ Utilisateur débanni')
          .setDescription(`**${ban.user.tag}** a été débanni avec succès.`)
          .setColor('Green');

        await i.update({ embeds: [successEmbed], components: [] });

        // 🧾 Envoi dans le salon de logs via l’ID
        const logChannel = guild.channels.cache.get('1399133165414649866');

        if (logChannel && logChannel.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setTitle('📥 Débannissement exécuté')
            .addFields(
              { name: '👤 Utilisateur', value: `${ban.user.tag} (\`${ban.user.id}\`)` },
              { name: '🛡️ Modérateur', value: `${user.tag}` },
              { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:f>` }
            )
            .setColor('Blue');

          await logChannel.send({ embeds: [logEmbed] });
        }

        collector.stop(); // fin du collecteur après l'action
      }
    });

    // ⏹️ Quand le temps est écoulé, on désactive les boutons
    collector.on('end', () => {
      if (!reply.editable) return;
      reply.edit({ components: [] }).catch(() => {});
    });
  }
};