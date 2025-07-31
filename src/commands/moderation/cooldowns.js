// 📦 Importation des classes nécessaires
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  // 🧩 Définition de la commande slash
  data: new SlashCommandBuilder()
    .setName('cooldowns')
    .setDescription('🐢 Applique un délai (slowmode) dans un salon pour limiter le spam.')
    .addChannelOption(option =>
      option.setName('salon')
        .setDescription('Le salon où appliquer le cooldown')
        .addChannelTypes(ChannelType.GuildText) // uniquement les salons textuels
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('temps')
        .setDescription('Temps en secondes (0 pour désactiver)')
        .setMinValue(0)
        .setMaxValue(21600) // 6 heures max (limite Discord)
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels), // 🔐 Permission requise

  // 🔁 Fonction exécutée quand on utilise la commande
  async execute(interaction) {
    const salon = interaction.options.getChannel('salon');
    const temps = interaction.options.getInteger('temps');

    // 🔒 Vérifie si le bot a les permissions
    if (!salon.manageable) {
      return interaction.reply({
        content: '❌ Je n’ai pas la permission de modifier ce salon.',
        ephemeral: true
      });
    }

    try {
      // 🛠️ Appliquer le slowmode
      await salon.setRateLimitPerUser(temps, `Défini par ${interaction.user.tag}`);

      // 🧾 Création de l’embed de confirmation
      const embed = new EmbedBuilder()
        .setTitle('🐢 Cooldown appliqué')
        .setDescription(
          temps === 0
            ? `✅ Le cooldown a été **désactivé** pour ${salon}.`
            : `✅ Le salon ${salon} a maintenant un **slowmode de \`${temps} seconde(s)\`**.`
        )
        .setColor('White')
        .setFooter({ text: `Modifié par ${interaction.user.tag}` });

      // 💬 Envoie la réponse
      await interaction.reply({ embeds: [embed], ephemeral: false });

    } catch (err) {
      console.error('Erreur dans /cooldowns :', err);
      await interaction.reply({
        content: '❌ Une erreur est survenue en appliquant le cooldown.',
        ephemeral: true
      });
    }
  }
};