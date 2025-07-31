const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { manager } = require('../../lavalinkClient');
const { msToHMS } = require('../../utility/msToHMS');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('🔎 Recherche et sélectionne un morceau à jouer')
    .addStringOption(opt =>
      opt.setName('recherche')
        .setDescription('Nom ou lien du morceau')
        .setRequired(true)
    ),

  /**
   * 🔍 Commande slash pour rechercher et choisir une piste
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const query = interaction.options.getString('recherche');
    const voiceChannel = interaction.member.voice.channel;

    // 🔒 Vérifie que l'utilisateur est dans un salon vocal
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ Tu dois être dans un salon vocal pour lancer une recherche.',
        ephemeral: true
      });
    }

    // 🎮 Création du player Erela
    let player = manager.players.get(interaction.guild.id);
    if (!player) {
      player = manager.create({
        guild: interaction.guild.id,
        voiceChannel: voiceChannel.id,
        textChannel: interaction.channel.id,
        selfDeafen: true
      });
      player.connect();
    }

    await interaction.deferReply(); // ⏳ Évite le timeout Discord

    // 🔍 Recherche via Lavalink
    const res = await manager.search(query, interaction.user);

    if (!res || !res.tracks || res.tracks.length === 0) {
      return interaction.editReply('❌ Aucun résultat trouvé.');
    }

    const results = res.tracks.slice(0, 5); // Top 5
    const list = results.map((t, i) =>
      `${i + 1}) **${t.title}** - ${t.author} (${msToHMS(t.duration)})`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('🔎 Résultats de recherche')
      .setDescription(list)
      .setFooter({ text: 'Réponds avec un chiffre (1-5) ou "cancel"' })
      .setColor(0xffffff);

    const msg = await interaction.followUp({ embeds: [embed], fetchReply: true });

    // 📩 Collecte la réponse utilisateur
    const collector = msg.channel.createMessageCollector({
      filter: m =>
        m.author.id === interaction.user.id &&
        ['1', '2', '3', '4', '5', 'cancel'].includes(m.content.toLowerCase()),
      time: 15000,
      max: 1
    });

    collector.on('collect', async (response) => {
      const content = response.content.toLowerCase();
      if (content === 'cancel') {
        return interaction.followUp('❌ Recherche annulée.');
      }

      const index = parseInt(content) - 1;
      const selected = results[index];

      player.queue.add(selected);
      if (!player.playing && !player.paused && !player.queue.size) {
        player.play();
      }

      const confirmEmbed = new EmbedBuilder()
        .setTitle(`🎶 Ajouté à la file : ${selected.title}`)
        .addFields(
          { name: '🎤 Auteur', value: selected.author, inline: true },
          { name: '⏱️ Durée', value: msToHMS(selected.duration), inline: true },
          { name: '🔗 Lien', value: selected.uri }
        )
        .setColor(0xffffff);

      interaction.followUp({ embeds: [confirmEmbed] });
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.followUp('⏱️ Temps écoulé. Relance la commande pour réessayer.');
      }
    });
  }
};