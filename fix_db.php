<?php
try {
    $pdo = new PDO('mysql:host=localhost;dbname=vteen', 'root', '');
    $pdo->exec("ALTER TABLE vteen_guest_files ADD COLUMN user_id INT NULL AFTER ip_address");
    echo "SUCCESS";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
