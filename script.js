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
                            //addMessageToChat(`JSON ответ: ${match[1]}`, false);
                            
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
								console.log(JSON.stringify(resultApi1, null, 2));
								console.log(resultApi1.client_id);
								console.log(resultApi1.id);
								console.log(resultApi1.positive_prompt);
								//addMessageToChat(`JSON ответ: ${resultApi1.positive_prompt}`, false);

								addMessageToChat(`Задача на формирование изображения отправлена`, false);

								// Функция для отображения изображений в чате
								const displayImages = (images) => {
									if (!images || !images.length) return;
									
									// Создаем контейнер для галереи изображений
									const galleryContainer = document.createElement('div');
									galleryContainer.className = 'message bot-message image-gallery';
									galleryContainer.style.display = 'grid';
									galleryContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
									galleryContainer.style.gap = '10px';
									
									// Добавляем все изображения в галерею
									images.forEach((imageUrl) => {
										const imgElement = document.createElement('img');
										imgElement.src = imageUrl;
										imgElement.alt = "AI генерированное изображение";
										imgElement.style.maxWidth = "100%";
										imgElement.style.borderRadius = "5px";
										
										galleryContainer.appendChild(imgElement);
									});
									
									// Добавляем галерею в чат
									chatMessages.appendChild(galleryContainer);
									chatMessages.scrollTop = chatMessages.scrollHeight;
									
									addMessageToChat("Изображения успешно сгенерированы!", false);
								};
								
								// Функция проверки статуса генерации изображения
								const checkImageStatus = async (imageId) => {
									try {
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
										
										return await response.json();
									} catch (error) {
										console.error("Ошибка при проверке статуса изображения:", error);
										return null;
									}
								};
								
								// Рекурсивная функция для периодической проверки статуса
								const pollImageStatus = async (imageId, attempt = 1) => {
									if (attempt > 5) { // Ограничиваем количество попыток (~5 минут)
										addMessageToChat("Превышено время ожидания генерации изображений", false);
										return;
									}
									
									console.log(`Проверка статуса изображения, попытка ${attempt}`);
									const result = await checkImageStatus(imageId);
									
									if (result && result.completed === true) {
										// Изображения готовы, отображаем их
										displayImages(result.images);
									} else {
										// Еще не готово, ждем 10 секунд и проверяем снова
										addMessageToChat(`Изображения генерируются... (${attempt}/30)`, false);
										setTimeout(() => pollImageStatus(imageId, attempt + 1), 10000);
									}
								};

								try {
                                // Отправляем JSON на второй вебхук для получения изображения
									const responseApi2 = await fetch("https://itsa777.app.n8n.cloud/webhook/e7a59345-0b95-46f5-8abd-aea5a2ea2134", {
										method: 'POST',
										headers: {
											'Content-Type': 'application/json'
										},
										body: JSON.stringify({
											"user": "dreamsWizard",
											"password": "dreamsWizard2024",
											"id": resultApi1.id
										})
									});
									
									if (!responseApi2.ok) {
										console.error('Ошибка запроса к API изображений:', responseApi2.status);
										return;
									}
									resultApi2 = await responseApi2.json();

									console.log("Ответ от API изображений:", resultApi2.completed);
									console.log("Ответ от API изображений:", resultApi2);
									
									// Проверяем статус генерации изображений
									if (resultApi2.completed === true && resultApi2.images && resultApi2.images.length > 0) {
										// Изображения уже готовы, отображаем их
										displayImages(resultApi2.images);
									} else {
										// Изображения еще не готовы, запускаем периодическую проверку
										addMessageToChat("Изображения генерируются, ожидайте...", false);
										pollImageStatus(resultApi1.id);
									}
									
								} catch (error) {
									console.error("Ошибка при обработке изображения:", error);
								}
                            } catch (err) {
                                console.error("Ошибка при обработке изображения:", err);
                            }
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
