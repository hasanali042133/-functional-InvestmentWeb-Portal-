/**
 * Seeds the investment products, their price history, and a demo account.
 *
 * Run with:  npm run db:seed
 *
 * The script is idempotent — products are upserted by `code` and the demo
 * customer by email — so it can safely be re-run against an existing database,
 * including after a deployment.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { generateTxnRef } from '../src/utils/txnRef.js';
import { unitsFor, round } from '../src/utils/money.js';

dotenv.config();

const prisma = new PrismaClient();

const NAV_HISTORY_DAYS = 90;

const DEMO_CUSTOMER = {
  fullName: 'Assessment User',
  email: 'assessment@example.com',
  password: 'Assessment123',
};

const PRODUCTS = [
  {
    code: 'GROWTH',
    name: 'Growth Fund',
    category: 'Equity',
    riskLevel: 'HIGH',
    minInvestment: 5000,
    expectedReturnPct: 18.5,
    description:
      'An aggressive equity fund that invests in listed growth companies. Suited to investors with a long horizon who can tolerate short-term volatility in exchange for higher potential returns.',
    startingNav: 112.4,
    annualDrift: 0.185,
    // Amplitude of the daily deviation from trend — the visible "choppiness"
    // of the line, scaled to the product's risk level.
    dailyVolatility: 0.012,
  },
  {
    code: 'INCOME',
    name: 'Income Fund',
    category: 'Income',
    riskLevel: 'MEDIUM',
    minInvestment: 5000,
    expectedReturnPct: 12.25,
    description:
      'A balanced fund holding corporate debt and dividend-paying equities. Aims to deliver a steady income stream with moderate capital growth and lower volatility than a pure equity fund.',
    startingNav: 104.8,
    annualDrift: 0.1225,
    dailyVolatility: 0.0045,
  },
  {
    code: 'MONEY_MARKET',
    name: 'Money Market Fund',
    category: 'Money Market',
    riskLevel: 'LOW',
    minInvestment: 1000,
    expectedReturnPct: 8.75,
    description:
      'A capital-preservation fund invested in short-term government securities and bank deposits. The lowest risk option, intended for parking funds that may be needed at short notice.',
    startingNav: 101.2,
    annualDrift: 0.0875,
    dailyVolatility: 0.0009,
  },
];

/**
 * Deterministic pseudo-random generator (mulberry32).
 *
 * Seeding it from the product code means every run produces the same price
 * series, so the demo portfolio and its charts look identical on every machine
 * and after every redeploy.
 */
const createRng = (seedText) => {
  let seed = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  }
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const midnightUtc = (daysAgo) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

/**
 * Builds a daily NAV series: a compound-growth trend matching the product's
 * stated expected return, with a mean-reverting deviation layered on top so the
 * chart wanders like a real fund instead of being a straight line.
 *
 * The deviation is deliberately mean-reverting rather than a free random walk.
 * With a free walk the daily shocks compound, and over 90 days they can easily
 * overwhelm the drift — which produced a Growth Fund that had *lost* value
 * while the Money Market Fund outperformed it. Pulling the deviation back
 * towards zero each day keeps the long-run trend equal to the advertised
 * return, while higher-risk products still visibly swing more.
 */
const buildNavSeries = (product) => {
  const rng = createRng(product.code);
  const series = [];
  let deviation = 0;

  for (let index = 0; index < NAV_HISTORY_DAYS; index += 1) {
    const dayOffset = NAV_HISTORY_DAYS - 1 - index;
    const shock = (rng() - 0.5) * 2 * product.dailyVolatility;

    // Retain most of yesterday's deviation, then nudge it — an AR(1) process.
    deviation = deviation * 0.88 + shock;

    const trend = product.startingNav * (1 + product.annualDrift) ** (index / 365);
    series.push({ date: midnightUtc(dayOffset), nav: round(trend * (1 + deviation), 4) });
  }

  return series;
};

