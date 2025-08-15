<?php
session_start();
header('Content-Type: application/json');

// Проверяем, авторизован ли пользователь
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Пользователь не авторизован'
    ]);
    exit;
}

// Подключаемся к базе данных и загружаем helper'ы
require_once 'db_connect.php';
require_once 'image_helper.php';

$userId = $_SESSION['user_id'];

// Получаем список проектов пользователя
$stmt = $conn->prepare("SELECT id, name, created_at FROM projects WHERE user_id = ? ORDER BY created_at DESC");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$projects = [];
while ($row = $result->fetch_assoc()) {
    // Получаем миниатюру изображения отдельно для каждого проекта
    $image = get_project_image($conn, $row['id']);
    
    $projects[] = [
        'id' => $row['id'],
        'name' => $row['name'],
        'created_at' => $row['created_at'],
        'has_image' => !empty($image),
        'image_preview' => !empty($image) ? true : false
    ];
}

$stmt->close();
$conn->close();

echo json_encode([
    'success' => true,
    'projects' => $projects
]);
