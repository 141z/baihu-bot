// 📁 src/commands/moderation/setup-ticket.js

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  // 📌 Définition de la commande slash
  data: new SlashCommandBuilder()
    .setName('setup-ticket')
    .setDescription('🎫 Crée le message de création de ticket.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // 🔐 Réservée aux admins

  async execute(interaction) {
    // 🛡️ Vérifie que le salon cible existe (par ID)
    const setupChannel = interaction.guild.channels.cache.get('1399203017223438346'); // Salon de création de ticket
    if (!setupChannel) {
      return interaction.reply({ content: '❌ Le salon de configuration est introuvable.', ephemeral: true });
    }

    // 🧾 Embed d’explication pour créer un ticket
    const embed = new EmbedBuilder()
      .setTitle('📬 Créer un ticket')
      .setDescription('Si tu as besoin d’aide, clique sur le bouton ci-dessous pour ouvrir un ticket privé avec le staff.\nUn salon privé sera automatiquement créé pour toi.')
      .setColor('White');

    // 🎫 Bouton de création de ticket
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Créer un ticket')
        .setEmoji('📬')
        .setStyle(ButtonStyle.Primary)
    );

    // 📨 Envoie du message dans le salon de configuration
    await setupChannel.send({ embeds: [embed], components: [row] });

    // ✅ Réponse à l’admin qui a exécuté la commande
    await interaction.reply({ content: '✅ Le message de création de ticket a été envoyé avec succès.', ephemeral: true });
  }
};