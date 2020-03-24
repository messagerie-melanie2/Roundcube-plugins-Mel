-- Index: pamela_mailcount_send_time_idx

-- DROP INDEX pamela_mailcount_send_time_idx;

CREATE INDEX pamela_mailcount_send_time_idx
  ON pamela_mailcount
  USING btree
  (send_time);

-- Index: pamela_mailcount_uid_idx

-- DROP INDEX pamela_mailcount_uid_idx;

CREATE INDEX pamela_mailcount_uid_idx
  ON pamela_mailcount
  USING btree
  (uid COLLATE pg_catalog."default");