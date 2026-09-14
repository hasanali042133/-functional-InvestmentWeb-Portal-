import { StepShell } from '../StepShell.jsx';
import { Alert } from '@/components/ui/Alert.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { formatCurrency, formatDate } from '@/lib/format.js';
import {
  GENDERS,
  MARITAL_STATUSES,
  EMPLOYMENT_STATUSES,
  RISK_PROFILES,
  DOCUMENT_TYPES,
} from '@/lib/accountOptions.js';

const labelFor = (options, value) =>
  options.find((option) => option.value === value)?.label ?? value ?? '—';

function Section({ title, onEdit, rows }) {
  return (
    <div className="rounded-lg ring-1 ring-slate-200 ring-inset">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          Edit
        </button>
      </div>
      <dl className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-4 px-4 py-2.5">
            <dt className="w-44 shrink-0 text-sm text-slate-500">{row.label}</dt>
            <dd className="min-w-0 flex-1 text-sm break-words text-slate-900">{row.value || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ReviewStep({ application, documents, onEditStep, onBack, onSubmit, isSubmitting, serverError }) {
  const byType = Object.fromEntries(documents.map((document) => [document.type, document]));

  return (
    <StepShell
      title="Review and submit"
      description="Check everything below. You can edit any section before submitting."
      error={serverError}
      onBack={onBack}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      isSaving={isSubmitting}
      submitLabel="Submit application"
    >
      <div className="space-y-4">
        <Section
          title="Personal information"
          onEdit={() => onEditStep('personal')}
          rows={[
            { label: 'Full name', value: application.fullName },
            { label: "Father's / mother's name", value: application.fatherName },
            { label: 'Date of birth', value: formatDate(application.dateOfBirth) },
            { label: 'Gender', value: labelFor(GENDERS, application.gender) },
            { label: 'CNIC', value: application.cnic },
            { label: 'Mobile', value: application.mobile },
            { label: 'Email', value: application.email },
            { label: 'Marital status', value: labelFor(MARITAL_STATUSES, application.maritalStatus) },
          ]}
        />

        <Section
          title="Address"
          onEdit={() => onEditStep('address')}
          rows={[
            { label: 'Address', value: application.addressLine1 },
            { label: 'City', value: application.city },
            { label: 'Province', value: application.province },
            { label: 'Country', value: application.country },
            { label: 'Postal code', value: application.postalCode },
          ]}
        />

        <Section
          title="Employment and financial"
          onEdit={() => onEditStep('financial')}
          rows={[
            {
              label: 'Employment status',
              value: labelFor(EMPLOYMENT_STATUSES, application.employmentStatus),
            },
            { label: 'Occupation', value: application.occupation },
            { label: 'Employer', value: application.employerName },
            { label: 'Monthly income', value: formatCurrency(application.monthlyIncome) },
            { label: 'Source of income', value: application.sourceOfIncome },
            {
              label: 'Expected investment',
              value: formatCurrency(application.expectedInvestmentAmount),
            },
          ]}
        />

        <Section
          title="Investment profile"
          onEdit={() => onEditStep('profile')}
          rows={[
            { label: 'Objective', value: application.investmentObjective },
            { label: 'Risk profile', value: labelFor(RISK_PROFILES, application.riskProfile) },
            { label: 'Experience', value: application.investmentExperience },
            { label: 'Frequency', value: application.investmentFrequency },
          ]}
        />

        <div className="rounded-lg ring-1 ring-slate-200 ring-inset">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Documents</h3>
            <button
              type="button"
              onClick={() => onEditStep('documents')}
              className="text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Edit
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {DOCUMENT_TYPES.map((definition) => (
              <li key={definition.type} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 text-sm text-slate-900">{definition.label}</span>
                {byType[definition.type] ? (
                  <>
                    {byType[definition.type].isCropped && <Badge tone="neutral">Cropped</Badge>}
                    <Badge tone="success">Uploaded</Badge>
                  </>
                ) : (
                  <Badge tone="danger">Missing</Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Alert variant="warning" title="Before you submit">
        Once submitted, your application is checked and your account is activated. Make sure the
        details above match your CNIC.
      </Alert>
    </StepShell>
  );
}
