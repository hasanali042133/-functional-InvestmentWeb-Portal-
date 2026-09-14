/** Joins class names, dropping anything falsy. */
export const cn = (...classes) => classes.filter(Boolean).join(' ');
