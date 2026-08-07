export const environment = {
  production: true,
  // Chemin relatif : nginx sert le frontend ET reverse-proxy /api/ vers gunicorn
  // sur la même VM — aucune IP/domaine à coder en dur.
  apiUrl: '/api',
};
