// 📁 src/events/messageCreate.js

const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 🔧 Configuration : ID du salon de vérification et XP
const verificationChannelId = '1399175444225458277';
const xpChannelId = '1399233085345632436';

// 📘 Fichier JSON contenant les rôles de niveau
const levelRoles = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/level_roles.json'), 'utf-8'));

// 🧠 Système de mémoire temporaire pour XP (à remplacer par DB si besoin)
const userXP = new Map();

module.exports = {
  name: 'messageCreate',

  async execute(message) {
    // 🚫 Ignore les messages des bots ou les messages hors serveur
    if (message.author.bot || !message.guild) return;

    const { channel, guild, author, member } = message;

    /**
     * 🔐 🔁 SYSTÈME DE VÉRIFICATION : suppression automatique et message d'aide
     */
    if (channel.id === verificationChannelId) {
      // 🧹 Supprime tout message dans le salon de vérification
      setTimeout(() => message.delete().catch(() => {}), 1500);

      // 🧪 Envoie le message explicatif une seule fois
      const recentMessages = await channel.messages.fetch({ limit: 10 });
      const alreadySent = recentMessages.some(msg =>
        msg.author.bot &&
        msg.embeds.length > 0 &&
        msg.embeds[0].title === '🔐 Vérification requise'
      );

      if (!alreadySent) {
        const embed = new EmbedBuilder()
          .setTitle('🔐 Vérification requise')
          .setDescription(
            `Bienvenue jeune voyageur !\n\n` +
            `Pour entrer dans la **Dynastie**, tu dois prouver que tu n’es pas un automate.\n\n` +
            `> Tape la commande \`/verifier\` dans ce salon.\n` +
            `> Tu recevras un **code unique** à recopier dans ce salon.\n` +
            `> En cas de succès, tu obtiendras le rôle <@&1399195206007390239>.\n\n` +
            `⚠️ Après **5 erreurs**, tu seras automatiquement expulsé du serveur.`
          )
          .setColor('White')
          .setFooter({ text: '白虎 - Bái Hǔ • Gardien de la Dynastie' });

        await channel.send({ embeds: [embed] });
      }

      return; // 🔚 Arrête ici pour éviter de traiter l'XP dans ce salon
    }

    /**
     * 📈 📊 SYSTÈME D'XP : accumulation, level up, attribution de rôles
     */
    const key = `${guild.id}-${author.id}`;
    if (!userXP.has(key)) userXP.set(key, { xp: 0, level: 0 });
    const data = userXP.get(key);

    // 🎲 Ajoute de l’XP aléatoire entre 5 et 15
    const xpGain = Math.floor(Math.random() * 10) + 5;
    data.xp += xpGain;

    // 📏 Calcul du niveau : racine carrée simplifiée
    const newLevel = Math.floor(0.1 * Math.sqrt(data.xp));

    if (newLevel > data.level) {
      data.level = newLevel;

      const levelConfig = levelRoles.find(lvl => lvl.level === newLevel);

      if (levelConfig) {
        const role = guild.roles.cache.get(levelConfig.roleId);

        if (role) {
          // 🔁 Retire les anciens rôles de niveau
          const oldRoles = levelRoles
            .filter(lvl => lvl.level !== newLevel)
            .map(lvl => lvl.roleId);
          await member.roles.remove(oldRoles).catch(console.error);

          // ✅ Ajoute le nouveau rôle
          await member.roles.add(role).catch(console.error);

          // 📢 Annonce dans le salon d’XP
          const xpChannel = guild.channels.cache.get(xpChannelId);
          if (xpChannel) {
            xpChannel.send(`🎉 ${member} a atteint le **niveau ${newLevel}** et devient ${role} !`);
          }
        }
      }
    }

    userXP.set(key, data); // 💾 Mise à jour
  },
};