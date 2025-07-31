// 📦 Importation des classes nécessaires depuis discord.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');

// 📁 Modules Node.js pour gérer les fichiers et chemins
const fs = require('fs');
const path = require('path');

module.exports = {
  // 🔧 Définition des données de la commande
  data: new SlashCommandBuilder()
    .setName('warn') // Nom de la commande : /warn
    .setDescription('➕ Avertir un membre')
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Le membre à avertir') // Option : utilisateur cible
        .setRequired(true))
    .addStringOption(option =>
      option.setName('raison')
        .setDescription("La raison de l’avertissement") // Option : raison
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers), // Permission requise

  // 🧠 Exécution de la commande
  async execute(interaction) {
    // Récupération des infos
    const target = interaction.options.getUser('membre'); // Utilisateur ciblé
    const reason = interaction.options.getString('raison'); // Raison
    const moderator = interaction.user; // Celui qui lance la commande
    const guild = interaction.guild; // Le serveur

    // 🔎 Vérifie si le membre est encore sur le serveur
    const member = await guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      return interaction.reply({
        content: '❌ Utilisateur introuvable sur ce serveur.',
        ephemeral: true
      });
    }

    // 📁 Chemin vers le fichier JSON contenant les warns
    const filePath = path.join(__dirname, '../../../data/warns.json');
    let data = {};

    // 📥 Lire le fichier s’il existe
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    // 🗂️ Initialiser un tableau si c’est la première fois que cette personne est warn
    if (!data[target.id]) {
      data[target.id] = [];
    }

    // ➕ Ajouter un nouvel avertissement à la liste
    data[target.id].push({
      reason,               // Raison du warn
      date: Date.now(),     // Date actuelle (timestamp)
      mod: moderator.tag    // Qui a lancé le warn
    });

    // 💾 Enregistrer les données mises à jour dans le fichier JSON
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    // ✉️ Essayer d’envoyer un message privé à l’utilisateur averti
    try {
      await target.send(`⚠️ Vous avez été averti sur **${guild.name}**.\n📌 Raison : ${reason}`);
    } catch {
      // Silencieusement ignoré si l’utilisateur bloque les DMs
    }

    // ✅ Embed de confirmation pour l’auteur de la commande
    const embed = new EmbedBuilder()
      .setTitle('✅ Avertissement appliqué')
      .setDescription(`**${target.tag}** a été averti.`)
      .setColor('Green'); // Vert fluo pour les actions réussies

    await interaction.reply({ embeds: [embed] });

    // 📁 Log de l’action dans le salon #archives-du-conseil
    const logChannel = guild.channels.cache.get('1399133165414649866'); // ID du salon

    if (logChannel && logChannel.isTextBased()) {
      const logEmbed = new EmbedBuilder()
        .setTitle('📥 Avertissement')
        .addFields(
          { name: '👤 Membre averti', value: `${target.tag} (<@${target.id}>)` },
          { name: '🛡️ Par', value: `${moderator.tag}` },
          { name: '📌 Raison', value: reason },
          { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:F>` } // Format Discord
        )
        .setColor('White'); // Blanc pour les embeds neutres

      await logChannel.send({ embeds: [logEmbed] });
    }
  }
};