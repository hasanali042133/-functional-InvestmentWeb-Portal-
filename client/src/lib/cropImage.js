/**
 * Turns a crop selection into an image file.
 *
 * react-easy-crop reports the selected area in the source image's own pixel
 * coordinates; this draws just that area onto a canvas and exports it, so what
 * gets uploaded is the cropped image rather than the original plus a note about
 * where to cut.
 */

const loadImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('That image could not be read.')));
    image.src = url;
  });

/** Longest edge of the exported image — keeps uploads small without visible loss. */
const MAX_EDGE = 1600;

/**
 * @param {string} imageSrc      object URL of the original file
 * @param {{x:number,y:number,width:number,height:number}} area  crop in source pixels
 * @param {string} fileName
 * @returns {Promise<File>} a JPEG of the cropped region
 */
export const getCroppedImage = async (imageSrc, area, fileName = 'document.jpg') => {
  const image = await loadImage(imageSrc);

  const scale = Math.min(1, MAX_EDGE / Math.max(area.width, area.height));
  const width = Math.round(area.width * scale);
  const height = Math.round(area.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    width,
    height,
  );

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  if (!blob) throw new Error('The cropped image could not be created.');

  const name = fileName.replace(/\.[^.]+$/, '') + '-cropped.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
};

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/** Mirrors the limits the backend enforces, so problems surface before upload. */
export const validateFile = (file) => {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Upload a JPG, PNG, WebP or PDF file.';
  }
  if (file.size > MAX_FILE_BYTES) {
    return `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`;
  }
  return null;
};

export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
