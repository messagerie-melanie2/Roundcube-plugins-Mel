<?php

declare(strict_types=1);

/**
 * Image personnalisée refusée par la validation.
 */
class mel_custom_picture_exception extends RuntimeException
{
}

/**
 * Data-URI d'image validée et ré-encodée, prête à être stockée dans les
 * préférences utilisateur et injectée dans du CSS.
 *
 * La seule façon d'obtenir une instance est `from_data_uri()`, qui rejette
 * tout ce qui n'est pas une image décodable par GD. Les octets conservés
 * sont ceux produits par GD, pas ceux reçus : tout ce qui n'est pas du pixel
 * (métadonnées EXIF, données concaténées après la fin du format, fichiers
 * polyglottes) disparaît au ré-encodage.
 */
final class mel_custom_picture
{
    /**
     * Forme normalisée d'une image stockée. L'alphabet base64 ne contient ni
     * quote, ni parenthèse, ni point-virgule : une valeur qui matche ce motif
     * est injectable dans un `url(...)` CSS sans échappement supplémentaire.
     */
    private const NORMALIZED_PATTERN =
        '#^data:image/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$#';

    /** Taille max de la chaîne reçue. Doit rester alignée avec le contrôle côté client. */
    private const MAX_ENCODED_BYTES = 2097152;

    private const MAX_SIDE = 4000;

    /** Garde-fou contre les bombes de décompression (~32 Mo en truecolor GD). */
    private const MAX_PIXELS = 8000000;

    /** @var array<int, string> Types acceptés, du type réel détecté vers son mime. */
    private const ALLOWED_TYPES = [
        IMAGETYPE_PNG => 'image/png',
        IMAGETYPE_JPEG => 'image/jpeg',
        IMAGETYPE_GIF => 'image/gif',
        IMAGETYPE_WEBP => 'image/webp',
    ];

    /** @var int Constante IMAGETYPE_* du contenu. */
    private $type;

    /** @var string Octets produits par GD. */
    private $binary;

    private function __construct(int $type, string $binary)
    {
        $this->type = $type;
        $this->binary = $binary;
    }

    /**
     * Valide une data-URI reçue du client et retourne l'image ré-encodée.
     *
     * @throws mel_custom_picture_exception Si l'entrée n'est pas une image
     *                                     d'un des formats autorisés.
     */
    public static function from_data_uri(string $raw): self
    {
        // Avant tout décodage : la valeur part sérialisée dans la colonne
        // `preferences` et sera relue à chaque page.
        if (strlen($raw) > self::MAX_ENCODED_BYTES) {
            throw new mel_custom_picture_exception('Image trop volumineuse.');
        }

        $matches = [];
        if (!preg_match(self::NORMALIZED_PATTERN, $raw)
            || !preg_match('#^data:(image/[a-z]+);base64,(.*)$#', $raw, $matches)
        ) {
            throw new mel_custom_picture_exception('Format de data-URI invalide.');
        }

        $declared_mime = $matches[1];
        $binary = base64_decode($matches[2], true);

        if ($binary === false || $binary === '') {
            throw new mel_custom_picture_exception('Base64 invalide.');
        }

        $info = getimagesizefromstring($binary);

        if ($info === false) {
            throw new mel_custom_picture_exception('Contenu non reconnu comme image.');
        }

        $type = isset($info[2]) ? (int) $info[2] : 0;

        if (!isset(self::ALLOWED_TYPES[$type])) {
            throw new mel_custom_picture_exception('Format d\'image non autorisé.');
        }

        // Le mime annoncé dans la data-URI doit correspondre au contenu réel.
        if (self::ALLOWED_TYPES[$type] !== $declared_mime) {
            throw new mel_custom_picture_exception('Le type déclaré ne correspond pas au contenu.');
        }

        $width = (int) $info[0];
        $height = (int) $info[1];

        if ($width < 1 || $height < 1 || $width > self::MAX_SIDE || $height > self::MAX_SIDE) {
            throw new mel_custom_picture_exception('Dimensions d\'image hors limites.');
        }

        // Contrôlé avant tout appel à GD : le décodeur est lui-même une surface
        // d'attaque, on ne lui donne jamais une image aux dimensions non bornées.
        if ($width * $height > self::MAX_PIXELS) {
            throw new mel_custom_picture_exception('Image trop grande à décoder.');
        }

        return new self($type, self::reencode($binary, $type));
    }

