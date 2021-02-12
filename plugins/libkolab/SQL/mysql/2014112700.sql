-- delete cache entries for old folder identifiers
DELETE FROM `kolab_folders` WHERE `resource` LIKE 'imap://anonymous@%';
