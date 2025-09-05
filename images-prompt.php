<?php
// Загрузка переменных из .env файла, если это нужно
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

loadEnv(__DIR__ . '/.env');

// Настройка заголовков
header("Content-Type: application/json");

// Получаем данные запроса
$requestData = json_decode(file_get_contents("php://input"), true);

if (!isset($requestData['response'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Неверный формат запроса']);
    exit;
}

// URL для API DreamsGenerator
$apiUrl = "https://dreamsgenerator.azurewebsites.net/api/prompt";

// Формируем запрос к API
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Accept: application/json"
]);

// Данные для API - используем переданные данные из фронтенда
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData['response']));

// Выполняем запрос
$response = curl_exec($ch);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при запросе к API: ' . curl_error($ch)]);
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Проверяем код ответа
if ($httpCode >= 400) {
    http_response_code($httpCode);
    echo json_encode(['error' => 'API вернул ошибку. Код: ' . $httpCode]);
    exit;
}

// Возвращаем ответ от API как есть
echo $response;
