// 📦 Import des classes nécessaires de discord.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

// 🔒 Import du middleware anti-abus
const modActionLimiter = require('../../middleware/modActionLimiter');

module.exports = {
  // 🧩 Définition de la commande /ban
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🚫 Bannit un membre du serveur avec confirmation.')
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Le membre à bannir')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('La raison du bannissement')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const { guild, user } = interaction; // user = modérateur
    const member = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison');

    // 🔐 Protection anti-abus : limite le spam de bans
    const abuseCheck = await modActionLimiter(user.id, guild.id, 'ban');
    if (!abuseCheck.allowed) {
      return interaction.reply({
        content: `❌ Trop de bannissements effectués récemment.\n⏳ Réessaie <t:${Math.floor(abuseCheck.retryAfter / 1000)}:R>.`,
        ephemeral: true,
      });
    }

    // 🔍 Vérifie que l'utilisateur est bien dans le serveur
    if (!member) {
      return interaction.reply({
        content: '❌ Ce membre est introuvable sur ce serveur.',
        ephemeral: true,
      });
    }

    // 🔒 Vérifie si le bot peut le bannir
    if (!member.bannable) {
      return interaction.reply({
        content: '❌ Je ne peux pas bannir ce membre (rôle trop élevé ?).',
        ephemeral: true,
      });
    }

    // 📩 Embed de confirmation
    const confirmEmbed = new EmbedBuilder()
      .setTitle('Confirmation du bannissement')
      .setDescription(`🚫 Es-tu sûr de vouloir **bannir** ${member} ?\n📌 Raison : \`${reason}\``)
      .setColor('White');

    // 🟢 Boutons de confirmation
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_ban')
        .setLabel('Confirmer')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_ban')
        .setLabel('Annuler')
        .setStyle(ButtonStyle.Secondary)
    );

    // 🔁 Envoie le message de confirmation interactif
    const reply = await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      ephemeral: true,
    });

    // ⏳ Collecteur de clics sur les boutons
    const collector = reply.createMessageComponentCollector({ time: 15000 });

    collector.on('collect', async i => {
      // ❌ Empêche les autres utilisateurs d'interagir
      if (i.user.id !== user.id) {
        return i.reply({ content: '❌ Ce bouton ne t’est pas destiné.', ephemeral: true });
      }

      // ❎ Annulation du ban
      if (i.customId === 'cancel_ban') {
        await i.update({
          content: '❌ Bannissement annulé.',
          embeds: [],
          components: [],
        });
        collector.stop();
        return;
      }

      // ✅ Confirmation du ban
      if (i.customId === 'confirm_ban') {
        try {
          // (optionnel) DM de notification
          try {
            await member.send(`🚫 Tu as été **banni** du serveur **${guild.name}**.\n📌 Raison : ${reason}`);
          } catch {}

          // 🔨 Bannissement
          await member.ban({ reason });

          // ✅ Message de succès (embed vert)
          const successEmbed = new EmbedBuilder()
            .setTitle('✅ Bannissement effectué')
            .setDescription(`**${member.user.tag}** a été banni du serveur.`)
            .setColor('Green');

          await i.update({ embeds: [successEmbed], components: [] });

          // 🧾 Log du ban dans #🧾archives-du-conseil
          const logChannel = guild.channels.cache.get('1399133165414649866');
          if (logChannel && logChannel.isTextBased()) {
            const logEmbed = new EmbedBuilder()
              .setTitle('📤 Bannissement exécuté')
              .addFields(
                { name: '👤 Utilisateur', value: `${member.user.tag} (\`${member.id}\`)` },
                { name: '📌 Raison', value: reason },
                { name: '🛡️ Modérateur', value: `${user.tag}` },
                { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:f>` }
              )
              .setColor('White');

            await logChannel.send({ embeds: [logEmbed] });
          }
        } catch (error) {
          console.error('Erreur lors du bannissement :', error);
          await i.update({
            content: '❌ Une erreur est survenue lors du bannissement.',
            components: [],
          });
        }

        collector.stop();
      }
    });

    // ⏹️ Fin de la session si rien n'est cliqué
    collector.on('end', () => {
      if (!reply.editable) return;
      reply.edit({ components: [] }).catch(() => {});
    });
  },
};