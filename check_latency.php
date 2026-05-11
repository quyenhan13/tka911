<?php
$start = microtime(true);
$_GET['page'] = 1;
$_GET['limit'] = 24;
ob_start();
include 'c:/xampp/htdocs/api/movies.php';
ob_end_clean();
$end = microtime(true);
echo "Execution time: " . ($end - $start) . " seconds\n";
