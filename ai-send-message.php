<?php
session_start();

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

// Настройка заголовков
header("Content-Type: application/json");

// Получаем текст из POST-запроса
$rawInput = file_get_contents("php://input");
error_log("Raw input: " . $rawInput);

// Пробуем декодировать как JSON
$input = json_decode($rawInput, true);

// Выясняем, что именно пришло в запросе
if (is_array($input) && isset($input['question'])) {
    // Случай когда приходит объект {"question": "текст"}
    $text = $input['question'];
} else {
    // Случай когда приходит просто строка текста
    $text = $rawInput;
}
file_put_contents(__DIR__ . "/debug_raw.txt", $text);

error_log("Extracted text: " . $text);

if (empty($text)) {
    echo json_encode(['error' => 'No text provided']);
    exit;
}

// API-ключ
$apiKey = $_ENV['OPENAI_API_KEY'] ?? 'YOUR_FALLBACK_API_KEY';

// Функция для выполнения запроса к API
function callOpenAiApi($endpoint, $method, $data = null, $apiKey) {
    $ch = curl_init("https://api.openai.com/v1/" . $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
        'OpenAI-Beta: assistants=v2'  // Изменено с v1 на v2
    ]);
    
    if ($method == 'POST' && $data) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    } else if ($method != 'GET') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }
    
    $response = curl_exec($ch);
    if (curl_errno($ch)) {
        throw new Exception(curl_error($ch));
    }
    curl_close($ch);
    
    return json_decode($response, true);
}

// Получить или создать Thread ID из сессии
if (!isset($_SESSION['thread_id'])) {
    try {
        // Создаем новый Thread
        $threadResponse = callOpenAiApi('threads', 'POST', [], $apiKey);
        
        if (isset($threadResponse['id'])) {
            $_SESSION['thread_id'] = $threadResponse['id'];
            error_log("Created new thread: " . $_SESSION['thread_id']);
        } else {
            throw new Exception("Failed to create thread: " . json_encode($threadResponse));
        }
    } catch (Exception $e) {
        echo json_encode(['error' => 'Failed to create thread: ' . $e->getMessage()]);
        exit;
    }
}

$threadId = $_SESSION['thread_id'];
$assistantId = 'asst_xRLqgnIP2MJdU9t7ItW3l6qt'; // ID вашего ассистента

try {
    // 1. Добавляем сообщение пользователя в Thread
    $addMessageResponse = callOpenAiApi(
        "threads/{$threadId}/messages", 
        'POST', 
        ['role' => 'user', 'content' => $text], 
        $apiKey
    );
    
    if (!isset($addMessageResponse['id'])) {
        throw new Exception("Failed to add message: " . json_encode($addMessageResponse));
    }
    
    // 2. Запускаем обработку Thread ассистентом
    $runResponse = callOpenAiApi(
        "threads/{$threadId}/runs", 
        'POST', 
        ['assistant_id' => $assistantId], 
        $apiKey
    );
    
    if (!isset($runResponse['id'])) {
        throw new Exception("Failed to start run: " . json_encode($runResponse));
    }
    
    $runId = $runResponse['id'];
    
    // 3. Проверяем статус обработки (повторяем, пока не готово)
    $maxAttempts = 30;
    $attemptCount = 0;
    $runStatus = '';
    
    while ($attemptCount < $maxAttempts) {
        $runStatusResponse = callOpenAiApi("threads/{$threadId}/runs/{$runId}", 'GET', null, $apiKey);
        $runStatus = $runStatusResponse['status'] ?? '';
        
        if ($runStatus === 'completed') {
            break;
        } else if (in_array($runStatus, ['failed', 'cancelled', 'expired'])) {
            throw new Exception("Run ended with status: {$runStatus}");
        }
        
        // Ожидаем перед следующей проверкой (с увеличением времени)
        $waitTime = min(1 * pow(2, $attemptCount), 8); // Макс. 8 секунд между запросами
        sleep($waitTime);
        $attemptCount++;
    }
    
    if ($runStatus !== 'completed') {
        throw new Exception("Run did not complete in time. Status: {$runStatus}");
    }
    
    // 4. Получаем ответ ассистента
    $messagesResponse = callOpenAiApi(
        "threads/{$threadId}/messages", 
        'GET', 
        null, 
        $apiKey
    );
    
    // Получаем последнее сообщение от ассистента
    $assistantMessage = null;
    if (isset($messagesResponse['data']) && is_array($messagesResponse['data'])) {
        foreach ($messagesResponse['data'] as $message) {
            if ($message['role'] === 'assistant') {
                $assistantMessage = $message;
                break;
            }
        }
    }
    
    if (!$assistantMessage) {
        throw new Exception("No assistant message found in response");
    }
    
    // Извлекаем содержимое ответа
    $responseText = '';
    if (isset($assistantMessage['content']) && is_array($assistantMessage['content'])) {
        foreach ($assistantMessage['content'] as $content) {
            if (isset($content['type']) && $content['type'] === 'text') {
                $responseText .= $content['text']['value'];
            }
        }
    }
    
    // Формируем ответ для клиента
    $clientResponse = ['output' => $responseText];
    echo json_encode($clientResponse);
    
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}