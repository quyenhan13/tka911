<?php
$_GET['page'] = 1;
$_GET['limit'] = 20;
ob_start();
include 'c:/xampp/htdocs/api/movies.php';
$output = ob_get_clean();
echo $output;
