

# Plan : Corriger la sélection du mois et de la date dans le calendrier

## Problème

Le calendrier utilise `captionLayout="dropdown-buttons"` mais le composant `Calendar` ne définit pas les styles pour les classes de dropdown de `react-day-picker` : `caption_dropdowns`, `dropdown_month`, `dropdown_year`, `dropdown`. Les `<select>` natifs de mois/année ne sont pas correctement stylisés et les clics ne fonctionnent pas car `caption_label` masque les dropdowns.

## Solution

Ajouter les classNames manquants dans `src/components/ui/calendar.tsx` :

```tsx
caption: "flex justify-center pt-1 relative items-center",
caption_label: "text-sm font-medium hidden",  // masquer le label quand dropdown actif
caption_dropdowns: "flex gap-2 items-center",
dropdown_month: "relative",
dropdown_year: "relative",
dropdown: "appearance-none bg-transparent border border-input rounded-md px-2 py-1 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring",
vhidden: "hidden",
```

Problème : `caption_label: "hidden"` masquerait le label même sans dropdowns. Il faut conditionner : si `captionLayout` inclut "dropdown", on masque le label.

Approche retenue : passer `captionLayout` en prop et conditionner `caption_label` :

```tsx
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout,
  ...props
}: CalendarProps) {
  const isDropdown = captionLayout?.includes('dropdown');
  
  return (
    <DayPicker
      captionLayout={captionLayout}
      classNames={{
        caption_label: cn("text-sm font-medium", isDropdown && "hidden"),
        caption_dropdowns: "flex gap-2 items-center",
        dropdown_month: "relative",
        dropdown_year: "relative",
        dropdown: "appearance-none bg-transparent border border-input rounded-md px-2 py-1 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring",
        vhidden: "hidden",
        // ... rest unchanged
      }}
    />
  );
}
```

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/components/ui/calendar.tsx` | Ajouter les styles dropdown et conditionner `caption_label` |

