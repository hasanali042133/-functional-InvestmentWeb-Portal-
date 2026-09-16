import { useCallback, useState } from 'react';

/**
 * Submits a form, and refuses to fail silently.
 *
 * React Hook Form stops on invalid input and leaves each message beside its
 * field — which works right up until the offending field is not on screen. A
 * form that hides a field conditionally, or a rule that reports against a field
 * the customer cannot see, then produces a button that does nothing at all and
 * says nothing about why.
 *
 * So every message is also collected here, for the form to show somewhere it
 * cannot be missed. A duplicated message is a small cost; a dead button is not.
 */
export function useGuardedSubmit(handleSubmit, onValid) {
  const [blockedReasons, setBlockedReasons] = useState([]);

  const collect = useCallback((errors, path = '') => {
    const messages = [];

    for (const [key, value] of Object.entries(errors ?? {})) {
      const field = path ? `${path}.${key}` : key;

      if (typeof value?.message === 'string' && value.message) {
        messages.push(value.message);
      } else if (value && typeof value === 'object' && !value.message) {
        // Nested field groups keep their own error shape.
        messages.push(...collect(value, field));
      }
    }

    return messages;
  }, []);

  const submit = handleSubmit(
    (values) => {
      setBlockedReasons([]);
      return onValid(values);
    },
    (errors) => {
      // Unique, because one rule reporting against two fields should not say the
      // same thing twice.
      setBlockedReasons([...new Set(collect(errors))]);
    },
  );

  return { submit, blockedReasons };
}
