// 📦 Commande /logaudio — Affiche les messages vocaux anonymes enregistrés par Bai Hu dans les 24 dernières heures (admin only)

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getLogsFromLast24Hours } = require('../../utils/audioLog'); // ✅ chemin corrigé

module.exports = {
  // 📌 Définition de la commande /logaudio
  data: new SlashCommandBuilder()
    .setName('logaudio')
    .setDescription('Afficher les logs vocaux anonymes des dernières 24h (admin seulement).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // 🔐 Commande réservée aux administrateurs
    .setDMPermission(false),

  // ⚙️ Code exécuté lorsque la commande est utilisée
  async execute(interaction) {
    const guildId = interaction.guild.id;

    // 🗃️ Récupère tous les logs du serveur actuel
    const allLogs = getAudioLogs(guildId);

    // 🕒 Filtre uniquement les messages des dernières 24h
    const now = Date.now();
    const logs = allLogs.filter(log => now - new Date(log.date).getTime() <= 24 * 60 * 60 * 1000);

    // 📭 Aucun log trouvé
    if (logs.length === 0) {
      return interaction.reply({
        content: '📭 Aucun message vocal enregistré au cours des dernières 24 heures.',
        ephemeral: true
      });
    }

    // 🧾 Création d'un embed propre pour les logs
    const embed = new EmbedBuilder()
      .setTitle('📚 Confessions anonymes — dernières 24h')
      .setColor(0xffffff) // 🎨 Couleur blanche (neutre)
      .setFooter({ text: 'Données confidentielles — usage modération uniquement' })
      .setTimestamp();

    // 🧩 Ajoute chaque message à l'embed
    logs.reverse().forEach((log, index) => {
      const date = new Date(log.date).toLocaleString('fr-FR');
      embed.addFields({
        name: `#${index + 1} • ${date}`,
        value: `🧑 ID: \`${log.userId}\`\n💬 ${log.message}`
      });
    });

    // 📤 Envoie l'embed uniquement à l'admin
    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};