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

// Проверяем наличие ID проекта
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Неверный ID проекта'
    ]);
    exit;
}

// Подключаемся к базе данных и загружаем helper'ы
require_once 'db_connect.php';
require_once 'image_helper.php';

$projectId = intval($_GET['id']);
$userId = $_SESSION['user_id'];

// Получаем данные проекта, проверяя принадлежность пользователю
$stmt = $conn->prepare("SELECT id, name, content, created_at FROM projects WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $projectId, $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Проект не найден или нет доступа'
    ]);
    exit;
}

$project = $result->fetch_assoc();
$stmt->close();

// Получаем изображение отдельно
$image = get_project_image($conn, $projectId);
$project['image'] = $image;

$conn->close();

echo json_encode([
    'success' => true,
    'project' => $project
]);
