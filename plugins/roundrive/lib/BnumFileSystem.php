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
        $trashes = iterator_to_array($this->_where($this->getAdapter()->listTrash(), $whereCallback));
        $trashes = (new ContentListingFormatter('', true, true))->formatListing($trashes);
        if ($setOriginalPath === false) yield from $trashes;
        else {
            foreach ($trashes as $value) {
                $value['path'] = $value['originalLocation'];
                yield $value;
            }
        }
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