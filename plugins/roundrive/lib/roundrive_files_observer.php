<?php

/**
 * Observer for HTTP_Request2 implementing saving response body into a file
 */
class roundrive_observer implements SplObserver
{
    protected $file;
    protected $fp;

    public function set_file($file)
    {
        $this->file = $file;
    }

    public function update(SplSubject $subject)
    {
        $event = $subject->getLastEvent();

        switch ($event['name']) {
        case 'receivedHeaders':
            if (!$this->file || !($this->fp = @fopen($this->file, 'wb'))) {
                throw new Exception("Cannot open target file '{$this->file}'");
            }
            break;

        case 'receivedBodyPart':
        case 'receivedEncodedBodyPart':
            fwrite($this->fp, $event['data']);
            break;

        case 'receivedBody':
            fclose($this->fp);
            break;
        }
    }
}
