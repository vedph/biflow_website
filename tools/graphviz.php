<?php

if (!isset($_GET["dot"])) {
  die("Error 1");
}

$descriptorspec = array(0 => array("pipe", "r") ,1 => array("pipe", "w"), 2 => array("pipe", "w"));

$process = proc_open(getcwd() . "/build/bin/dot -Tsvg", $descriptorspec, $pipes);                
if (!is_resource($process)) {
  die("Error 2");
}

fwrite($pipes[0], base64_decode($_GET["dot"]));
fclose($pipes[0]);

header('Access-Control-Allow-Origin: *');
header("Content-Type: image/svg+xml");
while($s= fgets($pipes[1], 1024)) {
  echo $s;
}
