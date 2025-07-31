// 📦 Charge les variables d'environnement depuis .env (à mettre en haut)
require('dotenv').config();

// 📦 Importer REST et Routes depuis discord.js
const { REST, Routes } = require('discord.js');

// 📁 Modules pour gérer les fichiers/dossiers
const fs = require('fs');
const path = require('path');

// 📋 Stocke toutes les commandes au format JSON
const commands = [];

// 📂 Chemin vers le dossier contenant les catégories de commandes (src/commands)
const commandsPath = path.join(__dirname, 'commands');

// 📁 On liste tous les dossiers (ex: moderation, music...)
const categories = fs.readdirSync(commandsPath);

// 🔄 Lecture de chaque commande de chaque dossier
for (const category of categories) {
  const categoryPath = path.join(commandsPath, category);

  // 🧼 On vérifie que c’est bien un dossier
  if (!fs.lstatSync(categoryPath).isDirectory()) continue;

  // 📄 Liste tous les fichiers .js dans ce dossier
  const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(categoryPath, file);
    const command = require(filePath);

    // ✅ Vérifie que la commande a les bonnes propriétés
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.warn(`⚠️ La commande ${file} est invalide (il manque data ou execute)`);
    }
  }
}

// 🧠 Récupération des variables d'environnement
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.TOKEN;

// ❌ Vérifie que toutes les infos sont bien présentes
if (!clientId || !guildId || !token) {
  console.error("❌ Erreur : Une ou plusieurs variables d'environnement manquent dans .env");
  process.exit(1);
}

// 📡 Création de l’instance REST pour l’API Discord
const rest = new REST({ version: '10' }).setToken(token);

// 🚀 Déploiement des commandes
(async () => {
  try {
    console.log('🔄 Déploiement des commandes slash...');
    console.log(`📦 ${commands.length} commande(s) détectée(s)`);

    // 🔁 Choix entre déploiement local (rapide) ou global (lent mais pour tous les serveurs)
    // 💡 Active un seul des deux blocs selon ton besoin :

    // === 🌍 GLOBAL : visible sur tous les serveurs (⚠️ prend 1h à apparaître)
    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    // === ⚙️ LOCAL (DEV) : immédiat mais limité à ton serveur de test
    /*
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands
    });
    */

    console.log('✅ Commandes enregistrées avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors du déploiement :', error);
  }
})();