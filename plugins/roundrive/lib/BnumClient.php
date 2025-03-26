<?php
use Sabre\DAV\Client;
use Sabre\DAV\XMLUtil;
use Sabre\HTTP;

class BnumClient extends Client {
    public function __construct(array $settings) {
        parent::__construct($settings);
    }

    /**
     * Trouve des ressources à partir d'un filtre.
     *
     * @param string $url L'URL à laquelle envoyer la requête.
     * @param array $properties Les propriétés à demander.
     * @param array $filters Les filtres à appliquer.
     * @param int $depth La profondeur de la requête. Par défaut, 1.
     * @param string $requestType Le type de la requête. Par défaut, 'REPORT'.
     * @return array Le résultat de la requête.
     * @throws Exception Si la requête HTTP échoue.
     */    
    public function findFromFilter(string $url, array $properties, array $filters, int $depth = 1, string $requestType = 'REPORT') {
        $dom = new \DOMDocument('1.0', 'UTF-8');
        $dom->formatOutput = true;
        $root = $dom->createElement('x:filter-files');
        $prop = $dom->createElementNS('DAV:', 'd:prop');

        foreach($properties as $property) {

            list(
                $namespace,
                $elementName
            ) = XMLUtil::parseClarkNotation($property);

            if ($namespace === 'DAV:') {
                $element = $dom->createElement('d:'.$elementName);
            } else {
                $element = $dom->createElementNS($namespace, 'x:'.$elementName);
            }

            $prop->appendChild( $element );
        }

        $root->appendChild( $prop );

        if (count($filters)) {
            foreach ($this->_generateFromFilter($dom, $filters) as $filter) {
                $root->appendChild($filter);
            }
        }

        $dom->appendChild($root);

        $body = $dom->saveXML();

        $url = $this->getAbsoluteUrl($url);

        $request = new HTTP\Request($requestType, $url, [
            'Depth' => $depth,
            'Content-Type' => 'application/xml'
        ], $body);

        $response = $this->send($request);

        if ((int)$response->getStatus() >= 400) {
            throw new Exception('HTTP error: ' . $response->getStatus());
        }

        $result = $this->parseMultiStatus($this->_invertStatusAndHref($response->getBodyAsString()));

        // If depth was 0, we only return the top item
        if ($depth === 0) {
            reset($result);
            $result = current($result);
            return isset($result[200])?$result[200]:[];
        }

        $newResult = [];
        foreach($result as $href => $statusList) {

            $newResult[$href] = isset($statusList[200])?$statusList[200]:[];

        }

        return $newResult;
    }

    private function _invertStatusAndHref(string $xmlString) : string{
        // Load the XML string into a DOMDocument
        $dom = new \DOMDocument();
        $dom->loadXML($xmlString);
    
        // Create a new XPath object
        $xpath = new \DOMXPath($dom);
    
        // Find all d:response elements
        $responses = $xpath->query('//d:response');
    
        foreach ($responses as $response) {
            // Find the d:status and d:href elements
            $status = $xpath->query('d:status', $response)->item(0);
            $href = $xpath->query('d:href', $response)->item(0);
    
            if ($status && $href) {
                // Clone the elements to avoid modifying the original nodes
                $statusClone = $status->cloneNode(true);
                $hrefClone = $href->cloneNode(true);
    
                // Replace the original nodes with the cloned nodes in inverted order
                $response->replaceChild($statusClone, $href);
                $response->replaceChild($hrefClone, $status);
            }
        }
    
        // Return the modified XML string
        return $dom->saveXML();
    }

        /**
     * Génère des éléments DOM à partir des filtres.
     *
     * @param \DOMDocument $dom Le document DOM.
     * @param array $filters Les filtres à appliquer.
     * @return \Generator Un générateur d'éléments DOM.
     */
    private function _generateFromFilter(\DOMDocument &$dom, array $filters):  \Generator {
        foreach ($filters as $key => $value) {
            list(
                $namespace,
                $elementName
            ) = XMLUtil::parseClarkNotation($key);

            if ($namespace === 'DAV:') {
                $element = $dom->createElement('d:'.$elementName);
            } else {
                $element = $dom->createElementNS($namespace, 'x:'.$elementName);
            }

            if (is_array($value)) {
                foreach ($this->_generateFromFilter($dom, $value) as $value) {
                    $element->appendChild($value);
                }
            }
            else if ($value !== null){
                $element->nodeValue = $value;
            }

            yield $element;
        }
    }
}