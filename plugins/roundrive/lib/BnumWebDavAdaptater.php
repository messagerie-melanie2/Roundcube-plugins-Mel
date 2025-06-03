<?php
use League\Flysystem\WebDAV\WebDAVAdapter;
include_once "BnumClient.php";

/**
 * Classe BnumWebDavAdaptater
 * Adaptateur WebDAV personnalisé pour gérer les fonctionnalités spécifiques comme la corbeille et les favoris.
 */
class BnumWebDavAdaptater extends WebDAVAdapter {
    /**
     * Constructeur.
     *
     * @param BnumClient $client Instance du client Bnum.
     * @param string|null $prefix Préfixe pour les chemins (optionnel).
     */
    public function __construct(BnumClient $client, $prefix = null)
    {
        parent::__construct($client, $prefix);
    }

    /**
     * Récupère le client Bnum.
     *
     * @return BnumClient Instance du client Bnum.
     */
    private function _getClient() : BnumClient {
        return $this->client;
    }

    /**
     * Liste les fichiers dans la corbeille.
     *
     * @return \Generator Générateur qui retourne les objets de la corbeille.
     */
    public function listTrash() : Generator {
        $directory = 'trash';
        $location = str_replace('files', 'trashbin', $this->applyPathPrefix($directory));
        $response = $this->_getClient()->propFind(
            $location . '/',
            [
                '{DAV:}displayname',
                '{DAV:}getcontentlength',
                '{DAV:}getcontenttype',
                '{DAV:}getlastmodified',
                '{DAV:}getetag',
                '{http://owncloud.org/ns}fileid',
                '{http://owncloud.org/ns}owner-display-name',
                '{http://nextcloud.org/ns}trashbin-filename',
                '{http://nextcloud.org/ns}trashbin-deletion-time',
                '{http://nextcloud.org/ns}trashbin-original-location',
                '{http://nextcloud.org/ns}trashbin-title',
                '{http://nextcloud.org/ns}lock',
                '{http://nextcloud.org/ns}lock-owner',
                '{http://nextcloud.org/ns}lock-owner-displayname',
                '{http://nextcloud.org/ns}lock-time',
                '{http://nextcloud.org/ns}lock-owner-type',
                '{http://nextcloud.org/ns}lock-owner-editor',
            ],
            1
        );

        array_shift($response);

        foreach ($response as $path => $object) {
            $path = $this->removePathPrefix($path);
            $object = $this->normalizeObject($object, $path);

            yield $object;
        }

    }
 
    /**
     * Liste les fichiers marqués comme favoris.
     *
     * @return \Generator Générateur qui retourne les objets favoris.
     */
    public function listFavorites() : \Generator
    {
        $directory = '';
        $location = $this->applyPathPrefix($directory);
        $response = $this->_getClient()->findFromFilter($location . '/', [
            '{DAV:}displayname',
            '{DAV:}getcontentlength',
            '{DAV:}getcontenttype',
            '{DAV:}getlastmodified',
            '{DAV:}getetag',
            '{http://owncloud.org/ns}fileid',
            '{http://owncloud.org/ns}owner-display-name',
        ], [
            '{http://owncloud.org/ns}filter-rules' => [
                '{http://owncloud.org/ns}favorite' => 1
            ]
        ]);

        array_shift($response);

        foreach ($response as $path => $object) {
            $path = $this->removePathPrefix($path);
            $object = $this->normalizeObject($object, $path);

            yield $object;
        }
    }

    /**
     * Normalise un objet WebDAV en ajoutant des métadonnées supplémentaires.
     *
     * @param array $object Tableau contenant les données de l'objet.
     * @param string $path Chemin de l'objet.
     * @return array Objet normalisé avec des métadonnées supplémentaires.
     */
    protected function normalizeObject(array $object, $path) {
        $result = parent::normalizeObject($object, $path);
        $result['otherRawData'] = [];

        foreach ($object as $key => $value) {
            switch ($key) {
                case '{http://nextcloud.org/ns}trashbin-title':
                    $result['originalLocation'] = $value;
                    break;
                
                default:
                    $result['otherRawData'][$key] = $value;
                    break;
            }
        }

        return $result;
    }
}