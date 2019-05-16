CREATE TABLE pamela_mailcount (
  uid character varying(255) NOT NULL,
  send_time timestamp without time zone NOT NULL,
  nb_dest integer NOT NULL DEFAULT 0,
  address_ip character varying(16) NOT NULL DEFAULT '0.0.0.0'::character varying
);

CREATE TABLE pamela_tentativescnx (
  uid character varying(128) PRIMARY KEY,
  lastcnx integer NOT NULL,
  nbtentatives integer NOT NULL
);

