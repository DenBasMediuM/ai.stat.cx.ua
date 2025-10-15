<?php
// Test PHP limits
echo "PHP Configuration Test:\n";
echo "post_max_size: " . ini_get('post_max_size') . "\n";
echo "upload_max_filesize: " . ini_get('upload_max_filesize') . "\n";
echo "memory_limit: " . ini_get('memory_limit') . "\n";
echo "max_execution_time: " . ini_get('max_execution_time') . "\n";
echo "Content-Length: " . ($_SERVER['CONTENT_LENGTH'] ?? 'not set') . "\n";

// Test creating a small JSON payload
$testPayload = json_encode(['action' => 'create_thread']);
echo "Test payload size: " . strlen($testPayload) . " bytes\n";
?>
