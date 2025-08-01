// 📁 audioQueue.js
// 📦 Gère la file d'attente des lectures vocales de Bai Hu (Text-to-Speech)
// Chaque serveur Discord (guild) dispose de sa propre file d'attente

const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
  getVoiceConnection
} = require('@discordjs/voice');

const fs = require('fs');
const path = require('path');

// 🔄 Map globale : stocke la file d'attente de chaque serveur
const queueMap = new Map();

/**
 * 📌 Ajoute un message audio à la file d'attente d'un serveur
 * @param {Object} options
 * @param {string} options.guildId - ID du serveur Discord
 * @param {string} options.channelId - ID du salon vocal cible
 * @param {string} options.filePath - Chemin vers le fichier audio à jouer (généré via IA)
 */
async function enqueueAudio({ guildId, channelId, filePath }) {
  // 🧱 Si aucune file pour cette guild, on initialise une nouvelle
  if (!queueMap.has(guildId)) {
    queueMap.set(guildId, {
      queue: [],        // Liste des fichiers audio en attente
      playing: false    // Indique si un audio est en cours
    });
  }

  const guildQueue = queueMap.get(guildId);
  guildQueue.queue.push({ channelId, filePath });

  // ▶️ Si rien n’est en train de jouer, on démarre la lecture
  if (!guildQueue.playing) {
    playNext(guildId);
  }
}

/**
 * ▶️ Joue le prochain message dans la file d’un serveur
 * @param {string} guildId - ID du serveur
 */
function playNext(guildId) {
  const guildQueue = queueMap.get(guildId);
  if (!guildQueue || guildQueue.queue.length === 0) {
    // 📭 Fin de la file
    guildQueue.playing = false;
    return;
  }

  const { channelId, filePath } = guildQueue.queue.shift(); // 🔁 Retire le prochain message

  // 🎵 Crée un lecteur audio Discord
  const player = createAudioPlayer();

  // 🔊 Rejoint le salon vocal spécifié
  const connection = joinVoiceChannel({
    channelId,
    guildId,
    adapterCreator: player.voiceAdapterCreator || getVoiceConnection(guildId)?.joinConfig?.adapterCreator,
    selfDeaf: false
  });

  // 📡 Joue la ressource audio
  const resource = createAudioResource(filePath);
  connection.subscribe(player);
  player.play(resource);

  guildQueue.playing = true;

  // 🎯 Quand la lecture est terminée
  player.on(AudioPlayerStatus.Idle, () => {
    // 🧹 Supprime le fichier audio temporaire après lecture
    fs.unlink(filePath, err => {
      if (err) console.error(`[⚠️] Erreur suppression fichier audio :`, err);
    });

    // 🔁 Enchaîne avec le suivant
    playNext(guildId);
  });

  // ⚠️ Gestion des erreurs audio
  player.on('error', err => {
    console.error(`[❌] Erreur de lecture vocale :`, err);
    playNext(guildId); // Continue même si erreur
  });
}

/**
 * 🧼 Vide manuellement la file d'attente d’un serveur
 * @param {string} guildId - ID du serveur
 */
function clearQueue(guildId) {
  const guildQueue = queueMap.get(guildId);
  if (guildQueue) {
    guildQueue.queue = []; // Réinitialise la file
  }
}

/**
 * 🔍 Récupère la file actuelle d’un serveur (utile pour logs ou debug)
 * @param {string} guildId
 * @returns {Array|null}
 */
function getQueue(guildId) {
  const guildQueue = queueMap.get(guildId);
  return guildQueue ? guildQueue.queue : null;
}

// 📤 Exporte les fonctions et la file partagée
module.exports = {
  enqueueAudio,
  clearQueue,
  getQueue,
  queueMap // partagé uniquement si besoin interne
};