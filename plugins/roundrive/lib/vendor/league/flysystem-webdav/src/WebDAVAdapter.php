<?php

namespace League\Flysystem\WebDAV;

use League\Flysystem\Adapter\AbstractAdapter;
use League\Flysystem\Adapter\Polyfill\NotSupportingVisibilityTrait;
use League\Flysystem\Adapter\Polyfill\StreamedCopyTrait;
use League\Flysystem\Adapter\Polyfill\StreamedTrait;
use League\Flysystem\Config;
use League\Flysystem\Util;
use LogicException;
use Sabre\DAV\Client;
use Sabre\DAV\Exception;
use Sabre\DAV\Exception\NotFound;

class WebDAVAdapter extends AbstractAdapter
{
    use StreamedTrait;
    use StreamedCopyTrait;
    use NotSupportingVisibilityTrait;

    /**
     * @var array
     */
    protected static $resultMap = [
        '{DAV:}getcontentlength' => 'size',
        '{DAV:}getcontenttype' => 'mimetype',
        'content-length' => 'size',
        'content-type' => 'mimetype',
    ];

    /**
     * @var Client
     */
    protected $client;

    /**
     * Constructor.
     *
     * @param Client $client
     * @param string $prefix
     */
    public function __construct(Client $client, $prefix = null)
    {
        $this->client = $client;
        $this->setPathPrefix($prefix);
    }

    /**
     * {@inheritdoc}
     */
    public function getMetadata($path)
    {
        $location = $this->applyPathPrefix($path);

        try {
            $result = $this->client->propFind($location, [
                '{DAV:}displayname',
                '{DAV:}getcontentlength',
                '{DAV:}getcontenttype',
                '{DAV:}getlastmodified',
            ]);

            return $this->normalizeObject($result, $path);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * {@inheritdoc}
     */
    public function has($path)
    {
        return $this->getMetadata($path);
    }

    /**
     * {@inheritdoc}
     */
    public function read($path)
    {
        $location = $this->applyPathPrefix($path);

        try {
            $response = $this->client->request('GET', $location);

            if ($response['statusCode'] !== 200) {
                return false;
            }

            return array_merge([
                'contents' => $response['body'],
                'timestamp' => strtotime(is_array($response['headers']['last-modified'])
                    ? current($response['headers']['last-modified'])
                    : $response['headers']['last-modified']),
                'path' => $path,
            ], Util::map($response['headers'], static::$resultMap));
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * {@inheritdoc}
     */
    public function write($path, $contents, Config $config)
    {
        $location = $this->applyPathPrefix($path);
        $response = $this->client->request('PUT', $location, $contents);

        if ($response['statusCode'] >= 400) {
            return false;
        }

        $result = compact('path', 'contents');

        if ($config->get('visibility')) {
            throw new LogicException(__CLASS__.' does not support visibility settings.');
        }

        return $result;
    }

    /**
     * {@inheritdoc}
     */
    public function update($path, $contents, Config $config)
    {
        return $this->write($path, $contents, $config);
    }

    /**
     * {@inheritdoc}
     */
    public function rename($path, $newpath)
    {
        $location = $this->applyPathPrefix($path);
        $newLocation = $this->applyPathPrefix($newpath);

        try {
            $response = $this->client->request('MOVE', '/'.ltrim($location, '/'), null, [
                'Destination' => '/'.ltrim($newLocation, '/'),
            ]);

            if ($response['statusCode'] >= 200 && $response['statusCode'] < 300) {
                return true;
            }
        } catch (NotFound $e) {
            // Would have returned false here, but would be redundant
        }

        return false;
    }

    /**
     * {@inheritdoc}
     */
    public function delete($path)
    {
        $location = $this->applyPathPrefix($path);

        try {
            $this->client->request('DELETE', $location);

            return true;
        } catch (NotFound $e) {
            return false;
        }
    }

    /**
     * {@inheritdoc}
     */
    public function createDir($path, Config $config)
    {
        $location = $this->applyPathPrefix($path);
        $response = $this->client->request('MKCOL', $location);

        if ($response['statusCode'] !== 201) {
            return false;
        }

        return compact('path') + ['type' => 'dir'];
    }

    /**
     * {@inheritdoc}
     */
    public function deleteDir($dirname)
    {
        return $this->delete($dirname);
    }

    /**
     * {@inheritdoc}
     */
    public function listContents($directory = '', $recursive = false)
    {
        $location = $this->applyPathPrefix($directory);
        $response = $this->client->propFind($location . '/', [
            '{DAV:}displayname',
            '{DAV:}getcontentlength',
            '{DAV:}getcontenttype',
            '{DAV:}getlastmodified',
            '{http://owncloud.org/ns}fileid',
            '{http://owncloud.org/ns}owner-display-name',
        ], 1);

        array_shift($response);
        $result = [];

        foreach ($response as $path => $object) {
            $path = $this->removePathPrefix($path);
            $object = $this->normalizeObject($object, $path);
            $result[] = $object;

            if ($recursive && $object['type'] === 'dir') {
                $result = array_merge($result, $this->listContents($object['path'], true));
            }
        }

        return $result;
    }

    /**
     * {@inheritdoc}
     */
    public function getSize($path)
    {
        return $this->getMetadata($path);
    }

    /**
     * {@inheritdoc}
     */
    public function getTimestamp($path)
    {
        return $this->getMetadata($path);
    }

    /**
     * {@inheritdoc}
     */
    public function getMimetype($path)
    {
        return $this->getMetadata($path);
    }

    /**
     * Normalise a WebDAV repsonse object.
     *
     * @param array  $object
     * @param string $path
     *
     * @return array
     */
    protected function normalizeObject(array $object, $path)
    {
        //dossier
        if (! isset($object['{DAV:}getcontentlength'])) {
            $result = ['type' => 'dir', 'path' => trim($path, '/')];

        }
        //fichier
        else {
            $result = Util::map($object, static::$resultMap);
            $result['type'] = 'file';
            $result['path'] = trim($path, '/');

            if (isset($object['{http://owncloud.org/ns}owner-display-name']))
                $result["createdBy"] = $object['{http://owncloud.org/ns}owner-display-name'];
        }

        if (isset($object['{DAV:}getlastmodified'])) {
            $result["modifiedAt"] = $object['{DAV:}getlastmodified'];
            $result['timestamp'] = strtotime($object['{DAV:}getlastmodified']);
        }

        if (isset($object['{http://owncloud.org/ns}fileid']))
            $result["id"] = $object['{http://owncloud.org/ns}fileid'];

        return $result;
    }
}
