const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../../data/presentations.json');

function loadPresentations() {
  if (!fs.existsSync(dataPath)) return {};
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

function savePresentations(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('présentation')
    .setDescription('Crée ou modifie ta fiche de présentation')
    .addStringOption(opt =>
      opt.setName('pseudo').setDescription('👤 Ton pseudo ou surnom').setRequired(true))
    .addStringOption(opt =>
      opt.setName('lieu').setDescription('🌍 D\'où tu viens').setRequired(true))
    .addStringOption(opt =>
      opt.setName('age').setDescription('🎂 Ton âge').setRequired(true))
    .addStringOption(opt =>
      opt.setName('activites').setDescription('🎨 Études, boulot, hobbies...').setRequired(true))
    .addStringOption(opt =>
      opt.setName('aimes').setDescription('❤️ Ce que tu aimes').setRequired(true))
    .addStringOption(opt =>
      opt.setName('detestes').setDescription('💢 Ce que tu détestes').setRequired(true))
    .addStringOption(opt =>
      opt.setName('voyage').setDescription('✈️ Endroit où tu veux aller').setRequired(true))
    .addStringOption(opt =>
      opt.setName('objectif').setDescription('🧭 Ce que tu cherches ici').setRequired(true))
    .addStringOption(opt =>
      opt.setName('funfact').setDescription('🎉 Un fun fact sur toi').setRequired(true)),

  async execute(interaction) {
    const user = interaction.user;
    const userId = user.id;

    const fields = {
      pseudo: interaction.options.getString('pseudo'),
      lieu: interaction.options.getString('lieu'),
      age: interaction.options.getString('age'),
      activites: interaction.options.getString('activites'),
      aimes: interaction.options.getString('aimes'),
      detestes: interaction.options.getString('detestes'),
      voyage: interaction.options.getString('voyage'),
      objectif: interaction.options.getString('objectif'),
      funfact: interaction.options.getString('funfact')
    };

    const presentations = loadPresentations();
    const isNew = !presentations[userId];
    presentations[userId] = fields;
    savePresentations(presentations);

    const embed = new EmbedBuilder()
      .setTitle('📝 Présentation')
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setColor(0xffffff)
      .setDescription(`<@${user.id}> a ${isNew ? 'créé' : 'modifié'} sa présentation`)
      .addFields(
        { name: '👤 Pseudo / surnom', value: fields.pseudo, inline: true },
        { name: '🌍 Lieu', value: fields.lieu, inline: true },
        { name: '🎂 Âge', value: fields.age, inline: true },
        { name: '🎨 Activités', value: fields.activites },
        { name: '❤️ Aime', value: fields.aimes, inline: true },
        { name: '💢 Déteste', value: fields.detestes, inline: true },
        { name: '✈️ Rêve de voyage', value: fields.voyage },
        { name: '🧭 Cherche sur le serveur', value: fields.objectif },
        { name: '🎉 Fun fact', value: fields.funfact }
      )
      .setFooter({
        text: `Envoyé par ${user.username}`,
        iconURL: user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    // ✅ Création du bouton
    const button = new ButtonBuilder()
      .setCustomId('modifier_presentation')
      .setLabel('✏️ Modifier ma présentation')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    // 🎯 Envoie l'embed + bouton dans le salon
    await interaction.reply({
      embeds: [embed],
      components: [row]
    });

    // 🔔 Envoie dans le salon de logs aussi
    const logChannelId = '1399133165414649866';
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (logChannel && logChannel.isTextBased()) {
      logChannel.send({ embeds: [embed] }).catch(console.error);
    }
  }
};