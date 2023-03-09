<?php 
class Stopwatch {
    private $startTime;
    private $stopTime;
    private $elapsedTime;
  
    public function __construct() {
      $this->startTime = null;
      $this->stopTime = null;
      $this->elapsedTime = null;
    }
  
    public function start() {
      $this->startTime = microtime(true);
    }
  
    public function stop() {
      $this->stopTime = microtime(true);
      $this->elapsedTime = $this->stopTime - $this->startTime;
    }
  
    public function getElapsedTime() {
      return $this->elapsedTime;
    }

    public function echoElapsedTime($identifier) {
        return "[$identifier]Time elapsed: " . $this->getElapsedTime() . " seconds\n";
    }
  
    public function reset() {
      $this->startTime = null;
      $this->stopTime = null;
      $this->elapsedTime = null;
    }

    public function restart() {
        $this->reset();
        $this->start();
    }
  }