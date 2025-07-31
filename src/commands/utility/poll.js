const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('📊 Crée un sondage avec réactions')
    .addStringOption(opt =>
      opt.setName('question')
        .setDescription('La question du sondage')
        .setRequired(true)
    ),

  async execute(interaction) {
    const question = interaction.options.getString('question');

    const embed = new EmbedBuilder()
      .setTitle('🗳️ Sondage')
      .setColor(0xffffff)
      .setDescription(question)
      .setFooter({ text: `Créé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    const pollMessage = await interaction.reply({ embeds: [embed], fetchReply: true });

    await pollMessage.react('✅');
    await pollMessage.react('❌');
  }
};