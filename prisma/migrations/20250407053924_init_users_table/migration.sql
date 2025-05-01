-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(30) NOT NULL,
    "last_name" VARCHAR(30) NOT NULL,
    "profile_url" VARCHAR(30),
    "email" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,
    "mobile" VARCHAR(10) NOT NULL,
    "gender_id" INTEGER NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "otp_verified" BOOLEAN NOT NULL DEFAULT false,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
