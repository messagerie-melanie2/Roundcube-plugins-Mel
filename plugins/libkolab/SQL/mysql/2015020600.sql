-- improve cache synchronization (#3933)
ALTER TABLE `kolab_folders`
  ADD `changed` DATETIME DEFAULT NULL,
  ADD `objectcount` BIGINT DEFAULT NULL;
