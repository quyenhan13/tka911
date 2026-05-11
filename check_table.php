<?php
try {
    $pdo = new PDO('mysql:host=localhost;dbname=vteen', 'root', '');
    $s = $pdo->query('DESCRIBE movies');
    print_r($s->fetchAll(PDO::FETCH_ASSOC));
    $s = $pdo->query('SHOW INDEX FROM movies');
    print_r($s->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo $e->getMessage();
}
