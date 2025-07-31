const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('annonce')
    .setDescription('Envoie une annonce propre et formatée dans un embed')
    
    // 📌 Champ Titre (personnalisable)
    .addStringOption(option =>
      option.setName('titre')
        .setDescription('Titre personnalisé de l’annonce')
        .setRequired(true))

    // 📝 Champ Texte (contenu avec retour à la ligne)
    .addStringOption(option =>
      option.setName('texte')
        .setDescription('Contenu de l’annonce (tu peux faire des retours à la ligne avec Shift + Entrée)')
        .setRequired(true))

    // 🏷️ Option Tag (mention @everyone ou @role)
    .addStringOption(option =>
      option.setName('tag')
        .setDescription('Mentionner @everyone ou un rôle spécifique')
        .setRequired(false))

    // 🔒 Réservé aux membres avec permission de gérer le serveur
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const titre = interaction.options.getString('titre');
    const texte = interaction.options.getString('texte');
    const tag = interaction.options.getString('tag');

    let mention = '';
    if (tag) {
      if (tag.toLowerCase() === 'everyone') {
        mention = '@everyone';
      } else {
        const roleId = tag.replace(/[<@&>]/g, '');
        const role = interaction.guild.roles.cache.get(roleId);
        if (role) {
          mention = `<@&${role.id}>`;
        } else {
          return interaction.reply({
            content: '❌ Rôle invalide ou introuvable.',
            ephemeral: true
          });
        }
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`${titre}`) // Titre personnalisé
      .setDescription(texte) // Respecte les sauts à la ligne (Shift + Entrée dans Discord)
      .setColor(0xffffff)
      .setFooter({
        text: `Envoyé par ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    await interaction.reply({
      content: mention || null,
      embeds: [embed],
      allowedMentions: { parse: ['roles', 'everyone'] }
    });
  }
};