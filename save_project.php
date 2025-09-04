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

// Получение данных из запроса
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['name']) || !isset($data['image']) || !isset($data['conversation'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Incomplete data for saving'
    ]);
    exit;
}

// Подключение к MongoDB
require_once 'mongo_connect.php';

// Получение коллекции проектов
$projectsCollection = $db->projects;

// Подготовка данных для вставки
$userId = $_SESSION['user_id'];
$projectName = $data['name'];
$content = $data['conversation'];
$image = $data['image'];

// Вставка проекта в MongoDB
$project = [
    'user_id' => $userId,
    'name' => $projectName,
    'content' => $content, // Храним напрямую как массив в MongoDB
    'image' => $image,
    'created_at' => new MongoDB\BSON\UTCDateTime()
];

$result = $projectsCollection->insertOne($project);

if ($result->getInsertedCount() > 0) {
    echo json_encode([
        'success' => true,
        'message' => 'Project successfully saved'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error saving project to database'
    ]);
}
?>
