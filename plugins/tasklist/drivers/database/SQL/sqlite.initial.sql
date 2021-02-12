/**
 * Roundcube Tasklist plugin database
 *
 * @author Thomas Bruederli
 * @licence GNU AGPL
 * @copyright (C) 2014, Kolab Systems AG
 */

CREATE TABLE tasklists (
    tasklist_id integer NOT NULL PRIMARY KEY,
    user_id integer NOT NULL,
    name varchar(255) NOT NULL,
    color varchar(8) NOT NULL,
    showalarms tinyint NOT NULL DEFAULT '0',
    CONSTRAINT fk_tasklists_user_id FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX ix_tasklists_user_id ON tasklists (user_id, name);

CREATE TABLE tasks (
    task_id integer NOT NULL PRIMARY KEY,
    tasklist_id integer NOT NULL,
    parent_id integer DEFAULT NULL,
    uid varchar(255) NOT NULL,
    created datetime NOT NULL DEFAULT (datetime('now', 'localtime')),
    changed datetime NOT NULL DEFAULT (datetime('now', 'localtime')),
    del tinyint NOT NULL DEFAULT '0',
    title varchar(255) NOT NULL,
    description text,
    tags text,
    "date" varchar(10) DEFAULT NULL,
    "time" varchar(5) DEFAULT NULL,
    startdate varchar(10) DEFAULT NULL,
    starttime varchar(5) DEFAULT NULL,
    flagged tinyint NOT NULL DEFAULT '0',
    complete real NOT NULL DEFAULT '0',
    status varchar(16) NOT NULL DEFAULT '',
    alarms varchar(255) DEFAULT NULL,
    recurrence varchar(255) DEFAULT NULL,
    organizer varchar(255) DEFAULT NULL,
    attendees text,
    notify datetime DEFAULT NULL,
    CONSTRAINT fk_tasks_tasklist_id FOREIGN KEY (tasklist_id)
        REFERENCES tasklists (tasklist_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX ix_tasks_tasklisting ON tasks (tasklist_id, del, date);
CREATE INDEX ix_tasks_uid ON tasks (uid);

INSERT INTO system (name, value) VALUES ('tasklist-database-version', '2014051900');
