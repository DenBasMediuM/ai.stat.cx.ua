<?php
// Test thread_manager.php directly
echo "Testing thread_manager.php...\n";

// Simulate session
session_start();
$_SESSION['user_id'] = 'test_user';

// Create test data
$testData = json_encode(['action' => 'create_thread']);
echo "Test payload: $testData\n";
echo "Payload size: " . strlen($testData) . " bytes\n";

// Make POST request to thread_manager.php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8080/thread_manager.php');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $testData);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($testData)
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIE, session_name() . '=' . session_id());

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";
?>
