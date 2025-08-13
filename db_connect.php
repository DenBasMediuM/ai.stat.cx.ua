<?php
$servername = "avalon.cityhost.com.ua";
$username = "ch29f38bbe_test-ai";
$password = "8q1ruYBR2N";
$dbname = "ch29f38bbe_test-ai";

// Создаем соединение
$conn = new mysqli($servername, $username, $password, $dbname);

// Проверяем соединение
if ($conn->connect_error) {
    die("Ошибка подключения к базе данных: " . $conn->connect_error);
}

// Устанавливаем кодировку
$conn->set_charset("utf8");
?>
