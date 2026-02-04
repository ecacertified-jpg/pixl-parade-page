
# Correction du systeme de notifications SMS lors de l'ajout d'un contact

## Diagnostic

L'ajout d'un ami avec le numero `+2250707467445` n'a pas declenche de SMS pour deux raisons:

### Probleme 1: Preferences d'alerte manquantes

La table `contact_alert_preferences` est **vide**. La fonction edge `notify-contact-added` verifie les preferences (ligne 77-90):

```javascript
const { data: preferences } = await supabaseAdmin
  .from('contact_alert_preferences')
  .select('*')
  .eq('user_id', user.id)
  .single();

if (!preferences?.alerts_enabled || !preferences?.alert_on_contact_add) {
  return { success: false, message: 'Alerts disabled by user preferences' };
}
```

Comme il n'y a pas de preferences, `preferences` est `null`, donc la condition `!preferences?.alerts_enabled` est vraie et la fonction s'arrete.

### Probleme 2: Preferences non creees automatiquement

Le hook `useContactAlertPreferences` cree les preferences uniquement quand l'utilisateur visite la page des parametres. Mais l'utilisateur qui ajoute un ami ne passe pas forcement par cette page.

---

## Solution

### Etape 1: Modifier la fonction edge pour utiliser des valeurs par defaut

La fonction `notify-contact-added` doit:
1. Verifier si les preferences existent
2. Si non, creer automatiquement des preferences par defaut
3. Continuer avec l'envoi du SMS

### Etape 2: Creer un trigger de base de donnees (optionnel mais recommande)

Creer automatiquement les preferences lors de la creation d'un profil utilisateur via un trigger PostgreSQL.

---

## Changements techniques

### 1. Modification de `supabase/functions/notify-contact-added/index.ts`

Remplacer la logique de verification des preferences par une creation automatique:

```text
AVANT (lignes 76-90):
- Recupere les preferences
- Si pas de preferences OU alerts desactives -> retourne erreur

APRES:
- Recupere les preferences
- Si pas de preferences -> cree les preferences par defaut avec alerts_enabled=true
- Continue avec l'envoi
```

Logique ajoutee:
```javascript
// Get or create user preferences
let { data: preferences } = await supabaseAdmin
  .from('contact_alert_preferences')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle();

// Create default preferences if they don't exist
if (!preferences) {
  const { data: newPrefs } = await supabaseAdmin
    .from('contact_alert_preferences')
    .insert({
      user_id: user.id,
      alerts_enabled: true,
      sms_enabled: true,
      whatsapp_enabled: true,
      email_enabled: false,
      alert_on_contact_add: true,
      alert_10_days: true,
      alert_5_days: true,
      alert_3_days: true,
      alert_2_days: true,
      alert_1_day: true,
      alert_day_of: true,
      notify_of_adder_birthday: true
    })
    .select()
    .single();
  
  preferences = newPrefs;
}

// Now check if alerts are enabled
if (!preferences?.alerts_enabled || !preferences?.alert_on_contact_add) {
  // ...
}
```

### 2. Migration SQL pour le trigger automatique

```sql
CREATE OR REPLACE FUNCTION create_default_contact_alert_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO contact_alert_preferences (
    user_id,
    alerts_enabled,
    sms_enabled,
    whatsapp_enabled,
    email_enabled,
    alert_on_contact_add,
    alert_10_days,
    alert_5_days,
    alert_3_days,
    alert_2_days,
    alert_1_day,
    alert_day_of,
    notify_of_adder_birthday
  ) VALUES (
    NEW.user_id,
    true, true, true, false,
    true, true, true, true, true, true, true, true
  ) ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_create_alert_prefs
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_contact_alert_preferences();
```

### 3. Creer les preferences pour les utilisateurs existants

```sql
INSERT INTO contact_alert_preferences (
  user_id, alerts_enabled, sms_enabled, whatsapp_enabled, email_enabled,
  alert_on_contact_add, alert_10_days, alert_5_days, alert_3_days,
  alert_2_days, alert_1_day, alert_day_of, notify_of_adder_birthday
)
SELECT 
  user_id, true, true, true, false,
  true, true, true, true, true, true, true, true
FROM profiles
WHERE user_id NOT IN (SELECT user_id FROM contact_alert_preferences)
ON CONFLICT (user_id) DO NOTHING;
```

---

## Fichiers modifies

| Fichier | Action |
|---------|--------|
| `supabase/functions/notify-contact-added/index.ts` | Modifier - creation auto des preferences |
| Migration SQL | Creer - trigger + backfill des preferences existantes |

---

## Verification apres correction

1. Supprimer le contact "Marie Belle" et le re-ajouter
2. Verifier dans `birthday_contact_alerts` qu'un enregistrement est cree
3. Verifier que le SMS est recu sur le telephone

```sql
-- Verifier les preferences creees
SELECT * FROM contact_alert_preferences ORDER BY created_at DESC LIMIT 5;

-- Verifier les alertes envoyees
SELECT * FROM birthday_contact_alerts ORDER BY created_at DESC LIMIT 5;
```
