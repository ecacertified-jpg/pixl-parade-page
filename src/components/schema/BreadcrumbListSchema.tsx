import { useEffect } from 'react';

const DOMAIN = 'https://joiedevivre-africa.com';

export interface BreadcrumbItem {
  name: string;
  path: string; // Relative path (e.g., '/shop', '/boutique/abc123')
}

export interface BreadcrumbListSchemaProps {
  items: BreadcrumbItem[];
}

/**
 * BreadcrumbList Schema.org component for improved navigation in Google search results.
 */
export function BreadcrumbListSchema({ items }: BreadcrumbListSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${DOMAIN}${item.path}`,
    })),
  };

  useEffect(() => {
    const scriptId = 'schema-breadcrumb-list';

    // Remove existing script if any
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    // Create and inject new script
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [items]);

  return null;
}
