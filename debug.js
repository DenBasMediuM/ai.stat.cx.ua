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

// Экспортируем утилиты
window.debug = {
    safeLog,
    displayError
};

console.log('Утилиты отладки загружены');
