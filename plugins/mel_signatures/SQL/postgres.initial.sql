-- mel_signatures : libellés du bloc Marque État et DN associés (ticket 0009463, V1)
-- Les liens pré-établis (V2) auront deux tables de même forme : mel_signatures_links et mel_signatures_link_dns.
-- Base : Roundcube (PostgreSQL).
--
-- Les clés primaires suivent la convention des tables Roundcube (ex. identities) :
-- une séquence nommée <table>_seq. rcube_db::insert_id('<table>') lit cette séquence,
-- une colonne GENERATED ... AS IDENTITY ne fonctionnerait pas avec Roundcube.

-- ---------------------------------------------------------------------------
-- Libellés du bloc Marque État
-- ---------------------------------------------------------------------------

CREATE SEQUENCE mel_signatures_titles_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE mel_signatures_titles (
    title_id integer DEFAULT nextval('mel_signatures_titles_seq'::text) PRIMARY KEY,
    title_label text NOT NULL,
    title_signature_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mel_signatures_titles_label_key UNIQUE (title_label)
);

ALTER SEQUENCE mel_signatures_titles_seq OWNED BY mel_signatures_titles.title_id;

COMMENT ON TABLE mel_signatures_titles IS 'Libellés du bloc Marque État proposés dans le générateur de signature (ticket 0009463)';
COMMENT ON COLUMN mel_signatures_titles.title_label IS 'Nom affiché dans la liste, tri alphabétique';
COMMENT ON COLUMN mel_signatures_titles.title_signature_text IS 'Texte imprimé dans la signature, une ligne par retour à la ligne, sans HTML';

CREATE SEQUENCE mel_signatures_title_dns_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE mel_signatures_title_dns (
    title_dn_id integer DEFAULT nextval('mel_signatures_title_dns_seq'::text) PRIMARY KEY,
    title_id integer NOT NULL
        REFERENCES mel_signatures_titles (title_id) ON DELETE CASCADE ON UPDATE CASCADE,
    dn text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mel_signatures_title_dns_dn_key UNIQUE (dn)
);

ALTER SEQUENCE mel_signatures_title_dns_seq OWNED BY mel_signatures_title_dns.title_dn_id;

CREATE INDEX mel_signatures_title_dns_title_id_idx ON mel_signatures_title_dns (title_id);

COMMENT ON TABLE mel_signatures_title_dns IS 'DN LDAP déterminant le libellé proposé par défaut à un agent (ticket 0009463)';
COMMENT ON COLUMN mel_signatures_title_dns.dn IS 'Partie de DN recherchée dans le DN de l''agent (le plus long gagne), ou « default » pour le repli';
