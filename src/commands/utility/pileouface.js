const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pileouface')
    .setDescription('Lance une pièce : pile ou face !'),

  async execute(interaction) {
    const result = Math.random() < 0.5 ? 'pile' : 'face';

    // 📸 Obtenir le chemin de l'image selon le résultat
    const imagePath = path.join(__dirname, '../../assets/coin', `${result}.png`);

    // 🔁 Lire le fichier image
    const imageBuffer = fs.readFileSync(imagePath);

    const embed = new EmbedBuilder()
      .setTitle('🪙 Lancer de pièce')
      .setDescription(`Résultat : **${result.toUpperCase()}**`)
      .setColor(result === 'pile' ? 0xffffff : 0xffffff)
      .setImage(`attachment://${result}.png`);

    await interaction.reply({
      embeds: [embed],
      files: [{
        attachment: imageBuffer,
        name: `${result}.png`
      }]
    });
  }
};