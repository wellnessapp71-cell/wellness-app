-- CreateTable (missing from earlier migrations — adds schema drift fix)
CREATE TABLE IF NOT EXISTS "reports" (
    "id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date_range" JSONB NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'csv',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduled_email" TEXT,
    "file_url" TEXT,
    "generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_requested_by_id_created_at_idx" ON "reports"("requested_by_id", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_type_status_idx" ON "reports"("type", "status");

-- AddForeignKey (guarded — re-runs safely)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'reports_requested_by_id_fkey'
    ) THEN
        ALTER TABLE "reports" ADD CONSTRAINT "reports_requested_by_id_fkey"
            FOREIGN KEY ("requested_by_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "last_sent_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "device_push_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "device_name" TEXT,
    "app_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "device_push_tokens_token_key" ON "device_push_tokens"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "device_push_tokens_user_id_idx" ON "device_push_tokens"("user_id");

-- AddForeignKey (guarded)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'device_push_tokens_user_id_fkey'
    ) THEN
        ALTER TABLE "device_push_tokens" ADD CONSTRAINT "device_push_tokens_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
