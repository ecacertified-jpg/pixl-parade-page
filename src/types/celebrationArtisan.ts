export interface CelebrationArtisan {
  /** Stable slug key (e.g. "decorateur") */
  role: string;
  /** Human label shown in UI (e.g. "Décorateur") */
  role_label: string;
  /** Optional provider display name */
  name?: string;
  // Reserved for V2 marketplace:
  // provider_id?: string;
  // phone?: string;
  // portfolio_url?: string;
  // rating?: number;
}