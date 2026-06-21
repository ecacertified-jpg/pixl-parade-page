import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAllCountries, getCountryCodeByPhonePrefix, DEFAULT_COUNTRY_CODE } from '@/config/countries';
import { useCountrySafe } from '@/contexts/CountryContext';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  /** Full phone value, e.g. "+225 0707..." */
  value: string;
  onChange: (fullValue: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  defaultPrefix?: string;
}

/** Parse stored full phone into { prefix, local }. */
const splitPhone = (full: string, fallbackPrefix: string) => {
  const trimmed = (full || '').trim();
  for (const c of getAllCountries()) {
    if (trimmed.startsWith(c.phonePrefix)) {
      return { prefix: c.phonePrefix, local: trimmed.slice(c.phonePrefix.length).trim() };
    }
  }
  // Treat as local-only number with default prefix
  return { prefix: fallbackPrefix, local: trimmed };
};

export function PhoneInput({
  value,
  onChange,
  placeholder = 'Numéro WhatsApp',
  disabled,
  className,
  defaultPrefix,
}: PhoneInputProps) {
  const country = useCountrySafe();
  const fallback =
    defaultPrefix ||
    country?.country?.phonePrefix ||
    '+225';

  const { prefix, local } = useMemo(() => splitPhone(value, fallback), [value, fallback]);
  const countries = getAllCountries();

  const setPrefix = (next: string) => {
    onChange(local ? `${next} ${local}` : next);
  };
  const setLocal = (next: string) => {
    const cleaned = next.replace(/[^\d\s]/g, '');
    onChange(cleaned ? `${prefix} ${cleaned.trim()}` : '');
  };

  return (
    <div className={cn('flex gap-1.5', className)}>
      <Select value={prefix} onValueChange={setPrefix} disabled={disabled}>
        <SelectTrigger className="w-[110px] shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countries.map((c) => (
            <SelectItem key={c.code} value={c.phonePrefix}>
              <span className="mr-1">{c.flag}</span>
              {c.phonePrefix}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        inputMode="tel"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={20}
        className="flex-1"
      />
    </div>
  );
}

export { getCountryCodeByPhonePrefix };