<?php
require_once __DIR__ . '/vendor/autoload.php';

// Загрузка переменных из .env файла
function loadEnv($file)
{
    if (!file_exists($file)) return;
    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

$host = $_SERVER['SERVER_NAME'] ?? ($_SERVER['HTTP_HOST'] ?? 'cli');

// Получаем параметры подключения
if (in_array($host, ['127.0.0.1', 'localhost'])) {
    // Локальная среда: берем из .env
    loadEnv(__DIR__ . '/.env');
    $connectionString = $_ENV['MONGO_CONNECTION_STRING'];
    $databaseName = $_ENV['MONGO_DATABASE'];
    echo "Локальная среда\n";
} else {
    // Продакшн: берем из $_SERVER
    $connectionString = $_SERVER['CONNECTION_STRING'];
    $databaseName = $_SERVER['DATABASE'];
    echo "Продакшн\n";
}

try {
    $client = new MongoDB\Client($connectionString);
    $db = $client->selectDatabase($databaseName);
    $collections = $db->listCollections();
    echo "Подключение к MongoDB успешно!\n";
    echo "Коллекции в базе '$databaseName':\n";
    foreach ($collections as $collection) {
        echo "- " . $collection->getName() . "\n";
    }
} catch (Exception $e) {
    echo "Ошибка подключения: " . $e->getMessage();
}
