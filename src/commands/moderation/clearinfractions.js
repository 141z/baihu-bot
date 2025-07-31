const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

const fs = require('fs');
const path = require('path');

// 📁 Chemin du fichier de warns
const warnsPath = path.join(__dirname, '../../../data/warns.json');

// 📋 Commande définie ici
module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearinfractions')
    .setDescription('🧼 Supprime tous les avertissements d’un membre.')
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Le membre dont les avertissements seront supprimés.')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const member = interaction.options.getUser('membre');
    const moderator = interaction.user;

    // 📤 Lire les warns existants
    let warnsData = {};
    if (fs.existsSync(warnsPath)) {
      warnsData = JSON.parse(fs.readFileSync(warnsPath));
    }

    const userWarns = warnsData[member.id];

    // 🔍 Vérifie si la personne a des warns
    if (!userWarns || userWarns.length === 0) {
      return interaction.reply({
        content: `✅ **${member.tag}** n’a aucun avertissement à supprimer.`,
        ephemeral: true,
      });
    }

    // 📨 Embed de confirmation
    const confirmEmbed = new EmbedBuilder()
      .setTitle('Confirmation requise')
      .setDescription(`Voulez-vous vraiment supprimer les **${userWarns.length}** avertissement(s) de **${member.tag}** ?`)
      .setColor('White')
      .setFooter({ text: 'Cette action est irréversible.' });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_clear_warns')
        .setLabel('Confirmer')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('cancel_clear_warns')
        .setLabel('Annuler')
        .setStyle(ButtonStyle.Danger)
    );

    const reply = await interaction.reply({
      embeds: [confirmEmbed],
      components: [buttons],
      ephemeral: true
    });

    // 🎯 Collecteur pour gérer les boutons
    const collector = reply.createMessageComponentCollector({ time: 15000 });

    collector.on('collect', async i => {
      if (i.user.id !== moderator.id)
        return i.reply({ content: '❌ Tu ne peux pas interagir ici.', ephemeral: true });

      if (i.customId === 'cancel_clear_warns') {
        await i.update({
          content: '❌ Action annulée.',
          components: [],
          embeds: []
        });
        collector.stop();
        return;
      }

      if (i.customId === 'confirm_clear_warns') {
        // ✅ Supprimer les warns
        delete warnsData[member.id];
        fs.writeFileSync(warnsPath, JSON.stringify(warnsData, null, 2));

        // ✅ Embed de succès
        const successEmbed = new EmbedBuilder()
          .setTitle('✅ Avertissements supprimés')
          .setDescription(`Tous les avertissements de **${member.tag}** ont été supprimés.`)
          .setColor('Green');

        await i.update({
          embeds: [successEmbed],
          components: [],
        });

        // 📝 Log dans le salon des archives
        const logChannel = interaction.guild.channels.cache.get('1399133165414649866');
        if (logChannel && logChannel.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setTitle('🧼 Infractions réinitialisées')
            .addFields(
              { name: '👤 Membre concerné', value: `${member.tag} (\`${member.id}\`)` },
              { name: '🛡️ Par', value: `${moderator.tag}` },
              { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:f>` }
            )
            .setColor('White');

          await logChannel.send({ embeds: [logEmbed] });
        }

        collector.stop();
      }
    });

    // ⛔ Retirer les boutons à la fin
    collector.on('end', () => {
      if (reply.editable) {
        reply.edit({ components: [] }).catch(() => {});
      }
    });
  }
};