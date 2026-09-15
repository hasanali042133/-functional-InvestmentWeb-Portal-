import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/Button.jsx';
import { getCroppedImage } from '@/lib/cropImage.js';

/**
 * Crop an uploaded identity document before it is submitted.
 *
 * The frame is locked to 1.585:1 — the ISO card ratio a CNIC uses — so the
 * customer is guided to trim away the desk or table around the card rather than
 * choosing an arbitrary shape.
 */
const CARD_ASPECT = 1.585;

export function CropDialog({ open, imageSrc, fileName, onCancel, onSkip, onCropped }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleCropComplete = useCallback((_area, areaInPixels) => {
    setAreaPixels(areaInPixels);
  }, []);

  if (!open) return null;

  const handleSave = async () => {
    if (!areaPixels) return;
    setIsSaving(true);
    setError(null);
    try {
      const file = await getCroppedImage(imageSrc, areaPixels, fileName);
      onCropped(file);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Crop document"
    >
      <div className="flex max-h-[95dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Crop your document</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Drag to reposition and use the slider to zoom, so only the card is in frame.
          </p>
        </div>

        <div className="relative h-72 bg-slate-900 sm:h-96">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={CARD_ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            objectFit="contain"
            showGrid
          />
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <label className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Zoom</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-1.5 flex-1 accent-[var(--color-brand-700)]"
              aria-label="Zoom level"
            />
          </label>

          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
              Choose a different file
            </Button>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="secondary" onClick={onSkip} disabled={isSaving}>
                Upload without cropping
              </Button>
              <Button onClick={handleSave} loading={isSaving} disabled={!areaPixels}>
                {isSaving ? 'Uploading' : 'Crop and upload'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
