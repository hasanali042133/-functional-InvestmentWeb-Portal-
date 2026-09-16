/**
 * The token that lets this browser skip the emailed sign-in code.
 *
 * Kept alongside the address it was issued for, so the login screen can tell
 * whether the person typing is the one this browser was remembered for. The
 * server checks that too — this is only so the form can hide a field the
 * customer will not need, never the thing that decides it.
 *
 * Every access is guarded: private browsing can make localStorage throw rather
 * than return null, and a sign-in screen that crashes is worse than one that
 * asks for a code.
 */

const STORAGE_KEY = 'nivesta.trusted-device';

export const readTrustedDevice = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const device = JSON.parse(raw);
    if (!device?.token || !device?.email) return null;

    // Expired locally is expired: no point sending a token the server will
    // refuse, then showing the customer an error it could have avoided.
    if (device.expiresAt && new Date(device.expiresAt).getTime() <= Date.now()) {
      clearTrustedDevice();
      return null;
    }

    return device;
  } catch {
    return null;
  }
};

export const storeTrustedDevice = ({ email, token, expiresAt }) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, token, expiresAt }));
  } catch {
    /* The device simply will not be remembered. */
  }
};

export const clearTrustedDevice = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Nothing to do. */
  }
};

/** The stored token, but only when it belongs to the address being signed in. */
export const tokenForEmail = (email) => {
  const device = readTrustedDevice();
  if (!device || !email) return undefined;

  return device.email.trim().toLowerCase() === email.trim().toLowerCase()
    ? device.token
    : undefined;
};
