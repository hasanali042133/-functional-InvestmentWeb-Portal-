import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { financialSchema } from '@/lib/accountValidators.js';
import { useGuardedSubmit } from '@/hooks/useGuardedSubmit.js';
import {
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_WITHOUT_EMPLOYER,
  SOURCES_OF_INCOME,
} from '@/lib/accountOptions.js';
import { StepShell } from '../StepShell.jsx';
import { Input, Select, CurrencyInput } from '@/components/ui/Field.jsx';

export function FinancialStep({ defaultValues, onSubmit, onBack, isSaving, serverError }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(financialSchema),
    mode: 'onTouched',
    defaultValues,
  });

  const { submit, blockedReasons } = useGuardedSubmit(handleSubmit, onSubmit);

  const employmentStatus = watch('employmentStatus');

  // A student or retiree has no employer to name, so the field is hidden rather
  // than shown as an awkward optional blank.
  const showEmployer = employmentStatus && !EMPLOYMENT_WITHOUT_EMPLOYER.includes(employmentStatus);

  return (
    <StepShell
      title="Employment and financial details"
      description="Regulations require us to understand the source of the funds you invest."
      error={serverError}
      isSaving={isSaving}
      onBack={onBack}
      onSubmit={submit}
      blockedReasons={blockedReasons}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="Employment status"
          required
          options={EMPLOYMENT_STATUSES}
          error={errors.employmentStatus?.message}
          {...register('employmentStatus')}
        />

        <Input
          label="Occupation"
          required
          placeholder="Enter your occupation"
          error={errors.occupation?.message}
          {...register('occupation')}
        />

        {showEmployer && (
          <Input
            label="Employer name"
            required={employmentStatus === 'SALARIED'}
            placeholder="Enter employer name"
            error={errors.employerName?.message}
            {...register('employerName')}
          />
        )}

        <Select
          label="Main source of income"
          required
          options={SOURCES_OF_INCOME}
          error={errors.sourceOfIncome?.message}
          {...register('sourceOfIncome')}
        />

        <CurrencyInput
          label="Monthly income"
          required
          min={0}
          step={1000}
          placeholder="Enter monthly income"
          error={errors.monthlyIncome?.message}
          {...register('monthlyIncome')}
        />

        <CurrencyInput
          label="Expected investment amount"
          required
          min={1000}
          step={1000}
          placeholder="Enter expected amount"
          error={errors.expectedInvestmentAmount?.message}
          {...register('expectedInvestmentAmount')}
        />
      </div>
    </StepShell>
  );
}
