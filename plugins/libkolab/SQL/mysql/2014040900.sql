ALTER TABLE `kolab_cache_contact` CHANGE `data` `data` LONGTEXT NOT NULL;
ALTER TABLE `kolab_cache_event` CHANGE `data` `data` LONGTEXT NOT NULL;
ALTER TABLE `kolab_cache_task` CHANGE `data` `data` LONGTEXT NOT NULL;
ALTER TABLE `kolab_cache_journal` CHANGE `data` `data` LONGTEXT NOT NULL;
ALTER TABLE `kolab_cache_note` CHANGE `data` `data` LONGTEXT NOT NULL;
ALTER TABLE `kolab_cache_file` CHANGE `data` `data` LONGTEXT NOT NULL;
ALTER TABLE `kolab_cache_configuration` CHANGE `data` `data` LONGTEXT NOT NULL;
ALTER TABLE `kolab_cache_freebusy` CHANGE `data` `data` LONGTEXT NOT NULL;

-- rebuild cache entries for xcal objects with alarms
DELETE FROM `kolab_cache_event` WHERE tags LIKE '% x-has-alarms %';
DELETE FROM `kolab_cache_task` WHERE tags LIKE '% x-has-alarms %';

-- force cache synchronization
UPDATE `kolab_folders` SET ctag='' WHERE `type` IN ('event','task');

