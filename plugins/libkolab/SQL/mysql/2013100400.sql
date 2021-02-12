CREATE TABLE `kolab_folders` (
  `folder_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `resource` VARCHAR(255)  NOT NULL,
  `type` VARCHAR(32) NOT NULL,
  `synclock` INT(10) NOT NULL DEFAULT '0',
  `ctag` VARCHAR(40) DEFAULT NULL,
  PRIMARY KEY(`folder_id`),
  INDEX `resource_type` (`resource`, `type`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

CREATE TABLE `kolab_cache_contact` (
  `folder_id` BIGINT UNSIGNED NOT NULL,
  `msguid` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(128) CHARACTER SET ascii NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `data` TEXT NOT NULL,
  `xml` TEXT NOT NULL,
  `tags` VARCHAR(255) NOT NULL,
  `words` TEXT NOT NULL,
  `type` VARCHAR(32) CHARACTER SET ascii NOT NULL,
  CONSTRAINT `fk_kolab_cache_contact_folder` FOREIGN KEY (`folder_id`)
    REFERENCES `kolab_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY(`folder_id`,`msguid`),
  INDEX `contact_type` (`folder_id`,`type`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

CREATE TABLE `kolab_cache_event` (
  `folder_id` BIGINT UNSIGNED NOT NULL,
  `msguid` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(128) CHARACTER SET ascii NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `data` TEXT NOT NULL,
  `xml` TEXT NOT NULL,
  `tags` VARCHAR(255) NOT NULL,
  `words` TEXT NOT NULL,
  `dtstart` DATETIME,
  `dtend` DATETIME,
  CONSTRAINT `fk_kolab_cache_event_folder` FOREIGN KEY (`folder_id`)
    REFERENCES `kolab_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY(`folder_id`,`msguid`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

CREATE TABLE `kolab_cache_task` (
  `folder_id` BIGINT UNSIGNED NOT NULL,
  `msguid` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(128) CHARACTER SET ascii NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `data` TEXT NOT NULL,
  `xml` TEXT NOT NULL,
  `tags` VARCHAR(255) NOT NULL,
  `words` TEXT NOT NULL,
  `dtstart` DATETIME,
  `dtend` DATETIME,
  CONSTRAINT `fk_kolab_cache_task_folder` FOREIGN KEY (`folder_id`)
    REFERENCES `kolab_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY(`folder_id`,`msguid`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

CREATE TABLE `kolab_cache_journal` (
  `folder_id` BIGINT UNSIGNED NOT NULL,
  `msguid` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(128) CHARACTER SET ascii NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `data` TEXT NOT NULL,
  `xml` TEXT NOT NULL,
  `tags` VARCHAR(255) NOT NULL,
  `words` TEXT NOT NULL,
  `dtstart` DATETIME,
  `dtend` DATETIME,
  CONSTRAINT `fk_kolab_cache_journal_folder` FOREIGN KEY (`folder_id`)
    REFERENCES `kolab_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY(`folder_id`,`msguid`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

CREATE TABLE `kolab_cache_note` (
  `folder_id` BIGINT UNSIGNED NOT NULL,
  `msguid` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(128) CHARACTER SET ascii NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `data` TEXT NOT NULL,
  `xml` TEXT NOT NULL,
  `tags` VARCHAR(255) NOT NULL,
  `words` TEXT NOT NULL,
  CONSTRAINT `fk_kolab_cache_note_folder` FOREIGN KEY (`folder_id`)
    REFERENCES `kolab_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY(`folder_id`,`msguid`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

CREATE TABLE `kolab_cache_file` (
  `folder_id` BIGINT UNSIGNED NOT NULL,
  `msguid` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(128) CHARACTER SET ascii NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `data` TEXT NOT NULL,
  `xml` TEXT NOT NULL,
  `tags` VARCHAR(255) NOT NULL,
  `words` TEXT NOT NULL,
  `filename` varchar(255) DEFAULT NULL,
  CONSTRAINT `fk_kolab_cache_file_folder` FOREIGN KEY (`folder_id`)
    REFERENCES `kolab_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY(`folder_id`,`msguid`),
  INDEX `folder_filename` (`folder_id`, `filename`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

CREATE TABLE `kolab_cache_configuration` (
  `folder_id` BIGINT UNSIGNED NOT NULL,
  `msguid` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(128) CHARACTER SET ascii NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `data` TEXT NOT NULL,
  `xml` TEXT NOT NULL,
  `tags` VARCHAR(255) NOT NULL,
  `words` TEXT NOT NULL,
  `type` VARCHAR(32) CHARACTER SET ascii NOT NULL,
  CONSTRAINT `fk_kolab_cache_configuration_folder` FOREIGN KEY (`folder_id`)
    REFERENCES `kolab_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY(`folder_id`,`msguid`),
  INDEX `configuration_type` (`folder_id`,`type`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

CREATE TABLE `kolab_cache_freebusy` (
  `folder_id` BIGINT UNSIGNED NOT NULL,
  `msguid` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(128) CHARACTER SET ascii NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `data` TEXT NOT NULL,
  `xml` TEXT NOT NULL,
  `tags` VARCHAR(255) NOT NULL,
  `words` TEXT NOT NULL,
  `dtstart` DATETIME,
  `dtend` DATETIME,
  CONSTRAINT `fk_kolab_cache_freebusy_folder` FOREIGN KEY (`folder_id`)
    REFERENCES `kolab_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY(`folder_id`,`msguid`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;


-- Migrate data from old kolab_cache table

INSERT INTO kolab_folders (resource, type)
  SELECT DISTINCT resource, type
  FROM  kolab_cache WHERE type IN ('event','contact','task','file');

INSERT INTO kolab_cache_event (folder_id, msguid, uid, created, changed, data, xml, tags, words, dtstart, dtend)
  SELECT kolab_folders.folder_id, msguid, uid, created, changed, data, xml, tags, words, dtstart, dtend
  FROM kolab_cache LEFT JOIN kolab_folders ON (kolab_folders.resource = kolab_cache.resource)
  WHERE kolab_cache.type = 'event' AND kolab_folders.folder_id IS NOT NULL;

INSERT INTO kolab_cache_task (folder_id, msguid, uid, created, changed, data, xml, tags, words, dtstart, dtend)
  SELECT kolab_folders.folder_id, msguid, uid, created, changed, data, xml, tags, words, dtstart, dtend
  FROM kolab_cache LEFT JOIN kolab_folders ON (kolab_folders.resource = kolab_cache.resource)
  WHERE kolab_cache.type = 'task' AND kolab_folders.folder_id IS NOT NULL;

INSERT INTO kolab_cache_contact (folder_id, msguid, uid, created, changed, data, xml, tags, words, type)
  SELECT kolab_folders.folder_id, msguid, uid, created, changed, data, xml, tags, words, kolab_cache.type
  FROM kolab_cache LEFT JOIN kolab_folders ON (kolab_folders.resource = kolab_cache.resource)
  WHERE kolab_cache.type IN ('contact','distribution-list') AND kolab_folders.folder_id IS NOT NULL;

INSERT INTO kolab_cache_file (folder_id, msguid, uid, created, changed, data, xml, tags, words, filename)
  SELECT kolab_folders.folder_id, msguid, uid, created, changed, data, xml, tags, words, filename
  FROM kolab_cache LEFT JOIN kolab_folders ON (kolab_folders.resource = kolab_cache.resource)
  WHERE kolab_cache.type = 'file' AND kolab_folders.folder_id IS NOT NULL;


DROP TABLE IF EXISTS `kolab_cache`;

