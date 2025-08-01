// 📦 Commande /leave — Fait quitter Bai Hu du salon vocal manuellement

const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  // 📌 Définition de la commande /leave
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Me faire quitter le salon vocal.'),

  // ⚙️ Code exécuté lorsque la commande est appelée
  async execute(interaction) {
    // 🔒 Vérifie que la commande est exécutée dans un serveur (pas en DM)
    if (!interaction.guild) {
      return interaction.reply({
        content: "❌ Cette commande ne peut être utilisée que sur Dynastie.",
        ephemeral: true
      });
    }

    // 🔍 Recherche une connexion audio active pour le serveur
    const connection = getVoiceConnection(interaction.guild.id);

    if (!connection) {
      // ❌ Bai Hu n'est pas connecté à un salon vocal dans ce serveur
      return interaction.reply({
        content: "🤔 Je suis actuellement connecté à aucun salon vocal dans ce serveur.",
        ephemeral: true
      });
    }

    // 📣 Déconnexion propre du salon vocal
    connection.destroy();

    // ✅ Confirmation à l'utilisateur
    await interaction.reply({
      content: "👋 J'ai bien quitté le salon vocal.",
      ephemeral: true
    });
  }
};