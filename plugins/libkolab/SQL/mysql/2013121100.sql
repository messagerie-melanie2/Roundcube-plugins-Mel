-- well, these deletes are really optional
-- we can clear all caches or only contacts/events/tasks
-- the issue we're fixing here was about contacts (Bug #2662)
DELETE FROM `kolab_folders` WHERE `type` IN ('contact', 'event', 'task');

ALTER TABLE `kolab_cache_contact` CHANGE `xml` `xml` LONGBLOB NOT NULL;
ALTER TABLE `kolab_cache_event` CHANGE `xml` `xml` LONGBLOB NOT NULL;
ALTER TABLE `kolab_cache_task` CHANGE `xml` `xml` LONGBLOB NOT NULL;
ALTER TABLE `kolab_cache_journal` CHANGE `xml` `xml` LONGBLOB NOT NULL;
ALTER TABLE `kolab_cache_note` CHANGE `xml` `xml` LONGBLOB NOT NULL;
ALTER TABLE `kolab_cache_file` CHANGE `xml` `xml` LONGBLOB NOT NULL;
ALTER TABLE `kolab_cache_configuration` CHANGE `xml` `xml` LONGBLOB NOT NULL;
ALTER TABLE `kolab_cache_freebusy` CHANGE `xml` `xml` LONGBLOB NOT NULL;
