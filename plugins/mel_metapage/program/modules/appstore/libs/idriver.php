<?php 
interface iDriver {
    function get($id);
    function get_all();
    function set($id, $item);
    function need_save_all();
    function set_all();
}