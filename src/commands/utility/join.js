// 📦 Importe les classes nécessaires pour les commandes slash et l’audio
const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
  // 📌 Déclaration de la commande slash "/join"
  data: new SlashCommandBuilder()
    .setName('join') // Nom de la commande
    .setDescription('Faire rejoindre Bai Hu dans ton salon vocal (étape requise avant /dire).'),

  // ⚙️ Fonction exécutée quand la commande est utilisée
  async execute(interaction) {
    // ✅ Vérifie que la commande est utilisée dans un serveur (pas en MP)
    if (!interaction.guild) {
      return interaction.reply({
        content: "❌ Cette commande doit être utilisée dans un serveur (pas en message privé).",
        ephemeral: true // Message visible uniquement par l’utilisateur
      });
    }

    // 👤 Récupère l’utilisateur qui a exécuté la commande
    const member = interaction.member;

    // 🎧 Vérifie que l’utilisateur est bien connecté dans un salon vocal
    const voiceChannel = member.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "🔇 Vous devez être connecté à un salon vocal pour que Bai Hu puisse vous rejoindre.",
        ephemeral: true
      });
    }

    // 🤖 Le bot rejoint le salon vocal de l’utilisateur
    try {
      joinVoiceChannel({
        channelId: voiceChannel.id, // ID du salon vocal
        guildId: voiceChannel.guild.id, // ID du serveur
        adapterCreator: voiceChannel.guild.voiceAdapterCreator, // Adaptateur vocal du serveur
        selfDeaf: false, // Le bot garde ses oreilles ouvertes (au cas où tu veux écouter un jour)
        selfMute: false  // Le bot n'est pas muet (nécessaire pour jouer de l’audio plus tard)
      });

      // ✅ Confirmation envoyée à l’utilisateur
      await interaction.reply({
        content: `✅ 白虎 - Bai Hu a rejoint le salon vocal **${voiceChannel.name}**.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('❌ Erreur lors de la connexion au vocal :', error);
      await interaction.reply({
        content: "❌ Une erreur est survenue lors de la tentative de rejoindre le salon vocal.",
        ephemeral: true
      });
    }
  }
};