const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('📊 Affiche les infos sur le serveur'),

  async execute(interaction) {
    const { guild } = interaction;

    // 📋 Données principales du serveur
    const createdAt = `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`;
    const memberCount = guild.memberCount;
    const roles = guild.roles.cache.size;
    const channels = guild.channels.cache.size;

    // 📦 Embed blanc avec les infos
    const embed = new EmbedBuilder()
      .setTitle(`📈 Informations sur ${guild.name}`)
      .setColor(0xffffff)
      .addFields(
        { name: '🆔 ID', value: guild.id, inline: true },
        { name: '📅 Créé le', value: createdAt, inline: true },
        { name: '👥 Membres', value: `${memberCount}`, inline: true },
        { name: '📂 Rôles', value: `${roles}`, inline: true },
        { name: '🧵 Canaux', value: `${channels}`, inline: true }
      )
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setFooter({ text: `Demandé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};