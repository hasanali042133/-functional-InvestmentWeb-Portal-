import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { investmentProfileSchema } from '@/lib/accountValidators.js';
import { useGuardedSubmit } from '@/hooks/useGuardedSubmit.js';
import {
  INVESTMENT_OBJECTIVES,
  RISK_PROFILES,
  INVESTMENT_EXPERIENCE,
  INVESTMENT_FREQUENCIES,
} from '@/lib/accountOptions.js';
import { StepShell } from '../StepShell.jsx';
import { Select, RadioCardGroup, Checkbox } from '@/components/ui/Field.jsx';

export function InvestmentProfileStep({ defaultValues, onSubmit, onBack, isSaving, serverError }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(investmentProfileSchema),
    mode: 'onTouched',
    defaultValues,
  });

  const { submit, blockedReasons } = useGuardedSubmit(handleSubmit, onSubmit);

  return (
    <StepShell
      title="Investment profile"
      description="This helps us show you funds that suit how you want to invest."
      error={serverError}
      isSaving={isSaving}
      onBack={onBack}
      onSubmit={submit}
      blockedReasons={blockedReasons}
      submitLabel="Save and continue"
    >
      <Controller
        name="investmentObjective"
        control={control}
        render={({ field }) => (
          <RadioCardGroup
            label="What is your main investment objective?"
            name="investmentObjective"
            required
            columns={2}
            options={INVESTMENT_OBJECTIVES}
            value={field.value}
            onChange={field.onChange}
            error={errors.investmentObjective?.message}
          />
        )}
      />

      <Controller
        name="riskProfile"
        control={control}
        render={({ field }) => (
          <RadioCardGroup
            label="How would you react to a fall in the value of your investment?"
            name="riskProfile"
            required
            options={RISK_PROFILES}
            value={field.value}
            onChange={field.onChange}
            error={errors.riskProfile?.message}
          />
        )}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="Investment experience"
          required
          options={INVESTMENT_EXPERIENCE}
          error={errors.investmentExperience?.message}
          {...register('investmentExperience')}
        />

        <Select
          label="How often do you expect to invest?"
          required
          options={INVESTMENT_FREQUENCIES}
          error={errors.investmentFrequency?.message}
          {...register('investmentFrequency')}
        />
      </div>

      <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200 ring-inset">
        <Checkbox
          label="I confirm that the information I have provided is accurate and complete, and that the funds I invest come from a lawful source."
          error={errors.termsAccepted?.message}
          {...register('termsAccepted')}
        />
      </div>
    </StepShell>
  );
}
