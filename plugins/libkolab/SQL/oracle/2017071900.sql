-- make UID column bigger
ALTER TABLE "kolab_cache_contact" MODIFY "uid" VARCHAR(512) NOT NULL;
ALTER TABLE "kolab_cache_event" MODIFY "uid" VARCHAR(512) NOT NULL;
ALTER TABLE "kolab_cache_task" MODIFY "uid" VARCHAR(512) NOT NULL;
ALTER TABLE "kolab_cache_journal" MODIFY "uid" VARCHAR(512) NOT NULL;
ALTER TABLE "kolab_cache_note" MODIFY "uid" VARCHAR(512) NOT NULL;
ALTER TABLE "kolab_cache_file" MODIFY "uid" VARCHAR(512) NOT NULL;
ALTER TABLE "kolab_cache_configuration" MODIFY "uid" VARCHAR(512) NOT NULL;
ALTER TABLE "kolab_cache_freebusy" MODIFY "uid" VARCHAR(512) NOT NULL;
