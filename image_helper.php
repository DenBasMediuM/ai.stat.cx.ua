<?php
/**
 * Вспомогательные функции для работы с изображениями
 */

/**
 * Проверяет, является ли строка полноценным base64-изображением
 */
function is_valid_base64_image($base64_string) {
    // Проверяем наличие префикса data:image/
    if (strpos($base64_string, 'data:image/') === false) {
        return false;
    }
    
    // Извлекаем данные после запятой
    $parts = explode(',', $base64_string);
    if (count($parts) !== 2) {
        return false;
    }
    
    // Проверяем, что данные содержат только допустимые символы base64
    $data = $parts[1];
    return preg_match('/^[a-zA-Z0-9\/\r\n+]*={0,2}$/', $data);
}

/**
 * Получает изображение из базы данных и проверяет его корректность
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
    
    // Записываем информацию о длине в лог
    error_log("Project $project_id image length: " . strlen($image));
    
    $stmt->close();
    return $image;
}

/**
 * Сохраняет изображение в базу данных, убеждаясь, что оно корректное base64
 */
function save_project_image($conn, $project_id, $image_data) {
    // Если изображение не является корректным base64, не сохраняем его
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
