import { isProduction } from '../config/env.js';
import * as cloudinary from './cloudinary.storage.js';
import * as local from './local.storage.js';
import { AppError } from '../utils/AppError.js';

// Cloudinary when it is configured, otherwise the local disk. Production is not
// allowed to fall back: a platform instance has an ephemeral disk, so uploads
// would vanish on the next deploy and customers would lose their documents.
const adapter = cloudinary.isConfigured ? cloudinary : local;

if (cloudinary.isConfigured) {
  console.info('[storage] using cloudinary');
} else if (isProduction) {
  console.error('[storage] Cloudinary is not configured. Document uploads will be rejected.');
} else {
  console.warn('[storage] Cloudinary is not configured, falling back to local disk (development only)');
}

const assertUsable = () => {
  if (!cloudinary.isConfigured && isProduction) {
    throw new AppError(
      503,
      'Document uploads are not available right now.',
      'STORAGE_NOT_CONFIGURED',
    );
  }
};

export const storageName = adapter.name;
export const usingLocalDisk = adapter === local;

export const saveFile = (buffer, options) => {
  assertUsable();
  return adapter.save(buffer, options);
};

export const deleteFile = (id, resourceType) => {
  if (!cloudinary.isConfigured && isProduction) return Promise.resolve();
  return adapter.remove(id, resourceType);
};
