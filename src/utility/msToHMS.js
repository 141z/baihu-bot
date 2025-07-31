/**
 * ⏱️ Convertit une durée en millisecondes (ms) en un format lisible (HH:MM:SS)
 * Exemple : 95000 ms → "01:35"
 *
 * @param {number} ms - La durée en millisecondes
 * @returns {string} - Une chaîne formatée en heures:minutes:secondes
 */
function msToHMS(ms) {
  // 🧮 On convertit d'abord les millisecondes en secondes
  let totalSeconds = Math.floor(ms / 1000);

  // ⏳ On calcule les heures, minutes et secondes
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // 🧼 On retourne soit HH:MM:SS soit MM:SS si les heures sont inutiles
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ✅ On exporte la fonction pour qu’elle soit utilisable ailleurs
module.exports = { msToHMS };