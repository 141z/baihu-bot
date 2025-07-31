// 📦 Importation des outils nécessaires de discord.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  // 📌 Définition de la commande slash : /tirage
  data: new SlashCommandBuilder()
    .setName('tirage')
    .setDescription('Fait un tirage au sort immédiat')
    .addStringOption(option =>
      option.setName('participants')
        .setDescription('Liste des participants séparés par une virgule')
        .setRequired(true)
    ),

  // 🚀 Fonction exécutée quand un utilisateur utilise la commande
  async execute(interaction) {
    // 🧾 Récupération de la chaîne de texte entrée par l’utilisateur
    const input = interaction.options.getString('participants');

    // 🧹 On transforme la chaîne en tableau, en nettoyant les espaces inutiles
    const participants = input
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0); // Élimine les entrées vides

    // ❌ Vérifie qu'il y a au moins deux participants
    if (participants.length < 2) {
      return interaction.reply({
        content: '❌ Tu dois fournir au moins **2 participants**.',
        ephemeral: true
      });
    }

    // 🎲 Sélection aléatoire du gagnant
    const gagnant = participants[Math.floor(Math.random() * participants.length)];

    // 🎨 Création de l’embed avec la liste et le gagnant
    const embed = new EmbedBuilder()
      .setTitle('🎯 Tirage au sort')
      .setDescription(` Le gagnant est : **${gagnant}**🎉`)
      .addFields({
        name: '📋 La Liste :',
        value: participants.map(p => `• ${p}`).join('\n') // Format liste avec des puces
      })
      .setColor(0xffffff) // Bande blanche à gauche (le fond dépend du thème utilisateur)
      .setFooter({
        text: `Tirage demandé par ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    // 💬 Envoi de la réponse avec l’embed
    await interaction.reply({ embeds: [embed] });
  }
};