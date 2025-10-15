<?php
require_once 'mongo_connect.php';

// Функция для создания нового чата
function createNewChat($userId) {
    global $db;
    
    $chatsCollection = $db->selectCollection('chats');
    
    $newChat = [
        'user_id' => $userId,
        'title' => 'New chat',
        'messages' => [],
        'thread_id' => null, // Будет создан при первом сообщении
        'created_at' => new MongoDB\BSON\UTCDateTime(),
        'updated_at' => new MongoDB\BSON\UTCDateTime()
    ];
    
    $result = $chatsCollection->insertOne($newChat);
    
    if ($result->getInsertedCount() > 0) {
        return [
            'success' => true,
            'chat_id' => (string)$result->getInsertedId(),
            'title' => $newChat['title']
        ];
    }
    
    return ['success' => false, 'message' => 'Failed to create chat'];
}

// Функция для получения списка чатов пользователя
function getUserChats($userId) {
    global $db;
    
    $chatsCollection = $db->selectCollection('chats');
    
    $chats = $chatsCollection->find(
        ['user_id' => $userId],
        [
            'sort' => ['updated_at' => -1],
            'projection' => ['title' => 1, 'created_at' => 1, 'updated_at' => 1]
        ]
    );
    
    $chatList = [];
    foreach ($chats as $chat) {
        $chatList[] = [
            'id' => (string)$chat['_id'],
            'title' => $chat['title'],
            'created_at' => $chat['created_at']->toDateTime()->format('Y-m-d H:i:s'),
            'updated_at' => $chat['updated_at']->toDateTime()->format('Y-m-d H:i:s')
        ];
    }
    
    return ['success' => true, 'chats' => $chatList];
}

// Функция для получения конкретного чата
function getChat($chatId, $userId) {
    global $db;
    
    $chatsCollection = $db->selectCollection('chats');
    
    $chat = $chatsCollection->findOne([
        '_id' => new MongoDB\BSON\ObjectId($chatId),
        'user_id' => $userId
    ]);
    
    if ($chat) {
        return [
            'success' => true,
            'chat' => [
                'id' => (string)$chat['_id'],
                'title' => $chat['title'],
                'messages' => $chat['messages'],
                'created_at' => $chat['created_at']->toDateTime()->format('Y-m-d H:i:s'),
                'updated_at' => $chat['updated_at']->toDateTime()->format('Y-m-d H:i:s')
            ]
        ];
    }
    
    return ['success' => false, 'message' => 'Chat not found'];
}

// Функция для сохранения сообщения в чат
function saveMessageToChat($chatId, $userId, $message, $isUser, $messageType = 'text', $extraData = null) {
    global $db;
    
    $chatsCollection = $db->selectCollection('chats');
    
    $messageData = [
        'type' => $isUser ? 'user' : 'bot',
        'content' => $message,
        'message_type' => $messageType, // 'text', 'image_gallery', 'image_actions', 'selected_image'
        'timestamp' => new MongoDB\BSON\UTCDateTime()
    ];
    
    // Добавляем дополнительные данные если есть
    if ($extraData !== null) {
        $messageData['extra_data'] = $extraData;
    }
    
    $result = $chatsCollection->updateOne(
        [
            '_id' => new MongoDB\BSON\ObjectId($chatId),
            'user_id' => $userId
        ],
        [
            '$push' => ['messages' => $messageData],
            '$set' => ['updated_at' => new MongoDB\BSON\UTCDateTime()]
        ]
    );
    
    return $result->getModifiedCount() > 0;
}

// Функция для обновления названия чата
function updateChatTitle($chatId, $userId, $title) {
    global $db;
    
    $chatsCollection = $db->selectCollection('chats');
    
    // Ограничиваем длину названия
    $title = mb_substr($title, 0, 100);
    
    $result = $chatsCollection->updateOne(
        [
            '_id' => new MongoDB\BSON\ObjectId($chatId),
            'user_id' => $userId
        ],
        [
            '$set' => [
                'title' => $title,
                'updated_at' => new MongoDB\BSON\UTCDateTime()
            ]
        ]
    );
    
    return $result->getModifiedCount() > 0;
}

