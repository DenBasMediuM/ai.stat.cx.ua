<?php
/**
 * Helper functions for working with images
 */

/**
 * Checks if the string is a valid base64 image
 */
function is_valid_base64_image($base64_string) {
    // Check for data:image/ prefix
    if (strpos($base64_string, 'data:image/') === false) {
        return false;
    }
    
    // Extract data after comma
    $parts = explode(',', $base64_string);
    if (count($parts) !== 2) {
        return false;
    }
    
    // Check that data contains only valid base64 characters
    $data = $parts[1];
    return preg_match('/^[a-zA-Z0-9\/\r\n+]*={0,2}$/', $data);
}

/**
 * Gets an image from database and checks its validity
 */
function get_project_image($conn, $project_id) {
    $stmt = $conn->prepare("SELECT image FROM projects WHERE id = ?");
    $stmt->bind_param("i", $project_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return null;
    }
    
    $row = $result->fetch_assoc();
    $image = $row['image'];
    
    // Log length information
    error_log("Project $project_id image length: " . strlen($image));
    
    $stmt->close();
    return $image;
}

/**
 * Saves an image to database, ensuring it's valid base64
 */
function save_project_image($conn, $project_id, $image_data) {
    // If image is not valid base64, don't save it
    if (!is_valid_base64_image($image_data)) {
        error_log("Invalid base64 image data for project $project_id");
        return false;
    }
    
    $stmt = $conn->prepare("UPDATE projects SET image = ? WHERE id = ?");
    $stmt->bind_param("si", $image_data, $project_id);
    $result = $stmt->execute();
    
    error_log("Project $project_id image update result: " . ($result ? 'success' : 'failure'));
    
    $stmt->close();
    return $result;
}
