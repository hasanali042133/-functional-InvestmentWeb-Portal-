import { useEffect, useRef, useState } from 'react';
import * as accountApi from '@/api/account.api.js';
import { Button } from '@/components/ui/Button.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Spinner } from '@/components/ui/Spinner.jsx';
import { CropDialog } from './CropDialog.jsx';
import { validateFile, formatFileSize } from '@/lib/cropImage.js';
import { cn } from '@/lib/cn.js';

/**
 * One document slot: choose a file, preview it, optionally crop it, upload it,
 * and replace or remove it afterwards.
 *
 * Selecting a file does not upload it — the customer gets to look at the
 * preview, and crop it, before anything leaves the device.
 */
export function DocumentUploader({ definition, document, onUploaded, onRemoved }) {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [wasCropped, setWasCropped] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isRemoving, setIsRemoving] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Object URLs hold memory until they are revoked.
  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const isPdf = file?.type === 'application/pdf';
  const canCrop = definition.croppable && file && !isPdf;

  const clearSelection = () => {
    setFile(null);
    setPreviewUrl(null);
    setWasCropped(false);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const acceptFile = (candidate) => {
    if (!candidate) return;

    const problem = validateFile(candidate);
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setFile(candidate);
    setWasCropped(false);
    setPreviewUrl(URL.createObjectURL(candidate));

    // Identity cards are almost always photographed with the desk in frame, so
    // offer the crop straight away rather than waiting to be asked.
    if (definition.croppable && candidate.type !== 'application/pdf') {
      setCropOpen(true);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const handleCropped = (croppedFile) => {
    setFile(croppedFile);
    setPreviewUrl(URL.createObjectURL(croppedFile));
    setWasCropped(true);
    setCropOpen(false);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      const data = await accountApi.uploadDocument({
        type: definition.type,
        file,
        isCropped: wasCropped,
        onProgress: setProgress,
      });
      clearSelection();
      onUploaded(data.document);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    setError(null);
    try {
      await accountApi.deleteDocument(document.id);
      onRemoved(definition.type);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setIsRemoving(false);
    }
  };

  // ---------------------------------------------------------------- uploaded

  if (document) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-emerald-200">
            {document.mimeType === 'application/pdf' ? (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-500">
                PDF
              </div>
            ) : (
              <img
                src={document.url}
                alt={`${definition.label} preview`}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{definition.label}</p>
              <Badge tone="success">Uploaded</Badge>
              {document.isCropped && <Badge tone="neutral">Cropped</Badge>}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatFileSize(document.sizeBytes ?? 0)}
            </p>

            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
                Replace
              </Button>
              <Button size="sm" variant="ghost" onClick={handleRemove} loading={isRemoving}>
                Remove
              </Button>
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="sr-only"
          onChange={(event) => acceptFile(event.target.files?.[0])}
        />

        {/* Replacing re-enters the selection flow below. */}
        {file && (
          <div className="mt-4 border-t border-emerald-200 pt-4">
            <SelectionPreview
              definition={definition}
              file={file}
              previewUrl={previewUrl}
              wasCropped={wasCropped}
              isPdf={isPdf}
              canCrop={canCrop}
              isUploading={isUploading}
              progress={progress}
              onCrop={() => setCropOpen(true)}
              onCancel={clearSelection}
              onUpload={handleUpload}
              replacing
            />
          </div>
        )}

        <CropDialog
          open={cropOpen}
          imageSrc={previewUrl}
          fileName={file?.name}
          onCancel={() => setCropOpen(false)}
          onCropped={handleCropped}
        />
      </div>
    );
  }

  // ------------------------------------------------------------ pending file

  if (file) {
    return (
      <>
        <div className="rounded-xl border border-slate-300 bg-white p-4">
          <SelectionPreview
            definition={definition}
            file={file}
            previewUrl={previewUrl}
            wasCropped={wasCropped}
            isPdf={isPdf}
            canCrop={canCrop}
            isUploading={isUploading}
            progress={progress}
            onCrop={() => setCropOpen(true)}
            onCancel={clearSelection}
            onUpload={handleUpload}
          />
          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        </div>

        <CropDialog
          open={cropOpen}
          imageSrc={previewUrl}
          fileName={file.name}
          onCancel={() => setCropOpen(false)}
          onCropped={handleCropped}
        />
      </>
    );
  }

  // ---------------------------------------------------------------- empty

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex w-full flex-col items-center rounded-xl border-2 border-dashed px-5 py-8 text-center transition-colors',
          isDragging
            ? 'border-brand-500 bg-brand-50'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50',
        )}
      >
        <svg
          className="h-8 w-8 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 16V4m0 0L8 8m4-4 4 4" />
          <path d="M20 16.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.5" />
        </svg>

        <p className="mt-3 text-sm font-semibold text-slate-900">{definition.label}</p>
        <p className="mt-1 text-sm text-slate-500">{definition.description}</p>
        <p className="mt-3 text-xs text-slate-400">
          Drop a file here or click to browse · JPG, PNG, WebP or PDF · up to 5 MB
        </p>
      </button>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        onChange={(event) => acceptFile(event.target.files?.[0])}
      />
    </div>
  );
}

function SelectionPreview({
  definition,
  file,
  previewUrl,
  wasCropped,
  isPdf,
  canCrop,
  isUploading,
  progress,
  onCrop,
  onCancel,
  onUpload,
  replacing = false,
}) {
  return (
    <>
      <div className="flex items-start gap-4">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
          {isPdf ? (
            <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-500">
              PDF
            </div>
          ) : (
            <img src={previewUrl} alt="Selected file preview" className="h-full w-full object-cover" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {replacing ? `New ${definition.label.toLowerCase()}` : definition.label}
            </p>
            {wasCropped && <Badge tone="brand">Cropped</Badge>}
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {file.name} · {formatFileSize(file.size)}
          </p>

          {isUploading ? (
            <div className="mt-3 flex items-center gap-2.5">
              <Spinner size="sm" className="text-brand-700" />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-brand-600 transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="tabular text-xs text-slate-500">{progress}%</span>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={onUpload}>
                Upload
              </Button>
              {canCrop && (
                <Button size="sm" variant="secondary" onClick={onCrop}>
                  {wasCropped ? 'Crop again' : 'Crop'}
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
