// Import des outils nécessaires depuis discord.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  // Définition de la commande slash
  data: new SlashCommandBuilder()
    .setName('mutelist')
    .setDescription('📃 Affiche la liste des membres ayant le rôle muet.')
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers), // Permission requise

  async execute(interaction) {
    const { guild } = interaction;

    // ID du rôle muet (à adapter si besoin)
    const muteRoleId = '1399139621845078046';

    try {
      // Récupération du rôle muet
      const muteRole = guild.roles.cache.get(muteRoleId);

      if (!muteRole) {
        return interaction.reply({
          content: '❌ Le rôle muet est introuvable.',
          ephemeral: true,
        });
      }

      // Liste des utilisateurs ayant le rôle
      const mutedUsers = muteRole.members.map(m => m.user);

      // Si personne n’est mute
      if (mutedUsers.length === 0) {
        return interaction.reply({
          content: '✅ Aucun membre n’est actuellement muet.',
          ephemeral: true,
        });
      }

      // Créer l’embed de la liste
      const embed = new EmbedBuilder()
        .setTitle('🔇 Membres actuellement muets')
        .setColor('White')
        .setDescription(
          mutedUsers.map(u => `• ${u}`).join('\n') // Mentions des membres
        )
        .setFooter({ text: `Total : ${mutedUsers.length} membre(s)` });

      // Envoyer la liste dans un embed
      await interaction.reply({
        embeds: [embed],
        ephemeral: false, // Peut être mis à true si tu veux que seul le mod voie la liste
      });

    } catch (err) {
      console.error('❌ Erreur dans /mutelist :', err);
      await interaction.reply({
        content: '❌ Une erreur est survenue lors de la commande.',
        ephemeral: true,
      });
    }
  },
};