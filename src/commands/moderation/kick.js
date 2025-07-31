// 📦 Importation des modules nécessaires de discord.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

// 🔒 Import du middleware de limitation anti-abus
const modActionLimiter = require('../../middleware/modActionLimiter');

module.exports = {
  // 🧩 Définition de la commande /kick
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('🚪 Expulse un membre du serveur avec confirmation.')
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Le membre à expulser')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('La raison de l’expulsion')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const { guild, user } = interaction;
    const member = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';

    // 🔐 Applique la protection anti-abus
    const abuseCheck = await modActionLimiter(user.id, guild.id, 'kick');
    if (!abuseCheck.allowed) {
      return interaction.reply({
        content: `❌ Trop d’actions modération en peu de temps.\n⏳ Réessaie <t:${Math.floor(abuseCheck.retryAfter / 1000)}:R>.`,
        ephemeral: true,
      });
    }

    // 🔍 Vérifie si le membre ciblé est valide
    if (!member) {
      return interaction.reply({
        content: '❌ Ce membre est introuvable sur ce serveur.',
        ephemeral: true,
      });
    }

    // ❗ Vérifie si le bot peut le kicker
    if (!member.kickable) {
      return interaction.reply({
        content: '❌ Je ne peux pas expulser ce membre (peut-être un rôle trop élevé).',
        ephemeral: true,
      });
    }

    // 📤 Embed de confirmation
    const confirmEmbed = new EmbedBuilder()
      .setTitle('Confirmation de l’expulsion')
      .setDescription(`Es-tu sûr de vouloir **expulser** ${member} ?\n📌 Raison : \`${reason}\``)
      .setColor('White')
      .setFooter({ text: 'Appuie sur un bouton pour confirmer ou annuler.' });

    // 🔘 Boutons de confirmation
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_kick')
        .setLabel('Confirmer')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('cancel_kick')
        .setLabel('Annuler')
        .setStyle(ButtonStyle.Danger)
    );

    // 📩 Envoie le message interactif (éphémère)
    const reply = await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      ephemeral: true,
    });

    // ⏳ Crée un collecteur de boutons pendant 15 secondes
    const collector = reply.createMessageComponentCollector({ time: 15000 });

    collector.on('collect', async i => {
      if (i.user.id !== user.id) {
        return i.reply({ content: '❌ Tu ne peux pas interagir avec ce bouton.', ephemeral: true });
      }

      if (i.customId === 'cancel_kick') {
        await i.update({
          content: '❌ Expulsion annulée.',
          embeds: [],
          components: [],
        });
        collector.stop();
        return;
      }

      if (i.customId === 'confirm_kick') {
        try {
          // 🔔 Tente un DM (optionnel)
          try {
            await member.send(`🚪 Tu as été expulsé du serveur **${guild.name}**.\n📌 Raison : ${reason}`);
          } catch {}

          // 🚪 Expulsion réelle
          await member.kick(reason);

          // ✅ Confirmation dans un embed vert
          const successEmbed = new EmbedBuilder()
            .setTitle('✅ Expulsion effectuée')
            .setDescription(`**${member.user.tag}** a été expulsé avec succès.`)
            .setColor('Green');

          await i.update({ embeds: [successEmbed], components: [] });

          // 🧾 Log dans le salon #archives-du-conseil
          const logChannel = guild.channels.cache.get('1399133165414649866');
          if (logChannel && logChannel.isTextBased()) {
            const logEmbed = new EmbedBuilder()
              .setTitle('📤 Expulsion exécutée')
              .addFields(
                { name: '👤 Membre expulsé', value: `${member.user.tag} (\`${member.user.id}\`)` },
                { name: '📌 Raison', value: reason },
                { name: '🛡️ Modérateur', value: `${user.tag}` },
                { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:f>` }
              )
              .setColor('White');

            await logChannel.send({ embeds: [logEmbed] });
          }
        } catch (error) {
          console.error('Erreur lors du kick :', error);
          await i.update({
            content: '❌ Une erreur est survenue lors de l’expulsion.',
            components: [],
          });
        }

        collector.stop();
      }
    });

    // ⏹️ Nettoyage des boutons si le temps est écoulé
    collector.on('end', () => {
      if (!reply.editable) return;
      reply.edit({ components: [] }).catch(() => {});
    });
  },
};