// 📁 src/commands/utility/verifier.js

// 📦 Imports nécessaires de discord.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');

// 🧠 Mémoire temporaire des utilisateurs en cours de vérification
const attempts = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verifier')
    .setDescription('🔐 Lance une vérification CAPTCHA pour accéder à Dynastie.'),

  async execute(interaction) {
    const { user, guild, channel, client } = interaction;

    // 🔐 Constantes de configuration
    const verificationChannelId = '1399175444225458277'; // ID du salon de vérification
    const verifiedRoleId = '1399195206007390239'; // ID du rôle "membre"
    const logChannelId = '1399133165414649866'; // ID du salon de logs

    // 1️⃣ Vérifie que la commande est utilisée dans le bon salon
    if (channel.id !== verificationChannelId) {
      return interaction.reply({
        content: '❌ Cette commande ne peut être utilisée que dans le salon de vérification.',
        ephemeral: true,
      });
    }

    const member = guild.members.cache.get(user.id);

    // 2️⃣ Vérifie si l'utilisateur est déjà vérifié
    if (member.roles.cache.has(verifiedRoleId)) {
      return interaction.reply({
        content: '✅ Tu es déjà vérifié !',
        ephemeral: true,
      });
    }

    // 3️⃣ Génère un code de vérification aléatoire (6 lettres/chiffres)
    const code = [...Array(6)].map(() =>
      Math.random().toString(36)[2]
    ).join('').toUpperCase();

    // 4️⃣ Enregistre le code et initialise les tentatives
    attempts.set(user.id, { tries: 0, code });

    // 5️⃣ Envoie le code à l’utilisateur (en message éphémère)
    await interaction.reply({
      content: `✍️ Merci de taper ce code dans ce salon : \`${code}\``,
      ephemeral: true,
    });

    // 6️⃣ Création du collecteur pour surveiller les réponses de l’utilisateur
    const filter = m => m.author.id === user.id;
    const collector = channel.createMessageCollector({ filter, time: 2 * 60 * 1000 }); // 2 minutes

    collector.on('collect', async msg => {
      const entry = attempts.get(user.id);
      if (!entry) return;

      const input = msg.content.trim().toUpperCase();

      // ✅ Si le code est correct
      if (input === entry.code) {
        collector.stop();
        attempts.delete(user.id);

        // ✅ Donne le rôle de membre
        await member.roles.add(verifiedRoleId);

        const success = await channel.send({
          content: `✅ Vérification réussie <@${user.id}> ! Tu as maintenant accès à **Dynastie**.`,
        });

        setTimeout(() => {
          msg.delete().catch(() => {});
          success.delete().catch(() => {});
        }, 3000);
        return;
      }

      // ❌ Si le code est incorrect
      entry.tries++;

      // ⛔ Expulse l’utilisateur après 5 tentatives
      if (entry.tries >= 5) {
        collector.stop();
        attempts.delete(user.id);

        const warn = await channel.send({
          content: `❌ Trop d’erreurs <@${user.id}>. Tu vas être expulsé du serveur.`,
        });

        // ⏳ Attend 2s avant de kick + log
        setTimeout(async () => {
          try {
            await member.kick('Échec de la vérification CAPTCHA après 5 essais');
          } catch (err) {
            console.error(`❌ Erreur de kick pour ${member.user.tag} :`, err);
          }

          // 📄 Log dans le salon #archives-du-conseil
          const logChannel = guild.channels.cache.get(logChannelId);
          if (logChannel?.isTextBased()) {
            const logEmbed = new EmbedBuilder()
              .setTitle('🛑 Expulsion automatique')
              .setDescription(`Un utilisateur a échoué la vérification.`)
              .addFields(
                { name: '👤 Utilisateur', value: `${user.tag} (\`${user.id}\`)` },
                { name: '💥 Motif', value: `Échec CAPTCHA (5 tentatives)` },
                { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:f>` }
              )
              .setColor('Red');

            await logChannel.send({ embeds: [logEmbed] });
          }

          warn.delete().catch(() => {});
        }, 2000);

        return;
      }

      // ⚠️ Si mauvais code mais encore des essais restants
      const remaining = 5 - entry.tries;

      const feedback = await channel.send({
        content: `❌ Code incorrect <@${user.id}>. Tentatives restantes : **${remaining}**`,
      });

      setTimeout(() => {
        msg.delete().catch(() => {});
        feedback.delete().catch(() => {});
      }, 3000);
    });

    // 7️⃣ Nettoie la mémoire si le temps est écoulé
    collector.on('end', () => {
      attempts.delete(user.id);
    });
  },
};