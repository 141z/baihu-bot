// 📦 Import des classes nécessaires depuis discord.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// 🎵 Manager Erela pour contrôler les players (Lavalink)
const { manager } = require('../../lavalinkClient');

// ⏱️ Fonction utilitaire : formatage de durée (ex: 03:12)
const { msToHMS } = require('../../utility/msToHMS');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('🎶 Affiche la file d’attente musicale actuelle'),

  /**
   * 📥 Fonction exécutée quand un utilisateur utilise la commande /queue
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async execute(interaction) {
    const guildId = interaction.guild.id;

    // 🎧 Récupère le player Erela.js actif pour ce serveur
    const player = manager.players.get(guildId);

    // 🚫 Si aucun player ou aucune musique n’est en cours
    if (!player || !player.queue.current) {
      return interaction.reply({
        content: '❌ Aucun morceau n’est en cours de lecture.',
        ephemeral: true
      });
    }

    // 🎵 Musique en cours
    const current = player.queue.current;

    // 📋 File d’attente (prochains morceaux)
    const upcoming = player.queue.slice(0, 10); // Affiche max 10 morceaux
    const formattedQueue = upcoming
      .map((track, i) => `${i + 1}. **${track.title}** - ${track.author} (${msToHMS(track.duration)})`)
      .join('\n');

    // 🎨 Embed avec la musique actuelle + les prochaines
    const embed = new EmbedBuilder()
      .setTitle('📜 File d’attente musicale')
      .addFields(
        {
          name: '🎶 En cours',
          value: `**${current.title}** - ${current.author} (${msToHMS(current.duration)})`
        },
        {
          name: '📝 Prochain(s)',
          value: formattedQueue.length > 0 ? formattedQueue : 'Aucun autre morceau en attente.'
        }
      )
      .setColor(0xffffff)
      .setFooter({ text: `🎧 Total : ${1 + upcoming.length} morceau(x)` });

    await interaction.reply({ embeds: [embed] });
  }
};