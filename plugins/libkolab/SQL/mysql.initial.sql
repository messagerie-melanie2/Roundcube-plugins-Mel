/**
 * libkolab database schema
 *
 * @version 1.2
 * @author Thomas Bruederli
 * @licence GNU AGPL
 **/

/*!40014  SET FOREIGN_KEY_CHECKS=0 */;

DROP TABLE IF EXISTS `kolab_folders`;

CREATE TABLE `kolab_folders` (
  `folder_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `resource` VARCHAR(255) BINARY NOT NULL,
  `type` VARCHAR(32) NOT NULL,
  `synclock` INT(10) NOT NULL DEFAULT '0',
  `ctag` VARCHAR(40) DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `objectcount` BIGINT DEFAULT NULL,
  PRIMARY KEY(`folder_id`),
  INDEX `resource_type` (`resource`, `type`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

DROP TABLE IF EXISTS `kolab_cache`;

DROP TABLE IF EXISTS `kolab_cache_contact`;

CREATE TABLE `kolab_cache_contact` (
  `folder_id` BIGINT UNSIGNED NOT NULL,
  `msguid` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(512) NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `data` LONGTEXT NOT NULL,
  `tags` TEXT NOT NULL,
  `words` TEXT NOT NULL,
  `type` VARCHAR(32) CHARACTER SET ascii NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `firstname` VARCHAR(255) NOT NULL,
  `surname` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  CONSTRAINT `fk_kolab_cache_contact_folder` FOREIGN KEY (`folder_id`)
    REFERENCES `kolab_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY(`folder_id`,`msguid`),
  INDEX `contact_type` (`folder_id`,`type`),
  INDEX `contact_uid2msguid` (`folder_id`,`uid`,`msguid`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

DROP TABLE IF EXISTS `kolab_cache_event`;

CREATE TABLE `kolab_cache_event` (
  `folder_id` BIGINT UNSIGNED NOT NULL,
  `msguid` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(512) NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `data` LONGTEXT NOT NULL,
  `tags` TEXT NOT NULL,
  `words` TEXT NOT NULL,
  `dtstart` DATETIME,
  `dtend` DATETIME,
  CONSTRAINT `fk_kolab_cache_event_folder` FOREIGN KEY (`folder_id`)
    REFERENCES `kolab_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY(`folder_id`,`msguid`),
  INDEX `event_uid2msguid` (`folder_id`,`uid`,`msguid`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

DROP TABLE IF EXISTS `kolab_cache_task`;

CREATE TABLE `kolab_cache_task` (
  `folder_id` BIGINT UNSIGNED NOT NULL,
  `msguid` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(512) NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `data` LONGTEXT NOT NULL,
  `tags` TEXT NOT NULL,
  `words` TEXT NOT NULL,
  `dtstart` DATETIME,
  `dtend` DATETIME,
  CONSTRAINT `fk_kolab_cache_task_folder` FOREIGN KEY (`folder_id`)
    REFERENCES `kolab_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY(`folder_id`,`msguid`),
  INDEX `task_uid2msguid` (`folder_id`,`uid`,`msguid`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

DROP TABLE IF EXISTS `kolab_cache_journal`;

CREATE TABLE `kolab_cache_journal` (
  `folder_id` BIGINT UNSIGNED NOT NULL,
  `msguid` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(512) NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `data` LONGTEXT NOT NULL,
  `tags` TEXT NOT NULL,
  `words` TEXT NOT NULL,
  `dtstart` DATETIME,
  `dtend` DATETIME,
  CONSTRAINT `fk_kolab_cache_journal_folder` FOREIGN KEY (`folder_id`)
    REFERENCES `kolab_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY(`folder_id`,`msguid`),
  INDEX `journal_uid2msguid` (`folder_id`,`uid`,`msguid`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

DROP TABLE IF EXISTS `kolab_cache_note`;

CREATE TABLE `kolab_cache_note` (
  `folder_id` BIGINT UNSIGNED NOT NULL,
  `msguid` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(512) NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `data` LONGTEXT NOT NULL,
  `tags` TEXT NOT NULL,
  `words` TEXT NOT NULL,
  CONSTRAINT `fk_kolab_cache_note_folder` FOREIGN KEY (`folder_id`)
    REFERENCES `kolab_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY(`folder_id`,`msguid`),
  INDEX `note_uid2msguid` (`folder_id`,`uid`,`msguid`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

DROP TABLE IF EXISTS `kolab_cache_file`;

CREATE TABLE `kolab_cache_file` (
  `folder_id` BIGINT UNSIGNED NOT NULL,
  `msguid` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(512) NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `data` LONGTEXT NOT NULL,
  `tags` TEXT NOT NULL,
  `words` TEXT NOT NULL,
  `filename` varchar(255) DEFAULT NULL,
  CONSTRAINT `fk_kolab_cache_file_folder` FOREIGN KEY (`folder_id`)
    REFERENCES `kolab_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY(`folder_id`,`msguid`),
  INDEX `folder_filename` (`folder_id`, `filename`),
  INDEX `file_uid2msguid` (`folder_id`,`uid`,`msguid`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

DROP TABLE IF EXISTS `kolab_cache_configuration`;

CREATE TABLE `kolab_cache_configuration` (
  `folder_id` BIGINT UNSIGNED NOT NULL,
  `msguid` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(512) NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `data` LONGTEXT NOT NULL,
  `tags` TEXT NOT NULL,
  `words` TEXT NOT NULL,
  `type` VARCHAR(32) CHARACTER SET ascii NOT NULL,
  CONSTRAINT `fk_kolab_cache_configuration_folder` FOREIGN KEY (`folder_id`)
    REFERENCES `kolab_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY(`folder_id`,`msguid`),
  INDEX `configuration_type` (`folder_id`,`type`),
  INDEX `configuration_uid2msguid` (`folder_id`,`uid`,`msguid`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

DROP TABLE IF EXISTS `kolab_cache_freebusy`;

CREATE TABLE `kolab_cache_freebusy` (
  `folder_id` BIGINT UNSIGNED NOT NULL,
  `msguid` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(512) NOT NULL,
  `created` DATETIME DEFAULT NULL,
  `changed` DATETIME DEFAULT NULL,
  `data` LONGTEXT NOT NULL,
  `tags` TEXT NOT NULL,
  `words` TEXT NOT NULL,
  `dtstart` DATETIME,
  `dtend` DATETIME,
  CONSTRAINT `fk_kolab_cache_freebusy_folder` FOREIGN KEY (`folder_id`)
    REFERENCES `kolab_folders`(`folder_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY(`folder_id`,`msguid`),
  INDEX `freebusy_uid2msguid` (`folder_id`,`uid`,`msguid`)
) /*!40000 ENGINE=INNODB */ /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;

/*!40014  SET FOREIGN_KEY_CHECKS=1 */;

REPLACE INTO `system` (`name`, `value`) VALUES ('libkolab-version', '2019092900');
