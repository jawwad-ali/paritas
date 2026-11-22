interface JsonBlockProps {
  value: unknown;
  label: string;
}

/** A source payload exactly as received, for audit: monospace, scrollable, never reformatted beyond indentation. */
export const JsonBlock = ({ value, label }: JsonBlockProps) => (
  <pre
    aria-label={label}
    tabIndex={0}
    className="max-h-80 overflow-auto rounded-md border bg-muted p-3 font-mono text-xs leading-relaxed focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
  >
    {JSON.stringify(value, null, 2)}
  </pre>
);
