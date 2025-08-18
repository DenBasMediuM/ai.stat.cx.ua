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

// Connect to database
require_once 'db_connect.php';

$userId = $_SESSION['user_id'];

// Get list of user projects with images
$stmt = $conn->prepare("SELECT id, name, created_at, image FROM projects WHERE user_id = ? ORDER BY created_at DESC");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$projects = [];
while ($row = $result->fetch_assoc()) {
    // Add project with full image
    $projects[] = [
        'id' => $row['id'],
        'name' => $row['name'],
        'created_at' => $row['created_at'],
        'image' => $row['image'] // Pass full image data
    ];
}

echo json_encode([
    'success' => true,
    'projects' => $projects
]);

$stmt->close();
$conn->close();
