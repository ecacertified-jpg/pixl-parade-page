/**
 * Nettoie les préfixes Meta template ({{1}}, {{2}}, etc.) des paramètres d'URL.
 * Meta Business Manager encode parfois le placeholder comme texte littéral,
 * produisant des URLs comme /f/{{1}}851779a5-... au lieu de /f/851779a5-...
 */
export const cleanMetaParam = (param: string | undefined): string | undefined => {
  if (!param) return param;
  return param.replace(/^\{\{\d+\}\}/, '');
};
