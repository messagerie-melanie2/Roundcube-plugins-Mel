ALTER TABLE `kolab_cache_contact` ADD `name` VARCHAR(255) NOT NULL,
  ADD `firstname` VARCHAR(255) NOT NULL,
  ADD `surname` VARCHAR(255) NOT NULL,
  ADD `email` VARCHAR(255) NOT NULL;

-- updating or clearing all contacts caches is required.
-- either run `bin/modcache.sh update --type=contact` or execute the following query:
--   DELETE FROM `kolab_folders` WHERE `type`='contact';

