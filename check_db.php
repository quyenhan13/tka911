<?php
try {
    $pdo = new PDO('mysql:host=localhost;dbname=vteen', 'root', '');
    $stmt = $pdo->query("SHOW COLUMNS FROM vteen_guest_files LIKE 'user_id'");
    $res = $stmt->fetch();
    if ($res) {
        echo "EXISTS";
    } else {
        echo "MISSING";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
