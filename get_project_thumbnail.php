<?php
session_start();
header('Content-Type: application/json');

// Проверяем, авторизован ли пользователь
if (!isset($_SESSION['user_id'])) {
    header('HTTP/1.1 401 Unauthorized');
    echo json_encode(['error' => 'Пользователь не авторизован']);
    exit;
}

// Проверяем ID проекта
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(['error' => 'Неверный ID проекта']);
    exit;
}

// Подключаемся к базе данных
require_once 'db_connect.php';

$projectId = intval($_GET['id']);
$userId = $_SESSION['user_id'];

// Получаем только изображение проекта
$stmt = $conn->prepare("SELECT image FROM projects WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $projectId, $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    header('HTTP/1.1 404 Not Found');
    echo json_encode(['error' => 'Проект не найден или нет доступа']);
    exit;
}

$row = $result->fetch_assoc();
$image = $row['image'];

echo json_encode([
    'success' => true,
    'image' => $image
]);

$stmt->close();
$conn->close();