const seedProducts = async () => {
  const seeded = [];

  for (const product of PRODUCTS) {
    const series = buildNavSeries(product);
    // The current NAV must be the latest point in the history, otherwise
    // portfolio valuation and the performance chart would disagree.
    const currentNav = series[series.length - 1].nav;

    const record = await prisma.product.upsert({
      where: { code: product.code },
      update: {
        name: product.name,
        category: product.category,
        riskLevel: product.riskLevel,
        minInvestment: product.minInvestment,
        expectedReturnPct: product.expectedReturnPct,
        description: product.description,
        currentNav,
        isActive: true,
      },
      create: {
        code: product.code,
        name: product.name,
        category: product.category,
        riskLevel: product.riskLevel,
        minInvestment: product.minInvestment,
        expectedReturnPct: product.expectedReturnPct,
        description: product.description,
        currentNav,
      },
    });

    await prisma.productNavHistory.deleteMany({ where: { productId: record.id } });
    await prisma.productNavHistory.createMany({
      data: series.map((point) => ({
        productId: record.id,
        date: point.date,
        nav: point.nav,
      })),
    });

    seeded.push({ ...record, series });
    console.info(`  ${product.name.padEnd(20)} NAV ${currentNav}  (${series.length} days of history)`);
  }

  return seeded;
};

const seedDemoCustomer = async (products) => {
  const passwordHash = await bcrypt.hash(DEMO_CUSTOMER.password, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_CUSTOMER.email },
    update: { fullName: DEMO_CUSTOMER.fullName, passwordHash, isEmailVerified: true },
    create: {
      fullName: DEMO_CUSTOMER.fullName,
      email: DEMO_CUSTOMER.email,
      passwordHash,
      isEmailVerified: true,
    },
  });

  const application = {
    status: 'APPROVED',
    fullName: 'Assessment User',
    fatherName: 'Abdul Rahman',
    dateOfBirth: new Date('1994-03-18T00:00:00.000Z'),
    gender: 'MALE',
    cnic: '42101-1234567-1',
    mobile: '+923001234567',
    email: DEMO_CUSTOMER.email,
    maritalStatus: 'SINGLE',
    addressLine1: 'House 24, Street 7, Clifton Block 5',
    city: 'Karachi',
    province: 'Sindh',
    country: 'Pakistan',
    postalCode: '75600',
    employmentStatus: 'SALARIED',
    occupation: 'Software Engineer',
    employerName: 'Northwind Technologies',
    monthlyIncome: 450000,
    sourceOfIncome: 'Salary',
    expectedInvestmentAmount: 500000,
    investmentObjective: 'Long-term wealth accumulation',
    riskProfile: 'MEDIUM',
    investmentExperience: '3-5 years',
    investmentFrequency: 'Monthly',
    termsAccepted: true,
    submittedAt: midnightUtc(45),
    approvedAt: midnightUtc(45),
  };

  await prisma.application.upsert({
    where: { userId: user.id },
    update: application,
    create: { userId: user.id, ...application },
  });

  // Start from a clean slate so re-running does not stack up duplicate holdings.
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.investment.deleteMany({ where: { userId: user.id } });

  const holdings = [
    { code: 'GROWTH', amount: 100000, daysAgo: 40 },
    { code: 'INCOME', amount: 50000, daysAgo: 22 },
    { code: 'MONEY_MARKET', amount: 25000, daysAgo: 8 },
  ];

  for (const holding of holdings) {
    const product = products.find((p) => p.code === holding.code);
    const purchaseDate = midnightUtc(holding.daysAgo);

    // Buy at the price that actually applied on the purchase date, so the gain
    // shown in the portfolio matches the product's own price history.
    const pointOnDate =
      product.series.find((point) => point.date.getTime() === purchaseDate.getTime()) ??
      product.series[0];

    const units = unitsFor(holding.amount, pointOnDate.nav);

    const investment = await prisma.investment.create({
      data: {
        userId: user.id,
        productId: product.id,
        amountInvested: holding.amount,
        units,
        navAtPurchase: pointOnDate.nav,
        createdAt: purchaseDate,
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        investmentId: investment.id,
        productId: product.id,
        txnRef: generateTxnRef(),
        type: 'INVESTMENT',
        amount: holding.amount,
        status: 'COMPLETED',
        createdAt: purchaseDate,
      },
    });

    console.info(
      `  ${product.name.padEnd(20)} invested ${holding.amount.toLocaleString()} @ NAV ${pointOnDate.nav} -> ${units} units`,
    );
  }

  return user;
};

const main = async () => {
  console.info('\nSeeding investment products...');
  const products = await seedProducts();

  console.info('\nSeeding demo customer...');
  const user = await seedDemoCustomer(products);

  console.info('\nDone.');
  console.info(`  Demo login: ${DEMO_CUSTOMER.email} / ${DEMO_CUSTOMER.password}`);
  console.info(`  User id:    ${user.id}\n`);
};

main()
  .catch((error) => {
    console.error('\nSeed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
