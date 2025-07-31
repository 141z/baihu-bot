const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 📂 Chemin du fichier JSON contenant les présentations
const dataPath = path.join(__dirname, '../../data/presentations.json');

// 📥 Fonction pour charger les présentations
function loadPresentations() {
  if (!fs.existsSync(dataPath)) return {};
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bio')
    .setDescription('Affiche la présentation d’un membre ou toi-même')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('Le membre dont tu veux voir la bio')
        .setRequired(false) // ❗️Le champ devient facultatif
    ),

  async execute(interaction) {
    // 🧠 Si l’utilisateur choisit quelqu’un, on prend cette personne. Sinon, on prend lui-même.
    const member = interaction.options.getUser('utilisateur') || interaction.user;

    // 📂 On charge toutes les présentations enregistrées
    const presentations = loadPresentations();

    // 🔍 On récupère la présentation liée à l'ID du membre
    const data = presentations[member.id];

    // ❌ Si la personne n’a pas encore de présentation
    if (!data) {
      return interaction.reply({
        content: `❌ ${member.id === interaction.user.id ? 'Tu' : member.username + ' n’a'} pas encore rempli de présentation.`,
        ephemeral: true // Message privé
      });
    }

    // ✅ Si la présentation existe, on construit l’embed
    const embed = new EmbedBuilder()
      .setTitle('📝 Présentation')
      .setThumbnail(member.displayAvatarURL({ dynamic: true }))
      .setColor(0xffffff)
      .setDescription(`<@${member.id}>`)
      .addFields(
        { name: '👤 Pseudo / surnom', value: data.pseudo, inline: true },
        { name: '🌍 Lieu', value: data.lieu, inline: true },
        { name: '🎂 Âge', value: data.age, inline: true },
        { name: '🎨 Activités', value: data.activites },
        { name: '❤️ Aime', value: data.aimes, inline: true },
        { name: '💢 Déteste', value: data.detestes, inline: true },
        { name: '✈️ Rêve de voyage', value: data.voyage },
        { name: '🧭 Cherche sur le serveur', value: data.objectif },
        { name: '🎉 Fun fact', value: data.funfact }
      )
      .setFooter({
        text: `Consulté par ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    // 💬 On envoie l'embed dans le salon
    await interaction.reply({ embeds: [embed] });
  }
};