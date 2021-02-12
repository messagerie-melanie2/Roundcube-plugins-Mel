/**
 * libkolab database schema
 *
 * @version 1.2
 * @author Aleksander Machniak
 * @licence GNU AGPL
 **/


CREATE TABLE "kolab_folders" (
    "folder_id" number NOT NULL PRIMARY KEY,
    "resource" VARCHAR(255) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "synclock" integer DEFAULT 0 NOT NULL,
    "ctag" VARCHAR(40) DEFAULT NULL,
    "changed" timestamp DEFAULT NULL,
    "objectcount" number DEFAULT NULL
);

CREATE INDEX "kolab_folders_resource_idx" ON "kolab_folders" ("resource", "type");

CREATE SEQUENCE "kolab_folders_seq"
    START WITH 1 INCREMENT BY 1 NOMAXVALUE;

CREATE TRIGGER "kolab_folders_seq_trig"
BEFORE INSERT ON "kolab_folders" FOR EACH ROW
BEGIN
    :NEW."folder_id" := "kolab_folders_seq".nextval;
END;
/

CREATE TABLE "kolab_cache_contact" (
    "folder_id" number NOT NULL
        REFERENCES "kolab_folders" ("folder_id") ON DELETE CASCADE,
    "msguid" number NOT NULL,
    "uid" varchar(512) NOT NULL,
    "created" timestamp DEFAULT NULL,
    "changed" timestamp DEFAULT NULL,
    "data" clob NOT NULL,
    "tags" clob DEFAULT NULL,
    "words" clob DEFAULT NULL,
    "type" varchar(32) NOT NULL,
    "name" varchar(255) DEFAULT NULL,
    "firstname" varchar(255) DEFAULT NULL,
    "surname" varchar(255) DEFAULT NULL,
    "email" varchar(255) DEFAULT NULL,
    PRIMARY KEY ("folder_id", "msguid")
);

CREATE INDEX "kolab_cache_contact_type_idx" ON "kolab_cache_contact" ("folder_id", "type");
CREATE INDEX "kolab_cache_contact_uid2msguid" ON "kolab_cache_contact" ("folder_id", "uid", "msguid");


CREATE TABLE "kolab_cache_event" (
    "folder_id" number NOT NULL
        REFERENCES "kolab_folders" ("folder_id") ON DELETE CASCADE,
    "msguid" number NOT NULL,
    "uid" varchar(512) NOT NULL,
    "created" timestamp DEFAULT NULL,
    "changed" timestamp DEFAULT NULL,
    "data" clob NOT NULL,
    "tags" clob DEFAULT NULL,
    "words" clob DEFAULT NULL,
    "dtstart" timestamp DEFAULT NULL,
    "dtend" timestamp DEFAULT NULL,
    PRIMARY KEY ("folder_id", "msguid")
);

CREATE INDEX "kolab_cache_event_uid2msguid" ON "kolab_cache_event" ("folder_id", "uid", "msguid");


CREATE TABLE "kolab_cache_task" (
    "folder_id" number NOT NULL
        REFERENCES "kolab_folders" ("folder_id") ON DELETE CASCADE,
    "msguid" number NOT NULL,
    "uid" varchar(512) NOT NULL,
    "created" timestamp DEFAULT NULL,
    "changed" timestamp DEFAULT NULL,
    "data" clob NOT NULL,
    "tags" clob DEFAULT NULL,
    "words" clob DEFAULT NULL,
    "dtstart" timestamp DEFAULT NULL,
    "dtend" timestamp DEFAULT NULL,
    PRIMARY KEY ("folder_id", "msguid")
);

CREATE INDEX "kolab_cache_task_uid2msguid" ON "kolab_cache_task" ("folder_id", "uid", "msguid");


