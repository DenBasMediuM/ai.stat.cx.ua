<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
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

$host = $_SERVER['SERVER_NAME'] ?? ($_SERVER['HTTP_HOST'] ?? 'cli');

if (in_array($host, ['127.0.0.1', 'localhost'])) {
    loadEnv(__DIR__ . '/.env');
}

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

error_log("Extracted text: " . $text);

if (empty($text)) {
    echo json_encode(['error' => 'No text provided']);
    exit;
}

// API-ключ
$apiKey = in_array($_SERVER['SERVER_NAME'], ['127.0.0.1', 'localhost']) ? $_ENV['OPENAI_API_KEY3'] : $_SERVER['AI_API_KEY3'];

// Функция для выполнения запроса к API
// Исправлен порядок параметров: обязательные сначала, потом необязательные
function callOpenAiApi($endpoint, $method, $apiKey, $data = null) {
    $ch = curl_init("https://api.openai.com/v1/" . $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
        'OpenAI-Beta: assistants=v2'
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

// Функция для создания нового Thread
function createNewThread($apiKey) {
    $threadResponse = callOpenAiApi('threads', 'POST', $apiKey, []);
    
    if (isset($threadResponse['id'])) {
        $_SESSION['thread_id'] = $threadResponse['id'];
        error_log("Created new thread: " . $_SESSION['thread_id']);
        return $threadResponse['id'];
    } else {
        throw new Exception("Failed to create thread: " . json_encode($threadResponse));
    }
}

// Получить или создать Thread ID из сессии
if (!isset($_SESSION['thread_id'])) {
    try {
        createNewThread($apiKey);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Failed to create thread: ' . $e->getMessage()]);
        exit;
    }
}

$threadId = $_SESSION['thread_id'];
$assistantId = 'asst_LM8D0QhDk5xZXDbb1d8t3sTI'; // ID вашего ассистента

try {
    // 1. Добавляем сообщение пользователя в Thread
    $addMessageResponse = callOpenAiApi(
        "threads/{$threadId}/messages", 
        'POST', 
        $apiKey,
        ['role' => 'user', 'content' => $text]
    );
    
    // Проверяем, если thread недействителен, создаем новый
    if (!isset($addMessageResponse['id'])) {
        // Проверяем, содержит ли ошибка информацию о недействительном thread
        $errorResponse = json_encode($addMessageResponse);
        if (strpos($errorResponse, 'No thread found with id') !== false) {
            error_log("Thread not found, creating new one. Old ID: " . $threadId);
            // Создаем новый thread
            $threadId = createNewThread($apiKey);
            // Повторно пытаемся добавить сообщение
            $addMessageResponse = callOpenAiApi(
                "threads/{$threadId}/messages", 
                'POST', 
                $apiKey,
                ['role' => 'user', 'content' => $text]
            );
        }
        
        if (!isset($addMessageResponse['id'])) {
            throw new Exception("Failed to add message: " . json_encode($addMessageResponse));
        }
    }
    
    // 2. Запускаем обработку Thread ассистентом
    $runResponse = callOpenAiApi(
        "threads/{$threadId}/runs", 
        'POST', 
        $apiKey,
        ['assistant_id' => $assistantId]
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
        $runStatusResponse = callOpenAiApi("threads/{$threadId}/runs/{$runId}", 'GET', $apiKey);
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