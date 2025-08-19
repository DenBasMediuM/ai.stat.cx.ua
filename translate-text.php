<?php
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

loadEnv(__DIR__ . '/.env');

header("Content-Type: application/json");

// Получаем данные из POST-запроса
$input = json_decode(file_get_contents("php://input"), true);
$text = $input["text"] ?? "";
$targetLang = $input["targetLang"] ?? "en";

// Если текст пустой или язык английский - возвращаем исходный текст
if (empty($text) || $targetLang === "en" || $targetLang === "unknown") {
    echo json_encode(["translation" => $text]);
    exit;
}

// API-ключ - используем загруженный из .env или запасной вариант
$apiKey = $_ENV['OPENAI_API_KEY'];

// Логируем запрос на перевод
error_log("Translation request: text='" . substr($text, 0, 30) . "...', targetLang=$targetLang");

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
            "content" => "You are a translation service. Translate the text to the specified language code. Respond with ONLY the translated text, no explanations."
        ],
        [
            "role" => "user",
            "content" => "Translate the following text to {$targetLang}: \"{$text}\""
        ]
    ],
    "temperature" => 0.3,
    "max_tokens" => 100
];

curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    error_log("Translation curl error: " . curl_error($ch));
    echo json_encode(["error" => curl_error($ch), "translation" => $text]);
    exit;
}

curl_close($ch);

try {
    $data = json_decode($response, true);
    
    if (isset($data['choices'][0]['message']['content'])) {
        $translation = trim($data['choices'][0]['message']['content']);
        error_log("Translation result: " . substr($translation, 0, 30) . "...");
        echo json_encode([
            "translation" => $translation
        ]);
    } else {
        error_log("Translation API error: " . json_encode($data));
        echo json_encode([
            "error" => "Unexpected API response",
            "translation" => $text
        ]);
    }
} catch (Exception $e) {
    error_log("Translation error: " . $e->getMessage());
    echo json_encode([
        "error" => "Error parsing response",
        "translation" => $text
    ]);
}
