// 📦 Importation des outils nécessaires
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { manager } = require('../../lavalinkClient'); // ✅ Chemin vers ton client Lavalink

module.exports = {
  // 🧠 Déclaration slash command
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('⏭️ Passe au morceau suivant dans la file'),

  /**
   * ⏭️ Commande slash pour passer au morceau suivant
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    // 🎤 Vérifie que l’utilisateur est bien dans un salon vocal
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ Tu dois être dans un salon vocal pour utiliser cette commande.',
        ephemeral: true
      });
    }

    // 🎧 Récupère le player Erela pour ce serveur
    const player = manager.players.get(interaction.guild.id);
    if (!player) {
      return interaction.reply({
        content: '📭 Aucun morceau n’est en cours de lecture.',
        ephemeral: true
      });
    }

    // ❗ Vérifie si quelque chose est en cours
    if (!player.queue.current) {
      return interaction.reply({
        content: '⚠️ Aucun morceau à ignorer. La file est vide ou arrêtée.',
        ephemeral: true
      });
    }

    // ⏭️ Skip la piste en cours
    player.stop(); // Cela lance automatiquement la suivante si disponible

    // 🎨 Crée un embed de confirmation
    const embed = new EmbedBuilder()
      .setTitle('⏭️ Morceau ignoré')
      .setDescription('Passage au morceau suivant dans la file...')
      .setColor(0xffffff);

    // 📤 Envoie l’embed
    return interaction.reply({ embeds: [embed] });
  }
};