<?php
try {
    $pdo = new PDO('mysql:host=localhost;dbname=vteen', 'root', '');
    $s = $pdo->query('SELECT COUNT(*) FROM movies');
    echo $s->fetchColumn();
} catch (Exception $e) {
    echo $e->getMessage();
}