    /**
     * Vérifie qu'une valeur déjà stockée est sous forme normalisée.
     *
     * À utiliser sur le chemin de lecture : les préférences enregistrées avant
     * ce correctif peuvent contenir n'importe quoi.
     */
    public static function is_normalized(?string $value): bool
    {
        return $value !== null
            && strlen($value) <= self::MAX_ENCODED_BYTES
            && preg_match(self::NORMALIZED_PATTERN, $value) === 1;
    }

    /**
     * Data-URI normalisée, reconstruite depuis le mime de la liste blanche.
     */
    public function to_data_uri(): string
    {
        return 'data:' . self::ALLOWED_TYPES[$this->type] . ';base64,' . base64_encode($this->binary);
    }

    /**
     * Décode puis ré-encode l'image, ne conservant que les pixels.
     */
    private static function reencode(string $binary, int $type): string
    {
        self::require_functions(['imagecreatefromstring', 'imagedestroy']);

        // `imagecreatefromstring` émet un warning au lieu de lever : on neutralise
        // le handler le temps de l'appel plutôt que d'utiliser `@`.
        set_error_handler(static function (): bool {
            return true;
        });

        try {
            $image = imagecreatefromstring($binary);
        } finally {
            restore_error_handler();
        }

        if ($image === false) {
            throw new mel_custom_picture_exception('Image non décodable.');
        }

        ob_start();

        try {
            $written = self::write($image, $type);
        } finally {
            $output = (string) ob_get_clean();
            imagedestroy($image);
        }

        if (!$written || $output === '') {
            throw new mel_custom_picture_exception('Ré-encodage impossible.');
        }

        return $output;
    }

    /**
     * Écrit l'image sur la sortie standard dans son format d'origine.
     *
     * @param resource|GdImage $image
     */
    private static function write($image, int $type): bool
    {
        switch ($type) {
            case IMAGETYPE_PNG:
                self::require_functions(['imagealphablending', 'imagesavealpha', 'imagepng']);

                imagealphablending($image, false);
                imagesavealpha($image, true);

                return imagepng($image);

            case IMAGETYPE_JPEG:
                self::require_functions(['imagejpeg']);

                return imagejpeg($image, null, 85);

            case IMAGETYPE_GIF:
                self::require_functions(['imagegif']);

                // GD n'écrit qu'une frame : un GIF animé est aplati.
                return imagegif($image);

            case IMAGETYPE_WEBP:
                self::require_functions(['imagealphablending', 'imagesavealpha', 'imagewebp']);

                imagealphablending($image, false);
                imagesavealpha($image, true);

                return imagewebp($image);

            default:
                return false;
        }
    }

    /**
     * Vérifie que les fonctions GD requises existent sur cette installation.
     *
     * GD est une extension optionnelle : certaines fonctions (notamment
     * `imagewebp`) peuvent être absentes même quand l'extension est chargée,
     * selon la version de la libgd liée au build de PHP.
     *
     * @param array<int, string> $functions Noms des fonctions GD requises.
     *
     * @throws mel_custom_picture_exception Si une fonction requise est absente.
     */
    private static function require_functions(array $functions): void
    {
        foreach ($functions as $function) {
            if (!function_exists($function)) {
                throw new mel_custom_picture_exception(
                    "Fonction GD indisponible sur cette installation : {$function}()."
                );
            }
        }
    }
}