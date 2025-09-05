<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
session_start();
header('Content-Type: application/json');

// Подключение к MongoDB
require_once 'mongo_connect.php';

// Функция для безопасного вывода JSON
function output_json($success, $message, $data = []) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

// Обработка выхода из системы
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    // Удаляем данные сессии
    session_unset();
    session_destroy();
    
    // Перенаправляем на главную
    header('Location: index.php');
    exit;
}

// Проверка метода запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    output_json(false, 'Invalid request method');
}

// Получаем действие из формы
$action = $_POST['action'] ?? '';

// Обработка входа пользователя
if ($action === 'login') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    // Проверка заполнения полей
    if (empty($username) || empty($password)) {
        output_json(false, 'Please fill in all fields');
    }
    
    // Поиск пользователя в MongoDB
    $user = $usersCollection->findOne(['username' => $username]);
    
    if ($user) {
        // Проверка пароля (поддержка как хэшированных, так и обычных паролей для тестирования)
        if (password_verify($password, $user->password) || $password === $user->password) {
            // Обновляем ID сессии
            session_regenerate_id(true);
            
            // Устанавливаем данные сессии
            $_SESSION['user_id'] = (string)$user->_id;
            $_SESSION['username'] = $user->username;
            
            // Логируем для отладки
            error_log("User logged in: " . $user->username);
            error_log("Session data: " . print_r($_SESSION, true));
            
            // Обновляем время последнего входа
            $usersCollection->updateOne(
                ['_id' => $user->_id],
                ['$set' => ['last_login' => new MongoDB\BSON\UTCDateTime()]]
            );
            
            output_json(true, 'Successfully logged in', ['username' => $user->username]);
        } else {
            output_json(false, 'Invalid username or password');
        }
    } else {
        output_json(false, 'Invalid username or password');
    }
}
// Обработка регистрации
else if ($action === 'register') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    
    // Проверка заполнения полей
    if (empty($username) || empty($password) || empty($confirm_password)) {
        output_json(false, 'Please fill in all fields');
    }
    
    // Проверка совпадения паролей
    if ($password !== $confirm_password) {
        output_json(false, 'Passwords do not match');
    }
    
    // Проверка существования пользователя
    $existingUser = $usersCollection->findOne(['username' => $username]);
    
    if ($existingUser) {
        output_json(false, 'Username already exists');
    }
    
    // Хэширование пароля
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Добавление пользователя в MongoDB
    $newUser = [
        'username' => $username,
        'password' => $hashed_password,
        'created_at' => new MongoDB\BSON\UTCDateTime(),
        'last_login' => new MongoDB\BSON\UTCDateTime()
    ];
    
    $result = $usersCollection->insertOne($newUser);
    
    if ($result->getInsertedCount() > 0) {
        output_json(true, 'Successfully registered');
    } else {
        output_json(false, 'Registration error: Failed to create user');
    }
}
// Неизвестное действие
else {
    output_json(false, 'Unknown action');
}
?>
