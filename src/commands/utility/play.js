// 📦 Import des outils nécessaires de discord.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// 🎵 Manager Lavalink (Erela)
const { manager, queues } = require('../../lavalinkClient'); // ✅ adapt selon ton arbo

// ⏱️ Convertit des ms vers hh:mm:ss
const { msToHMS } = require('../../utility/msToHMS');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('📀 Joue une musique (titre ou lien)')
    .addStringOption(opt =>
      opt.setName('recherche')
        .setDescription('🔎 Lien ou nom du morceau')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('recherche');
    const voiceChannel = interaction.member.voice.channel;

    // 🔒 Vérifie que l’utilisateur est bien dans un salon vocal
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ Tu dois être dans un salon vocal pour utiliser cette commande.',
        ephemeral: true
      });
    }

    // 📡 Connexion au node Lavalink si pas encore connecté
    if (!manager.nodes.size || !manager.nodes.first().connected) {
      return interaction.reply({
        content: '❌ Le serveur Lavalink n’est pas connecté.',
        ephemeral: true
      });
    }

    // 🛠️ Récupération ou création du player
    const player = manager.create({
      guild: interaction.guild.id,
      voiceChannel: voiceChannel.id,
      textChannel: interaction.channel.id,
      selfDeafen: true
    });

    // 🧭 Rejoint le vocal si ce n’est pas déjà fait
    if (!player.connected) player.connect();

    await interaction.deferReply(); // 🔄 Pour éviter le timeout

    // 🔍 Rechercher la musique via Lavalink
    const res = await manager.search(query, interaction.user);

    if (res.loadType === 'NO_MATCHES') {
      return interaction.editReply({
        content: '❌ Aucun résultat trouvé.'
      });
    }

    if (res.loadType === 'LOAD_FAILED') {
      return interaction.editReply({
        content: '⚠️ Erreur lors du chargement de la piste.'
      });
    }

    const track = res.tracks[0];

    // 🎶 Ajoute la piste à la file
    player.queue.add(track);

    // ▶️ Si rien ne joue, on lance la lecture immédiatement
    if (!player.playing && !player.paused && player.queue.totalSize === 1) {
      player.play();
    }

    // ✅ Réponse avec Embed blanc
    const embed = new EmbedBuilder()
      .setTitle(`🎶 Ajouté à la file : ${track.title}`)
      .addFields(
        { name: '🎤 Auteur', value: track.author, inline: true },
        { name: '⏱️ Durée', value: msToHMS(track.duration), inline: true },
        { name: '🔗 Lien', value: track.uri }
      )
      .setColor(0xffffff);

    return interaction.editReply({ embeds: [embed] });
  }
};
