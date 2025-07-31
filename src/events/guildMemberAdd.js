// 📦 Import des classes nécessaires
const { EmbedBuilder, Events } = require('discord.js');

module.exports = {
  name: Events.GuildMemberAdd,

  async execute(member) {
    // 📌 ID du salon où poster le message de bienvenue
    const welcomeChannelId = '1399175399723765781';
    const channel = member.guild.channels.cache.get(welcomeChannelId);

    // ❌ Si le salon n'existe pas ou est inaccessible
    if (!channel || !channel.isTextBased()) return;

    // 🖼️ Avatar du nouveau membre (en PNG haute qualité)
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 512 });

    // 📝 Embed personnalisé
    const welcomeEmbed = new EmbedBuilder()
      .setColor('White') // 🌟 Couleur blanche comme demandé
      .setTitle('🎉 Un nouveau disciple entre dans la Dynastie !')
      .setDescription(`Bienvenue ${member} 👋\n\n➡️ Pour rejoindre officiellement **Dynastie**, rends-toi dans <#1399175444225458277> et utilise la commande </verifier:123456789> pour confirmer que tu n’es pas un automate.\n\nQue ton chemin soit lumineux et tes intentions nobles.`)
      .setThumbnail(avatarURL) // Affiche l’avatar du membre dans le coin
      .setFooter({
        text: `白虎 - Bái Hǔ •  Gardien de la Dynastie`,
        iconURL: member.guild.iconURL({ dynamic: true }),
      });

    // 📤 Envoie le message
    await channel.send({
      content: `✨ ${member} a rejoint l'Empire.`,
      embeds: [welcomeEmbed],
    });
  },
};