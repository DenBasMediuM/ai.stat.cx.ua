<?php
session_start();
header('Content-Type: application/json');

// Подключаемся к базе данных
require_once 'db_connect.php';

// Функция для безопасного вывода JSON
function output_json($success, $message, $data = []) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

// Обработка логаута
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    // Удаляем данные сессии
    session_unset();
    session_destroy();
    
    // Перенаправляем на главную
    header('Location: index.php');
    exit;
}

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    output_json(false, 'Неверный метод запроса');
}

// Получаем действие из формы
$action = $_POST['action'] ?? '';

// Обрабатываем вход пользователя
if ($action === 'login') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    // Проверяем, что поля не пустые
    if (empty($username) || empty($password)) {
        output_json(false, 'Пожалуйста, заполните все поля');
    }
    
    // Выполняем запрос к базе данных
    $stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        // Проверяем пароль
        if (password_verify($password, $user['password'])) {
            // Устанавливаем сессию
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            
            output_json(true, 'Вы успешно авторизованы');
        } else {
            output_json(false, 'Неверное имя пользователя или пароль');
        }
    } else {
        output_json(false, 'Неверное имя пользователя или пароль');
    }
    
    $stmt->close();
}
// Обрабатываем регистрацию
else if ($action === 'register') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    
    // Проверяем, что поля не пустые
    if (empty($username) || empty($password) || empty($confirm_password)) {
        output_json(false, 'Пожалуйста, заполните все поля');
    }
    
    // Проверяем, совпадают ли пароли
    if ($password !== $confirm_password) {
        output_json(false, 'Пароли не совпадают');
    }
    
    // Проверяем, не существует ли пользователь с таким именем
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        output_json(false, 'Пользователь с таким именем уже существует');
    }
    
    $stmt->close();
    
    // Хешируем пароль
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Добавляем пользователя в базу данных
    $stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    $stmt->bind_param("ss", $username, $hashed_password);
    
    if ($stmt->execute()) {
        output_json(true, 'Вы успешно зарегистрированы');
    } else {
        output_json(false, 'Ошибка при регистрации: ' . $conn->error);
    }
    
    $stmt->close();
}
// Неизвестное действие
else {
    output_json(false, 'Неизвестное действие');
}

// Закрываем соединение с базой данных
$conn->close();
?>
