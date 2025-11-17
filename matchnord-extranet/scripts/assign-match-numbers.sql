-- SQL script to assign match numbers to existing matches
-- Based on creation order (createdAt timestamp)
-- Tournament ID: cmg1tk8z4000marfd6rneywbs

-- Option 1: Assign match numbers per tournament (simple sequential)
-- Match numbers will be: M1, M2, M3, etc. (per tournament)
UPDATE "Match"
SET "matchNumber" = 'M' || row_number
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "tournamentId" 
      ORDER BY "createdAt" ASC
    ) as row_number
  FROM "Match"
  WHERE "tournamentId" = 'cmg1tk8z4000marfd6rneywbs'
) AS numbered_matches
WHERE "Match".id = numbered_matches.id
  AND "Match"."tournamentId" = 'cmg1tk8z4000marfd6rneywbs'
  AND ("Match"."matchNumber" IS NULL OR "Match"."matchNumber" = '');

-- Option 2: Assign match numbers per group (recommended for better organization)
-- Match numbers will be: G1-M1, G1-M2, G2-M1, etc. (group-grouped)
-- Uncomment the block below and comment Option 1 to use this instead:
/*
UPDATE "Match"
SET "matchNumber" = 'G' || group_num || '-M' || match_num
FROM (
  SELECT 
    m.id,
    m."groupId",
    DENSE_RANK() OVER (
      PARTITION BY m."tournamentId" 
      ORDER BY m."groupId" NULLS LAST, m."createdAt"
    ) as group_num,
    ROW_NUMBER() OVER (
      PARTITION BY m."groupId" 
      ORDER BY m."createdAt" ASC
    ) as match_num
  FROM "Match" m
  WHERE m."tournamentId" = 'cmg1tk8z4000marfd6rneywbs'
) AS numbered_matches
WHERE "Match".id = numbered_matches.id
  AND "Match"."tournamentId" = 'cmg1tk8z4000marfd6rneywbs'
  AND ("Match"."matchNumber" IS NULL OR "Match"."matchNumber" = '');
*/

-- Option 3: Assign match numbers per division
-- Match numbers will be: D1-M1, D1-M2, D2-M1, etc. (division-grouped)
-- Uncomment to use this instead:
/*
UPDATE "Match"
SET "matchNumber" = 'D' || division_num || '-M' || match_num
FROM (
  SELECT 
    m.id,
    m."divisionId",
    DENSE_RANK() OVER (
      PARTITION BY m."tournamentId" 
      ORDER BY m."divisionId" NULLS LAST, m."createdAt"
    ) as division_num,
    ROW_NUMBER() OVER (
      PARTITION BY m."divisionId" 
      ORDER BY m."createdAt" ASC
    ) as match_num
  FROM "Match" m
  WHERE m."tournamentId" = 'cmg1tk8z4000marfd6rneywbs'
) AS numbered_matches
WHERE "Match".id = numbered_matches.id
  AND "Match"."tournamentId" = 'cmg1tk8z4000marfd6rneywbs'
  AND ("Match"."matchNumber" IS NULL OR "Match"."matchNumber" = '');
*/

-- Verify the results
SELECT 
  id,
  "matchNumber",
  "createdAt",
  "groupId",
  "divisionId",
  "homeTeamId",
  "awayTeamId"
FROM "Match"
WHERE "tournamentId" = 'cmg1tk8z4000marfd6rneywbs'
ORDER BY "createdAt" ASC;

-- Count matches with and without match numbers
SELECT 
  COUNT(*) FILTER (WHERE "matchNumber" IS NOT NULL) as with_match_number,
  COUNT(*) FILTER (WHERE "matchNumber" IS NULL) as without_match_number,
  COUNT(*) as total_matches
FROM "Match"
WHERE "tournamentId" = 'cmg1tk8z4000marfd6rneywbs';

