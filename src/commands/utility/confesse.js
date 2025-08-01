// Importation des classes nécessaires de discord.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  // Définition des données de la commande (structure de la commande slash)
  data: new SlashCommandBuilder()
    .setName('confesse') // Nom de la commande à taper
    .setDescription('Envoyer une confession anonyme au sanctuaire de la Dynastie.')
    .addStringOption(option =>
      option.setName('message') // Nom de l’option obligatoire
        .setDescription('La confession que vous souhaitez partager.')
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option.setName('fichier') // Option image facultative
        .setDescription('Image ou illustration à joindre à votre confession.')
        .setRequired(false) // Ce champ est optionnel
    )
    .setDMPermission(true), // Autorise l’utilisation en message privé (DM)

  // Fonction exécutée quand l’utilisateur utilise la commande
  async execute(interaction) {
    // 🔒 Vérifie que la commande a bien été utilisée en message privé
    if (interaction.guild) {
      return interaction.reply({
        content: "⚠️ Cette commande ne peut être utilisée qu’en message privé avec Bai Hu.",
        ephemeral: true
      });
    }

    // Récupère le texte de la confession
    const confession = interaction.options.getString('message');

    // Récupère le fichier joint s’il y en a un
    const attachment = interaction.options.getAttachment('fichier');

    // 🛕 ID du salon Discord où sera envoyée la confession anonyme
    const confessionChannelId = '1400511768941428870';

    // Tente de récupérer le salon via l’API de Discord
    const confessionChannel = await interaction.client.channels.fetch(confessionChannelId).catch(() => null);

    // Vérifie que le salon existe et accepte les messages texte
    if (!confessionChannel || !confessionChannel.isTextBased()) {
      return interaction.reply({
        content: "❌ Le sanctuaire est introuvable... 白虎 - Bái Hǔ ne peut pas transmettre votre message.",
        ephemeral: true
      });
    }

    // 🖼️ Création de l'embed roleplay anonyme
    const embed = new EmbedBuilder()
      .setTitle('📜 Confession d’un résident de la Dynastie')
      .setDescription(`*« ${confession} »*`)
      .setColor(0xffffff)
      .setFooter({
        text: 'Transmis par 白虎 - Bái Hǔ, le Tigre Blanc',
        iconURL: interaction.client.user.displayAvatarURL()
      })
      .setTimestamp();

    // Si une image a été jointe, on l’ajoute à l’embed
    if (attachment && attachment.contentType?.startsWith('image/')) {
      embed.setImage(attachment.url);
    }

    // Envoie l’embed (et image si présente) dans le salon dédié
    await confessionChannel.send({ embeds: [embed] });

    // 🔔 Réponse privée à l’utilisateur avec lien vers le salon
    await interaction.reply({
      content: `✅ Votre message a été confié à 白虎 - Bái Hǔ et partagé dans le sanctuaire : <#${confessionChannelId}>.\n\n*Que les vents de la sagesse guident votre âme...*`,
      ephemeral: true
    });
  }
};