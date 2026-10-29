-- Tables des libellés du bloc Marque État (base Roundcube, PostgreSQL)

-- Libellés

CREATE TABLE mel_signatures_titles (
    title_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title_label text NOT NULL,
    title_signature_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mel_signatures_titles_label_key UNIQUE (title_label)
);

COMMENT ON TABLE mel_signatures_titles IS 'Libellés du bloc Marque État proposés dans le générateur de signature (ticket 0009463)';
COMMENT ON COLUMN mel_signatures_titles.title_label IS 'Nom affiché dans la liste, tri alphabétique';
COMMENT ON COLUMN mel_signatures_titles.title_signature_text IS 'Texte imprimé dans la signature, une ligne par retour à la ligne, sans HTML';

-- DN qui choisissent le libellé proposé à un agent

CREATE TABLE mel_signatures_title_dn (
    title_dn_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title_id integer NOT NULL
        REFERENCES mel_signatures_titles (title_id) ON DELETE CASCADE ON UPDATE CASCADE,
    dn text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mel_signatures_title_dn_dn_key UNIQUE (dn)
);

CREATE INDEX mel_signatures_title_dn_title_id_idx ON mel_signatures_title_dn (title_id);

COMMENT ON TABLE mel_signatures_title_dn IS 'DN LDAP déterminant le libellé proposé par défaut à un agent (ticket 0009463)';
COMMENT ON COLUMN mel_signatures_title_dn.dn IS 'Partie de DN recherchée dans le DN de l''agent (le plus long gagne), ou « default » pour le repli';
