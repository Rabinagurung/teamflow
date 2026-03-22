UPDATE "user"
SET
  "given_name" = NULLIF(split_part(trim("name"), ' ', 1), ''),
  "family_name" = NULLIF(regexp_replace(trim("name"), '^\S+\s*', ''), ''),
  "picture" = "image"
WHERE
  "given_name" IS NULL
  OR "family_name" IS NULL
  OR "picture" IS NULL;
