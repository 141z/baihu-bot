// 📁 index.js

// ==============================================
// 🔐 Chargement des variables d’environnement
// ==============================================
require('dotenv').config(); // Charge les variables depuis le fichier `.env`

// 🚀 Importation des modules nécessaires
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 🎧 Import du Manager Lavalink et des fonctions d’init
const { manager, initLavalink, updateVoice } = require('./src/lavalinkClient');

// 🧠 Création du client Discord avec les intentions nécessaires
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates // ✅ Obligatoire pour la musique
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
  ]
});

// 📦 Collection des commandes slash
client.commands = new Collection();

// ==============================================
// 📁 Chargement dynamique des commandes Slash
// ==============================================
const foldersPath = path.join(__dirname, 'src/commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`✅ Commande chargée : ${command.data.name}`);
    } else {
      console.warn(`⚠️ Mauvais format pour la commande : ${filePath}`);
    }
  }
}

// ==============================================
// 📁 Chargement dynamique des événements
// ==============================================
const eventsPath = path.join(__dirname, 'src/events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }

  console.log(`📥 Événement chargé : ${event.name}`);
}

// ===================================================
// 🔄 Connexion à Lavalink après que le bot soit prêt
// ===================================================
client.once('ready', () => {
  console.log(`✅ Connecté à Discord en tant que ${client.user.tag}`);
  initLavalink(client); // 🔁 Initialisation de Lavalink
});

// 📡 Mise à jour des voiceStates (requis par Erela)
client.on('raw', (packet) => updateVoice(packet));

// ==============================================
// 🚀 Connexion du bot à Discord avec le token
// ==============================================
client.login(process.env.TOKEN); // Token sécurisé dans le fichier .env