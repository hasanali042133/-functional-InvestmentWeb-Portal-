import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalSchema } from '@/lib/accountValidators.js';
import { GENDERS, MARITAL_STATUSES } from '@/lib/accountOptions.js';
import { StepShell } from '../StepShell.jsx';
import { Input, Select, RadioPills } from '@/components/ui/Field.jsx';

/** Formats a CNIC as the customer types: 4210112345671 -> 42101-1234567-1 */
const formatCnic = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

export function PersonalStep({ defaultValues, onSubmit, isSaving, serverError }) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(personalSchema),
    mode: 'onTouched',
    defaultValues,
  });

  // Nobody old enough to open an account was born after today.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <StepShell
      title="Personal information"
      description="These details must match your CNIC exactly."
      error={serverError}
      isSaving={isSaving}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Full name"
          required
          autoComplete="name"
          placeholder="As printed on your CNIC"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="Father's / mother's name"
          required
          placeholder="Parent's full name"
          error={errors.fatherName?.message}
          {...register('fatherName')}
        />

        <Input
          label="Date of birth"
          type="date"
          required
          max={today}
          error={errors.dateOfBirth?.message}
          {...register('dateOfBirth')}
        />

        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <RadioPills
              label="Gender"
              name="gender"
              required
              options={GENDERS}
              value={field.value}
              onChange={field.onChange}
              error={errors.gender?.message}
            />
          )}
        />

        <Input
          label="CNIC number"
          required
          inputMode="numeric"
          placeholder="42101-1234567-1"
          hint="13 digits, dashes added automatically"
          error={errors.cnic?.message}
          {...register('cnic', {
            onChange: (event) => setValue('cnic', formatCnic(event.target.value)),
          })}
        />

        <Input
          label="Mobile number"
          type="tel"
          required
          autoComplete="tel"
          placeholder="03001234567"
          error={errors.mobile?.message}
          {...register('mobile')}
        />

        <Input
          label="Email address"
          type="email"
          required
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <Select
          label="Marital status"
          required
          options={MARITAL_STATUSES}
          error={errors.maritalStatus?.message}
          {...register('maritalStatus')}
        />
      </div>
    </StepShell>
  );
}
