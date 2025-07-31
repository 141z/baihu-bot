// 📦 Importation des outils nécessaires
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 📁 Chemin vers le fichier JSON
const dataPath = path.join(__dirname, '../../data/presentations.json');

// 📥 Fonction pour charger les présentations
function loadPresentations() {
  if (!fs.existsSync(dataPath)) return {};
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

// 💾 Fonction pour sauvegarder les changements
function savePresentations(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
  // 📌 Définition de la commande
  data: new SlashCommandBuilder()
    .setName('deletebio')
    .setDescription('❌ Supprime la présentation de quelqu’un')
    .addUserOption(opt =>
      opt.setName('utilisateur')
        .setDescription('L’utilisateur dont tu veux supprimer la présentation')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // 🔐 Limité aux admins/modos

  async execute(interaction) {
    const target = interaction.options.getUser('utilisateur');
    const targetId = target.id;

    // 📂 Chargement des données actuelles
    const presentations = loadPresentations();

    // ❌ Si aucune fiche trouvée
    if (!presentations[targetId]) {
      return interaction.reply({
        content: `❌ ${target.username} n’a pas de présentation à supprimer.`,
        flags: 64
      });
    }

    // 🗑️ Supprimer la fiche
    delete presentations[targetId];
    savePresentations(presentations);

    // 🎨 Créer un embed de confirmation
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Présentation supprimée')
      .setDescription(`La présentation de <@${targetId}> a été supprimée par <@${interaction.user.id}>.`)
      .setColor(0xffffff)
      .setFooter({
        text: `Action par ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    // 🔔 Envoi dans le salon de logs
    const logChannelId = '1399133165414649866';
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (logChannel && logChannel.isTextBased()) {
      logChannel.send({ embeds: [embed] }).catch(console.error);
    }

    // ✅ Réponse à l’admin/modo
    await interaction.reply({
      content: `✅ La présentation de ${target.username} a été supprimée.`,
      flags: 64
    });
  }
};