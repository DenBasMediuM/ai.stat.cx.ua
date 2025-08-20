<?php
session_start();
header('Content-Type: application/json');

// Проверка авторизации
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not authenticated'
    ]);
    exit;
}

// Получаем ID проекта - может быть как из POST, так и из GET
$projectId = isset($_POST['project_id']) ? intval($_POST['project_id']) : 
            (isset($_GET['id']) ? intval($_GET['id']) : 0);

if (!$projectId) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid project ID'
    ]);
    exit;
}

// Подключение к БД
require_once 'db_connect.php';

$userId = $_SESSION['user_id'];

// Проверка, что проект принадлежит пользователю и удаление
$stmt = $conn->prepare("DELETE FROM projects WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $projectId, $userId);
$stmt->execute();

// Проверка результата удаления
if ($stmt->affected_rows > 0) {
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

$stmt->close();
$conn->close();
