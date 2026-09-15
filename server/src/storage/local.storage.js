import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

/**
 * Development fallback so the app runs without a Cloudinary account.
 *
 * Not suitable for deployment: hosting platforms give each instance an
 * ephemeral disk, so uploads written here disappear on the next restart.
 */

export const isConfigured = true;
export const name = 'local disk';

export const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
export const PUBLIC_PATH = '/uploads';

const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

export const save = async (buffer, { folder, key, mimeType }) => {
  const directory = path.join(UPLOAD_ROOT, folder);
  await fs.mkdir(directory, { recursive: true });

  const fileName = `${key}.${EXTENSIONS[mimeType] ?? 'bin'}`;
  const relativePath = path.posix.join(folder, fileName);

  await fs.writeFile(path.join(directory, fileName), buffer);

  return {
    url: `${env.PUBLIC_URL}${PUBLIC_PATH}/${relativePath}`,
    id: relativePath,
  };
};

export const remove = async (id) => {
  try {
    await fs.unlink(path.join(UPLOAD_ROOT, id));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('[storage] local delete failed', id, error.message);
    }
  }
};
