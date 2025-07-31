// 📦 lavalinkClient.js
// Ce fichier configure la connexion à Lavalink via Erela.js
// et centralise les files d’attente musicales pour chaque serveur Discord

const { Manager } = require("erela.js");

// 🎶 Conteneur de files musicales par serveur
const queues = {};

// 🚨 Important : le client est injecté depuis `index.js` pour éviter les import circulaires
let clientInstance = null;

// 🔗 Création du Manager Erela
const manager = new Manager({
  nodes: [
    {
      host: process.env.LAVALINK_HOST || "localhost",       // 🖥️ Adresse du serveur Lavalink
      port: parseInt(process.env.LAVALINK_PORT || "2333"),  // 🔢 Port (doit correspondre à application.yml)
      password: process.env.LAVALINK_PASSWORD || "youshallnotpass", // 🔐 Mot de passe
      secure: process.env.LAVALINK_SECURE === "true"        // 🔒 SSL (true sur Railway)
    }
  ],

  // 📡 Nécessaire pour que Lavalink envoie correctement les paquets vocaux
  send: (guildId, payload) => {
    const guild = clientInstance?.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  }
});

/**
 * 🚀 Initialise Lavalink (appelé dans index.js quand le bot est prêt)
 * @param {Client} client - Le client Discord
 */
function initLavalink(client) {
  clientInstance = client;
  manager.init(client.user.id);
  console.log("🎵 Lavalink Manager initialisé.");
}

/**
 * 🔁 Transfert les updates de voiceState à Lavalink
 * (appelé dans index.js sur chaque événement `raw`)
 * @param {*} packet - Le paquet Discord
 */
function updateVoice(packet) {
  manager.updateVoiceState(packet);
}

// ✅ Export pour les autres fichiers
module.exports = {
  queues,
  manager,
  initLavalink,
  updateVoice
};