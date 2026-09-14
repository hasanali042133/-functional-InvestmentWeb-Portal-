import { DOCUMENT_TYPES } from '@/lib/accountOptions.js';
import { DocumentUploader } from '@/components/documents/DocumentUploader.jsx';
import { StepShell } from '../StepShell.jsx';
import { Alert } from '@/components/ui/Alert.jsx';

export function DocumentsStep({ documents, onUploaded, onRemoved, onBack, onContinue, serverError }) {
  const byType = Object.fromEntries(documents.map((document) => [document.type, document]));
  const uploadedCount = DOCUMENT_TYPES.filter((definition) => byType[definition.type]).length;
  const allUploaded = uploadedCount === DOCUMENT_TYPES.length;

  return (
    <StepShell
      title="Upload your documents"
      description={`${uploadedCount} of ${DOCUMENT_TYPES.length} uploaded. All three are required.`}
      error={serverError}
      onBack={onBack}
      onSubmit={(event) => {
        event.preventDefault();
        onContinue();
      }}
      canSubmit={allUploaded}
      submitLabel="Continue to review"
    >
      <Alert variant="info">
        Photograph your CNIC on a flat surface in good light, then crop it so only the card is in
        frame. Make sure all text is readable.
      </Alert>

      <div className="space-y-4">
        {DOCUMENT_TYPES.map((definition) => (
          <DocumentUploader
            key={definition.type}
            definition={definition}
            document={byType[definition.type]}
            onUploaded={onUploaded}
            onRemoved={onRemoved}
          />
        ))}
      </div>

      {!allUploaded && (
        <p className="text-sm text-slate-500">
          Upload all three documents to continue.
        </p>
      )}
    </StepShell>
  );
}
