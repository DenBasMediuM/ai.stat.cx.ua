<?php
header("Content-Type: application/json");

// Читаем входящие данные
$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true);

// Для отладки — сохраняем "сырое" тело и разобранный JSON
file_put_contents(__DIR__ . "/debug_raw.txt", $rawInput);
file_put_contents(__DIR__ . "/debug_input.json", json_encode($input, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// Отправляем дальше на Azure API
$ch = curl_init("https://dreamsgenerator.azurewebsites.net/api/upscale");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($input));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode);
echo $response;