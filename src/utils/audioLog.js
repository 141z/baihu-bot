// 📦 Gère les logs internes des messages vocaux (utilisateur, message, date)

const fs = require('fs');
const path = require('path');

// 📍 Chemin du fichier de logs JSON local
const LOG_FILE_PATH = path.join(__dirname, '../data/audioLogs.json');

/**
 * 🔐 Sauvegarde un message vocal dans les logs
 * @param {string} userId - ID de l'utilisateur
 * @param {string} text - Message vocal transmis
 */
function logAudioMessage(userId, text) {
  const data = fs.existsSync(LOG_FILE_PATH)
    ? JSON.parse(fs.readFileSync(LOG_FILE_PATH, 'utf-8'))
    : [];

  data.push({ userId, text, timestamp: new Date().toISOString() });

  fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(data, null, 2));
}

/**
 * 📅 Récupère les logs des dernières 24 heures
 */
function getLogsFromLast24Hours() {
  if (!fs.existsSync(LOG_FILE_PATH)) return [];

  const data = JSON.parse(fs.readFileSync(LOG_FILE_PATH, 'utf-8'));
  const now = Date.now();
  const limit = 24 * 60 * 60 * 1000; // 24h en ms

  return data.filter(entry => now - new Date(entry.timestamp).getTime() <= limit);
}

module.exports = { logAudioMessage, getLogsFromLast24Hours };