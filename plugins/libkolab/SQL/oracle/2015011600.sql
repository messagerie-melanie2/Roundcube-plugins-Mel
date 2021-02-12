-- direct change from varchar to clob does not work, need temp column (#4257)
ALTER TABLE "kolab_cache_contact" ADD "tags1" clob DEFAULT NULL;
UPDATE "kolab_cache_contact" SET "tags1" = "tags";
ALTER TABLE "kolab_cache_contact" DROP COLUMN "tags";
ALTER TABLE "kolab_cache_contact" RENAME COLUMN "tags1" TO "tags";

ALTER TABLE "kolab_cache_event" ADD "tags1" clob DEFAULT NULL;
UPDATE "kolab_cache_event" SET "tags1" = "tags";
ALTER TABLE "kolab_cache_event" DROP COLUMN "tags";
ALTER TABLE "kolab_cache_event" RENAME COLUMN "tags1" TO "tags";

ALTER TABLE "kolab_cache_task" ADD "tags1" clob DEFAULT NULL;
UPDATE "kolab_cache_task" SET "tags1" = "tags";
ALTER TABLE "kolab_cache_task" DROP COLUMN "tags";
ALTER TABLE "kolab_cache_task" RENAME COLUMN "tags1" TO "tags";

ALTER TABLE "kolab_cache_journal" ADD "tags1" clob DEFAULT NULL;
UPDATE "kolab_cache_journal" SET "tags1" = "tags";
ALTER TABLE "kolab_cache_journal" DROP COLUMN "tags";
ALTER TABLE "kolab_cache_journal" RENAME COLUMN "tags1" TO "tags";

ALTER TABLE "kolab_cache_note" ADD "tags1" clob DEFAULT NULL;
UPDATE "kolab_cache_note" SET "tags1" = "tags";
ALTER TABLE "kolab_cache_note" DROP COLUMN "tags";
ALTER TABLE "kolab_cache_note" RENAME COLUMN "tags1" TO "tags";

ALTER TABLE "kolab_cache_file" ADD "tags1" clob DEFAULT NULL;
UPDATE "kolab_cache_file" SET "tags1" = "tags";
ALTER TABLE "kolab_cache_file" DROP COLUMN "tags";
ALTER TABLE "kolab_cache_file" RENAME COLUMN "tags1" TO "tags";

ALTER TABLE "kolab_cache_configuration" ADD "tags1" clob DEFAULT NULL;
UPDATE "kolab_cache_configuration" SET "tags1" = "tags";
ALTER TABLE "kolab_cache_configuration" DROP COLUMN "tags";
ALTER TABLE "kolab_cache_configuration" RENAME COLUMN "tags1" TO "tags";

ALTER TABLE "kolab_cache_freebusy" ADD "tags1" clob DEFAULT NULL;
UPDATE "kolab_cache_freebusy" SET "tags1" = "tags";
ALTER TABLE "kolab_cache_freebusy" DROP COLUMN "tags";
ALTER TABLE "kolab_cache_freebusy" RENAME COLUMN "tags1" TO "tags";
