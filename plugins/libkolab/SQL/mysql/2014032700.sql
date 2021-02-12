ALTER TABLE `kolab_cache_configuration` ADD INDEX `configuration_uid2msguid` (`folder_id`, `uid`, `msguid`);
ALTER TABLE `kolab_cache_contact` ADD INDEX `contact_uid2msguid` (`folder_id`, `uid`, `msguid`);
ALTER TABLE `kolab_cache_event` ADD INDEX `event_uid2msguid` (`folder_id`, `uid`, `msguid`);
ALTER TABLE `kolab_cache_task` ADD INDEX `task_uid2msguid` (`folder_id`, `uid`, `msguid`);
ALTER TABLE `kolab_cache_journal` ADD INDEX `journal_uid2msguid` (`folder_id`, `uid`, `msguid`);
ALTER TABLE `kolab_cache_note` ADD INDEX `note_uid2msguid` (`folder_id`, `uid`, `msguid`);
ALTER TABLE `kolab_cache_file` ADD INDEX `file_uid2msguid` (`folder_id`, `uid`, `msguid`);
ALTER TABLE `kolab_cache_freebusy` ADD INDEX `freebusy_uid2msguid` (`folder_id`, `uid`, `msguid`);
