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

// Подключение к MongoDB
require_once 'mongo_connect.php';

// Получение коллекции проектов
$projectsCollection = $db->projects;

$userId = $_SESSION['user_id'];

// Запрос проектов пользователя из MongoDB
$cursor = $projectsCollection->find(
    ['user_id' => $userId],
    [
        'sort' => ['created_at' => -1],
        'projection' => [
            'name' => 1,
            'created_at' => 1,
            'image' => 1
        ]
    ]
);

$projects = [];
foreach ($cursor as $document) {
    // Преобразование документа MongoDB в массив
    $project = [
        'id' => (string)$document->_id,
        'name' => $document->name,
        'created_at' => $document->created_at->toDateTime()->format('c'),
        'image' => $document->image ?? null
    ];
    
    $projects[] = $project;
}

echo json_encode([
    'success' => true,
    'projects' => $projects
]);
?>
