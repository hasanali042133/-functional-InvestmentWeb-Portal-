import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as accountApi from '@/api/account.api.js';
import { useAuth } from '@/hooks/useAuth.js';
import { PageHeader } from '@/components/layout/PageHeader.jsx';
import { StepIndicator } from '@/components/account/StepIndicator.jsx';
import { PersonalStep } from '@/components/account/steps/PersonalStep.jsx';
import { AddressStep } from '@/components/account/steps/AddressStep.jsx';
import { FinancialStep } from '@/components/account/steps/FinancialStep.jsx';
import { InvestmentProfileStep } from '@/components/account/steps/InvestmentProfileStep.jsx';
import { DocumentsStep } from '@/components/account/steps/DocumentsStep.jsx';
import { ReviewStep } from '@/components/account/steps/ReviewStep.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { LoadingSection } from '@/components/ui/Spinner.jsx';
import { ErrorState } from '@/components/ui/States.jsx';

const STEPS = [
  { key: 'personal', title: 'Personal' },
  { key: 'address', title: 'Address' },
  { key: 'financial', title: 'Financial' },
  { key: 'profile', title: 'Investment profile' },
  { key: 'documents', title: 'Documents' },
  { key: 'review', title: 'Review' },
];

/** A date column arrives as an ISO timestamp but an <input type="date"> wants YYYY-MM-DD. */
const toDateInput = (value) => (value ? String(value).slice(0, 10) : '');

const blankApplication = (user) => ({
  fullName: user?.fullName ?? '',
  fatherName: '',
  dateOfBirth: '',
  gender: '',
  cnic: '',
  mobile: '',
  email: user?.email ?? '',
  maritalStatus: '',
  addressLine1: '',
  city: '',
  province: '',
  country: 'Pakistan',
  postalCode: '',
  employmentStatus: '',
  occupation: '',
  employerName: '',
  monthlyIncome: '',
  sourceOfIncome: '',
  expectedInvestmentAmount: '',
  investmentObjective: '',
  riskProfile: '',
  investmentExperience: '',
  investmentFrequency: '',
  termsAccepted: false,
});

export default function AccountOpeningPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const load = () => {
    setIsLoading(true);
    setLoadError(null);

    accountApi
      .getApplication()
      .then((data) => {
        // An account already approved has nothing left to fill in.
        if (data.application?.status === 'APPROVED') {
          navigate('/dashboard', { replace: true });
          return;
        }
        setApplication({
          ...blankApplication(user),
          ...Object.fromEntries(
            Object.entries(data.application ?? {}).filter(([, value]) => value !== null),
          ),
          dateOfBirth: toDateInput(data.application?.dateOfBirth),
        });
        setDocuments(data.documents ?? []);
      })
      .catch(setLoadError)
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  // Moving between steps should start at the top of the new step, not halfway
  // down where the previous step's buttons were.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stepIndex]);

  /** Saves one section as a draft, then advances. */
  const saveSection = async (values) => {
    setIsSaving(true);
    setServerError(null);

    try {
      const data = await accountApi.saveApplication(values);
      setApplication((current) => ({
        ...current,
        ...values,
        ...(data?.application ?? {}),
        dateOfBirth: toDateInput(data?.application?.dateOfBirth ?? values.dateOfBirth),
      }));
      setStepIndex((index) => Math.min(index + 1, STEPS.length - 1));
    } catch (error) {
      setServerError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const data = await accountApi.submitApplication();
      navigate('/account/submitted', {
        replace: true,
        state: { approvedAt: data?.application?.approvedAt },
      });
    } catch (error) {
      setServerError(error.message);
      setIsSubmitting(false);
    }
  };

  const goToStep = (key) => setStepIndex(STEPS.findIndex((step) => step.key === key));
  const back = () => setStepIndex((index) => Math.max(index - 1, 0));

  if (isLoading) {
    return (
      <Card>
        <LoadingSection label="Loading your application" />
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card>
        <ErrorState error={loadError} onRetry={load} />
      </Card>
    );
  }

  const step = STEPS[stepIndex].key;

  return (
    <>
      <PageHeader
        title="Open your investment account"
        description="Your answers are saved as you go, so you can come back and finish later."
      />

      <StepIndicator steps={STEPS} currentIndex={stepIndex} />

      {step === 'personal' && (
        <PersonalStep
          defaultValues={application}
          onSubmit={saveSection}
          isSaving={isSaving}
          serverError={serverError}
        />
      )}

      {step === 'address' && (
        <AddressStep
          defaultValues={application}
          onSubmit={saveSection}
          onBack={back}
          isSaving={isSaving}
          serverError={serverError}
        />
      )}

      {step === 'financial' && (
        <FinancialStep
          defaultValues={application}
          onSubmit={saveSection}
          onBack={back}
          isSaving={isSaving}
          serverError={serverError}
        />
      )}

      {step === 'profile' && (
        <InvestmentProfileStep
          defaultValues={application}
          onSubmit={saveSection}
          onBack={back}
          isSaving={isSaving}
          serverError={serverError}
        />
      )}

      {step === 'documents' && (
        <DocumentsStep
          documents={documents}
          onUploaded={(document) =>
            setDocuments((current) => [
              ...current.filter((item) => item.type !== document.type),
              document,
            ])
          }
          onRemoved={(type) =>
            setDocuments((current) => current.filter((item) => item.type !== type))
          }
          onBack={back}
          onContinue={() => setStepIndex(STEPS.length - 1)}
          serverError={serverError}
        />
      )}

      {step === 'review' && (
        <ReviewStep
          application={application}
          documents={documents}
          onEditStep={goToStep}
          onBack={back}
          onSubmit={handleSubmitApplication}
          isSubmitting={isSubmitting}
          serverError={serverError}
        />
      )}
    </>
  );
}