// Функция для удаления чата
function deleteChat($chatId, $userId) {
    global $db;
    
    $chatsCollection = $db->selectCollection('chats');
    
    $result = $chatsCollection->deleteOne([
        '_id' => new MongoDB\BSON\ObjectId($chatId),
        'user_id' => $userId
    ]);
    
    return $result->getDeletedCount() > 0;
}

// Функция для обновления thread_id чата
function updateChatThreadId($chatId, $userId, $threadId) {
    global $db;
    
    $chatsCollection = $db->selectCollection('chats');
    
    $result = $chatsCollection->updateOne(
        [
            '_id' => new MongoDB\BSON\ObjectId($chatId),
            'user_id' => $userId
        ],
        [
            '$set' => [
                'thread_id' => $threadId,
                'updated_at' => new MongoDB\BSON\UTCDateTime()
            ]
        ]
    );
    
    return $result->getModifiedCount() > 0;
}

// Функция для получения thread_id чата
function getChatThreadId($chatId, $userId) {
    global $db;
    
    $chatsCollection = $db->selectCollection('chats');
    
    $chat = $chatsCollection->findOne([
        '_id' => new MongoDB\BSON\ObjectId($chatId),
        'user_id' => $userId
    ], [
        'projection' => ['thread_id' => 1]
    ]);
    
    return $chat ? $chat['thread_id'] : null;
}

// Обработка AJAX запросов
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    session_start();
    header('Content-Type: application/json');
    
    // Проверяем авторизацию
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Not authenticated']);
        exit;
    }
    
    $userId = $_SESSION['user_id'];
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    try {
        switch ($action) {
            case 'create_chat':
                $result = createNewChat($userId);
                echo json_encode($result);
                break;
                
            case 'get_chats':
                $result = getUserChats($userId);
                echo json_encode($result);
                break;
                
            case 'get_chat':
                $chatId = $input['chat_id'] ?? '';
                if (empty($chatId)) {
                    echo json_encode(['success' => false, 'message' => 'Chat ID required']);
                    break;
                }
                $result = getChat($chatId, $userId);
                echo json_encode($result);
                break;
                
            case 'save_message':
                $chatId = $input['chat_id'] ?? '';
                $message = $input['message'] ?? '';
                $isUser = $input['is_user'] ?? false;
                $messageType = $input['message_type'] ?? 'text';
                $extraData = $input['extra_data'] ?? null;
                
                if (empty($chatId) || empty($message)) {
                    echo json_encode(['success' => false, 'message' => 'Chat ID and message required']);
                    break;
                }
                
                $success = saveMessageToChat($chatId, $userId, $message, $isUser, $messageType, $extraData);
                echo json_encode(['success' => $success]);
                break;
                
            case 'update_title':
                $chatId = $input['chat_id'] ?? '';
                $title = $input['title'] ?? '';
                
                if (empty($chatId) || empty($title)) {
                    echo json_encode(['success' => false, 'message' => 'Chat ID and title required']);
                    break;
                }
                
                $success = updateChatTitle($chatId, $userId, $title);
                echo json_encode(['success' => $success]);
                break;
                
            case 'delete_chat':
                $chatId = $input['chat_id'] ?? '';
                
                if (empty($chatId)) {
                    echo json_encode(['success' => false, 'message' => 'Chat ID required']);
                    break;
                }
                
                $success = deleteChat($chatId, $userId);
                echo json_encode(['success' => $success]);
                break;
                
            case 'update_thread_id':
                $chatId = $input['chat_id'] ?? '';
                $threadId = $input['thread_id'] ?? '';
                
                if (empty($chatId) || empty($threadId)) {
                    echo json_encode(['success' => false, 'message' => 'Chat ID and thread ID required']);
                    break;
                }
                
                $success = updateChatThreadId($chatId, $userId, $threadId);
                echo json_encode(['success' => $success]);
                break;
                
            case 'get_thread_id':
                $chatId = $input['chat_id'] ?? '';
                
                if (empty($chatId)) {
                    echo json_encode(['success' => false, 'message' => 'Chat ID required']);
                    break;
                }
                
                $threadId = getChatThreadId($chatId, $userId);
                echo json_encode(['success' => true, 'thread_id' => $threadId]);
                break;
                
            default:
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    } catch (Exception $e) {
        error_log("Chat management error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Internal server error']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
