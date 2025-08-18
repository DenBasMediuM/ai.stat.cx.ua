<?php
$servername = "avalon.cityhost.com.ua";
$username = "ch29f38bbe_test-ai";
$password = "8q1ruYBR2N";
$dbname = "ch29f38bbe_test-ai";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Database connection error: " . $conn->connect_error);
}

// Set character encoding
$conn->set_charset("utf8");
?>
