const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  // Définition de la commande slash
  data: new SlashCommandBuilder()
    .setName('banlist')
    .setDescription('📋 Affiche la liste des utilisateurs bannis avec leurs ID.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const { guild } = interaction;
    const user = interaction.user;

    // Emojis utilisés pour sélectionner des utilisateurs (max 10)
    const numberEmojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

    // Emojis pour changer de page
    const navigationEmojis = ['⬅️', '➡️'];

    try {
      // On récupère tous les bannis du serveur
      const bans = await guild.bans.fetch();

      if (bans.size === 0) {
        return interaction.reply({
          content: '✅ Aucun utilisateur banni sur ce serveur.',
          ephemeral: true,
        });
      }

      const bannedUsers = bans.map(b => b.user); // liste des utilisateurs bannis
      const perPage = 10; // nombre par page
      let currentPage = 0;

      // Fonction qui crée un embed pour une page donnée
      const getPageEmbed = (page) => {
        const start = page * perPage;
        const pageUsers = bannedUsers.slice(start, start + perPage);

        const description = pageUsers
          .map((u, i) => `${numberEmojis[i]} - **${u.tag}** (*${u.id}*)`)
          .join('\n');

        return new EmbedBuilder()
          .setTitle('🔨 Utilisateurs bannis')
          .setDescription(description || 'Aucun utilisateur sur cette page.')
          .setColor('White')
          .setFooter({ text: `Page ${page + 1}/${Math.ceil(bannedUsers.length / perPage)}` });
      };

      // Envoie de la première page
      const message = await interaction.reply({
        embeds: [getPageEmbed(currentPage)],
        fetchReply: true,
      });

      // Fonction pour obtenir les utilisateurs de la page actuelle
      const pageUsers = () =>
        bannedUsers.slice(currentPage * perPage, (currentPage + 1) * perPage);

      // Ajout des réactions de sélection utilisateur
      for (let i = 0; i < pageUsers().length; i++) {
        await message.react(numberEmojis[i]);
      }

      // Si plusieurs pages, on ajoute les réactions de navigation
      if (bannedUsers.length > perPage) {
        await message.react('⬅️');
        await message.react('➡️');
      }

      // Création du collecteur de réactions (écoute uniquement l’utilisateur qui a lancé la commande)
      const collector = message.createReactionCollector({
        time: 60000, // temps d'écoute : 60 secondes
        filter: (reaction, reactingUser) => reactingUser.id === user.id,
      });

      // Lorsqu'une réaction est ajoutée
      collector.on('collect', async (reaction) => {
        const emoji = reaction.emoji.name;

        // 👉 L'utilisateur sélectionne un utilisateur de la liste
        if (numberEmojis.includes(emoji)) {
          const index = numberEmojis.indexOf(emoji);
          const targetUser = pageUsers()[index];

          if (!targetUser) return;

          // Envoie un message contenant uniquement l’ID (copiable facilement)
          await message.channel.send(` \`${targetUser.id}\``);

          return collector.stop(); // on arrête après une sélection
        }

        // ⬅️ Page précédente
        if (emoji === '⬅️' && currentPage > 0) {
          currentPage--;
        }

        // ➡️ Page suivante
        if (emoji === '➡️' && (currentPage + 1) * perPage < bannedUsers.length) {
          currentPage++;
        }

        // Met à jour l’embed de la page affichée
        await message.edit({ embeds: [getPageEmbed(currentPage)] });

        // Réinitialise les réactions (efface tout et remet selon la nouvelle page)
        await message.reactions.removeAll();

        // Réactions pour les utilisateurs
        for (let i = 0; i < pageUsers().length; i++) {
          await message.react(numberEmojis[i]);
        }

        // Réactions de navigation si nécessaire
        if (bannedUsers.length > perPage) {
          await message.react('⬅️');
          await message.react('➡️');
        }
      });

      // Nettoyage final des réactions à la fin du temps
      collector.on('end', () => {
        message.reactions.removeAll().catch(() => {});
      });

    } catch (err) {
      console.error('❌ Erreur dans /banlist :', err);
      await interaction.reply({
        content: '❌ Une erreur est survenue lors de l\'exécution de la commande.',
        ephemeral: true,
      });
    }
  },
};