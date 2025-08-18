<?php
session_start();
header('Content-Type: application/json');

// Connect to database
require_once 'db_connect.php';

// Function for safe JSON output
function output_json($success, $message, $data = []) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

// Handle logout
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    // Remove session data
    session_unset();
    session_destroy();
    
    // Redirect to home page
    header('Location: index.php');
    exit;
}

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    output_json(false, 'Invalid request method');
}

// Get action from form
$action = $_POST['action'] ?? '';

// Process user login
if ($action === 'login') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    // Check that fields are not empty
    if (empty($username) || empty($password)) {
        output_json(false, 'Please fill in all fields');
    }
    
    // Query database
    $stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        // Check password with support for non-hashed passwords for testing
        if (password_verify($password, $user['password']) || $password === $user['password']) {
            // Clear previous session
            session_regenerate_id(true);
            
            // Set session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            
            // Log for debugging
            error_log("User logged in: " . $user['username']);
            error_log("Session data: " . print_r($_SESSION, true));
            
            output_json(true, 'Successfully logged in', ['username' => $user['username']]);
        } else {
            output_json(false, 'Invalid username or password');
        }
    } else {
        output_json(false, 'Invalid username or password');
    }
    
    $stmt->close();
}
// Process registration
else if ($action === 'register') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    
    // Check that fields are not empty
    if (empty($username) || empty($password) || empty($confirm_password)) {
        output_json(false, 'Please fill in all fields');
    }
    
    // Check if passwords match
    if ($password !== $confirm_password) {
        output_json(false, 'Passwords do not match');
    }
    
    // Check if username already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        output_json(false, 'Username already exists');
    }
    
    $stmt->close();
    
    // Hash password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Add user to database
    $stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    $stmt->bind_param("ss", $username, $hashed_password);
    
    if ($stmt->execute()) {
        output_json(true, 'Successfully registered');
    } else {
        output_json(false, 'Registration error: ' . $conn->error);
    }
    
    $stmt->close();
}
// Unknown action
else {
    output_json(false, 'Unknown action');
}

// Close database connection
$conn->close();
?>
