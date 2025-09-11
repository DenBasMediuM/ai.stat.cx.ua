<?php
header("Content-Type: application/json");

// Определяем адрес API
$host = $_SERVER['SERVER_NAME'] ?? ($_SERVER['HTTP_HOST'] ?? 'cli');
if (in_array($host, ['127.0.0.1', 'localhost'])) {
    function loadEnv($file) {
        if (!file_exists($file)) return;
        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            list($name, $value) = explode('=', $line, 2);
            $_ENV[trim($name)] = trim($value);
        }
    }
    loadEnv(__DIR__ . '/.env');
    $apiBase = rtrim($_ENV['GENERATOR_API'], '/');
} else {
    $apiBase = rtrim($_SERVER['GENERATOR_API'], '/');
}

// Читаем входящие данные
$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true);

// Отправляем дальше на Azure API
$ch = curl_init($apiBase . "/api/generate");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($input['response']));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode);
echo $response;