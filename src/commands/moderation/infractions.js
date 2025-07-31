// 📦 Importation des modules nécessaires
const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

const fs = require('fs');
const path = require('path');

// 📁 Chemin vers le fichier des avertissements
const warnsFile = path.join(__dirname, '../../../data/warns.json');

module.exports = {
  // 🔧 Définition de la commande slash /infractions
  data: new SlashCommandBuilder()
    .setName('infractions')
    .setDescription('📋 Affiche tous les avertissements reçus par un membre.')
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Le membre dont on veut voir les avertissements')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers), // 🔒 Permission nécessaire

  async execute(interaction) {
    const member = interaction.options.getUser('membre');

    // 🔄 Charger les données de warns
    let warnsData = {};
    if (fs.existsSync(warnsFile)) {
      warnsData = JSON.parse(fs.readFileSync(warnsFile));
    }

    const userWarns = warnsData[member.id];

    // 📭 Si aucun avertissement trouvé
    if (!userWarns || userWarns.length === 0) {
      return interaction.reply({
        content: `✅ **${member.tag}** n'a aucun avertissement.`,
        ephemeral: true
      });
    }

    // 📝 Créer une liste des avertissements
    const warnList = userWarns
      .map((warn, index) => 
        `**${index + 1}.** 📅 <t:${Math.floor(new Date(warn.date).getTime() / 1000)}:f>\n` +
        `🛡️ **Modérateur** : ${warn.moderator}\n` +
        `📌 **Raison** : ${warn.reason}`
      )
      .join('\n\n');

    // 🧾 Créer l'embed
    const embed = new EmbedBuilder()
      .setTitle(`📋 Infractions de ${member.tag}`)
      .setDescription(warnList)
      .setColor('White')
      .setFooter({ text: `Total : ${userWarns.length} avertissement(s)` });

    await interaction.reply({ embeds: [embed] });
  }
};