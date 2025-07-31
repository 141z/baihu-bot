module.exports = {
  name: 'ready',            // Nom de l’événement (Discord le déclenche quand le bot est prêt)
  once: true,               // Exécuté une seule fois
  execute(client) {
    console.log(`🟢 Connecté en tant que ${client.user.tag}`);
  },
};