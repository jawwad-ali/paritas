'use client';

import { Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

/** Every control has a visible label; errors sit under their own field. */
export const FormsShowcase = () => (
  <div className="grid gap-6 rounded-md border bg-card p-4 sm:p-6 lg:grid-cols-2">
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="ds-search">Search exceptions</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput id="ds-search" placeholder="EX-1042, pi_3QgT8a or a customer" />
        </InputGroup>
        <FieldDescription>Type EX- and a number to jump to one exception.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="ds-severity">Severity</FieldLabel>
        <Select defaultValue="CRITICAL">
          <SelectTrigger id="ds-severity" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field orientation="horizontal">
        <Checkbox id="ds-mine" defaultChecked />
        <FieldLabel htmlFor="ds-mine" className="font-normal">
          Only exceptions assigned to me
        </FieldLabel>
      </Field>
    </FieldGroup>
    <FieldGroup>
      <Field data-invalid>
        <FieldLabel htmlFor="ds-reason">Reason for resolving</FieldLabel>
        <Textarea id="ds-reason" aria-invalid defaultValue="ok" rows={3} />
        <FieldError>Give a reason of at least 3 characters.</FieldError>
      </Field>
      <Field data-disabled>
        <FieldLabel htmlFor="ds-amount">Auto-match threshold</FieldLabel>
        <Input id="ds-amount" defaultValue="0.85" disabled className="tabular-nums" />
        <FieldDescription>Only administrators can change matching rules.</FieldDescription>
      </Field>
    </FieldGroup>
  </div>
);
