// 📆 dire.js — Fait parler Bai Hu avec une voix IA

// 📦 Importe les outils nécessaires de discord.js pour créer une commande slash
const { SlashCommandBuilder } = require('discord.js');

// 🔊 Outils pour rejoindre un salon vocal et jouer de l'audio
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus
} = require('@discordjs/voice');

// 📁 Modules Node.js pour fichiers et chemins
const fs = require('fs');
const path = require('path');

// ⚠️ Correction : import dynamique de node-fetch compatible avec Node 18+
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

require('dotenv').config();

// 🔄 Gestion de la file d'attente audio personnalisée
const { enqueueAudio } = require('../../utils/audioQueue');

// 🕵️ Gestion du log des messages vocaux anonymes
const { logAudioMessage } = require('../../utils/audioLog');

/**
 * 🔧 Génère un fichier audio MP3 depuis du texte via l’API ElevenLabs
 * @param {string} text - Le message à transformer en voix
 * @param {string} filePath - Le chemin de sortie du fichier MP3
 */
async function generateSpeech(text, filePath) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.8
      }
    })
  });

  if (!response.ok) throw new Error('❌ Échec de génération audio (API ElevenLabs).');

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(buffer));
}

module.exports = {
  // 📀 Déclaration de la commande /dire
  data: new SlashCommandBuilder()
    .setName('dire')
    .setDescription('Envoyer une parole anonyme à Bai Hu.')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Le message que Bai Hu doit prononcer.')
        .setRequired(true)
    )
    .setDMPermission(false), // ❌ Utilisable uniquement en serveur (pas en DM)

  /**
   * ⚙️ Fonction exécutée quand un utilisateur utilise la commande
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const texte = interaction.options.getString('message');

    // 🔒 Vérifie que l'utilisateur est bien dans un serveur
    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ Cette commande doit être utilisée dans un serveur.',
        ephemeral: true
      });
    }

    // 🎧 Vérifie que l'utilisateur est bien dans un salon vocal
    const member = interaction.member;
    const voiceChannel = member.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '🔇 Vous devez être connecté à un salon vocal pour utiliser cette commande.',
        ephemeral: true
      });
    }

    // ✅ Confirme la réception du message à l'utilisateur
    await interaction.reply({
      content: `✅ Votre message a bien été confié à 白虎 - Bai Hu.\n🎙️ Il sera prononcé dans **${voiceChannel.name}** sous peu.`,
      ephemeral: true
    });

    // 📁 Vérifie que le dossier temp existe, sinon le créer
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 📁 Définition du chemin de fichier temporaire audio
    const filePath = path.join(tempDir, `${Date.now()}-audio.mp3`);

    try {
      // 🎤 Génère un fichier audio à partir du texte
      await generateSpeech(texte, filePath);

      // 📥 Ajoute ce fichier à la file d'attente audio pour lecture en vocal
      await enqueueAudio({
        guildId: interaction.guild.id,
        channelId: voiceChannel.id,
        filePath
      });

      // 🕵️ Log pour audit (consultable avec /logaudio, réservé aux admins)
      logAudioMessage({
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        message: texte
      });

    } catch (err) {
      console.error('❌ Erreur lors du traitement vocal :', err);
      await interaction.followUp({
        content: '❌ Une erreur est survenue lors de la génération ou de la lecture du message.',
        ephemeral: true
      });
    }
  }
};