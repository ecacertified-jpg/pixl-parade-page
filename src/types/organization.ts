export type OrganizationPageType = 'birthday' | 'event';

export type OrganizerRole = 'admin' | 'tasks' | 'budget' | 'guests' | 'vendors';
export type OrganizerStatus = 'pending' | 'accepted' | 'revoked';
export type EventTaskStatus = 'todo' | 'in_progress' | 'done';
export type EventGuestStatus = 'invited' | 'confirmed' | 'declined' | 'pending';

export interface EventOrganizer {
  id: string;
  page_type: OrganizationPageType;
  page_id: string;
  user_id: string | null;
  invited_name: string | null;
  invited_phone: string | null;
  invited_email: string | null;
  role: OrganizerRole;
  status: OrganizerStatus;
  invite_token: string | null;
  invited_by: string | null;
  accepted_at: string | null;
  created_at: string;
}

export interface EventTask {
  id: string;
  page_type: OrganizationPageType;
  page_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: EventTaskStatus;
  assigned_to: string | null;
  position: number;
  created_at: string;
}

export interface EventVendor {
  id: string;
  page_type: OrganizationPageType;
  page_id: string;
  category: string;
  name: string;
  phone: string | null;
  notes: string | null;
  business_account_id: string | null;
  created_at: string;
}

export interface EventBudgetItem {
  id: string;
  page_type: OrganizationPageType;
  page_id: string;
  category: string;
  label: string | null;
  planned_amount: number;
  spent_amount: number;
  currency: string;
  notes: string | null;
  created_at: string;
}

export interface EventGuest {
  id: string;
  page_type: OrganizationPageType;
  page_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  contact_id: string | null;
  status: EventGuestStatus;
  note: string | null;
  created_at: string;
}

export const ORGANIZER_ROLE_LABELS: Record<OrganizerRole, { label: string; emoji: string }> = {
  admin: { label: 'Administrateur', emoji: '👑' },
  tasks: { label: 'Responsable préparatifs', emoji: '✅' },
  budget: { label: 'Trésorier', emoji: '💰' },
  guests: { label: 'Responsable invités', emoji: '💌' },
  vendors: { label: 'Responsable prestataires', emoji: '🎨' },
};

export const TASK_STATUS_LABELS: Record<EventTaskStatus, { label: string; emoji: string }> = {
  todo: { label: 'À faire', emoji: '○' },
  in_progress: { label: 'En cours', emoji: '◐' },
  done: { label: 'Terminée', emoji: '✓' },
};

export const GUEST_STATUS_LABELS: Record<EventGuestStatus, { label: string; emoji: string }> = {
  invited: { label: 'Invité', emoji: '💌' },
  pending: { label: 'En attente', emoji: '⏳' },
  confirmed: { label: 'Confirmé', emoji: '🎉' },
  declined: { label: 'Refusé', emoji: '✖️' },
};