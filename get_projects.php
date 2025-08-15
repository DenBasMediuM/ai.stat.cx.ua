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

// Подключаемся к базе данных
require_once 'db_connect.php';

$userId = $_SESSION['user_id'];

// Получаем список проектов пользователя с изображениями
$stmt = $conn->prepare("SELECT id, name, created_at, image FROM projects WHERE user_id = ? ORDER BY created_at DESC");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$projects = [];
while ($row = $result->fetch_assoc()) {
    // Добавляем проект с полным изображением
    $projects[] = [
        'id' => $row['id'],
        'name' => $row['name'],
        'created_at' => $row['created_at'],
        'image' => $row['image'] // Передаем полные данные изображения
    ];
}

echo json_encode([
    'success' => true,
    'projects' => $projects
]);

$stmt->close();
$conn->close();
