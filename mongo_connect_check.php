<?php
require_once __DIR__ . '/vendor/autoload.php';

?><pre><?=var_dump($_SERVER);?></pre><?

try {
    // Подключение к MongoDB с указанием базы аутентификации
    $client = new MongoDB\Client(
        'mongodb://aiwpre:ewfwef90ewfvf@20.56.52.242:27017/aiwpre?authSource=aiwpre'
    );

    // Выбор базы
    $db = $client->aiwpre;

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
