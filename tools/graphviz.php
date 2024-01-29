<?php

if (!isset($_GET["dot"])) {
  die("Error 1");
}

$descriptorspec = array(0 => array("pipe", "r") ,1 => array("pipe", "w"), 2 => array("pipe", "w"));

$process = proc_open("/usr/bin/dot -Tsvg", $descriptorspec, $pipes);
if (!is_resource($process)) {
  die("Error 2");
}

$file = ".cache/" . hash('sha256', $GET["dot"]);
if (!file_exists($file)) {
  fwrite($pipes[0], base64_decode($_GET["dot"]));
  fclose($pipes[0]);

  $fd = fopen($file, "w") or die("Error 3");
  while($s = fgets($pipes[1], 1024)) {
    fwrite($fd, $s);
  }
  fclose($fd);
}

header('Access-Control-Allow-Origin: *');
header("Content-Type: image/svg+xml");
readfile($file);
