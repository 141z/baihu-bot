const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const responses = [
  'Oui.',
  'Non.',
  'Peut-être.',
  'Je ne sais pas.',
  'Bien sûr !',
  'Jamais.',
  'Demande plus tard.',
  'Probablement.',
  'Très improbable.',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('🎱 Pose une question à la boule magique')
    .addStringOption(opt =>
      opt.setName('question')
        .setDescription('Ta question')
        .setRequired(true)
    ),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const answer = responses[Math.floor(Math.random() * responses.length)];

    const embed = new EmbedBuilder()
      .setTitle('🎱 8ball')
      .setColor(0xffffff)
      .addFields(
        { name: '❓ Question', value: question },
        { name: '💬 Réponse', value: answer }
      )
      .setFooter({ text: `Demandé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};