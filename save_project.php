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

// Получаем данные из запроса
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['name']) || !isset($data['image']) || !isset($data['conversation'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Неполные данные для сохранения'
    ]);
    exit;
}

// Подключаемся к базе данных
require_once 'db_connect.php';

// Подготавливаем данные для вставки
$userId = $_SESSION['user_id'];
$projectName = $data['name'];
$content = json_encode($data['conversation']);
$image = $data['image'];

// Вставляем запись в базу данных
$stmt = $conn->prepare("INSERT INTO projects (user_id, name, content, image) VALUES (?, ?, ?, ?)");
$stmt->bind_param("isss", $userId, $projectName, $content, $image);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Проект успешно сохранен'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка при сохранении проекта: ' . $conn->error
    ]);
}

$stmt->close();
$conn->close();
