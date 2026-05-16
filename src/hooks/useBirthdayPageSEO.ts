import { useEffect } from 'react';

interface BirthdayPageSEOParams {
  firstName: string;
  age: number | null;
  slug: string;
  coverImage: string | null;
  messagesCount: number;
  photosCount: number;
  celebrationYear: number;
}

const DOMAIN = 'https://joiedevivre-africa.com';

function setOrCreateMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useBirthdayPageSEO({
  firstName,
  age,
  slug,
  coverImage,
  messagesCount,
  photosCount,
  celebrationYear,
}: BirthdayPageSEOParams) {
  useEffect(() => {
    if (!firstName || !slug) return;

    const ageText = age ? `${age} ans` : '';
    const title = age
      ? `Anniversaire de ${firstName} - ${ageText} | JOIE DE VIVRE`
      : `Anniversaire de ${firstName} | JOIE DE VIVRE`;

    const description = age
      ? `Célébrez les ${ageText} de ${firstName} ! Écrivez-lui un message, partagez vos photos et participez au cadeau collectif.`
      : `Célébrez l'anniversaire de ${firstName} ! Écrivez-lui un message, partagez vos photos et participez au cadeau collectif.`;

    const keywords = [
      'anniversaire',
      firstName,
      ageText,
      'cadeau collectif',
      'messages anniversaire',
      'album souvenir',
      'JOIE DE VIVRE',
      'célébration',
      'cagnotte',
      'Côte d\'Ivoire',
      `anniversaire ${celebrationYear}`,
    ].filter(Boolean).join(', ');

    const pageUrl = `${DOMAIN}/birthday/${slug}`;
    const image = coverImage || `${DOMAIN}/og-image.jpg`;

    // Title
    const prevTitle = document.title;
    document.title = title;

    // Meta tags
    setOrCreateMeta('description', description);
    setOrCreateMeta('keywords', keywords);

    // Open Graph
    setOrCreateMeta('og:title', title, true);
    setOrCreateMeta('og:description', description, true);
    setOrCreateMeta('og:url', pageUrl, true);
    setOrCreateMeta('og:type', 'website', true);
    setOrCreateMeta('og:image', image, true);
    setOrCreateMeta('og:site_name', 'JOIE DE VIVRE', true);
    setOrCreateMeta('og:locale', 'fr_FR', true);

    // Twitter Card
    setOrCreateMeta('twitter:card', 'summary_large_image');
    setOrCreateMeta('twitter:title', title);
    setOrCreateMeta('twitter:description', description);
    setOrCreateMeta('twitter:image', image);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', pageUrl);

    return () => {
      document.title = prevTitle;
    };
  }, [firstName, age, slug, coverImage, messagesCount, photosCount, celebrationYear]);
}
