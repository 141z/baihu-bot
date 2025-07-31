const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('👤 Affiche les infos d’un membre')
    .addUserOption(opt =>
      opt.setName('utilisateur')
        .setDescription('Le membre à inspecter')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.options.getMember('utilisateur');

    const joinDate = `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`;
    const createdAt = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`;

    const roles = member.roles.cache
      .filter(r => r.name !== '@everyone')
      .map(r => r.toString())
      .join(', ') || 'Aucun';

    const embed = new EmbedBuilder()
      .setTitle(`🔍 Informations sur ${member.user.username}`)
      .setColor(0xffffff)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🆔 ID', value: member.id, inline: true },
        { name: '📅 Compte créé le', value: createdAt, inline: true },
        { name: '📌 A rejoint le', value: joinDate, inline: true },
        { name: '🎭 Rôles', value: roles }
      )
      .setFooter({ text: `Demandé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
