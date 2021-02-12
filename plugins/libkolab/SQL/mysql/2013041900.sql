DELETE FROM `kolab_cache` WHERE `type` = 'file';
ALTER TABLE `kolab_cache` ADD `filename` varchar(255) DEFAULT NULL;
ALTER TABLE `kolab_cache` ADD INDEX `resource_filename` (`resource`, `filename`);
