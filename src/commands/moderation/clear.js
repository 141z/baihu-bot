// 📦 Importation des outils nécessaires depuis discord.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  // 🧩 Définition de la commande slash
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('🧹 Supprime un nombre de messages, avec ou sans utilisateur ciblé.')
    .addIntegerOption(option =>
      option.setName('nombre')
        .setDescription('Nombre de messages à supprimer (max 100)')
        .setRequired(true)
    )
    .addUserOption(option =>
      option.setName('cible')
        .setDescription("Supprimer uniquement les messages de cet utilisateur")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages), // Permission requise

  async execute(interaction) {
    const { channel, guild, user, options } = interaction;
    const amount = options.getInteger('nombre');
    const target = options.getUser('cible');

    // 🛑 Vérifie que la quantité est valide
    if (amount < 1 || amount > 100) {
      return interaction.reply({
        content: '❌ Le nombre de messages doit être compris entre 1 et 100.',
        ephemeral: true,
      });
    }

    try {
      // 📩 Récupère jusqu’à 100 messages récents du salon
      const messages = await channel.messages.fetch({ limit: 100 });

      let messagesToDelete;

      // 🎯 Si un utilisateur est spécifié, filtre uniquement ses messages
      if (target) {
        messagesToDelete = messages
          .filter(msg => msg.author.id === target.id)
          .first(amount);
      } else {
        messagesToDelete = messages.first(amount);
      }

      // 🧹 Supprime les messages filtrés
      const deleted = await channel.bulkDelete(messagesToDelete, true);

      // ✅ Embed de confirmation (ephemeral)
      const confirmEmbed = new EmbedBuilder()
        .setTitle('🧹 Nettoyage effectué')
        .setDescription(`**${deleted.size}** message(s) supprimé(s) ${target ? `de **${target.tag}**` : ''}.`)
        .setColor('White');

      await interaction.reply({
        embeds: [confirmEmbed],
        ephemeral: true,
      });

      // 🗃️ Envoie un log dans le salon des archives
      const logChannel = guild.channels.cache.get('1399133165414649866');
      if (logChannel && logChannel.isTextBased()) {
        const logEmbed = new EmbedBuilder()
          .setTitle('📛 Suppression de messages')
          .addFields(
            { name: '👮 Modérateur', value: user.tag, inline: true },
            { name: '💬 Salon', value: `${channel}`, inline: true },
            { name: '🧹 Supprimés', value: `${deleted.size} message(s) ${target ? `de ${target.tag}` : ''}`, inline: false },
            { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:f>` }
          )
          .setColor('White');

        await logChannel.send({ embeds: [logEmbed] });
      }

    } catch (error) {
      console.error('❌ Erreur lors du clear :', error);
      return interaction.reply({
        content: '❌ Une erreur est survenue. Vérifie mes permissions ou l’ancienneté des messages.',
        ephemeral: true,
      });
    }
  },
};
