import 'react';

declare module 'react' {
  // Module augmentation must merge into the existing interface, so it cannot become a Record type alias.
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  interface CSSProperties {
    [customProperty: `--${string}`]: string | number | undefined;
  }
}
