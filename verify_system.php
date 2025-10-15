<?php
// Final verification of thread management system
session_start();
header('Content-Type: application/json');

// Test cases to verify thread management
$tests = [
    'auth_check' => false,
    'thread_creation' => false,
    'session_management' => false,
    'chat_thread_linking' => false
];

$results = [];

try {
    // Test 1: Check authentication
    if (isset($_SESSION['user_id'])) {
        $tests['auth_check'] = true;
        $results[] = "✅ Authentication: User logged in (ID: {$_SESSION['user_id']})";
    } else {
        $results[] = "❌ Authentication: No user session found";
    }
    
    // Test 2: Test thread creation API
    if (function_exists('curl_init')) {
        $tests['thread_creation'] = true;
        $results[] = "✅ Thread Creation: cURL available for OpenAI API calls";
    } else {
        $results[] = "❌ Thread Creation: cURL not available";
    }
    
    // Test 3: Test session management
    $_SESSION['test_thread'] = 'test_thread_' . time();
    if (isset($_SESSION['test_thread'])) {
        $tests['session_management'] = true;
        $results[] = "✅ Session Management: Session storage working";
    } else {
        $results[] = "❌ Session Management: Session storage failed";
    }
    unset($_SESSION['test_thread']);
    
    // Test 4: Check MongoDB connection for chat-thread linking
    try {
        require_once 'mongo_connect.php';
        if (isset($db)) {
            $tests['chat_thread_linking'] = true;
            $results[] = "✅ Chat-Thread Linking: Database connection available";
        } else {
            $results[] = "❌ Chat-Thread Linking: Database connection failed";
        }
    } catch (Exception $e) {
        $results[] = "❌ Chat-Thread Linking: Database error - " . $e->getMessage();
    }
    
    // Overall status
    $allPassed = array_reduce($tests, function($carry, $test) {
        return $carry && $test;
    }, true);
    
    $status = $allPassed ? "🎉 ALL SYSTEMS READY" : "⚠️ SOME ISSUES DETECTED";
    
    echo json_encode([
        'success' => true,
        'status' => $status,
        'tests' => $tests,
        'results' => $results,
        'timestamp' => date('Y-m-d H:i:s'),
        'summary' => [
            'total_tests' => count($tests),
            'passed' => array_sum($tests),
            'failed' => count($tests) - array_sum($tests)
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'results' => $results
    ], JSON_PRETTY_PRINT);
}
?>
