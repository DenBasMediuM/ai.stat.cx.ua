<?php
require_once __DIR__ . '/vendor/autoload.php';

?><pre><?=var_dump($_SERVER);?></pre><?

try {
    // Подключение к MongoDB с указанием базы аутентификации
    $connection = new \MongoDB\Client($_SERVER['CONNECTION_STRING']);
	$db = $connection->selectDatabase($_SERVER['DATABASE']);

    // Получаем список коллекций
    $collections = $db->listCollections();

    echo "Подключение к MongoDB успешно!\n";
    echo "Коллекции в базе 'aiwpre':\n";
    foreach ($collections as $collection) {
        echo "- " . $collection->getName() . "\n";
    }
} catch (Exception $e) {
    echo "Ошибка подключения: " . $e->getMessage();
}
