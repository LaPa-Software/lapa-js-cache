<?php
header("Access-Control-Allow-Origin: *");
$path = __DIR__ . '/';
$file = 'core.js';
if (isset($_GET['ver'])) {
    $path .= $_GET['ver'] . '/';
}
if (isset($_GET['file'])) {
    $file = $_GET['file'];
}
if (is_dir($path)) {
    if (is_file($path . $file)) {
        header("HTTP/1.1 200 Ok");
        echo file_get_contents($path . $file);
        die();
    }
}
header("HTTP/1.1 404 Not Found");