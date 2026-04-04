
-- Gastronomie & Délices
UPDATE products SET category_name = 'Gastronomie & Délices'
WHERE category_name IS NULL
  AND (
    lower(name) ~ '(gâteau|gateau|chocolat|vin |café|cafe|crêpe|crepe|jus |cocktail|bière|biere|pâtisserie|patisserie|bonbon|friandise|miel)'
    OR lower(coalesce(description,'')) ~ '(gâteau|gateau|chocolat|vin |café|cafe|crêpe|crepe|jus |cocktail|bière|biere|pâtisserie|patisserie|bonbon|friandise|miel)'
  );

-- Parfums & Beauté
UPDATE products SET category_name = 'Parfums & Beauté'
WHERE category_name IS NULL
  AND (
    lower(name) ~ '(parfum|soin|crème|creme|garnier|beauté|beaute|mèche|meche|lait corporel|lotion|maquillage|mascara|rouge à lèvres)'
    OR lower(coalesce(description,'')) ~ '(parfum|soin de beauté|garnier|beauté|beaute|maquillage)'
  );

-- Bijoux & Accessoires
UPDATE products SET category_name = 'Bijoux & Accessoires'
WHERE category_name IS NULL
  AND (
    lower(name) ~ '(montre|bracelet|collier|bague|bijou|pendentif|chaîne|chaine|boucle d.oreille)'
    OR lower(coalesce(description,'')) ~ '(montre|bracelet|collier|bague|bijou|pendentif)'
  );

-- Tech & Électronique
UPDATE products SET category_name = 'Tech & Électronique'
WHERE category_name IS NULL
  AND (
    lower(name) ~ '(téléphone|telephone|écouteur|ecouteur|chargeur|airpod|iphone|samsung|laptop|ordinateur|tablette|casque audio|enceinte|bluetooth)'
    OR lower(coalesce(description,'')) ~ '(téléphone|telephone|écouteur|ecouteur|chargeur|airpod|iphone|samsung|laptop|ordinateur|tablette)'
  );

-- Bien-être & Spa
UPDATE products SET category_name = 'Bien-être & Spa'
WHERE category_name IS NULL
  AND (
    lower(name) ~ '(spa|massage|bien-être|bien être|relaxation|yoga|aromathérapie)'
    OR lower(coalesce(description,'')) ~ '(spa|massage|bien-être|bien être|relaxation|yoga|aromathérapie)'
  );

-- Default: Mode & Vêtements for all remaining NULL
UPDATE products SET category_name = 'Mode & Vêtements'
WHERE category_name IS NULL;
