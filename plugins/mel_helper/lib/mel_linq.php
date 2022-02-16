<?php
interface Mel_Module_Enumerable
{
    public function run($previousArray = null);
    public function runWithoutGenerator($previousArray = null);
    public function isIterable();
    public function isRunWithGenerator();
}

class Mel_Enumerator implements Mel_Module_Enumerable{
    protected $array;
    protected $selectorList;
    protected $run;

    protected function __construct($array, $selectorList = [])
    {
        $this->array = $array;
        $this->selectorList = $selectorList;
        $this->run = false;
    } 

    public function where($selector)
    {
        return new Mel_Where_Enumerable($selector, array_merge($this->selectorList ?? [], [$this]));
    }

    public function any($selector = null)
    {
        if ($selector === null)
            return $this->count() !== 0;
        else 
            return (new Mel_Any_Enumerable($selector, array_merge($this->selectorList ?? [], [$this])))->runAll();
    }

    public function run($previousArray = null)
    {
        if ($previousArray === null)
            $previousArray = $this->array;

        foreach ($previousArray as $key => $value) {
            yield ["key" => $key, "value" => $value];
        }
    }

    public function runWithoutGenerator($previousArray = null)
    {
        if ($previousArray === null)
            $previousArray = $this->array;

        return $previousArray;
    }

    public function isRunWithGenerator()
    {
        return false;
    }

    protected function runAll()
    {
        $array = [];
        $lastArray = null;
        $isLast = false;
        $allRunnable = array_merge($this->selectorList, [$this]);
        foreach ($allRunnable as $runnable) {
            if ($runnable->isIterable())
            {
                if ($runnable->isRunWithGenerator())
                {
                    foreach ($runnable->run($lastArray) as $value) {
                            $array[] = $value;
                    }

                    $lastArray = $array;
                }
                else $lastArray = $runnable->runWithoutGenerator($lastArray);

                $array = [];
            }
            else
            {
                $array = [];
                $lastArray = $runnable->run($lastArray);
                break;
            }
        }

        if (count($array) === 0)
            $array = $lastArray;

        $this->selectorList = [$this];
        $this->array = $array;
        $this->run = true;

        return $array;
    }

    public function count()
    {
        return count($this->runAll());
    }

    public function toArray()
    {
        $array = [];

        foreach ($this->generateArray() as $value) {
            $array[] = $value;
        }

        return $array;
    }

    public function generateArray()
    {
        $array = $this->runAll();

        foreach ($array as $value) {
            yield $value["value"];
        }
    }

    public function isIterable()
    {
        return true;
    }

    public static function from($arrayLike)
    {
        return new Mel_Enumerator($arrayLike);
    }

}

class Mel_Where_Enumerable extends Mel_Enumerator implements Mel_Module_Enumerable
{
    protected $selector;

    public function __construct($selector, $selectorList = [])
    {
        $this->array = null;
        $this->selector = $selector;
        $this->selectorList = $selectorList;
    } 

    public function isRunWithGenerator()
    {
        return true;
    }

    public function run($previousArray = null)
    {
        if ($this->array === null)
        {
            if ($previousArray === null)
                $previousArray = $selectorList[0]->run();

            foreach ($previousArray as $key => $value) {
                if (call_user_func($this->selector, $value, $key) === true)
                    yield ["key" => $key, "value" => $value];
            }
        }
        else{
            foreach ($previousArray as $key => $value) {
                    yield $value;
            }         
        }
    }

    public function runWithoutGenerator($previousArray = null)
    {
        $array = [];

        foreach ($this->run($previousArray) as  $value) {
            $array[] = $value;
        }

        return $array;
    }

    public function isIterable()
    {
        return true;
    }
}

class Mel_Any_Enumerable extends Mel_Where_Enumerable 
{
    public function __construct($selector, $selectorList = [])
    {
        parent::__construct($selector, $selectorList);
    } 

    public function run($previousArray = null)
    {
        foreach (parent::run($previousArray) as $value) {
            return true;
        }

        return false;
    }

    public function runWithoutGenerator($previousArray = null)
    {
        return $this->run($previousArray);
    }

    public function isIterable()
    {
        return false;
    }
}