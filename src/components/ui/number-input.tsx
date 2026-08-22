import * as React from 'react';
import { Input } from '@/components/ui/input';

type BaseProps = Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'>;

export interface NumberInputProps extends BaseProps {
  value: number | string | null | undefined;
  /** Called with the parsed number (0 when empty) and the raw text. */
  onValueChange: (value: number, raw: string) => void;
}

/**
 * Numeric input that never keeps a sticky leading "0".
 * Keeps its own text state so typing "100" over an empty/zero field
 * produces "100" rather than "0100".
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onValueChange, onBlur, ...props }, ref) => {
    const [text, setText] = React.useState<string>(
      value === null || value === undefined || value === '' ? '' : String(value),
    );

    React.useEffect(() => {
      const incoming = value === null || value === undefined || value === '' ? '' : String(value);
      const current = text.trim();
      // Only sync when the external value genuinely differs from what's typed
      if (current === '' ? incoming !== '' && incoming !== '0' : Number(current) !== Number(incoming)) {
        setText(incoming);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
      <Input
        {...props}
        ref={ref}
        type="number"
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          onValueChange(raw === '' ? 0 : Number(raw), raw);
        }}
        onBlur={(e) => {
          if (text !== '') setText(String(Number(text)));
          onBlur?.(e);
        }}
      />
    );
  },
);
NumberInput.displayName = 'NumberInput';
