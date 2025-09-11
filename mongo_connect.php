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
    $mongoDatabase = $_ENV['MONGO_DATABASE'];
    $mongoCollection = $_ENV['MONGO_COLLECTION'] ?? 'users';
} else {
    // Продакшн: берем из $_SERVER
    $connectionString = $_SERVER['CONNECTION_STRING'];
    $mongoDatabase = $_SERVER['DATABASE'];
    $mongoCollection = $_SERVER['COLLECTION'] ?? 'users';
}

try {
    $mongoClient = new MongoDB\Client($connectionString);
    $db = $mongoClient->selectDatabase($mongoDatabase);
    $usersCollection = $db->selectCollection($mongoCollection);
    // Проверка соединения через команду ping (через менеджер клиента)
    $pingResult = $db->command(['ping' => 1]);
    $pingResultArray = $pingResult->toArray()[0] ?? null;
    if (!$pingResultArray || !isset($pingResultArray->ok) || $pingResultArray->ok != 1) {
        throw new Exception("Ошибка проверки подключения MongoDB");
    }
} catch (Exception $e) {
    error_log("MongoDB Error: " . $e->getMessage());
    die("Ошибка подключения к базе данных. Пожалуйста, попробуйте позже.");
}
?>
