document.addEventListener('DOMContentLoaded', () => {
    const userMessage = document.getElementById('userMessage');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    
    // Функция для добавления сообщения в чат
    const addMessageToChat = (text, isUser) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        
        // Прокрутка к последнему сообщению
        chatMessages.scrollTop = chatMessages.scrollHeight;
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
                                    return result;
                                } catch (error) {
                                    console.error("Ошибка при upscale:", error);
                                    return null;
                                }
















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
                                    } else {
                                        // Изображения еще не готовы, запускаем периодическую проверку
                                        addMessageToChat("Изображения генерируются, ожидайте...", false);
                                        pollImageStatus(imageId);
                                    }
                                } catch (error) {
                                    console.error("Ошибка при обработке изображения:", error);
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
    
    // Функциональность кнопок проектов
    document.querySelector('.my-projects').addEventListener('click', () => {
        console.log('My Projects clicked');
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
});
