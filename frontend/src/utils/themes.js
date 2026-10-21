// Règles de thèmes : chaque règle associe un thème à une liste de villes.
// Pour ajouter une autre ville, ajoute une ligne : nom et pays en minuscules, sans accents.
const REGLES = [{ theme: 'doudounette', villes: [{ nom: 'cremieu', pays: 'france' }] }]

// "Crémieu" devient "cremieu" : normalize('NFD') sépare chaque lettre de son accent
// (é devient e + accent), puis le replace retire les accents.
function normaliser(texte) {
  return String(texte ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

// Renvoie le nom du thème  ou null si la ville n'en a pas.
export function themeDe(ville) {
  if (!ville) return null
  const nom = normaliser(ville.nom)
  const pays = normaliser(ville.pays)
  for (const regle of REGLES) {
    if (regle.villes.some((v) => v.nom === nom && v.pays === pays)) return regle.theme
  }
  return null
}