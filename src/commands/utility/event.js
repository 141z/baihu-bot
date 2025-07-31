const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

// Utilisé pour convertir une date/heure en timestamp Discord <t:...:F>
function discordTimestamp(date) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('📅 Crée un événement et permet aux gens de s’inscrire')
    .addStringOption(opt =>
      opt.setName('titre')
        .setDescription('Le titre de l’événement')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('date')
        .setDescription('Date de l’événement (ex: 30/07/2025)')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('heure')
        .setDescription('Heure (ex: 20:30)')
        .setRequired(true)),

  async execute(interaction) {
    const titre = interaction.options.getString('titre');
    const dateStr = interaction.options.getString('date');
    const heureStr = interaction.options.getString('heure');

    // 🕓 Convertit la date + heure en timestamp (Fuseau Europe/Paris)
    const [jour, mois, annee] = dateStr.split('/').map(Number);
    const [heure, minute] = heureStr.split(':').map(Number);
    const eventDate = new Date(Date.UTC(annee, mois - 1, jour, heure - 2, minute)); // UTC+2 l'été

    if (isNaN(eventDate)) {
      return interaction.reply({ content: '❌ Format de date ou heure invalide.', ephemeral: true });
    }

    // 📦 Embed de l’événement
    const embed = new EmbedBuilder()
      .setTitle(`📅 ${titre}`)
      .setDescription(`🕒 **Quand :** ${discordTimestamp(eventDate)}\n\n📝 *Choisis ton statut avec le menu ci-dessous*`)
      .addFields(
        { name: '✅ Participants sûrs', value: '*Aucun pour l’instant*', inline: false },
        { name: '❓ Peut-être', value: '*Aucun pour l’instant*', inline: false },
        { name: '⏰ En retard', value: '*Aucun pour l’instant*', inline: false },
        { name: '❌ Absent', value: '*Aucun pour l’instant*', inline: false }
      )
      .setColor(0xffffff)
      .setFooter({ text: `Créé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    // 🎛️ Menu de sélection des statuts
    const select = new StringSelectMenuBuilder()
      .setCustomId(`event_status`)
      .setPlaceholder('📝 Choisir ton statut')
      .addOptions([
        { label: '✅ Présent', value: 'yes' },
        { label: '❓ Peut-être', value: 'maybe' },
        { label: '⏰ En retard', value: 'late' },
        { label: '❌ Absent', value: 'no' }
      ]);

    const row = new ActionRowBuilder().addComponents(select);

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });

    // ✅ Tu veux maintenant que je fasse la gestion des sélections + le rappel 5 min avant ?
  }
};