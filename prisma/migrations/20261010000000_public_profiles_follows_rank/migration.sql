ALTER TABLE "certificates"
  ADD COLUMN IF NOT EXISTS "rankPosition" INTEGER,
  ADD COLUMN IF NOT EXISTS "isTestData" BOOLEAN NOT NULL DEFAULT false;

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      ORDER BY "issuedAt" ASC, "createdAt" ASC, "publicCode" ASC
    )::INTEGER AS position
  FROM "certificates"
  WHERE "status" = 'valid'
)
UPDATE "certificates" AS certificate
SET "rankPosition" = ranked.position
FROM ranked
WHERE certificate."id" = ranked."id"
  AND certificate."rankPosition" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "certificates_rankPosition_key"
  ON "certificates" ("rankPosition");
CREATE INDEX IF NOT EXISTS "certificates_rank_idx"
  ON "certificates" ("status", "show_on_wall", "rankPosition");
CREATE INDEX IF NOT EXISTS "certificates_issue_order_idx"
  ON "certificates" ("status", "show_on_wall", "issuedAt", "createdAt", "publicCode");

CREATE TABLE IF NOT EXISTS "certificate_rank_counters" (
  "id" INTEGER NOT NULL,
  "lastRank" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "certificate_rank_counters_pkey" PRIMARY KEY ("id")
);
INSERT INTO "certificate_rank_counters" ("id", "lastRank")
SELECT 1, COALESCE(MAX("rankPosition"), 0)
FROM "certificates"
ON CONFLICT ("id") DO UPDATE SET "lastRank" = GREATEST(
  "certificate_rank_counters"."lastRank",
  EXCLUDED."lastRank"
);

CREATE TABLE IF NOT EXISTS "public_profiles" (
  "userId" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "avatarUrl" TEXT,
  "bio" VARCHAR(160),
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "allowFollows" BOOLEAN NOT NULL DEFAULT true,
  "followersCount" INTEGER NOT NULL DEFAULT 0,
  "followingCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "public_profiles_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "public_profiles_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user_profiles"("uid")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "public_profiles_username_key"
  ON "public_profiles" ("username");
CREATE INDEX IF NOT EXISTS "public_profiles_isPublic_username_idx"
  ON "public_profiles" ("isPublic", "username");
CREATE INDEX IF NOT EXISTS "public_profiles_isPublic_displayName_idx"
  ON "public_profiles" ("isPublic", "displayName");

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "public_profiles_displayName_trgm_idx"
  ON "public_profiles" USING GIN ("displayName" gin_trgm_ops);

INSERT INTO "public_profiles" (
  "userId", "username", "displayName", "avatarUrl", "joinedAt",
  "isPublic", "allowFollows", "createdAt", "updatedAt"
)
SELECT
  grouped."userId",
  LEFT(
    COALESCE(
      NULLIF(
        TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE(
          TRANSLATE(COALESCE(grouped.name, 'formada'), 'áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ', 'aaaaeeiooouucAAAAEEIOOOUUC'),
          '[^a-zA-Z0-9]+', '-', 'g'
        ))),
        ''
      ),
      'formada'
    ) || '-' || SUBSTRING(MD5(grouped."userId") FROM 1 FOR 6),
    60
  ),
  COALESCE(NULLIF(grouped.name, ''), grouped.certificate_name),
  COALESCE(grouped."profilePhotoUrl", grouped."avatarUrl"),
  grouped."createdAt",
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT ON (certificate."userId")
    certificate."userId",
    certificate."recipientName" AS certificate_name,
    certificate."issuedAt" AS "createdAt",
    profile.name,
    profile."profilePhotoUrl",
    profile."avatarUrl"
  FROM "certificates" AS certificate
  JOIN "user_profiles" AS profile ON profile.uid = certificate."userId"
  WHERE certificate."status" = 'valid'
  ORDER BY certificate."userId", certificate."issuedAt" ASC, certificate."createdAt" ASC
) AS grouped
ON CONFLICT ("userId") DO NOTHING;

CREATE TABLE IF NOT EXISTS "follows" (
  "followerId" TEXT NOT NULL,
  "followingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "follows_pkey" PRIMARY KEY ("followerId", "followingId"),
  CONSTRAINT "follows_followerId_fkey"
    FOREIGN KEY ("followerId") REFERENCES "public_profiles"("userId")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "follows_followingId_fkey"
    FOREIGN KEY ("followingId") REFERENCES "public_profiles"("userId")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "follows_no_self_follow" CHECK ("followerId" <> "followingId")
);

CREATE INDEX IF NOT EXISTS "follows_followingId_createdAt_idx"
  ON "follows" ("followingId", "createdAt");
CREATE INDEX IF NOT EXISTS "follows_followerId_createdAt_idx"
  ON "follows" ("followerId", "createdAt");

UPDATE "public_profiles" AS profile
SET
  "followersCount" = (
    SELECT COUNT(*)::INTEGER FROM "follows" WHERE "followingId" = profile."userId"
  ),
  "followingCount" = (
    SELECT COUNT(*)::INTEGER FROM "follows" WHERE "followerId" = profile."userId"
  );
