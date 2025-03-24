<?php
use League\Flysystem\WebDAV\WebDAVAdapter;
include_once "BnumClient.php";

class BnumWebDavAdaptater extends WebDAVAdapter {
    /**
     * Constructor.
     *
     * @param BnumClient $client
     * @param string $prefix
     */
    public function __construct(BnumClient $client, $prefix = null)
    {
        parent::__construct($client, $prefix);
    }

    private function _getClient() : BnumClient {
        return $this->client;
    }
 
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
}