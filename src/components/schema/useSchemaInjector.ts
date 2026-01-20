import { useEffect, useRef } from 'react';

/**
 * Generic hook to inject JSON-LD structured data into the document head.
 * Handles creation, update, and cleanup of script tags.
 */
export function useSchemaInjector(
  schemaId: string,
  schema: Record<string, unknown> | null
) {
  const schemaRef = useRef<string>('');

  useEffect(() => {
    if (!schema) return;

    const scriptId = `schema-${schemaId}`;
    const schemaString = JSON.stringify(schema);

    // Skip if schema hasn't changed
    if (schemaRef.current === schemaString) return;
    schemaRef.current = schemaString;

    // Remove existing script if any
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    // Create and inject new script
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = schemaString;
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [schemaId, schema]);
}
