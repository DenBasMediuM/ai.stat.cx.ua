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

// Проверка наличия ID проекта
if (!isset($_GET['id'])) {
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

$projectId = $_GET['id'];
$userId = $_SESSION['user_id'];

try {
    // Преобразование строки ID в MongoDB ObjectID
    $objectId = new MongoDB\BSON\ObjectId($projectId);
    
    // Запрос конкретного проекта из MongoDB
    $project = $projectsCollection->findOne([
        '_id' => $objectId,
        'user_id' => $userId
    ]);
    
    if (!$project) {
        echo json_encode([
            'success' => false,
            'message' => 'Project not found or access denied'
        ]);
        exit;
    }
    
    // Формирование данных проекта
    $formattedProject = [
        'id' => (string)$project->_id,
        'name' => $project->name,
        'content' => json_encode($project->content), // Преобразуем обратно в JSON-строку
        'image' => $project->image ?? null,
        'created_at' => $project->created_at->toDateTime()->format('c')
    ];
    
    echo json_encode([
        'success' => true,
        'project' => $formattedProject
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid project ID format'
    ]);
}
?>
