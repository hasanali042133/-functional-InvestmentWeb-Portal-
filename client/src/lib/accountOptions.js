/**
 * Option lists for the account opening form.
 *
 * Values match the database enums exactly where one exists, so nothing has to
 * be translated between the form and the API.
 */

export const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

export const MARITAL_STATUSES = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MARRIED', label: 'Married' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
];

export const EMPLOYMENT_STATUSES = [
  { value: 'SALARIED', label: 'Salaried' },
  { value: 'SELF_EMPLOYED', label: 'Self-employed' },
  { value: 'BUSINESS', label: 'Business owner' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'UNEMPLOYED', label: 'Not currently working' },
];

/** Employment types that have no employer to name. */
export const EMPLOYMENT_WITHOUT_EMPLOYER = ['STUDENT', 'RETIRED', 'UNEMPLOYED', 'SELF_EMPLOYED'];

export const PROVINCES = [
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Sindh', label: 'Sindh' },
  { value: 'Khyber Pakhtunkhwa', label: 'Khyber Pakhtunkhwa' },
  { value: 'Balochistan', label: 'Balochistan' },
  { value: 'Gilgit-Baltistan', label: 'Gilgit-Baltistan' },
  { value: 'Azad Jammu & Kashmir', label: 'Azad Jammu & Kashmir' },
  { value: 'Islamabad Capital Territory', label: 'Islamabad Capital Territory' },
];

export const COUNTRIES = [
  { value: 'Pakistan', label: 'Pakistan' },
  { value: 'United Arab Emirates', label: 'United Arab Emirates' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'United States', label: 'United States' },
  { value: 'Canada', label: 'Canada' },
];

export const SOURCES_OF_INCOME = [
  { value: 'Salary', label: 'Salary' },
  { value: 'Business income', label: 'Business income' },
  { value: 'Freelance / consultancy', label: 'Freelance / consultancy' },
  { value: 'Rental income', label: 'Rental income' },
  { value: 'Inheritance', label: 'Inheritance' },
  { value: 'Savings', label: 'Savings' },
  { value: 'Remittances', label: 'Remittances' },
];

export const INVESTMENT_OBJECTIVES = [
  {
    value: 'Capital preservation',
    label: 'Capital preservation',
    hint: 'Protect what I have, accept modest returns',
  },
  {
    value: 'Regular income',
    label: 'Regular income',
    hint: 'A steady payout matters more than growth',
  },
  {
    value: 'Long-term wealth accumulation',
    label: 'Long-term growth',
    hint: 'Build wealth over many years',
  },
  {
    value: 'Aggressive growth',
    label: 'Aggressive growth',
    hint: 'Maximise returns, accept large swings',
  },
];

export const RISK_PROFILES = [
  {
    value: 'LOW',
    label: 'Conservative',
    hint: 'A fall in value would worry me. I prefer stability.',
  },
  {
    value: 'MEDIUM',
    label: 'Balanced',
    hint: 'I can accept some ups and downs for better returns.',
  },
  {
    value: 'HIGH',
    label: 'Adventurous',
    hint: 'I am comfortable with large swings for higher potential returns.',
  },
];

export const INVESTMENT_EXPERIENCE = [
  { value: 'None', label: 'None — this is my first investment' },
  { value: 'Less than 1 year', label: 'Less than 1 year' },
  { value: '1-3 years', label: '1 to 3 years' },
  { value: '3-5 years', label: '3 to 5 years' },
  { value: 'More than 5 years', label: 'More than 5 years' },
];

export const INVESTMENT_FREQUENCIES = [
  { value: 'One-off', label: 'A single lump sum' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Annually', label: 'Annually' },
  { value: 'Occasionally', label: 'Whenever I have surplus funds' },
];

export const DOCUMENT_TYPES = [
  {
    type: 'CNIC_FRONT',
    label: 'CNIC — front',
    description: 'The side showing your photograph and CNIC number.',
    croppable: true,
  },
  {
    type: 'CNIC_BACK',
    label: 'CNIC — back',
    description: 'The side showing your address and date of issue.',
    croppable: true,
  },
  {
    type: 'PROOF_OF_ADDRESS',
    label: 'Proof of address',
    description: 'A utility bill or bank statement from the last 3 months.',
    croppable: false,
  },
];
