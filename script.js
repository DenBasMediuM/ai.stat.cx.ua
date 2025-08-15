document.addEventListener('DOMContentLoaded', () => {
    const userMessage = document.getElementById('userMessage');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    
    // Глобальная переменная для хранения истории сообщений
    let conversationHistory = [];
    
    // Флаг авторизации пользователя
    let isUserAuthenticated = false;
    
    // Элементы UI
    const myProjectsButton = document.querySelector('.my-projects');
    
    // Проверяем статус авторизации при загрузке страницы
    const checkAuthStatus = async () => {
        try {
            const response = await fetch('check_auth.php');
            const data = await response.json();
            
            isUserAuthenticated = data.authenticated;
            
            // Обновляем стиль кнопки "Мои проекты" в зависимости от статуса авторизации
            if (isUserAuthenticated) {
                myProjectsButton.style.opacity = '1';
                myProjectsButton.style.cursor = 'pointer';
                myProjectsButton.title = 'Просмотр ваших сохраненных проектов';
            } else {
                myProjectsButton.style.opacity = '0.5';
                myProjectsButton.style.cursor = 'not-allowed';
                myProjectsButton.title = 'Авторизуйтесь для доступа к сохраненным проектам';
            }
        } catch (error) {
            console.error('Ошибка при проверке авторизации:', error);
        }
    };
    
    // Вызываем проверку авторизации
    checkAuthStatus();
    
    // Модифицированная функция для добавления сообщения в чат и истории
    const addMessageToChat = (text, isUser) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        
        // Прокрутка к последнему сообщению
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Сохраняем сообщение в историю
        conversationHistory.push({
            type: isUser ? 'user' : 'bot',
            text: text,
            timestamp: new Date().toISOString()
        });
    };
    
    // Функция для отправки сообщения на webhook и получения ответа
    const sendMessage = async (text) => {
        if (!text.trim()) return;
        
        // Добавляем сообщение пользователя в чат
        addMessageToChat(text, true);
        
        try {
            const response = await fetch('https://itsa777.app.n8n.cloud/webhook/5e1d9bad-433a-43b7-a406-1295aff6c7f0', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question: text }) // Изменен параметр с message на question
            });
            
            if (response.ok) {
                // Получаем ответ от webhook
                const result = await response.json();
                console.log("Полученные данные от API:", result);
                
                if (result.output) {
                    // Проверяем тип данных result.output
                    if (typeof result.output === 'string') {
                        // Проверяем, содержит ли ответ JSON блок
                        const match = result.output.match(/```json\s*([\s\S]*?)```/);
                        if (match) {
                            console.log(match[1]);
                            
                            // Сохраняем JSON данные для возможной повторной генерации
                            const jsonData = match[1];
                            
                            // Сохраняем client_id для последующего использования
                            let lastClientId;
                            
                            // Функция проверки статуса генерации изображения
                            const checkImageStatus = async (imageId) => {
                                try {
                                    console.log('Запрос статуса для ID:', imageId);
                                    const response = await fetch("https://itsa777.app.n8n.cloud/webhook/e7a59345-0b95-46f5-8abd-aea5a2ea2134", {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            "user": "dreamsWizard",
                                            "password": "dreamsWizard2024",
                                            "id": imageId
                                        })
                                    });
                                    
                                    if (!response.ok) {
                                        console.error('Ошибка запроса статуса изображений:', response.status);
                                        return null;
                                    }
                                    
                                    const result = await response.json();
                                    console.log('Полученный статус:', JSON.stringify(result));
                                    return result;
                                } catch (error) {
                                    console.error("Ошибка при проверке статуса изображения:", error);
                                    return null;
                                }
                            };
                            
                            // Рекурсивная функция для периодической проверки статуса
                            const pollImageStatus = async (imageId, attempt = 1) => {
                                if (attempt > 30) { // Увеличиваем количество попыток до 30 (5 минут)
                                    addMessageToChat("Превышено время ожидания генерации изображений", false);
                                    return;
                                }
                                
                                console.log(`Проверка статуса изображения, попытка ${attempt}/30`);
                                const result = await checkImageStatus(imageId);
                                
                                if (result && result.completed === true && result.images && result.images.length > 0) {
                                    console.log(`Изображения готовы! Количество: ${result.images.length}`);
                                    // Изображения готовы, отображаем их с возможностью выбора
                                    displayImages(result.images, imageId);
                                } else {
                                    // Еще не готово, ждем 10 секунд и проверяем снова
                                    addMessageToChat(`Изображения генерируются... (${attempt}/30)`, false);
                                    
                                    // Если получили ответ, но без готовых изображений - показываем детали
                                    if (result) {
                                        console.log(`Статус: completed=${result.completed}, images=${result.images ? result.images.length : 'none'}`);
                                    }
                                    
                                    setTimeout(() => pollImageStatus(imageId, attempt + 1), 10000);
                                }
                            };
                            
                            // Функция для генерации изображений
                            const generateImages = async (jsonPayload) => {
                                try {
                                    // Отправляем JSON на второй вебхук для получения изображения
                                    const responseApi1 = await fetch("https://itsa777.app.n8n.cloud/webhook/654ca023-d8a1-47c7-ba21-c7d6d746ea51", {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({ response: jsonPayload })
                                    });
                                    
                                    if (!responseApi1.ok) {
                                        console.error('Ошибка запроса к API изображений:', responseApi1.status);
                                        addMessageToChat("Ошибка генерации изображений", false);
                                        return;
                                    }
                                    
                                    const resultApi1 = await responseApi1.json();
                                    console.log("Ответ от API изображений:", resultApi1);
                                    
                                    // Сохраняем client_id для использования в selectImage
                                    lastClientId = resultApi1.client_id;
                                    console.log('Сохраненный client_id:', lastClientId);
                                    
                                    addMessageToChat(`Задача на формирование изображения отправлена`, false);
                                    
                                    // Запускаем процесс проверки и получения изображений
                                    checkAndDisplayImages(resultApi1.id);
                                } catch (err) {
                                    console.error("Ошибка при запуске генерации изображения:", err);
                                    addMessageToChat("Произошла ошибка при генерации изображений", false);
                                }
                            };
                            
                            // Функция для отображения изображений с возможностью выбора
                            const displayImages = (images, imageId) => {
                                if (!images || !images.length) return;
                                
                                // Удаляем предыдущую галерею, если она есть
                                const existingGallery = document.querySelector('.image-gallery');
                                if (existingGallery) existingGallery.remove();
                                
                                const existingActions = document.querySelector('.image-actions');
                                if (existingActions) existingActions.remove();
                                
                                // Создаем контейнер для галереи изображений
                                const galleryContainer = document.createElement('div');
                                galleryContainer.className = 'message bot-message image-gallery';
                                galleryContainer.style.display = 'grid';
                                galleryContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
                                galleryContainer.style.gap = '10px';
                                
                                // Добавляем все изображения в галерею с возможностью выбора
                                images.forEach((imageUrl, index) => {
                                    const imageCard = document.createElement('div');
                                    imageCard.style.position = 'relative';
                                    imageCard.style.border = '1px solid #ddd';
                                    imageCard.style.borderRadius = '5px';
                                    imageCard.style.padding = '5px';
                                    imageCard.style.cursor = 'pointer';
                                    imageCard.style.transition = 'transform 0.2s';
                                    
                                    const imgElement = document.createElement('img');
                                    imgElement.src = imageUrl;
                                    imgElement.alt = `AI изображение ${index + 1}`;
                                    imgElement.style.maxWidth = "100%";
                                    imgElement.style.borderRadius = "5px";
                                    
                                    // Номер изображения
                                    const imageNumber = document.createElement('div');
                                    imageNumber.textContent = `${index + 1}`;
                                    imageNumber.style.position = 'absolute';
                                    imageNumber.style.top = '5px';
                                    imageNumber.style.left = '5px';
                                    imageNumber.style.backgroundColor = 'rgba(0,0,0,0.6)';
                                    imageNumber.style.color = 'white';
                                    imageNumber.style.borderRadius = '50%';
                                    imageNumber.style.width = '24px';
                                    imageNumber.style.height = '24px';
                                    imageNumber.style.display = 'flex';
                                    imageNumber.style.alignItems = 'center';
                                    imageNumber.style.justifyContent = 'center';
                                    
                                    imageCard.appendChild(imgElement);
                                    imageCard.appendChild(imageNumber);
                                    
                                    // Эффект при наведении
                                    imageCard.addEventListener('mouseover', () => {
                                        imageCard.style.transform = 'scale(1.03)';
                                    });
                                    
                                    imageCard.addEventListener('mouseout', () => {
                                        imageCard.style.transform = 'scale(1)';
                                    });
                                    
                                    // Обработчик клика для выбора изображения
                                    imageCard.addEventListener('click', () => {
                                        selectImage(imageUrl, index, lastClientId);
                                    });
                                    
                                    galleryContainer.appendChild(imageCard);
                                });
                                
                                // Добавляем галерею в чат
                                chatMessages.appendChild(galleryContainer);
                                
                                // Создаем кнопку перегенерации
                                const actionContainer = document.createElement('div');
                                actionContainer.className = 'message bot-message image-actions';
                                actionContainer.style.display = 'flex';
                                actionContainer.style.justifyContent = 'center';
                                actionContainer.style.gap = '10px';
                                actionContainer.style.marginTop = '10px';
                                
                                const regenerateButton = document.createElement('button');
                                regenerateButton.textContent = 'Перегенерировать все';
                                regenerateButton.className = 'action-button regenerate';
                                regenerateButton.style.padding = '8px 16px';
                                regenerateButton.style.backgroundColor = '#f0f0f0';
                                regenerateButton.style.border = '1px solid #ddd';
                                regenerateButton.style.borderRadius = '5px';
                                regenerateButton.style.cursor = 'pointer';
                                regenerateButton.style.fontWeight = 'bold';
                                
                                regenerateButton.addEventListener('click', () => {
                                    // Удаляем текущую галерею и кнопки действий
                                    galleryContainer.remove();
                                    actionContainer.remove();
                                    
                                    // Повторно генерируем изображения
                                    addMessageToChat("Перегенерирую изображения...", false);
                                    generateImages(jsonData);
                                });
                                
                                actionContainer.appendChild(regenerateButton);
                                chatMessages.appendChild(actionContainer);
                                
                                // Прокручиваем чат вниз
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                                
                                addMessageToChat("Выберите изображение или перегенерируйте все", false);
                            };
                            
                            // Функция обработки выбора изображения
                            const selectImage = async (imageUrl, index, clientId) => {
                                // Отображаем выбранное изображение более крупно
                                const selectedImgContainer = document.createElement('div');
                                selectedImgContainer.className = 'message bot-message selected-image';
                                selectedImgContainer.style.textAlign = 'center';
                                
                                const selectedImg = document.createElement('img');
                                selectedImg.src = imageUrl;
                                selectedImg.alt = "Выбранное изображение";
                                selectedImg.style.maxWidth = "80%";
                                selectedImg.style.borderRadius = "5px";
                                selectedImg.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                                
                                selectedImgContainer.appendChild(selectedImg);
                                chatMessages.appendChild(selectedImgContainer);
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                                
								addMessageToChat(`Вы выбрали изображение ${index + 1}`, true);
                                addMessageToChat("Создаю изображение с наилучшим разрешением...", false);

								// Выводим информацию о выбранном изображении и client_id
								//console.log('client_id:', clientId);
								//console.log('images:', imageUrl);
                                
                                // Здесь будет логика для создания изображения высокого разрешения
                                // (Заглушка как указано в требованиях)

								try {
                                    console.log('upscale...');
                                    const response = await fetch("https://itsa777.app.n8n.cloud/webhook/71fbba0d-d009-4aef-9485-83597e59d167", {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            "user": "dreamsWizard",
                                            "password": "dreamsWizard2024",
                                            "client_id": clientId,
											"images": [imageUrl]
                                        })
                                    });
                                    
                                    if (!response.ok) {
                                        console.error('Ошибка upscale:', response.status);
                                        return null;
                                    }
                                    
                                    const result = await response.json();
                                    console.log('Полученный upscale ответ:', JSON.stringify(result));
                                    
                                    // Проверяем наличие ID для отслеживания статуса
                                    if (result && result.id) {
                                        const upscaleId = result.id;
                                        addMessageToChat("Создаю изображение высокого разрешения, пожалуйста, подождите...", false);
                                        
                                        // Запускаем процесс отслеживания готовности изображения высокого разрешения
                                        pollUpscaledImageStatus(upscaleId, 1, clientId);
                                    } else {
                                        addMessageToChat("Не удалось начать генерацию изображения высокого разрешения", false);
                                        console.error("Ответ не содержит ID для отслеживания:", result);
                                    }
                                    
                                    return result;
                                } catch (error) {
                                    console.error("Ошибка при upscale:", error);
                                    addMessageToChat("Произошла ошибка при создании изображения высокого разрешения", false);
                                    return null;
                                }
                            };
                            
                            // Функция проверки статуса генерации изображения высокого разрешения
                            const checkUpscaledImageStatus = async (imageId) => {
                                try {
                                    console.log('Проверка статуса upscaled изображения для ID:', imageId);
                                    const response = await fetch("https://itsa777.app.n8n.cloud/webhook/e7a59345-0b95-46f5-8abd-aea5a2ea2134", {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            "user": "dreamsWizard",
                                            "password": "dreamsWizard2024",
                                            "id": imageId
                                        })
                                    });
                                    
                                    if (!response.ok) {
                                        console.error('Ошибка запроса статуса upscaled изображения:', response.status);
                                        return null;
                                    }
                                    
                                    const result = await response.json();
                                    console.log('Статус upscaled изображения:', JSON.stringify(result));
                                    return result;
                                } catch (error) {
                                    console.error("Ошибка при проверке статуса upscaled изображения:", error);
                                    return null;
                                }
                            };
                            
                            // Рекурсивная функция для периодической проверки статуса upscaled изображения
                            const pollUpscaledImageStatus = async (imageId, attempt = 1, clientId) => {
                                if (attempt > 30) { // Ограничиваем количество попыток
                                    addMessageToChat("Превышено время ожидания генерации изображения высокого разрешения", false);
                                    return;
                                }
                                
                                console.log(`Проверка статуса upscaled изображения, попытка ${attempt}/30`);
                                const result = await checkUpscaledImageStatus(imageId);
                                
                                if (result && result.completed === true && result.images && result.images.length > 0) {
                                    console.log(`Upscaled изображение готово!`);
                                    // Изображение готово, отображаем его
                                    displayUpscaledImage(result.images[0], imageId, clientId);
                                    
                                    // Очищаем ресурсы на сервере после успешного отображения
                                    clearServerResources(clientId, imageId);
                                } else {
                                    // Еще не готово, ждем 10 секунд и проверяем снова
                                    if (attempt % 3 === 0) { // Уведомляем пользователя каждые 3 попытки
                                        addMessageToChat(`Изображение высокого разрешения создаётся... (${attempt}/30)`, false);
                                    }
                                    
                                    // Если получили ответ, но без готовых изображений - показываем детали
                                    if (result) {
                                        console.log(`Статус upscale: completed=${result.completed}, images=${result.images ? result.images.length : 'none'}`);
                                    }
                                    
                                    setTimeout(() => pollUpscaledImageStatus(imageId, attempt + 1, clientId), 10000);
                                }
                            };
                            
                            // Функция для отображения upscaled изображения
                            const displayUpscaledImage = (imageUrl, upscaleId, clientId) => {
                                // Создаем контейнер для изображения высокого качества
                                const highResContainer = document.createElement('div');
                                highResContainer.className = 'message bot-message high-res-image';
                                highResContainer.style.textAlign = 'center';
                                highResContainer.style.marginTop = '20px';
                                
                                // Создаем заголовок
                                const heading = document.createElement('h4');
                                heading.textContent = 'Изображение в наилучшем качестве:';
                                heading.style.marginBottom = '10px';
                                heading.style.color = '#333';
                                
                                // Создаем изображение
                                const imgElement = document.createElement('img');
                                imgElement.src = imageUrl;
                                imgElement.alt = "Изображение высокого разрешения";
                                imgElement.style.maxWidth = "90%";
                                imgElement.style.borderRadius = "8px";
                                imgElement.style.boxShadow = "0 6px 12px rgba(0,0,0,0.3)";
                                
                                // Добавляем в контейнер и в чат
                                highResContainer.appendChild(heading);
                                highResContainer.appendChild(imgElement);
                                chatMessages.appendChild(highResContainer);
                                
                                // Прокручиваем чат вниз
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                                
                                // Сообщение об успешной генерации
                                addMessageToChat("Изображение в наилучшем качестве готово!", false);
                                
                                // Создаем контейнер для кнопок действий
                                const actionsContainer = document.createElement('div');
                                actionsContainer.className = 'message bot-message actions-container';
                                actionsContainer.style.display = 'flex';
                                actionsContainer.style.justifyContent = 'center';
                                actionsContainer.style.gap = '10px';
                                actionsContainer.style.marginTop = '10px';
                                
                                // Добавляем кнопку для скачивания изображения
                                const downloadButton = document.createElement('a');
                                downloadButton.textContent = 'Скачать изображение';
                                downloadButton.href = imageUrl;
                                downloadButton.download = 'high-resolution-image.jpg';
                                downloadButton.style.padding = '8px 16px';
                                downloadButton.style.backgroundColor = '#4CAF50';
                                downloadButton.style.color = 'white';
                                downloadButton.style.border = 'none';
                                downloadButton.style.borderRadius = '5px';
                                downloadButton.style.cursor = 'pointer';
                                downloadButton.style.textDecoration = 'none';
                                downloadButton.style.fontWeight = 'bold';
                                
                                actionsContainer.appendChild(downloadButton);
                                
                                // Проверяем, авторизован ли пользователь для добавления кнопки сохранения
                                if (isUserAuthenticated) {
                                    // Добавляем кнопку для сохранения проекта
                                    const saveButton = document.createElement('button');
                                    saveButton.textContent = 'Сохранить проект';
                                    saveButton.className = 'save-project-btn';
                                    saveButton.style.padding = '8px 16px';
                                    saveButton.style.backgroundColor = '#2196F3';
                                    saveButton.style.color = 'white';
                                    saveButton.style.border = 'none';
                                    saveButton.style.borderRadius = '5px';
                                    saveButton.style.cursor = 'pointer';
                                    saveButton.style.fontWeight = 'bold';
                                    saveButton.style.marginLeft = '10px';
                                    
                                    // Обработчик нажатия на кнопку сохранения
                                    saveButton.addEventListener('click', () => {
                                        saveProject(imageUrl);
                                    });
                                    
                                    actionsContainer.appendChild(saveButton);
                                }
                                
                                chatMessages.appendChild(actionsContainer);
                                
                                // Очищаем ресурсы на сервере после успешного отображения
                                clearServerResources(clientId, upscaleId);
                            };
                            
                            // Функция для сохранения проекта
                            const saveProject = (imageUrl) => {
                                // Запрашиваем у пользователя название проекта
                                const projectName = prompt('Введите название проекта:');
                                
                                if (!projectName || projectName.trim() === '') {
                                    return; // Пользователь отменил ввод или ввел пустую строку
                                }
                                
                                // Показываем индикатор сохранения
                                const savingMessage = addMessageToChat('Сохранение проекта...', false);
                                
                                // Формируем данные для сохранения
                                const projectData = {
                                    name: projectName,
                                    image: imageUrl,
                                    conversation: conversationHistory
                                };
                                
                                // Отправляем запрос на сохранение
                                fetch('save_project.php', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(projectData)
                                })
                                .then(response => response.json())
                                .then(data => {
                                    if (data.success) {
                                        // Показываем сообщение об успешном сохранении
                                        addMessageToChat(`Проект "${projectName}" успешно сохранен!`, false);
                                    } else {
                                        // Показываем сообщение об ошибке
                                        addMessageToChat(`Ошибка при сохранении проекта: ${data.message}`, false);
                                    }
                                })
                                .catch(error => {
                                    // Показываем сообщение об ошибке
                                    addMessageToChat('Произошла ошибка при сохранении проекта', false);
                                    console.error('Ошибка при сохранении проекта:', error);
                                });
                            };
                            
                            // Функция проверки и отображения изображений
                            const checkAndDisplayImages = async (imageId) => {
                                try {
                                    // Первичная проверка статуса
                                    const responseApi2 = await fetch("https://itsa777.app.n8n.cloud/webhook/e7a59345-0b95-46f5-8abd-aea5a2ea2134", {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            "user": "dreamsWizard",
                                            "password": "dreamsWizard2024",
                                            "id": imageId
                                        })
                                    });
                                    
                                    if (!responseApi2.ok) {
                                        console.error('Ошибка запроса к API изображений:', responseApi2.status);
                                        return;
                                    }
                                    const resultApi2 = await responseApi2.json();
                                    
                                    console.log("Ответ от API изображений:", resultApi2);
                                    
                                    // Проверяем статус генерации изображений
                                    if (resultApi2.completed === true && resultApi2.images && resultApi2.images.length > 0) {
                                        // Изображения уже готовы, отображаем их
                                        displayImages(resultApi2.images, imageId);
                                        
                                        // Очищаем ресурсы на сервере после успешного отображения
                                        clearServerResources(lastClientId, imageId);
                                    } else {
                                        // Изображения еще не готовы, запускаем периодическую проверку
                                        addMessageToChat("Изображения генерируются, ожидайте...", false);
                                        pollImageStatus(imageId);
                                    }
                                } catch (error) {
                                    console.error("Ошибка при обработке изображения:", error);
                                }
                            };
                            
                            // Функция для очистки ресурсов на сервере
                            const clearServerResources = async (clientId, id) => {
                                try {
                                    console.log(`Очистка ресурсов на сервере: clientId=${clientId}, id=${id}`);
                                    
                                    // Вместо прямого обращения к API DreamsGenerator используем n8n webhook как прокси
                                    const response = await fetch("https://itsa777.app.n8n.cloud/webhook/9fde9366-fe69-4bbd-8756-0f7cf2e08f10", {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            "user": "dreamsWizard",
                                            "password": "dreamsWizard2024",
                                            "client_id": clientId,
                                            "id": id
                                        })
                                    });
                                    
                                    if (!response.ok) {
                                        console.error('Ошибка при очистке ресурсов сервера:', response.status);
                                        return;
                                    }
                                    
                                    const result = await response.json();
                                    console.log('Ресурсы успешно очищены:', result);
                                } catch (error) {
                                    // Подавляем ошибку, чтобы она не блокировала основной функционал
                                    console.error("Ошибка при очистке ресурсов сервера:", error);
                                    console.log("Продолжаем работу без очистки ресурсов");
                                }
                            };
                            
                            // Запускаем процесс генерации изображений
                            generateImages(jsonData);
                        } else {
                            // Обычный текстовый ответ
                            addMessageToChat(result.output, false);
                        }
                    } else {
                        // Неизвестный формат
                        addMessageToChat(`Получен ответ в неизвестном формате: ${typeof result.output}`, false);
                    }
                } else {
                    // Если нет output поля, показываем весь ответ
                    addMessageToChat(`Сырой ответ: ${JSON.stringify(result)}`, false);
                }
                
                userMessage.value = '';
            } else {
                console.error('Ошибка при отправке сообщения');
                addMessageToChat("Ошибка: Не удалось получить ответ", false);
            }
        } catch (error) {
            console.error('Ошибка при отправке сообщения:', error);
            addMessageToChat("Ошибка: Не удалось подключиться к серверу", false);
        }
    };
    
    // Event listener для кнопки отправки
    sendButton.addEventListener('click', () => {
        sendMessage(userMessage.value);
    });
    
    // Event listener для клавиши Enter
    userMessage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(userMessage.value);
        }
    });
    
    // Улучшенная обработка ошибок
    window.addEventListener('error', (event) => {
        console.error('Глобальная ошибка:', event.error);
    });
    
    // Обработка непойманных Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Непойманная ошибка Promise:', event.reason);
    });
    
    // Функциональность кнопок проектов
    myProjectsButton.addEventListener('click', () => {
        if (isUserAuthenticated) {
            showUserProjects();
        } else {
            // Если пользователь не авторизован, показываем сообщение
            addMessageToChat('Для доступа к проектам необходимо авторизоваться', false);
        }
    });
    
    document.querySelector('.new-project').addEventListener('click', () => {
        // Отправляем сообщение "давай создадим проект" при нажатии на кнопку
        const projectMessage = "давай создадим проект";
        sendMessage(projectMessage);
    });
    
    // Скрываем приветствие после первого взаимодействия
    const hideGreetingAfterFirstMessage = () => {
        const greeting = document.querySelector('.greeting');
        if (greeting && chatMessages.children.length > 0) {
            greeting.style.display = 'none';
        }
    };
    
    // Наблюдаем за изменениями в контейнере сообщений
    const observer = new MutationObserver(hideGreetingAfterFirstMessage);
    observer.observe(chatMessages, { childList: true });
    
    // Функция для проверки корректности base64-строки изображения
    function isValidBase64Image(str) {
        if (!str) return false;
        // Проверяем, начинается ли строка с data:image/
        return typeof str === 'string' && str.startsWith('data:image/');
    }

    // Функция для отображения проектов пользователя
    const showUserProjects = async () => {
        if (!isUserAuthenticated) {
            return; // Не выполняем, если пользователь не авторизован
        }
        
        try {
            // Показываем индикатор загрузки
            const loadingMessage = addMessageToChat('Загрузка ваших проектов...', false);
            
            // Загружаем проекты пользователя
            const response = await fetch('get_projects.php');
            const data = await response.json();
            
            // Очищаем чат для отображения проектов
            chatMessages.innerHTML = '';
            
            if (!data.success || data.projects.length === 0) {
                addMessageToChat('У вас пока нет сохраненных проектов.', false);
                addMessageToChat('Создайте новый проект, используя кнопку "НОВЫЙ ПРОЕКТ".', false);
                return;
            }
            
            // Добавляем заголовок
            const headerMessage = document.createElement('div');
            headerMessage.className = 'message bot-message project-header';
            headerMessage.innerHTML = `<h2>Ваши сохраненные проекты (${data.projects.length})</h2>
                                      <p>Выберите проект для просмотра или вернитесь к диалогу.</p>`;
            chatMessages.appendChild(headerMessage);
            
            // Создаем контейнер для проектов в виде сетки
            const projectsGrid = document.createElement('div');
            projectsGrid.className = 'projects-grid';
            projectsGrid.style.display = 'grid';
            projectsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
            projectsGrid.style.gap = '15px';
            projectsGrid.style.padding = '15px 0';
            
            // Добавляем проекты в сетку
            data.projects.forEach(project => {
                const projectCard = document.createElement('div');
                projectCard.className = 'project-card';
                projectCard.style.border = '1px solid #ddd';
                projectCard.style.borderRadius = '8px';
                projectCard.style.overflow = 'hidden';
                projectCard.style.cursor = 'pointer';
                projectCard.style.transition = 'transform 0.2s';
                projectCard.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                projectCard.style.backgroundColor = '#fff';
                
                // Добавляем миниатюру изображения
                const imgContainer = document.createElement('div');
                imgContainer.style.width = '100%';
                imgContainer.style.height = '150px';
                imgContainer.style.backgroundColor = '#f5f5f5';
                imgContainer.style.display = 'flex';
                imgContainer.style.alignItems = 'center';
                imgContainer.style.justifyContent = 'center';
                imgContainer.style.overflow = 'hidden';
                
                if (project.image && isValidBase64Image(project.image)) {
                    const img = document.createElement('img');
                    img.src = project.image;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    imgContainer.appendChild(img);
                } else {
                    const noImgText = document.createElement('div');
                    noImgText.textContent = 'Нет изображения';
                    noImgText.style.color = '#999';
                    imgContainer.appendChild(noImgText);
                }
                
                projectCard.appendChild(imgContainer);
                
                // Добавляем информацию о проекте
                const projectInfo = document.createElement('div');
                projectInfo.style.padding = '10px';
                
                const projectName = document.createElement('h3');
                projectName.style.margin = '0 0 5px 0';
                projectName.style.fontSize = '16px';
                projectName.textContent = project.name;
                
                const projectDate = document.createElement('p');
                projectDate.style.margin = '0';
                projectDate.style.fontSize = '12px';
                projectDate.style.color = '#666';
                
                // Форматирование даты
                const date = new Date(project.created_at);
                projectDate.textContent = date.toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                projectInfo.appendChild(projectName);
                projectInfo.appendChild(projectDate);
                projectCard.appendChild(projectInfo);
                
                // Добавляем эффекты при наведении
                projectCard.addEventListener('mouseover', () => {
                    projectCard.style.transform = 'scale(1.03)';
                });
                
                projectCard.addEventListener('mouseout', () => {
                    projectCard.style.transform = 'scale(1)';
                });
                
                // Обработчик клика для просмотра проекта
                projectCard.addEventListener('click', () => {
                    viewProject(project.id);
                });
                
                projectsGrid.appendChild(projectCard);
            });
            
            chatMessages.appendChild(projectsGrid);
            
            // Добавляем кнопку возврата к диалогу
            const backButton = document.createElement('button');
            backButton.textContent = 'Вернуться к диалогу';
            backButton.style.padding = '10px 20px';
            backButton.style.backgroundColor = '#f0f0f0';
            backButton.style.border = '1px solid #ddd';
            backButton.style.borderRadius = '5px';
            backButton.style.cursor = 'pointer';
            backButton.style.display = 'block';
            backButton.style.margin = '15px auto';
            
            backButton.addEventListener('click', () => {
                window.location.reload(); // Простой способ вернуться к диалогу
            });
            
            chatMessages.appendChild(backButton);
            
        } catch (error) {
            addMessageToChat('Произошла ошибка при загрузке проектов', false);
            console.error('Ошибка при загрузке проектов:', error);
            
            // Добавляем кнопку для повторной попытки
            const retryButton = document.createElement('button');
            retryButton.textContent = 'Попробовать снова';
            retryButton.style.padding = '8px 16px';
            retryButton.style.margin = '10px 0';
            retryButton.style.cursor = 'pointer';
            
            retryButton.addEventListener('click', showUserProjects);
            
            chatMessages.appendChild(retryButton);
        }
    };
    
    // Функция для просмотра конкретного проекта
    const viewProject = async (projectId) => {
        try {
            // Очищаем чат
            chatMessages.innerHTML = '';
            
            // Показываем сообщение о загрузке
            addMessageToChat('Загрузка проекта...', false);
            
            // Загружаем данные проекта
            const response = await fetch(`get_project.php?id=${projectId}`);
            const data = await response.json();
            
            if (!data.success) {
                addMessageToChat(`Ошибка при загрузке проекта: ${data.message}`, false);
                return;
            }
            
            const project = data.project;
            
            // Очищаем чат еще раз для отображения проекта
            chatMessages.innerHTML = '';
            
            // Добавляем заголовок проекта
            const headerDiv = document.createElement('div');
            headerDiv.className = 'project-header';
            headerDiv.innerHTML = `<h2>${project.name}</h2>
                                  <p>Создан: ${new Date(project.created_at).toLocaleDateString('ru-RU')}</p>`;
            headerDiv.style.padding = '10px';
            headerDiv.style.marginBottom = '15px';
            headerDiv.style.borderBottom = '1px solid #eee';
            chatMessages.appendChild(headerDiv);
            
            // Восстанавливаем историю сообщений
            try {
                const conversations = JSON.parse(project.content);
                conversations.forEach(msg => {
                    const isUser = msg.type === 'user';
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
                    messageDiv.textContent = msg.text;
                    chatMessages.appendChild(messageDiv);
                });
            } catch (e) {
                console.error('Ошибка при разборе истории сообщений:', e);
                addMessageToChat('Ошибка при загрузке истории сообщений', false);
            }
            
            // Добавляем изображение проекта
            if (project.image && isValidBase64Image(project.image)) {
                const imageContainer = document.createElement('div');
                imageContainer.className = 'project-image';
                imageContainer.style.textAlign = 'center';
                imageContainer.style.marginTop = '20px';
                
                const img = document.createElement('img');
                img.src = project.image;
                img.style.maxWidth = '90%';
                img.style.borderRadius = '8px';
                img.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                
                imageContainer.appendChild(img);
                chatMessages.appendChild(imageContainer);
            }
            
            // Добавляем кнопку для возврата к списку проектов
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'center';
            buttonContainer.style.gap = '10px';
            buttonContainer.style.marginTop = '20px';
            
            const backButton = document.createElement('button');
            backButton.textContent = 'Назад к проектам';
            backButton.style.padding = '8px 16px';
            backButton.style.backgroundColor = '#f0f0f0';
            backButton.style.border = '1px solid #ddd';
            backButton.style.borderRadius = '5px';
            backButton.style.cursor = 'pointer';
            
            backButton.addEventListener('click', showUserProjects);
            
            const newChatButton = document.createElement('button');
            newChatButton.textContent = 'Новый диалог';
            newChatButton.style.padding = '8px 16px';
            newChatButton.style.backgroundColor = '#4CAF50';
            newChatButton.style.color = 'white';
            newChatButton.style.border = 'none';
            newChatButton.style.borderRadius = '5px';
            newChatButton.style.cursor = 'pointer';
            
            newChatButton.addEventListener('click', () => {
                window.location.reload();
            });
            
            buttonContainer.appendChild(backButton);
            buttonContainer.appendChild(newChatButton);
            chatMessages.appendChild(buttonContainer);
            
        } catch (error) {
            addMessageToChat('Произошла ошибка при загрузке проекта', false);
            console.error('Ошибка при загрузке проекта:', error);
        }
    };
});
