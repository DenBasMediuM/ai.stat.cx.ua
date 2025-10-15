<?php
// Test script for thread_manager.php
session_start();

// Set a test user session to simulate authentication
$_SESSION['user_id'] = 'test_user';

echo "Testing thread_manager.php...\n";

// Test the restore_thread_history action
$testData = [
    'action' => 'restore_thread_history',
    'thread_id' => 'test_thread_123',
    'messages' => [
        [
            'type' => 'user',
            'content' => 'Test message 1',
            'message_type' => 'text'
        ],
        [
            'type' => 'assistant', 
            'content' => 'Test response 1',
            'message_type' => 'text'
        ]
    ]
];

// Simulate the POST request
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['CONTENT_TYPE'] = 'application/json';

// Mock the input
file_put_contents('php://temp/maxmemory:1048576', json_encode($testData));

// Capture output
ob_start();

try {
    // Include the thread manager (this will execute the main logic)
    include 'thread_manager.php';
    
    $output = ob_get_clean();
    echo "Output: " . $output . "\n";
    
    // Try to parse as JSON
    $result = json_decode($output, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "✅ Valid JSON response received\n";
        echo "Response: " . print_r($result, true) . "\n";
    } else {
        echo "❌ Invalid JSON response\n";
        echo "JSON Error: " . json_last_error_msg() . "\n";
        echo "Raw output: " . $output . "\n";
    }
    
} catch (Exception $e) {
    $output = ob_get_clean();
    echo "❌ Exception caught: " . $e->getMessage() . "\n";
    echo "Output before exception: " . $output . "\n";
}
?>
