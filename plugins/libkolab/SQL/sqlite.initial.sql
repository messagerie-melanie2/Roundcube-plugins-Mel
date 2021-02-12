/**
 * libkolab database schema
 *
 * @version 1.2
 * @author Thomas Bruederli
 * @licence GNU AGPL
 **/

CREATE TABLE kolab_folders (
  folder_id INTEGER NOT NULL PRIMARY KEY,
  resource VARCHAR(255) NOT NULL,
  type VARCHAR(32) NOT NULL,
  synclock INTEGER NOT NULL DEFAULT '0',
  ctag VARCHAR(40) DEFAULT NULL,
  changed DATETIME DEFAULT NULL,
  objectcount INTEGER DEFAULT NULL
);

CREATE INDEX ix_resource_type ON kolab_folders(resource, type);

CREATE TABLE kolab_cache_contact (
  folder_id INTEGER NOT NULL,
  msguid INTEGER NOT NULL,
  uid VARCHAR(512) NOT NULL,
  created DATETIME DEFAULT NULL,
  changed DATETIME DEFAULT NULL,
  data TEXT NOT NULL,
  tags TEXT NOT NULL,
  words TEXT NOT NULL,
  type VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  firstname VARCHAR(255) NOT NULL,
  surname VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  PRIMARY KEY(folder_id,msguid)
);

CREATE INDEX ix_contact_type ON kolab_cache_contact(folder_id,type);
CREATE INDEX ix_contact_uid2msguid ON kolab_cache_contact(folder_id,uid,msguid);

CREATE TABLE kolab_cache_event (
  folder_id INTEGER NOT NULL,
  msguid INTEGER NOT NULL,
  uid VARCHAR(512) NOT NULL,
  created DATETIME DEFAULT NULL,
  changed DATETIME DEFAULT NULL,
  data TEXT NOT NULL,
  tags TEXT NOT NULL,
  words TEXT NOT NULL,
  dtstart DATETIME,
  dtend DATETIME,
  PRIMARY KEY(folder_id,msguid)
);

CREATE INDEX ix_event_uid2msguid ON kolab_cache_event(folder_id,uid,msguid);

CREATE TABLE kolab_cache_task (
  folder_id INTEGER NOT NULL,
  msguid INTEGER NOT NULL,
  uid VARCHAR(512) NOT NULL,
  created DATETIME DEFAULT NULL,
  changed DATETIME DEFAULT NULL,
  data TEXT NOT NULL,
  tags TEXT NOT NULL,
  words TEXT NOT NULL,
  dtstart DATETIME,
  dtend DATETIME,
  PRIMARY KEY(folder_id,msguid)
);

CREATE INDEX ix_task_uid2msguid ON kolab_cache_task(folder_id,uid,msguid);

CREATE TABLE kolab_cache_journal (
  folder_id INTEGER NOT NULL,
  msguid INTEGER NOT NULL,
  uid VARCHAR(512) NOT NULL,
  created DATETIME DEFAULT NULL,
  changed DATETIME DEFAULT NULL,
  data TEXT NOT NULL,
  tags TEXT NOT NULL,
  words TEXT NOT NULL,
  dtstart DATETIME,
  dtend DATETIME,
  PRIMARY KEY(folder_id,msguid)
);

CREATE INDEX ix_journal_uid2msguid ON kolab_cache_journal(folder_id,uid,msguid);

CREATE TABLE kolab_cache_note (
  folder_id INTEGER NOT NULL,
  msguid INTEGER NOT NULL,
  uid VARCHAR(512) NOT NULL,
  created DATETIME DEFAULT NULL,
  changed DATETIME DEFAULT NULL,
  data TEXT NOT NULL,
  tags TEXT NOT NULL,
  words TEXT NOT NULL,
  PRIMARY KEY(folder_id,msguid)
);

CREATE INDEX ix_note_uid2msguid ON kolab_cache_note(folder_id,uid,msguid);

CREATE TABLE kolab_cache_file (
  folder_id INTEGER NOT NULL,
  msguid INTEGER NOT NULL,
  uid VARCHAR(512) NOT NULL,
  created DATETIME DEFAULT NULL,
  changed DATETIME DEFAULT NULL,
  data TEXT NOT NULL,
  tags TEXT NOT NULL,
  words TEXT NOT NULL,
  filename varchar(255) DEFAULT NULL,
  PRIMARY KEY(folder_id,msguid)
);

CREATE INDEX ix_folder_filename ON kolab_cache_file(folder_id,filename);
CREATE INDEX ix_file_uid2msguid ON kolab_cache_file(folder_id,uid,msguid);

CREATE TABLE kolab_cache_configuration (
  folder_id INTEGER NOT NULL,
  msguid INTEGER NOT NULL,
  uid VARCHAR(512) NOT NULL,
  created DATETIME DEFAULT NULL,
  changed DATETIME DEFAULT NULL,
  data TEXT NOT NULL,
  tags TEXT NOT NULL,
  words TEXT NOT NULL,
  type VARCHAR(32) NOT NULL,
  PRIMARY KEY(folder_id,msguid)
);

CREATE INDEX ix_configuration_type ON kolab_cache_configuration(folder_id,type);
CREATE INDEX ix_configuration_uid2msguid ON kolab_cache_configuration(folder_id,uid,msguid);

CREATE TABLE kolab_cache_freebusy (
  folder_id INTEGER NOT NULL,
  msguid INTEGER NOT NULL,
  uid VARCHAR(512) NOT NULL,
  created DATETIME DEFAULT NULL,
  changed DATETIME DEFAULT NULL,
  data TEXT NOT NULL,
  tags TEXT NOT NULL,
  words TEXT NOT NULL,
  dtstart DATETIME,
  dtend DATETIME,
  PRIMARY KEY(folder_id,msguid)
);

CREATE INDEX ix_freebusy_uid2msguid ON kolab_cache_freebusy(folder_id,uid,msguid);

INSERT INTO system (name, value) VALUES ('libkolab-version', '2019092900');
