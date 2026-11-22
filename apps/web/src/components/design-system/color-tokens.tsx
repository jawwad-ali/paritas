import { cn } from '@/lib/utils';

const OCEAN_SUNSET = [
  { hex: '#001219', role: 'Ink: text, the rail' },
  { hex: '#005f73', role: 'Petrol: primary actions' },
  { hex: '#0a9396', role: 'Teal: focus, matched' },
  { hex: '#94d2bd', role: 'Mint: active, dark primary' },
  { hex: '#e9d8a6', role: 'Sand: low severity' },
  { hex: '#ee9b00', role: 'Amber: medium' },
  { hex: '#ca6702', role: 'Orange' },
  { hex: '#bb3e03', role: 'Rust: high' },
  { hex: '#ae2012', role: 'Red: destructive' },
  { hex: '#9b2226', role: 'Crimson: critical' },
];

const SEMANTIC = [
  { name: 'background', className: 'bg-background' },
  { name: 'card', className: 'bg-card' },
  { name: 'muted', className: 'bg-muted' },
  { name: 'accent', className: 'bg-accent' },
  { name: 'primary', className: 'bg-primary' },
  { name: 'ring', className: 'bg-ring' },
  { name: 'destructive', className: 'bg-destructive' },
  { name: 'sidebar', className: 'bg-sidebar' },
  { name: 'matched', className: 'bg-matched' },
];

export const ColorTokens = () => (
  <div className="space-y-6">
    <div>
      <h3 className="mb-2 text-sm font-medium">Ocean Sunset, as the source palette</h3>
      <ol className="grid grid-cols-2 overflow-hidden rounded-md border sm:grid-cols-5 lg:grid-cols-10">
        {OCEAN_SUNSET.map((swatch) => (
          <li key={swatch.hex} className="bg-card">
            <div className="h-16" style={{ backgroundColor: swatch.hex }} />
            <div className="space-y-0.5 p-2">
              <div className="font-mono text-xs">{swatch.hex}</div>
              <div className="text-xs text-muted-foreground">{swatch.role}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
    <div>
      <h3 className="mb-2 text-sm font-medium">Semantic tokens (switch the theme to see dark)</h3>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {SEMANTIC.map((token) => (
          <li key={token.name} className="space-y-1.5">
            <div className={cn('h-10 rounded-sm border', token.className)} />
            <div className="font-mono text-xs">{token.name}</div>
          </li>
        ))}
      </ul>
    </div>
  </div>
);
