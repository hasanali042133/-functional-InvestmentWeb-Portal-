import { z } from 'zod';

/**
 * Account opening validation, one schema per step.
 *
 * Each step validates on its own so the customer is told about a problem while
 * they are still looking at the field, rather than at the end of a long form.
 * The backend re-validates the whole application on submit.
 */

const MIN_AGE = 18;
const MAX_AGE = 100;

const required = (label) => `${label} is required.`;

const nameLike = (label) =>
  z
    .string({ required_error: required(label) })
    .trim()
    .min(2, `${label} must be at least 2 characters.`)
    .max(100, `${label} must be 100 characters or fewer.`)
    .regex(/^[\p{L}\s.'-]+$/u, `${label} can only contain letters, spaces and . ' -`);

/** 13 digits, conventionally written 42101-1234567-1. */
const cnic = z
  .string({ required_error: required('CNIC') })
  .trim()
  .regex(/^\d{5}-\d{7}-\d$/, 'Enter your CNIC as 42101-1234567-1.');

/** Accepts 03001234567 or +923001234567. */
const mobile = z
  .string({ required_error: required('Mobile number') })
  .trim()
  .regex(/^(\+92|0)3\d{9}$/, 'Enter a valid mobile number, e.g. 03001234567.');

const dateOfBirth = z
  .string({ required_error: required('Date of birth') })
  .min(1, required('Date of birth'))
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date.')
  .refine((value) => {
    const years = (Date.now() - new Date(value).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return years >= MIN_AGE;
  }, `You must be at least ${MIN_AGE} years old to open an account.`)
  .refine((value) => {
    const years = (Date.now() - new Date(value).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return years <= MAX_AGE;
  }, 'Please check the date of birth you entered.');

/**
 * A dropdown or radio choice.
 *
 * `required_error` only fires when the value is `undefined`, but an untouched
 * select submits an empty string — which falls through to Zod's built-in
 * "Invalid enum value. Expected 'MALE' | 'FEMALE'…" message. An `errorMap`
 * covers every failure mode with one sentence the customer can act on.
 */
const choice = (values, message) => z.enum(values, { errorMap: () => ({ message }) });

/** Money field: typed as text, coerced, and rejected if not a positive number. */
const money = (label, { min = 1, max = 1_000_000_000 } = {}) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number.`, required_error: required(label) })
    .min(min, `${label} must be at least ${min.toLocaleString()}.`)
    .max(max, `${label} looks too large. Please check it.`);

export const personalSchema = z.object({
  fullName: nameLike('Full name'),
  fatherName: nameLike("Father's or mother's name"),
  dateOfBirth,
  gender: choice(['MALE', 'FEMALE', 'OTHER'], 'Please select a gender.'),
  cnic,
  mobile,
  email: z
    .string({ required_error: required('Email address') })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.'),
  maritalStatus: choice(
    ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'],
    'Please select a marital status.',
  ),
});

export const addressSchema = z.object({
  addressLine1: z
    .string({ required_error: required('Address') })
    .trim()
    .min(5, 'Please enter your full street address.')
    .max(200, 'Address must be 200 characters or fewer.'),
  city: z
    .string({ required_error: required('City') })
    .trim()
    .min(2, 'Please enter your city.')
    .max(80, 'City must be 80 characters or fewer.'),
  province: z.string({ required_error: required('Province') }).min(1, 'Please select a province.'),
  country: z.string({ required_error: required('Country') }).min(1, 'Please select a country.'),
  postalCode: z
    .string({ required_error: required('Postal code') })
    .trim()
    .regex(/^\d{4,6}$/, 'Postal code should be 4 to 6 digits.'),
});

export const financialSchema = z
  .object({
    employmentStatus: choice(
      ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'STUDENT', 'RETIRED', 'UNEMPLOYED'],
      'Please select your employment status.',
    ),
    occupation: z
      .string({ required_error: required('Occupation') })
      .trim()
      .min(2, 'Please enter your occupation.')
      .max(100, 'Occupation must be 100 characters or fewer.'),
    employerName: z.string().trim().max(120, 'Employer name must be 120 characters or fewer.').optional().or(z.literal('')),
    monthlyIncome: money('Monthly income', { min: 0 }),
    sourceOfIncome: z
      .string({ required_error: required('Source of income') })
      .min(1, 'Please select your main source of income.'),
    expectedInvestmentAmount: money('Expected investment amount', { min: 1000 }),
  })
  .refine(
    (values) => !(values.employmentStatus === 'SALARIED' && !values.employerName?.trim()),
    { path: ['employerName'], message: "Please enter your employer's name." },
  );

export const investmentProfileSchema = z.object({
  investmentObjective: z
    .string({ required_error: required('Investment objective') })
    .min(1, 'Please choose an investment objective.'),
  riskProfile: choice(
    ['LOW', 'MEDIUM', 'HIGH'],
    'Please choose the risk level you are comfortable with.',
  ),
  investmentExperience: z
    .string({ required_error: required('Investment experience') })
    .min(1, 'Please select your investment experience.'),
  investmentFrequency: z
    .string({ required_error: required('Investment frequency') })
    .min(1, 'Please select how often you expect to invest.'),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Please confirm the declaration to continue.' }),
  }),
});

/** Investment amount, checked against the fund minimum and the available balance. */
export const investmentAmountSchema = ({ minInvestment, availableBalance }) =>
  z.object({
    amount: z.coerce
      .number({ invalid_type_error: 'Enter an amount.', required_error: 'Enter an amount.' })
      .positive('Enter an amount greater than zero.')
      .min(
        minInvestment,
        `The minimum investment in this fund is PKR ${minInvestment.toLocaleString()}.`,
      )
      .max(
        availableBalance,
        `You have PKR ${Math.floor(availableBalance).toLocaleString()} available to invest.`,
      ),
  });
