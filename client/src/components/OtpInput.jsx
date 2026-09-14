import { useRef } from 'react';
import { cn } from '@/lib/cn.js';

/**
 * Six single-character boxes behaving as one field.
 *
 * Typing advances, Backspace on an empty box steps back, and pasting a whole
 * code fills every box at once — customers almost always paste the code rather
 * than type it.
 */
export function OtpInput({ value = '', onChange, length = 6, disabled, invalid, autoFocus }) {
  const inputs = useRef([]);

  const setCharacter = (index, character) => {
    const next = value.padEnd(length, ' ').split('');
    next[index] = character;
    onChange(next.join('').replace(/\s/g, ' ').trimEnd());
  };

  const handleChange = (index) => (event) => {
    const digits = event.target.value.replace(/\D/g, '');
    if (!digits) return;

    if (digits.length > 1) {
      // A paste landed in one box: spread it across the remaining boxes.
      const merged = (value.slice(0, index) + digits).slice(0, length);
      onChange(merged);
      inputs.current[Math.min(merged.length, length - 1)]?.focus();
      return;
    }

    setCharacter(index, digits);
    if (index < length - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index) => (event) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (value[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1));
      } else if (index > 0) {
        onChange(value.slice(0, index - 1));
        inputs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < length - 1) inputs.current[index + 1]?.focus();
  };

  const handlePaste = (event) => {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!digits) return;
    event.preventDefault();
    onChange(digits);
    inputs.current[Math.min(digits.length, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          value={value[index] ?? ''}
          onChange={handleChange(index)}
          onKeyDown={handleKeyDown(index)}
          onFocus={(event) => event.target.select()}
          aria-label={`Digit ${index + 1} of ${length}`}
          className={cn(
            'tabular h-14 w-full min-w-0 rounded-lg bg-white text-center text-xl font-semibold',
            'text-slate-900 shadow-sm ring-1 ring-slate-300 ring-inset',
            'focus:ring-2 focus:ring-brand-600 focus:outline-none',
            'disabled:bg-slate-50 disabled:text-slate-400',
            invalid && 'ring-rose-400 focus:ring-rose-500',
          )}
        />
      ))}
    </div>
  );
}
