// On importe les constructeurs nécessaires depuis la bibliothèque discord.js
// - SlashCommandBuilder : pour créer une commande slash (ex: /roll)
// - EmbedBuilder : pour créer un message enrichi (embed)
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    // Définition de la commande slash avec son nom et sa description
    data: new SlashCommandBuilder()
        .setName('roll') // Nom de la commande que l'utilisateur va taper sur Discord (ex: /roll)
        .setDescription('Lance un dé entre 0 et 100'), // Description visible quand l'utilisateur tape /roll

    // Fonction exécutée lorsqu'un utilisateur utilise la commande
    async execute(interaction) {
        // Génère un nombre entier aléatoire entre 0 et 100
        // Math.random() donne un nombre flottant entre 0 (inclus) et 1 (exclu)
        // Math.random() * 101 donne un nombre flottant entre 0 et 100.999...
        // Math.floor(...) arrondit à l'entier inférieur, donc on obtient un nombre de 0 à 100 inclus
        const result = Math.floor(Math.random() * 101);

        // On récupère le nom d'utilisateur de la personne qui a utilisé la commande
        const username = interaction.user.username;

        // On récupère l'URL de l'avatar de l'utilisateur
        // Le paramètre dynamic: true permet d'utiliser un avatar animé s'il existe (ex: gif)
        const avatarURL = interaction.user.displayAvatarURL({ dynamic: true });

        // Création de l'embed personnalisé pour afficher le résultat
        const embed = new EmbedBuilder()
            .setColor(0xffffff) // Couleur de l'embed (ici blanc, en hexadécimal)
            
            // Définition de l'entête de l'embed (en haut à gauche)
            // Le champ `name` affiche le texte
            // Le champ `iconURL` affiche la photo de profil de l'utilisateur à côté du texte
            .setAuthor({
                name: `${username} a lancé le dé`, // Texte affiché dans l'en-tête
                iconURL: avatarURL, // Avatar à côté du nom
            })

            // Affiche l'avatar de l'utilisateur dans le coin supérieur droit de l'embed
            .setThumbnail(avatarURL)

            // Corps du message : affiche le résultat du dé
            .setDescription(`🎲 Résultat : **${result}**`) // Le résultat est mis en gras avec ** **

            // Pied de page de l'embed, en bas à droite (texte personnalisé)
            .setFooter({ text: username }) // Réaffiche le nom de l'utilisateur

            // Ajoute la date et l'heure à l'embed (en bas à droite automatiquement)
            .setTimestamp();

        // Envoie l'embed en réponse à l'utilisateur
        // On envoie un objet avec la clé `embeds` qui contient un tableau (ici avec un seul embed)
        await interaction.reply({ embeds: [embed] });
    },
};