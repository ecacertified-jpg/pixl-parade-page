import { DeviceContact } from "@/hooks/useDeviceContacts";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone } from "lucide-react";

interface ContactPickerListProps {
  contacts: DeviceContact[];
  selectedContacts: DeviceContact[];
  onSelectionChange: (contacts: DeviceContact[]) => void;
}

export function ContactPickerList({
  contacts,
  selectedContacts,
  onSelectionChange,
}: ContactPickerListProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isSelected = (contact: DeviceContact) => {
    return selectedContacts.some(
      (c) =>
        c.email === contact.email &&
        c.phone === contact.phone &&
        c.name === contact.name
    );
  };

  const toggleContact = (contact: DeviceContact) => {
    if (isSelected(contact)) {
      onSelectionChange(
        selectedContacts.filter(
          (c) =>
            !(
              c.email === contact.email &&
              c.phone === contact.phone &&
              c.name === contact.name
            )
        )
      );
    } else {
      onSelectionChange([...selectedContacts, contact]);
    }
  };

  const selectAll = () => {
    onSelectionChange(contacts);
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  if (contacts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {contacts.length} contact{contacts.length > 1 ? 's' : ''} importé{contacts.length > 1 ? 's' : ''}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-primary hover:underline text-xs"
          >
            Tout sélectionner
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            type="button"
            onClick={deselectAll}
            className="text-primary hover:underline text-xs"
          >
            Tout désélectionner
          </button>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
        {contacts.map((contact, index) => (
          <div
            key={`${contact.name}-${contact.email}-${contact.phone}-${index}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => toggleContact(contact)}
          >
            <Checkbox
              checked={isSelected(contact)}
              onCheckedChange={() => toggleContact(contact)}
              className="shrink-0"
            />
            
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{contact.name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {contact.email && (
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 shrink-0" />
                    {contact.email}
                  </span>
                )}
                {contact.email && contact.phone && (
                  <span className="mx-1">•</span>
                )}
                {contact.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 shrink-0" />
                    {contact.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedContacts.length > 0 && (
        <p className="text-sm text-primary font-medium">
          {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} sélectionné{selectedContacts.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
