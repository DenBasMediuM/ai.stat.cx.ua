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
                            // Нашли JSON блок в маркдауне
                            addMessageToChat(`JSON ответ: ${match[1]}`, false);
                            
                            try {
                                // Отправляем JSON на второй вебхук для получения изображения
                                const responseApi1 = await fetch("https://itsa777.app.n8n.cloud/webhook/654ca023-d8a1-47c7-ba21-c7d6d746ea51", {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ response: match[1] })
                                });
                                
                                if (!responseApi1.ok) {
                                    console.error('Ошибка запроса к API изображений:', responseApi1.status);
                                    return;
                                }
                                
                                const resultApi1 = await responseApi1.json();
                                console.log("Ответ от API изображений:", resultApi1);
                                
                                if (resultApi1.data) {
                                    let imageData = resultApi1.data;
                                    
                                    // Удаляем "=" если оно есть в начале
                                    if (imageData.startsWith('=')) {
                                        imageData = imageData.substring(1);
                                    }
                                    
                                    // Проверяем формат данных изображения
                                    if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
                                        // Создаем элемент изображения
                                        const imgElement = document.createElement('img');
                                        imgElement.src = imageData;
                                        imgElement.alt = "AI генерированное изображение";
                                        imgElement.style.maxWidth = "100%";
                                        imgElement.style.borderRadius = "5px";
                                        
                                        // Создаем контейнер для изображения
                                        const messageDiv = document.createElement('div');
                                        messageDiv.className = 'message bot-message image-message';
                                        messageDiv.appendChild(imgElement);
                                        
                                        // Добавляем в чат
                                        chatMessages.appendChild(messageDiv);
                                        chatMessages.scrollTop = chatMessages.scrollHeight;
                                    }
                                }
                            } catch (err) {
                                console.error("Ошибка при обработке изображения:", err);
                            }
                        } else {
                            // Обычный текстовый ответ
                            addMessageToChat(result.output, false);
                        }
                    } else if (typeof result.output === 'object') {
                        // Обработка объекта
                        const jsonString = JSON.stringify(result.output, null, 2);
                        addMessageToChat(`Получен объект: ${jsonString}`, false);
                        
                        try {
                            // Отправляем объект во второй API
                            const responseApi1 = await fetch("https://itsa777.app.n8n.cloud/webhook/654ca023-d8a1-47c7-ba21-c7d6d746ea51", {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ response: jsonString })
                            });
                            
                            // Обработка ответа так же как и выше
                            if (responseApi1.ok) {
                                const resultApi1 = await responseApi1.json();
                                
                                if (resultApi1.data) {
                                    let imageData = resultApi1.data;
                                    
                                    if (imageData.startsWith('=')) {
                                        imageData = imageData.substring(1);
                                    }
                                    
                                    if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
                                        const imgElement = document.createElement('img');
                                        imgElement.src = imageData;
                                        imgElement.alt = "AI генерированное изображение";
                                        imgElement.style.maxWidth = "100%";
                                        imgElement.style.borderRadius = "5px";
                                        
                                        const messageDiv = document.createElement('div');
                                        messageDiv.className = 'message bot-message image-message';
                                        messageDiv.appendChild(imgElement);
                                        
                                        chatMessages.appendChild(messageDiv);
                                        chatMessages.scrollTop = chatMessages.scrollHeight;
                                    }
                                }
                            }
                        } catch (error) {
                            console.error("Ошибка при обработке изображения:", error);
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
