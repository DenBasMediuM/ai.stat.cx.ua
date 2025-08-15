// Утилиты для отладки приложения

// Функция для безопасного логирования объектов
function safeLog(label, obj) {
    try {
        console.log(`${label}:`, JSON.stringify(obj));
    } catch (e) {
        console.log(`${label} (невозможно сериализовать):`, obj);
    }
}

// Функция для отображения информации об ошибке
function displayError(error, message = "Произошла ошибка") {
    console.error(message, error);
    
    // Создаем элемент для отображения ошибки
    const errorDiv = document.createElement('div');
    errorDiv.style.backgroundColor = '#ffebee';
    errorDiv.style.color = '#c62828';
    errorDiv.style.padding = '10px';
    errorDiv.style.margin = '10px 0';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.fontFamily = 'monospace';
    
    errorDiv.textContent = `${message}: ${error.message || 'Неизвестная ошибка'}`;
    
    // Добавляем к body или другому контейнеру
    document.body.appendChild(errorDiv);
    
    // Автоматически скрываем через 10 секунд
    setTimeout(() => {
        errorDiv.style.opacity = '0';
        errorDiv.style.transition = 'opacity 1s';
        setTimeout(() => errorDiv.remove(), 1000);
    }, 10000);
}

// Функция для проверки и восстановления базовой структуры base64 изображения
function fixBase64Image(base64String) {
    if (!base64String) return null;
    
    // Проверяем, содержит ли строка префикс data:image/
    if (!base64String.includes('data:image/')) {
        // Пробуем определить тип изображения по первым байтам
        // Для простоты предположим, что это JPEG
        return `data:image/jpeg;base64,${base64String.replace(/^[^a-zA-Z0-9+/=]*/g, '')}`;
    }
    
    // Если префикс есть, но строка обрезана, попробуем восстановить структуру
    const parts = base64String.split(',');
    if (parts.length === 2) {
        const prefix = parts[0];
        const data = parts[1].replace(/^[^a-zA-Z0-9+/=]*/g, '');
        return `${prefix},${data}`;
    }
    
    return base64String;
}

// Функция для загрузки и отображения изображения с обработкой ошибок
function loadAndDisplayImage(imageElement, base64String, fallbackText = 'Изображение недоступно') {
    if (!base64String) {
        imageElement.alt = fallbackText;
        return false;
    }
    
    try {
        const fixedBase64 = fixBase64Image(base64String);
        if (fixedBase64) {
            imageElement.src = fixedBase64;
            
            // Добавляем обработчик ошибок загрузки
            imageElement.onerror = () => {
                console.error('Ошибка загрузки изображения');
                imageElement.alt = fallbackText;
                imageElement.style.display = 'none';
            };
            
            return true;
        }
    } catch (e) {
        console.error('Ошибка при обработке base64 изображения:', e);
    }
    
    imageElement.alt = fallbackText;
    return false;
}

// Экспортируем утилиты
window.debug = {
    safeLog,
    displayError,
    fixBase64Image,
    loadAndDisplayImage
};

console.log('Утилиты отладки загружены');
