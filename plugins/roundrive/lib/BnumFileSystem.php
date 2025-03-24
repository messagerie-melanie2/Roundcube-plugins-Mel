<?php
include_once "BnumWebDavAdaptater.php";
use League\Flysystem\Filesystem;
use League\Flysystem\Util\ContentListingFormatter;

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
     * @return array
     */
    public function listFavorites(?callable $whereCallback = null) : \Generator {
        $favorites = iterator_to_array($this->_where($this->getAdapter()->listFavorites(), $whereCallback));
        yield from (new ContentListingFormatter('', true, true))->formatListing($favorites);
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
}