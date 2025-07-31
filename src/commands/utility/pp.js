const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pp')
    .setDescription('Affiche la photo de profil d’un utilisateur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('La personne dont tu veux voir l’avatar')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur') || interaction.user;
    const avatarURL = user.displayAvatarURL({ size: 1024, dynamic: true });

    const embed = new EmbedBuilder()
      .setTitle(`🍃 Avatar de ${user.username} 🍃`)
      .setImage(avatarURL)
      .setColor(0xffffff)
      .setFooter({ text: `Demandé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

    await interaction.reply({ embeds: [embed] });
  }
};