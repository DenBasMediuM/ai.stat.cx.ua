<?php
require_once __DIR__ . '/vendor/autoload.php';

// Параметры подключения к MongoDB
$mongoHost = "20.56.52.242";
$mongoPort = "27017";
$mongoUsername = "aiwpre";
$mongoPassword = "ewfwef90ewfvf";
$mongoDatabase = "aiwpre";
$mongoCollection = "AiWizardUsers";

// Создание клиента MongoDB с указанной строкой подключения
try {
    $connectionString = "mongodb://{$mongoUsername}:{$mongoPassword}@{$mongoHost}:{$mongoPort}/{$mongoDatabase}?authSource={$mongoDatabase}";
    $mongoClient = new MongoDB\Client($connectionString);
    $db = $mongoClient->selectDatabase($mongoDatabase);
    $usersCollection = $db->selectCollection($mongoCollection);
    
    // Проверка соединения - исправлено получение результата пинга
    $pingCommand = new MongoDB\Driver\Command(['ping' => 1]);
    $pingResult = $mongoClient->getManager()->executeCommand('admin', $pingCommand);
    $pingResultArray = current($pingResult->toArray());
    
    if (!isset($pingResultArray->ok) || $pingResultArray->ok != 1) {
        throw new Exception("Ошибка проверки подключения MongoDB");
    }
} catch (Exception $e) {
    error_log("MongoDB Error: " . $e->getMessage());
    die("Ошибка подключения к базе данных. Пожалуйста, попробуйте позже.");
}
?>
