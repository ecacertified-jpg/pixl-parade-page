import { useEffect } from 'react';

interface EventPageSEOParams {
  title: string;
  occasion: string;
  slug: string;
  coverImage: string | null;
  eventDate: string | null;
  description: string | null;
}

const DOMAIN = 'https://joiedevivre-africa.com';

const occasionLabels: Record<string, string> = {
  wedding: 'Mariage',
  baptism: 'Baptême',
  engagement: 'Fiançailles',
  graduation: 'Diplôme',
  promotion: 'Promotion',
  other: 'Événement',
};

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

export function useEventPageSEO({ title, occasion, slug, coverImage, eventDate, description }: EventPageSEOParams) {
  useEffect(() => {
    if (!title || !slug) return;

    const occasionLabel = occasionLabels[occasion] || 'Événement';
    const pageTitle = `${title} | ${occasionLabel} - JOIE DE VIVRE`;
    const desc = description || `Célébrez ce ${occasionLabel.toLowerCase()} ! Écrivez un message, partagez vos photos et participez au cadeau collectif.`;
    const pageUrl = `${DOMAIN}/event/${slug}`;
    const image = coverImage || `${DOMAIN}/og-image.png`;

    const prevTitle = document.title;
    document.title = pageTitle;

    setOrCreateMeta('description', desc);
    setOrCreateMeta('og:title', pageTitle, true);
    setOrCreateMeta('og:description', desc, true);
    setOrCreateMeta('og:url', pageUrl, true);
    setOrCreateMeta('og:type', 'website', true);
    setOrCreateMeta('og:image', image, true);
    setOrCreateMeta('og:site_name', 'JOIE DE VIVRE', true);
    setOrCreateMeta('og:locale', 'fr_FR', true);
    setOrCreateMeta('twitter:card', 'summary_large_image');
    setOrCreateMeta('twitter:title', pageTitle);
    setOrCreateMeta('twitter:description', desc);
    setOrCreateMeta('twitter:image', image);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', pageUrl);

    return () => { document.title = prevTitle; };
  }, [title, occasion, slug, coverImage, eventDate, description]);
}
