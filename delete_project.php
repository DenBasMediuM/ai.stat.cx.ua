<?php
session_start();
header('Content-Type: application/json');

// Проверка авторизации пользователя
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not authenticated'
    ]);
    exit;
}

// Получение ID проекта
$projectId = isset($_POST['project_id']) ? $_POST['project_id'] : 
           (isset($_GET['id']) ? $_GET['id'] : null);

if (!$projectId) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid project ID'
    ]);
    exit;
}

// Подключение к MongoDB
require_once 'mongo_connect.php';

// Получение коллекции проектов
$projectsCollection = $db->projects;

$userId = $_SESSION['user_id'];

try {
    // Преобразование строки ID в MongoDB ObjectID
    $objectId = new MongoDB\BSON\ObjectId($projectId);
    
    // Удаление проекта, если он принадлежит пользователю
    $result = $projectsCollection->deleteOne([
        '_id' => $objectId,
        'user_id' => $userId
    ]);
    
    if ($result->getDeletedCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Project successfully deleted'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Project not found or access denied'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid project ID format'
    ]);
}
?>
