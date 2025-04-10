<?php
include_once "BnumWebDavAdaptater.php";
use League\Flysystem\Filesystem;
use League\Flysystem\Util\ContentListingFormatter;
use Sabre\VObject\Property\Boolean;

class BnumFileSystem extends Filesystem {
    /**
     * Constructor.
     *
     * @param BnumWebDavAdaptater $adapter
     * @param Config|array     $config
     */
    public function __construct(BnumWebDavAdaptater $adapter, $config = null)
    {
        parent::__construct($adapter, $config);
    }

    public function getAdapter() : BnumWebDavAdaptater
    {
        return parent::getAdapter();
    }

    /**
     * Lists all favorites.
     * @return Generator
     */
    public function listFavorites(?callable $whereCallback = null) : \Generator {
        $favorites = iterator_to_array($this->_where($this->getAdapter()->listFavorites(), $whereCallback));
        yield from (new ContentListingFormatter('', true, true))->formatListing($favorites);
    }

    /**
     * Lists all trashes.
     * @return Generator
     */
    public function listTashes(?callable $whereCallback = null, bool $setOriginalPath = true) : Generator {
        // Récupère les éléments de la corbeille lié à un dossier précis ou non.
        $trashes = $this->_where($this->getAdapter()->listTrash(), $whereCallback);

        if ($setOriginalPath) {
            // Formate les éléments de la corbeille pour avoir le bon chemin
            $trashes = $this->_select($trashes, function ($object) {
                $object['path'] = $object['originalLocation'];
                return $object;
            });
        }

        // Formate les éléments de la corbeille pour avoir le bon format
        $trashes = (new ContentListingFormatter('', true, true))->formatListing(iterator_to_array($trashes));
        yield from $trashes;
    }

    /**
     * Permet de filtrer les résultats en fonction d'un callback
     * @return \Generator
     */
    private function _where(\Generator $generator, ?callable $callback) : \Generator {
        if ($callback === null) yield from $generator;
        else {
            foreach ($generator as $object) {
                if (call_user_func($callback, $object)) {
                    yield $object;
                }
            }
        }
    }

    /**
     * Permet de modifier les résultats en fonction d'un callback
     * @return \Generator
     */
    private function _select(\Generator $generator, ?callable $callback) : \Generator {
        if ($callback === null) yield from $generator;
        else {
            foreach ($generator as $object) {
                yield call_user_func($callback, $object);
            }
        }
    }
}