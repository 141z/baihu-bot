// 📦 Commande /clearqueue — Vide la file d'attente audio de Bai Hu dans un serveur

const { SlashCommandBuilder } = require('discord.js');

// 🔊 Permet de gérer les connexions vocales (ex: obtenir la connexion actuelle)
const { getVoiceConnection } = require('@discordjs/voice');

// 📁 On importe la file d'attente globale partagée définie dans audioQueue.js
const { queueMap } = require('../../utils/audioQueue'); // ✅ chemin corrigé

module.exports = {
  // 📀 Déclaration de la commande slash
  data: new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription("Vide la file d'attente des messages vocaux de Bai Hu."),

  // ⚙️ Fonction exécutée quand la commande est utilisée
  async execute(interaction) {
    // 🔒 Vérifie que la commande est bien utilisée dans un serveur
    if (!interaction.guild) {
      return interaction.reply({
        content: "❌ Cette commande ne peut être utilisée que sur un serveur.",
        ephemeral: true
      });
    }

    // 📛 Facultatif : vérifie si l'utilisateur est admin
    /*
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({
        content: "⚠️ Seuls les administrateurs peuvent vider la file d’attente.",
        ephemeral: true
      });
    }
    */

    // 🎯 Récupère l'ID du serveur et sa file d'attente
    const guildId = interaction.guild.id;
    const queue = queueMap.get(guildId);

    // 🧐 Si la file est vide ou inexistante, on informe l'utilisateur
    if (!queue || queue.queue.length === 0) {
      return interaction.reply({
        content: "📭 Il n'y a aucun message dans la file d'attente à supprimer.",
        ephemeral: true
      });
    }

    // 🧹 Vide la file d'attente (sans couper l'audio en cours)
    queue.queue = [];

    await interaction.reply({
      content: "✅ La file d'attente des messages vocaux a été vidée avec succès.",
      ephemeral: true
    });

    // 🪵 Log console utile pour débogage
    console.log(`[🧹 ClearQueue] File d'attente vidée pour le serveur ${interaction.guild.name} (${guildId})`);
  }
};