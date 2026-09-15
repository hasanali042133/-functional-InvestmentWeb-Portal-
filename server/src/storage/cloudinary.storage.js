import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

export const isConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const name = 'cloudinary';

export const save = (buffer, { folder, key, resourceType }) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${env.CLOUDINARY_FOLDER}/${folder}`,
        public_id: key,
        resource_type: resourceType,
        overwrite: true,
        invalidate: true,
      },
      (error, result) =>
        error ? reject(error) : resolve({ url: result.secure_url, id: result.public_id }),
    );

    stream.end(buffer);
  });

export const remove = async (id, resourceType) => {
  try {
    await cloudinary.uploader.destroy(id, { resource_type: resourceType });
  } catch (error) {
    // The database row is the source of truth; a leftover remote file is not
    // worth failing the customer's request over.
    console.error('[storage] cloudinary delete failed', id, error.message);
  }
};
