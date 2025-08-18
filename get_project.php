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

// Check if project ID exists
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid project ID'
    ]);
    exit;
}

// Connect to database and load helpers
require_once 'db_connect.php';
require_once 'image_helper.php';

$projectId = intval($_GET['id']);
$userId = $_SESSION['user_id'];

// Get project data, verifying user ownership
$stmt = $conn->prepare("SELECT id, name, content, created_at FROM projects WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $projectId, $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Project not found or access denied'
    ]);
    exit;
}

$project = $result->fetch_assoc();
$stmt->close();

// Get image separately
$image = get_project_image($conn, $projectId);
$project['image'] = $image;

$conn->close();

echo json_encode([
    'success' => true,
    'project' => $project
]);
