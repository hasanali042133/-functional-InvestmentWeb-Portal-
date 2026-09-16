import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema } from '@/lib/accountValidators.js';
import { useGuardedSubmit } from '@/hooks/useGuardedSubmit.js';
import { PROVINCES, COUNTRIES } from '@/lib/accountOptions.js';
import { StepShell } from '../StepShell.jsx';
import { Input, Select, Textarea } from '@/components/ui/Field.jsx';

export function AddressStep({ defaultValues, onSubmit, onBack, isSaving, serverError }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    mode: 'onTouched',
    defaultValues,
  });

  const { submit, blockedReasons } = useGuardedSubmit(handleSubmit, onSubmit);

  return (
    <StepShell
      title="Address information"
      description="Where you currently live. Your proof of address must show this address."
      error={serverError}
      isSaving={isSaving}
      onBack={onBack}
      onSubmit={submit}
      blockedReasons={blockedReasons}
    >
      <Textarea
        label="Residential address"
        required
        rows={3}
        placeholder="Enter your address"
        error={errors.addressLine1?.message}
        {...register('addressLine1')}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="City"
          required
          autoComplete="address-level2"
          placeholder="Enter your city"
          error={errors.city?.message}
          {...register('city')}
        />

        <Select
          label="Province"
          required
          options={PROVINCES}
          error={errors.province?.message}
          {...register('province')}
        />

        <Select
          label="Country"
          required
          options={COUNTRIES}
          error={errors.country?.message}
          {...register('country')}
        />

        <Input
          label="Postal code"
          required
          inputMode="numeric"
          placeholder="Enter postal code"
          error={errors.postalCode?.message}
          {...register('postalCode')}
        />
      </div>
    </StepShell>
  );
}
