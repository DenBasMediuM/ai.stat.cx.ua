<?php
// Настройка заголовков
header("Content-Type: application/json");

// Получаем текст из POST-запроса
$input = json_decode(file_get_contents("php://input"), true);
$text = $input["text"] ?? "";

// Если пустой текст
if (empty($text)) {
    echo json_encode(["error" => "No text provided"]);
    exit;
}

// API-ключ (храним в .env или config.php, а не в коде)
$apiKey = "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"; 

// Формируем запрос к OpenAI
$ch = curl_init("https://api.openai.com/v1/chat/completions");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer " . $apiKey
]);

$payload = [
    "model" => "gpt-3.5-turbo",
    "messages" => [
        [
            "role" => "system",
            "content" => "You are a language detection tool. Respond with only the ISO 639-1 language code and language name separated by a colon. For example: 'en: English'."
        ],
        [
            "role" => "user",
            "content" => "Detect the language of the following text: \"$text\""
        ]
    ],
    "temperature" => 0.3,
    "max_tokens" => 20
];

curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

// Выполняем запрос
$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo json_encode(["error" => curl_error($ch)]);
    exit;
}
curl_close($ch);

echo $response;