CREATE TABLE "kolab_cache_journal" (
    "folder_id" number NOT NULL
        REFERENCES "kolab_folders" ("folder_id") ON DELETE CASCADE,
    "msguid" number NOT NULL,
    "uid" varchar(512) NOT NULL,
    "created" timestamp DEFAULT NULL,
    "changed" timestamp DEFAULT NULL,
    "data" clob NOT NULL,
    "tags" clob DEFAULT NULL,
    "words" clob DEFAULT NULL,
    "dtstart" timestamp DEFAULT NULL,
    "dtend" timestamp DEFAULT NULL,
    PRIMARY KEY ("folder_id", "msguid")
);

CREATE INDEX "kolab_cache_journal_uid2msguid" ON "kolab_cache_journal" ("folder_id", "uid", "msguid");


CREATE TABLE "kolab_cache_note" (
    "folder_id" number NOT NULL
        REFERENCES "kolab_folders" ("folder_id") ON DELETE CASCADE,
    "msguid" number NOT NULL,
    "uid" varchar(512) NOT NULL,
    "created" timestamp DEFAULT NULL,
    "changed" timestamp DEFAULT NULL,
    "data" clob NOT NULL,
    "tags" clob DEFAULT NULL,
    "words" clob DEFAULT NULL,
    PRIMARY KEY ("folder_id", "msguid")
);

CREATE INDEX "kolab_cache_note_uid2msguid" ON "kolab_cache_note" ("folder_id", "uid", "msguid");


CREATE TABLE "kolab_cache_file" (
    "folder_id" number NOT NULL
        REFERENCES "kolab_folders" ("folder_id") ON DELETE CASCADE,
    "msguid" number NOT NULL,
    "uid" varchar(512) NOT NULL,
    "created" timestamp DEFAULT NULL,
    "changed" timestamp DEFAULT NULL,
    "data" clob NOT NULL,
    "tags" clob DEFAULT NULL,
    "words" clob DEFAULT NULL,
    "filename" varchar(255) DEFAULT NULL,
    PRIMARY KEY ("folder_id", "msguid")
);

CREATE INDEX "kolab_cache_file_filename" ON "kolab_cache_file" ("folder_id", "filename");
CREATE INDEX "kolab_cache_file_uid2msguid" ON "kolab_cache_file" ("folder_id", "uid", "msguid");


CREATE TABLE "kolab_cache_configuration" (
    "folder_id" number NOT NULL
        REFERENCES "kolab_folders" ("folder_id") ON DELETE CASCADE,
    "msguid" number NOT NULL,
    "uid" varchar(512) NOT NULL,
    "created" timestamp DEFAULT NULL,
    "changed" timestamp DEFAULT NULL,
    "data" clob NOT NULL,
    "tags" clob DEFAULT NULL,
    "words" clob DEFAULT NULL,
    "type" varchar(32) NOT NULL,
    PRIMARY KEY ("folder_id", "msguid")
);

CREATE INDEX "kolab_cache_config_type" ON "kolab_cache_configuration" ("folder_id", "type");
CREATE INDEX "kolab_cache_config_uid2msguid" ON "kolab_cache_configuration" ("folder_id", "uid", "msguid");


CREATE TABLE "kolab_cache_freebusy" (
    "folder_id" number NOT NULL
        REFERENCES "kolab_folders" ("folder_id") ON DELETE CASCADE,
    "msguid" number NOT NULL,
    "uid" varchar(512) NOT NULL,
    "created" timestamp DEFAULT NULL,
    "changed" timestamp DEFAULT NULL,
    "data" clob NOT NULL,
    "tags" clob DEFAULT NULL,
    "words" clob DEFAULT NULL,
    "dtstart" timestamp DEFAULT NULL,
    "dtend" timestamp DEFAULT NULL,
    PRIMARY KEY("folder_id", "msguid")
);

CREATE INDEX "kolab_cache_fb_uid2msguid" ON "kolab_cache_freebusy" ("folder_id", "uid", "msguid");


INSERT INTO "system" ("name", "value") VALUES ('libkolab-version', '2019092900');
