-- remove xml column, and change data format (clear cache needed)
DELETE FROM "kolab_folders";
ALTER TABLE "kolab_cache_contact" DROP COLUMN "xml";
ALTER TABLE "kolab_cache_event" DROP COLUMN "xml";
ALTER TABLE "kolab_cache_task" DROP COLUMN "xml";
ALTER TABLE "kolab_cache_journal" DROP COLUMN "xml";
ALTER TABLE "kolab_cache_note" DROP COLUMN "xml";
ALTER TABLE "kolab_cache_file" DROP COLUMN "xml";
ALTER TABLE "kolab_cache_configuration" DROP COLUMN "xml";
ALTER TABLE "kolab_cache_freebusy" DROP COLUMN "xml";
