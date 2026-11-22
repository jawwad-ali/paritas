'use client';

import { Eye, EyeOff } from 'lucide-react';
import { type ComponentProps, useState } from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

type PasswordInputProps = Omit<ComponentProps<'input'>, 'type'> & {
  /** Sizes the group, e.g. `h-10` on the sign-in form. */
  groupClassName?: string;
};

/** A password field with a show/hide toggle; the toggle states whether the text is visible. */
export const PasswordInput = ({ groupClassName, ...props }: PasswordInputProps) => {
  const [shown, setShown] = useState(false);
  return (
    <InputGroup className={groupClassName}>
      <InputGroupInput type={shown ? 'text' : 'password'} {...props} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          onClick={() => setShown((visible) => !visible)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
        >
          {shown ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
};
