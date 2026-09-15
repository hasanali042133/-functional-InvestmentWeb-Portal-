import { z } from 'zod';

const choice = (values, message) => z.enum(values, { errorMap: () => ({ message }) });

const nameLike = (message) =>
  z
    .string()
    .trim()
    .min(2, message)
    .max(100, 'This is too long.')
    .regex(/^[\p{L}\s.'-]+$/u, 'Use letters only.');

const money = (message, min) =>
  z.coerce
    .number({ invalid_type_error: message })
    .min(min, min === 0 ? message : `Enter at least ${min.toLocaleString()}.`)
    .max(1_000_000_000, 'This amount is too large.');

const dateOfBirth = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date.')
  .refine((value) => {
    const years = (Date.now() - Date.parse(value)) / (365.25 * 24 * 60 * 60 * 1000);
    return years >= 18 && years <= 100;
  }, 'You must be at least 18 to open an account.');

export const applicationFields = {
  fullName: nameLike('Enter your full name.'),
  fatherName: nameLike("Enter your father's or mother's name."),
  dateOfBirth,
  gender: choice(['MALE', 'FEMALE', 'OTHER'], 'Select a gender.'),
  cnic: z
    .string()
    .trim()
    .regex(/^\d{5}-\d{7}-\d$/, 'Enter a valid CNIC.'),
  mobile: z
    .string()
    .trim()
    .regex(/^(\+92|0)3\d{9}$/, 'Enter a valid mobile number.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  maritalStatus: choice(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'], 'Select a marital status.'),

  addressLine1: z.string().trim().min(5, 'Enter your address.').max(200, 'This is too long.'),
  city: z.string().trim().min(2, 'Enter your city.').max(80, 'This is too long.'),
  province: z.string().trim().min(2, 'Select a province.').max(80, 'This is too long.'),
  country: z.string().trim().min(2, 'Select a country.').max(80, 'This is too long.'),
  postalCode: z.string().trim().regex(/^\d{4,6}$/, 'Enter a valid postal code.'),

  employmentStatus: choice(
    ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'STUDENT', 'RETIRED', 'UNEMPLOYED'],
    'Select your employment status.',
  ),
  occupation: z.string().trim().min(2, 'Enter your occupation.').max(100, 'This is too long.'),
  employerName: z.string().trim().max(120, 'This is too long.').optional().or(z.literal('')),
  monthlyIncome: money('Enter your monthly income.', 0),
  sourceOfIncome: z.string().trim().min(2, 'Select your source of income.').max(80, 'This is too long.'),
  expectedInvestmentAmount: money('Enter an expected investment amount.', 1000),

  investmentObjective: z
    .string()
    .trim()
    .min(2, 'Choose an investment objective.')
    .max(120, 'This is too long.'),
  riskProfile: choice(['LOW', 'MEDIUM', 'HIGH'], 'Choose a risk level.'),
  investmentExperience: z
    .string()
    .trim()
    .min(2, 'Select your investment experience.')
    .max(80, 'This is too long.'),
  investmentFrequency: z
    .string()
    .trim()
    .min(2, 'Select how often you expect to invest.')
    .max(80, 'This is too long.'),

  termsAccepted: z.coerce.boolean(),
};

// Draft saves arrive one section at a time, so everything is optional here and
// completeness is enforced only on submit.
export const saveApplicationSchema = z
  .object(
    Object.fromEntries(
      Object.entries(applicationFields).map(([key, schema]) => [key, schema.optional()]),
    ),
  )
  .strict()
  .refine((values) => Object.keys(values).length > 0, 'Nothing to save.');

export const REQUIRED_ON_SUBMIT = Object.keys(applicationFields).filter(
  (field) => field !== 'employerName' && field !== 'termsAccepted',
);

export const documentTypeSchema = z.object({
  type: choice(
    ['CNIC_FRONT', 'CNIC_BACK', 'PROOF_OF_ADDRESS'],
    'Choose which document you are uploading.',
  ),
  isCropped: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export const documentIdParamSchema = z.object({
  id: z.string().uuid('That is not a valid document id.'),
});
