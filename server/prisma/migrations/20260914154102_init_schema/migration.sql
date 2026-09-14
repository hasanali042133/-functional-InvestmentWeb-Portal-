-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'STUDENT', 'RETIRED', 'UNEMPLOYED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CNIC_FRONT', 'CNIC_BACK', 'PROOF_OF_ADDRESS');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INVESTMENT', 'REDEMPTION');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('EMAIL_VERIFICATION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'EMAIL_VERIFICATION',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "full_name" TEXT,
    "father_name" TEXT,
    "date_of_birth" DATE,
    "gender" "Gender",
    "cnic" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "marital_status" "MaritalStatus",
    "address_line1" TEXT,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "employment_status" "EmploymentStatus",
    "occupation" TEXT,
    "employer_name" TEXT,
    "monthly_income" DECIMAL(18,2),
    "source_of_income" TEXT,
    "expected_investment_amount" DECIMAL(18,2),
    "investment_objective" TEXT,
    "risk_profile" "RiskLevel",
    "investment_experience" TEXT,
    "investment_frequency" TEXT,
    "terms_accepted" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "is_cropped" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "risk_level" "RiskLevel" NOT NULL,
    "min_investment" DECIMAL(18,2) NOT NULL,
    "expected_return_pct" DECIMAL(5,2) NOT NULL,
    "description" TEXT NOT NULL,
    "current_nav" DECIMAL(18,4) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_nav_history" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "nav" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "product_nav_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "amount_invested" DECIMAL(18,2) NOT NULL,
    "units" DECIMAL(18,6) NOT NULL,
    "nav_at_purchase" DECIMAL(18,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "investment_id" TEXT,
    "product_id" TEXT NOT NULL,
    "txn_ref" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL DEFAULT 'INVESTMENT',
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "otps_user_id_purpose_idx" ON "otps"("user_id", "purpose");

-- CreateIndex
CREATE INDEX "otps_expires_at_idx" ON "otps"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "applications_user_id_key" ON "applications"("user_id");

-- CreateIndex
CREATE INDEX "documents_user_id_idx" ON "documents"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "documents_application_id_type_key" ON "documents"("application_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE INDEX "product_nav_history_product_id_date_idx" ON "product_nav_history"("product_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "product_nav_history_product_id_date_key" ON "product_nav_history"("product_id", "date");

-- CreateIndex
CREATE INDEX "investments_user_id_idx" ON "investments"("user_id");

-- CreateIndex
CREATE INDEX "investments_user_id_product_id_idx" ON "investments"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_txn_ref_key" ON "transactions"("txn_ref");

-- CreateIndex
CREATE INDEX "transactions_user_id_created_at_idx" ON "transactions"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_nav_history" ADD CONSTRAINT "product_nav_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
