<?php
// Управление OpenAI threads для чатов
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('html_errors', 0);
ini_set('post_max_size', '20M');
ini_set('upload_max_filesize', '20M');
ini_set('memory_limit', '256M');
error_reporting(E_ALL);

// Clean any output buffer to prevent HTML warnings
if (ob_get_level()) {
    ob_clean();
}

// Log current PHP limits for debugging
error_log("PHP Limits - post_max_size: " . ini_get('post_max_size') . 
          ", upload_max_filesize: " . ini_get('upload_max_filesize') . 
          ", memory_limit: " . ini_get('memory_limit'));
error_log("Content-Length: " . ($_SERVER['CONTENT_LENGTH'] ?? 'not set'));

// Устанавливаем обработчик фатальных ошибок
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        if (ob_get_level()) {
            ob_clean();
        }
        if (!headers_sent()) {
            header("Content-Type: application/json");
        }
        echo json_encode(['success' => false, 'message' => 'Internal server error']);
        exit;
    }
});

session_start();

// Helper function to convert PHP size notation to bytes
function php_size_to_bytes($size) {
    $size = trim($size);
    $unit = strtolower($size[strlen($size) - 1]);
    $value = (int)$size;
    
    switch ($unit) {
        case 'g': $value *= 1024;
        case 'm': $value *= 1024;
        case 'k': $value *= 1024;
    }
    
    return $value;
}

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

header("Content-Type: application/json");

// API-ключ
$apiKey = in_array($_SERVER['SERVER_NAME'], ['127.0.0.1', 'localhost']) ? $_ENV['OPENAI_API_KEY3'] : $_SERVER['AI_API_KEY3'];

// Функция для выполнения запроса к OpenAI API
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
    try {
        $threadResponse = callOpenAiApi('threads', 'POST', $apiKey, []);
        
        if (isset($threadResponse['id'])) {
            error_log("Created new thread: " . $threadResponse['id']);
            return $threadResponse['id'];
        } else {
            throw new Exception("Failed to create thread: " . json_encode($threadResponse));
        }
    } catch (Exception $e) {
        error_log("Error creating thread: " . $e->getMessage());
        throw $e;
    }
}

// Функция для добавления сообщения в thread
function addMessageToThread($threadId, $role, $content, $apiKey) {
    try {
        $messageData = [
            'role' => $role, // 'user' или 'assistant'
            'content' => $content
        ];
        
        $response = callOpenAiApi("threads/{$threadId}/messages", 'POST', $apiKey, $messageData);
        
        if (isset($response['id'])) {
            error_log("Added message to thread {$threadId}: " . $response['id']);
            return $response['id'];
        } else {
            throw new Exception("Failed to add message to thread: " . json_encode($response));
        }
    } catch (Exception $e) {
        error_log("Error adding message to thread: " . $e->getMessage());
        throw $e;
    }
}

// Функция для восстановления истории сообщений в thread
function restoreThreadHistory($threadId, $messages, $apiKey) {
    try {
        $addedCount = 0;
        
        foreach ($messages as $message) {
            // Пропускаем сообщения типа изображений, оставляем только текстовые
            if (isset($message['message_type']) && $message['message_type'] !== 'text') {
                continue;
            }
            
            $role = ($message['type'] === 'user') ? 'user' : 'assistant';
            $content = $message['content'];
            
            // Добавляем сообщение в thread
            addMessageToThread($threadId, $role, $content, $apiKey);
            $addedCount++;
            
            // Небольшая задержка между запросами
            usleep(100000); // 0.1 секунды
        }
        
        error_log("Restored {$addedCount} messages to thread {$threadId}");
        return $addedCount;
    } catch (Exception $e) {
        error_log("Error restoring thread history: " . $e->getMessage());
        throw $e;
    }
}

// Функция для сброса текущего thread в сессии
function resetSessionThread() {
    unset($_SESSION['thread_id']);
    error_log("Session thread_id reset");
}

// Обработка AJAX запросов
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    error_log("=== THREAD MANAGER POST REQUEST START ===");
    error_log("Session user_id: " . ($_SESSION['user_id'] ?? 'not set'));
    
    try {
        // Проверяем авторизацию
        if (!isset($_SESSION['user_id'])) {
            error_log("Not authenticated - returning error");
            echo json_encode(['success' => false, 'message' => 'Not authenticated']);
            exit;
        }
        
        // Check for POST size limit exceeded
        $contentLength = $_SERVER['CONTENT_LENGTH'] ?? 0;
        $postMaxSizeBytes = php_size_to_bytes(ini_get('post_max_size'));
        
        error_log("POST check - Content-Length: $contentLength, post_max_size: " . ini_get('post_max_size') . " ($postMaxSizeBytes bytes)");
        error_log("POST check - _POST empty: " . (empty($_POST) ? 'yes' : 'no') . ", _FILES empty: " . (empty($_FILES) ? 'yes' : 'no'));
        
        if (empty($_POST) && empty($_FILES) && $contentLength > 0 && $contentLength > $postMaxSizeBytes) {
            $postMaxSize = ini_get('post_max_size');
            error_log("POST size exceeded: $contentLength > $postMaxSizeBytes");
            echo json_encode(['success' => false, 'message' => 'Request too large. Maximum allowed size: ' . $postMaxSize]);
            exit;
        }
        
        $rawInput = file_get_contents('php://input');
        if ($rawInput === false) {
            echo json_encode(['success' => false, 'message' => 'Failed to read request data']);
            exit;
        }
        
        $input = json_decode($rawInput, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            echo json_encode(['success' => false, 'message' => 'Invalid JSON in request: ' . json_last_error_msg()]);
            exit;
        }
    $action = $input['action'] ?? '';
    
    try {
        switch ($action) {
            case 'create_thread':
                $threadId = createNewThread($apiKey);
                echo json_encode(['success' => true, 'thread_id' => $threadId]);
                break;
                
            case 'reset_session_thread':
                resetSessionThread();
                echo json_encode(['success' => true, 'message' => 'Session thread reset']);
                break;
                
            case 'set_session_thread':
                $threadId = $input['thread_id'] ?? '';
                if (empty($threadId)) {
                    echo json_encode(['success' => false, 'message' => 'Thread ID required']);
                    break;
                }
                $_SESSION['thread_id'] = $threadId;
                error_log("Session thread_id set to: " . $threadId);
                echo json_encode(['success' => true, 'message' => 'Session thread set']);
                break;
                
            case 'get_session_thread':
                $threadId = $_SESSION['thread_id'] ?? null;
                echo json_encode(['success' => true, 'thread_id' => $threadId]);
                break;
                
            case 'restore_thread_history':
                $threadId = $input['thread_id'] ?? '';
                $messages = $input['messages'] ?? [];
                
                if (empty($threadId)) {
                    echo json_encode(['success' => false, 'message' => 'Thread ID required']);
                    break;
                }
                
                if (empty($messages)) {
                    echo json_encode(['success' => true, 'message' => 'No messages to restore', 'restored_count' => 0]);
                    break;
                }
                
                try {
                    $restoredCount = restoreThreadHistory($threadId, $messages, $apiKey);
                    echo json_encode(['success' => true, 'message' => 'Thread history restored', 'restored_count' => $restoredCount]);
                } catch (Exception $e) {
                    error_log("Failed to restore thread history: " . $e->getMessage());
                    echo json_encode(['success' => false, 'message' => 'Failed to restore thread history: ' . $e->getMessage()]);
                }
                break;
                
            default:
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    } catch (Exception $e) {
        error_log("Thread management error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Internal server error']);
    }
    } catch (Exception $e) {
        error_log("Main processing error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Request processing error']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
