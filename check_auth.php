<?php
session_start();
header('Content-Type: application/json');

// Проверяем, авторизован ли пользователь
$authenticated = isset($_SESSION['user_id']);

echo json_encode([
    'authenticated' => $authenticated,
    'username' => $authenticated ? $_SESSION['username'] : null
]);
