<?php
try {
    $pdo = new PDO('mysql:host=localhost;dbname=vteen', 'root', '');
    
    echo "--- SERIES ---\n";
    $sql = "SELECT 
                series_name as display_name,
                MAX(poster) as poster,
                MAX(slug) as slug,
                COUNT(id) as total_eps,
                MAX(CAST(episode AS UNSIGNED)) as latest_ep,
                '' as category,
                MAX(type) as movie_type
              FROM movies 
              WHERE series_name IS NOT NULL AND series_name != '' 
              GROUP BY series_name LIMIT 5";
    $s = $pdo->query($sql);
    print_r($s->fetchAll(PDO::FETCH_ASSOC));

    echo "\n--- SINGLE ---\n";
    $sql = "SELECT 
                title as display_name,
                MAX(poster) as poster,
                MAX(slug) as slug,
                COUNT(id) as total_eps,
                MAX(CAST(episode AS UNSIGNED)) as latest_ep,
                '' as category,
                MAX(type) as movie_type
              FROM movies 
              WHERE (series_name IS NULL OR series_name = '') 
              GROUP BY title LIMIT 5";
    $s = $pdo->query($sql);
    print_r($s->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    echo $e->getMessage();
}
