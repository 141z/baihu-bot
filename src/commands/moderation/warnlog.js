// 📁 src/commands/moderation/warnlog.js

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');

const fs = require('fs');
const path = require('path');

// 🔹 Chemin vers le fichier de stockage des warns
const warnsFilePath = path.join(__dirname, '../../../data/warns.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnlog')
    .setDescription('📁 Affiche tous les warns du serveur.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // réservé aux admins

  async execute(interaction) {
    try {
      // 🔸 Lire les warns depuis le fichier JSON
      if (!fs.existsSync(warnsFilePath)) {
        return interaction.reply({
          content: '❌ Aucun warn n’a encore été enregistré.',
          ephemeral: true,
        });
      }

      const warnsData = JSON.parse(fs.readFileSync(warnsFilePath, 'utf-8'));

      if (Object.keys(warnsData).length === 0) {
        return interaction.reply({
          content: '✅ Aucun membre n’a de warn actif.',
          ephemeral: true,
        });
      }

      // 🔹 Générer une liste des warns par utilisateur
      const warnList = Object.entries(warnsData)
        .map(([userId, warnings]) => {
          const userTag = warnings[0]?.tag || 'Utilisateur inconnu';
          return `- **${userTag}** (\`${userId}\`) ➜ ${warnings.length} warn(s)`;
        })
        .join('\n');

      // 🔹 Embed récapitulatif
      const embed = new EmbedBuilder()
        .setTitle('📁 Journal des avertissements')
        .setDescription(warnList)
        .setColor('White')
        .setFooter({ text: `Total: ${Object.keys(warnsData).length} membre(s) averti(s)` });

      // 🔸 Répondre avec l’embed
      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (err) {
      console.error('❌ Erreur warnlog :', err);
      await interaction.reply({
        content: '❌ Une erreur est survenue lors de la lecture des warns.',
        ephemeral: true,
      });
    }
  },
};
