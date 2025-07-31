// 📦 Importation des outils nécessaires depuis discord.js
const {
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType
} = require('discord.js');

// ✅ Petite fonction utilitaire pour répondre en privé (éphémère)
function replyEphemeral(interaction, message, options = {}) {
  return interaction.reply({
    content: message,
    ...options,
    flags: 64 // 👁️ Remplace "ephemeral: true"
  });
}

module.exports = {
  name: 'interactionCreate',

  /**
   * 📥 Fonction déclenchée automatiquement quand une interaction utilisateur est détectée
   * Elle peut venir d’une commande, d’un bouton, d’un menu ou d’un formulaire (modal)
   */
  async execute(interaction, client) {
    // ================================
    // 1️⃣ Gestion des commandes slash
    // ================================
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`💥 Erreur dans ${interaction.commandName}`, error);
        await replyEphemeral(interaction, '❌ Une erreur est survenue.');
      }
    }

    // ===============================
    // 2️⃣ Gestion des boutons cliqués
    // ===============================
    if (interaction.isButton()) {
      const { guild, member, customId } = interaction;
      const voiceChannel = member.voice.channel;

      // 🎯 Cas spécial : Bouton "modifier ma présentation"
      // ----------------------------------------------------
      if (customId === 'modifier_presentation') {
        // 🔁 Si l'utilisateur clique sur le bouton dans sa présentation,
        // le bot lui répond gentiment en privé avec la commande à retaper
        return replyEphemeral(interaction, '✏️ Tu peux modifier ta présentation en retapant la commande `/présentation`.');
      }

      // 🔒 Pour tous les autres boutons : on vérifie s’il est bien dans un salon vocal temporaire
      if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
        return replyEphemeral(interaction, '❌ Tu dois être dans **ton salon vocal temporaire** pour utiliser ce bouton.');
      }

      // 🔐 Vérifie si l'utilisateur est bien le propriétaire du salon (perms : Gérer le salon)
      const perms = voiceChannel.permissionOverwrites.cache.get(member.id);
      const isOwner = perms?.allow?.has(PermissionsBitField.Flags.ManageChannels);

      if (!isOwner) {
        return replyEphemeral(interaction, '🚫 Tu n’es pas le propriétaire de ce salon.');
      }

      // ▶️ Analyse quel bouton a été cliqué, et agit en conséquence
      switch (customId) {
        case 'open':
          await voiceChannel.permissionOverwrites.edit(guild.roles.everyone, {
            Connect: true,
            ViewChannel: true
          });
          return replyEphemeral(interaction, '🔓 Salon **ouvert à tous**.');

        case 'closed':
          await voiceChannel.permissionOverwrites.edit(guild.roles.everyone, {
            Connect: false,
            ViewChannel: true
          });
          return replyEphemeral(interaction, '🔒 Salon **fermé** (visible mais accès restreint).');

        case 'status': {
          const everyonePerms = voiceChannel.permissionOverwrites.cache.get(guild.roles.everyone.id);
          const isVisible = !everyonePerms?.deny?.has(PermissionsBitField.Flags.ViewChannel);
          const isConnectable = !everyonePerms?.deny?.has(PermissionsBitField.Flags.Connect);

          const embed = new EmbedBuilder()
            .setTitle('📊 Statut du salon vocal')
            .addFields(
              { name: '👁️ Visibilité', value: isVisible ? 'Visible' : 'Invisible', inline: true },
              { name: '🔌 Connexion', value: isConnectable ? 'Autorisé' : 'Refusé', inline: true },
              { name: '🌍 Région', value: voiceChannel.rtcRegion ?? 'Auto', inline: true },
              { name: '📈 Ping', value: voiceChannel.rtcRegion ? 'Personnalisée' : 'Automatique', inline: true }
            )
            .setColor('White');

          return interaction.reply({ embeds: [embed], flags: 64 });
        }

        case 'transfer': {
          const others = voiceChannel.members.filter(m => m.id !== member.id);
          if (others.size === 0) {
            return replyEphemeral(interaction, '❌ Aucun autre membre n’est connecté dans ton salon.');
          }

          const menu = new StringSelectMenuBuilder()
            .setCustomId('transfer_owner_to')
            .setPlaceholder('👑 Choisir un nouveau propriétaire')
            .addOptions(
              others.map(m => ({
                label: m.user.username,
                description: `Transférer à ${m.user.tag}`,
                value: m.id
              }))
            );

          const row = new ActionRowBuilder().addComponents(menu);

          return interaction.reply({
            content: 'À qui veux-tu transférer la propriété du salon ?',
            components: [row],
            flags: 64
          });
        }

        case 'place': {
          // 📝 Ouvre un petit formulaire pour définir la limite de places
          const modal = new ModalBuilder()
            .setCustomId('modal_place_limit')
            .setTitle('👥 Modifier le nombre de places');

          const input = new TextInputBuilder()
            .setCustomId('place_limit_input')
            .setLabel('Nombre de places (entre 1 et 99)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(2);

          const row = new ActionRowBuilder().addComponents(input);
          modal.addComponents(row);

          return interaction.showModal(modal);
        }
      }
    }

    // ===============================
    // 3️⃣ Gestion des menus déroulants (select)
    // ===============================
    if (interaction.isStringSelectMenu()) {
      const { customId, values, member, guild } = interaction;
      const voiceChannel = member.voice.channel;

      if (!voiceChannel) {
        return replyEphemeral(interaction, '❌ Tu n’es pas dans un salon vocal.');
      }

      if (customId === 'transfer_owner_to') {
        const newOwnerId = values[0];

        // ✅ Donne les droits de gestion au nouveau proprio
        await voiceChannel.permissionOverwrites.edit(newOwnerId, {
          ManageChannels: true,
          Connect: true,
          MuteMembers: true,
          DeafenMembers: true,
          MoveMembers: true,
          Stream: true
        });

        // ❌ Retire les droits à l'ancien
        await voiceChannel.permissionOverwrites.edit(member.id, {
          ManageChannels: false
        });

        const newOwner = await guild.members.fetch(newOwnerId);

        return interaction.update({
          content: `✅ La propriété du salon a été transférée à ${newOwner}.`,
          components: []
        });
      }
    }

    // ===============================
    // 4️⃣ Soumission du modal (formulaire "nombre de places")
    // ===============================
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_place_limit') {
      const member = interaction.member;
      const voiceChannel = member.voice.channel;
      const input = interaction.fields.getTextInputValue('place_limit_input');

      if (!voiceChannel) {
        return replyEphemeral(interaction, '❌ Tu dois être dans ton salon vocal.');
      }

      const newLimit = parseInt(input);
      if (isNaN(newLimit) || newLimit < 1 || newLimit > 99) {
        return replyEphemeral(interaction, '❌ Merci d’entrer un nombre valide entre 1 et 99.');
      }

      await voiceChannel.setUserLimit(newLimit);
      return replyEphemeral(interaction, `✅ Le salon est maintenant limité à **${newLimit} places**.`);
    }
  }
};