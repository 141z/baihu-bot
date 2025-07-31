// 📁 src/utils/modActionLimiter.js

const cooldowns = new Map(); // Map utilisateur → { action: [timestamps] }

// Limites pour chaque type d'action modératrice
const config = {
  ban:  { limit: 3, delay: 10 * 60 * 1000 }, // max 3 bannissements toutes les 10 minutes
  kick: { limit: 5, delay: 10 * 60 * 1000 }  // max 5 kicks toutes les 10 minutes
};

/**
 * Vérifie si un utilisateur est autorisé à effectuer une action (ban/kick)
 * @param {string} userId - ID du modérateur
 * @param {string} guildId - ID du serveur (au cas où tu veux séparer par serveur plus tard)
 * @param {'ban'|'kick'} action - Type d’action modératrice
 * @returns {Promise<{allowed: boolean, retryAfter?: number}>}
 */
module.exports = async function modActionLimiter(userId, guildId, action) {
  const now = Date.now();

  // Crée un espace pour cet utilisateur si pas encore fait
  if (!cooldowns.has(userId)) {
    cooldowns.set(userId, {});
  }

  const userActions = cooldowns.get(userId);

  // Si aucune action de ce type encore enregistrée
  if (!userActions[action]) {
    userActions[action] = [];
  }

  // Nettoyage : garde uniquement les actions encore valides dans la fenêtre de temps
  const delay = config[action].delay;
  userActions[action] = userActions[action].filter(ts => now - ts < delay);

  // Si l’utilisateur est encore dans la limite
  if (userActions[action].length < config[action].limit) {
    userActions[action].push(now); // Enregistre l'action
    return { allowed: true };
  }

  // Sinon, bloque et donne le temps restant avant de réessayer
  const nextTry = userActions[action][0] + delay;
  return {
    allowed: false,
    retryAfter: nextTry
  };
};