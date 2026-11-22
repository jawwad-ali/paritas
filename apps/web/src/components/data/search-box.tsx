'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

const DEBOUNCE_MS = 300;

interface SearchBoxProps {
  label: string;
  placeholder: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

/** Typing updates the results after a short pause, not on every keystroke. */
export const SearchBox = ({ label, placeholder, value, onChange }: SearchBoxProps) => {
  const [draft, setDraft] = useState(value ?? '');
  const [synced, setSynced] = useState(value);

  // The URL changed from elsewhere (back button, a cleared filter): show it.
  if (value !== synced) {
    setSynced(value);
    setDraft(value ?? '');
  }

  useEffect(() => {
    const trimmed = draft.trim() || undefined;
    if (trimmed === value) {
      return undefined;
    }
    const timer = setTimeout(() => onChange(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, value, onChange]);

  return (
    <InputGroup className="w-full sm:w-72">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        aria-label={label}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      {draft && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setDraft('')}>
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
};
