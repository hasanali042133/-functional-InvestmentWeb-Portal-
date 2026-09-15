import { z } from 'zod';

// One schema per step, so a problem is reported while the customer is still
// looking at the field. The backend re-validates the whole application on submit.

const MIN_AGE = 18;
const MAX_AGE = 100;

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
  .min(1, 'Enter your date of birth.')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date.')
  .refine((value) => {
    const years = (Date.now() - Date.parse(value)) / (365.25 * 24 * 60 * 60 * 1000);
    return years >= MIN_AGE;
  }, `You must be at least ${MIN_AGE} to open an account.`)
  .refine((value) => {
    const years = (Date.now() - Date.parse(value)) / (365.25 * 24 * 60 * 60 * 1000);
    return years <= MAX_AGE;
  }, 'Check the date you entered.');

export const personalSchema = z.object({
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
  maritalStatus: choice(
    ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'],
    'Select a marital status.',
  ),
});

export const addressSchema = z.object({
  addressLine1: z.string().trim().min(5, 'Enter your address.').max(200, 'This is too long.'),
  city: z.string().trim().min(2, 'Enter your city.').max(80, 'This is too long.'),
  province: z.string().min(1, 'Select a province.'),
  country: z.string().min(1, 'Select a country.'),
  postalCode: z.string().trim().regex(/^\d{4,6}$/, 'Enter a valid postal code.'),
});

export const financialSchema = z
  .object({
    employmentStatus: choice(
      ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'STUDENT', 'RETIRED', 'UNEMPLOYED'],
      'Select your employment status.',
    ),
    occupation: z.string().trim().min(2, 'Enter your occupation.').max(100, 'This is too long.'),
    employerName: z.string().trim().max(120, 'This is too long.').optional().or(z.literal('')),
    monthlyIncome: money('Enter your monthly income.', 0),
    sourceOfIncome: z.string().min(1, 'Select your source of income.'),
    expectedInvestmentAmount: money('Enter an expected investment amount.', 1000),
  })
  .refine((values) => !(values.employmentStatus === 'SALARIED' && !values.employerName?.trim()), {
    path: ['employerName'],
    message: 'Enter your employer name.',
  });

export const investmentProfileSchema = z.object({
  investmentObjective: z.string().min(1, 'Choose an investment objective.'),
  riskProfile: choice(['LOW', 'MEDIUM', 'HIGH'], 'Choose a risk level.'),
  investmentExperience: z.string().min(1, 'Select your investment experience.'),
  investmentFrequency: z.string().min(1, 'Select how often you expect to invest.'),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Confirm the declaration to continue.' }),
  }),
});

export const investmentAmountSchema = ({ minInvestment, availableBalance }) =>
  z.object({
    amount: z.coerce
      .number({ invalid_type_error: 'Enter an amount.' })
      .positive('Enter an amount greater than zero.')
      .min(minInvestment, `The minimum for this fund is PKR ${minInvestment.toLocaleString()}.`)
      .max(
        availableBalance,
        `You have PKR ${Math.floor(availableBalance).toLocaleString()} available.`,
      ),
  });
