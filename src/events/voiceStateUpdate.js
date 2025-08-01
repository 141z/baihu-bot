// 📁 src/events/voiceStateUpdate.js

const {
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  name: 'voiceStateUpdate',

  async execute(oldState, newState) {
    // 🎯 On cible le salon dans lequel l'utilisateur est entré
    const joinedChannel = newState.channel;

    // 🔧 ID du salon vocal "➕ Créer votre salon"
    const TEMP_CREATION_CHANNEL_ID = '1400149080847421480';

    // 🔐 ID du rôle qui a le droit de voir et rejoindre les vocaux temporaires
    const allowedRoleId = '1399195206007390239';

    // 🚫 Si l'utilisateur n'a pas rejoint le bon salon, on arrête
    if (joinedChannel?.id !== TEMP_CREATION_CHANNEL_ID) return;

    // 👤 On récupère le membre qui vient d'entrer
    const member = newState.member;

    // 🏗 Création d'un nouveau salon vocal temporaire personnalisé
    const tempChannel = await newState.guild.channels.create({
      name: `Salon de ${member.user.username}`, // Nom du salon
      type: ChannelType.GuildVoice, // Type : vocal
      parent: joinedChannel.parentId, // Même catégorie que le créateur
      userLimit: 7, // ✅ Par défaut : 7 places max
      permissionOverwrites: [
        {
          id: newState.guild.roles.everyone,
          deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect] // ❌ @everyone ne voit pas le salon
        },
        {
          id: allowedRoleId,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect] // ✅ Seulement ce rôle peut voir/rejoindre
        },
        {
          id: member.id, // Propriétaire du salon
          allow: [
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.ManageChannels,
            PermissionsBitField.Flags.MuteMembers,
            PermissionsBitField.Flags.DeafenMembers,
            PermissionsBitField.Flags.MoveMembers,
            PermissionsBitField.Flags.Stream
          ]
        }
      ]
    });

    // 🚪 Déplacement auto du membre dans son salon
    await member.voice.setChannel(tempChannel);

    // 🪤 Nettoyage : on supprime le salon s'il devient vide
    const interval = setInterval(async () => {
      const fetched = await newState.guild.channels.fetch(tempChannel.id);
      if (fetched.members.size === 0) {
        clearInterval(interval); // Arrête le vérificateur
        await fetched.delete().catch(() => {}); // Supprime le salon s'il est vide
      }
    }, 2000); // Toutes les 30 secondes

    // 📢 Embed explicatif avec les boutons de contrôle du salon
    const embed = new EmbedBuilder()
      .setTitle('🔧 Configuration du salon vocal')
      .setDescription(`Salut ${member}, tu peux gérer ton salon avec les boutons ci-dessous.`)
      .addFields(
        { name: '🔓 Ouvert', value: 'Tout le monde (ayant le rôle requis) peut rejoindre.' },
        { name: '🔒 Fermé', value: 'Visible mais seul les autorisés peuvent rejoindre.' },
        { name: '👥 Limite de places', value: 'Tu peux changer le nombre maximum de personnes.' },
        { name: '📊 Statut', value: 'Affiche la configuration actuelle du salon.' },
        { name: '👑 Transfert de propriété', value: 'Donne le contrôle à un autre membre présent.' }
      )
      .setColor('White');

    // 🔹 Ligne 1 : gestion accès
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('open').setLabel('🔓 Ouvert').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('closed').setLabel('🔒 Fermé').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('place').setLabel('👥 Places').setStyle(ButtonStyle.Primary)
    );

    // 🔹 Ligne 2 : statut + propriété
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('status').setLabel('📊 Statut').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('transfer').setLabel('👑 Transfert de propriété').setStyle(ButtonStyle.Secondary)
    );

    // 📩 Envoie le message de gestion dans le salon vocal
    await tempChannel.send({
      content: `👑 Propriétaire : ${member}`,
      embeds: [embed],
      components: [row1, row2]
    });
  }
};
