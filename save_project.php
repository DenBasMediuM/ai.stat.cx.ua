<?php
session_start();
header('Content-Type: application/json');

// Check if user is authenticated
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not authenticated'
    ]);
    exit;
}

// Get data from request
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['name']) || !isset($data['image']) || !isset($data['conversation'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Incomplete data for saving'
    ]);
    exit;
}

// Connect to database
require_once 'db_connect.php';

// Prepare data for insertion
$userId = $_SESSION['user_id'];
$projectName = $data['name'];
$content = json_encode($data['conversation']);
$image = $data['image'];

// Insert record into database
$stmt = $conn->prepare("INSERT INTO projects (user_id, name, content, image) VALUES (?, ?, ?, ?)");
$stmt->bind_param("isss", $userId, $projectName, $content, $image);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Project successfully saved'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error saving project: ' . $conn->error
    ]);
}

$stmt->close();
$conn->close();
