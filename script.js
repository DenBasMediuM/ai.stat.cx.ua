document.addEventListener('DOMContentLoaded', () => {
    const userMessage = document.getElementById('userMessage');
    const sendButton = document.getElementById('sendButton');
    const micButton = document.getElementById('micButton');
    const chatMessages = document.getElementById('chatMessages');
    const chatContainer = document.querySelector('.chat-container');
    const actionButtons = document.getElementById('actionButtons');
    
    // Enhanced scroll to bottom function - finds the correct scrollable container
    const scrollToBottom = () => {
        if (!chatMessages) {
            return;
        }
        
        // Find all potentially scrollable containers
        const potentialContainers = [
            chatMessages, // The chatMessages div itself
            chatMessages.parentElement, // Parent container
            chatMessages.parentElement?.parentElement, // Grandparent container
            document.querySelector('.chat-messages-scroll-container'), // New scroll container
            document.querySelector('.flex-1.flex.justify-center.overflow-y-auto'), // Specific outer container
            document.querySelector('.chat-container'), // Main chat container
            document.body, // Document body
            document.documentElement, // HTML element
            window, // Window itself
        ].filter(Boolean); // Remove null/undefined elements
        
        // Try to scroll each container
        potentialContainers.forEach((container, index) => {
            if (container === window) {
                // Special handling for window
                requestAnimationFrame(() => {
                    window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    });
                });
            } else if (container && container.scrollHeight > container.clientHeight) {
                // Use requestAnimationFrame for smooth scrolling
                requestAnimationFrame(() => {
                    const targetScrollTop = container.scrollHeight - container.clientHeight;
                    container.scrollTop = targetScrollTop;
                    
                    // Double-check after a small delay
                    setTimeout(() => {
                        if (container.scrollTop < targetScrollTop - 10) {
                            container.scrollTop = targetScrollTop;
                        }
                    }, 50);
                });
            }
        });
    };

    // Helper function to append messages to the proper container
    const appendToChat = (element) => {
        // Try to find the inner container, if not found, use the main container
        const innerContainer = chatMessages?.querySelector('.max-w-800');
        const targetContainer = innerContainer || chatMessages;
        
        if (targetContainer) {
            targetContainer.appendChild(element);
            // Enhanced scroll to bottom
            scrollToBottom();
        } else {
            console.error('❌ Cannot find chat container to append message');
        }
    };
    
    // Debug log for critical DOM elements
    console.log('🔧 DOM Elements Check:');
    console.log('📦 chatContainer:', chatContainer);
    console.log('🔘 actionButtons:', actionButtons);
    console.log('💬 chatMessages:', chatMessages);
    console.log('🎯 Inner container:', chatMessages?.querySelector('.max-w-800'));
    console.log('📝 userMessage:', userMessage);
    
    // Quick response elements
    const quickResponseContainer = document.getElementById('quickResponseButtons');
    const quickResponseButtons = document.querySelectorAll('.quick-response-btn');
    
    // Debug log for quick response elements
    console.log('🔧 Quick response container:', quickResponseContainer);
    console.log('🔘 Quick response buttons count:', quickResponseButtons.length);
    if (quickResponseButtons.length > 0) {
        console.log('📋 Button data:', Array.from(quickResponseButtons).map(btn => btn.getAttribute('data-response')));
    }
    
    // Sidebar elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mainContent = document.getElementById('mainContent');
    const sidebarCollapsedBar = document.getElementById('sidebarCollapsedBar');
    const sidebarToggleCollapsed = document.getElementById('sidebarToggleCollapsed');
    
    // Initialize sidebar functionality
    if (sidebar && sidebarToggle) {
        // Toggle sidebar on button click (from expanded state)
        sidebarToggle.addEventListener('click', () => {
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                sidebar.classList.toggle('mobile-open');
                sidebarOverlay.classList.toggle('active');
            } else {
                // Hide full sidebar and show collapsed bar
                sidebar.style.display = 'none';
                if (sidebarCollapsedBar) {
                    sidebarCollapsedBar.style.display = 'flex';
                }
                if (mainContent) {
                    mainContent.classList.add('sidebar-collapsed');
                }
            }
        });
        
        // Toggle sidebar on button click (from collapsed state)
        if (sidebarToggleCollapsed) {
            sidebarToggleCollapsed.addEventListener('click', () => {
                const isMobile = window.innerWidth <= 768;
                
                if (!isMobile) {
                    // Show full sidebar and hide collapsed bar
                    sidebar.style.display = 'flex';
                    if (sidebarCollapsedBar) {
                        sidebarCollapsedBar.style.display = 'none';
                    }
                    if (mainContent) {
                        mainContent.classList.remove('sidebar-collapsed');
                    }
                }
            });
        }
        
        // Close sidebar on overlay click (mobile)
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('mobile-open');
                sidebarOverlay.classList.remove('active');
            });
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            const isMobile = window.innerWidth <= 768;
            
            if (!isMobile) {
                // Remove mobile classes on desktop
                sidebar.classList.remove('mobile-open');
                sidebarOverlay.classList.remove('active');
            } else {
                // On mobile, always show full sidebar and hide collapsed bar
                sidebar.style.display = 'flex';
                if (sidebarCollapsedBar) {
                    sidebarCollapsedBar.style.display = 'none';
                }
                if (mainContent) {
                    mainContent.classList.remove('sidebar-collapsed');
                }
            }
        });
    }
    
    // Chat management functions
    const createNewChat = async () => {
        console.log('🔵 Creating new chat...');
        try {
            // 1. Создаем новый chat в базе данных
            const chatResponse = await fetch('chat_manager.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_chat' })
            });
            
            const chatData = await chatResponse.json();
            console.log('🔵 Create chat response:', chatData);
            
            if (chatData.success) {
                currentChatId = chatData.chat_id;
                firstMessageInChat = false;
                autoLoadAttempted = false; // Reset auto-load flag for future sessions
                console.log('✅ New chat created with ID:', currentChatId);
                
                // 2. Создаем новый OpenAI thread
                const threadId = await createNewThread();
                if (threadId) {
                    // 3. Связываем thread с чатом
                    await updateChatThreadId(currentChatId, threadId);
                    // 4. Устанавливаем thread как активный в сессии
                    await setSessionThread(threadId);
                    console.log('✅ Chat linked to thread:', threadId);
                } else {
                    console.warn('⚠️ Failed to create thread for chat, will create on first message');
                }
                
                // Clear current conversation only if this is called from UI (not from sendMessage)
                // Don't clear if we're in the middle of sending a message
                if (!window.creatingChatFromSendMessage) {
                    chatMessages.innerHTML = '';
                    conversationHistory = [];
                    
                    // Show greeting again
                    const greeting = document.querySelector('.greeting');
                    if (greeting) {
                        greeting.style.display = 'block';
                    }
                }
                
                // Always reload chats list to show new chat in sidebar
                loadUserChats();
                
                // Focus on input area
                if (userMessage) {
                    userMessage.focus();
                }
                
                return chatData.chat_id;
            } else {
                console.error('❌ Failed to create chat:', chatData.message);
                return null;
            }
        } catch (error) {
            console.error('❌ Error creating chat:', error);
            return null;
        }
    };
    
    const loadUserChats = async () => {
        console.log('🔵 Loading user chats... isUserAuthenticated:', isUserAuthenticated);
        if (!isUserAuthenticated) return;
        
        try {
            const response = await fetch('chat_manager.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_chats' })
            });
            
            const data = await response.json();
            console.log('🔵 Load chats response:', data);
            
            if (data.success) {
                const chatsList = document.getElementById('chatsList');
                if (chatsList) {
                    chatsList.innerHTML = '';
                    console.log('✅ Loading', data.chats.length, 'chats');
                    
                    data.chats.forEach(chat => {
                        const chatItem = document.createElement('div');
                        chatItem.className = 'chat-item flex items-center justify-between px-2 rounded-lg cursor-pointer mb-1 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 group relative';
                        chatItem.setAttribute('data-chat-id', chat.id); // Add data attribute for easy identification
                        
                        if (chat.id === currentChatId) {
                            chatItem.classList.add('active', 'bg-gray-100', 'dark:bg-gray-700');
                        }
                        
                        chatItem.innerHTML = `
                            <div class="chat-item-title flex-1 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap overflow-hidden text-ellipsis mr-2">${chat.title}</div>
                            <button class="chat-item-delete opacity-0 group-hover:opacity-100 bg-transparent border-none text-gray-400 hover:text-white hover:bg-red-500 cursor-pointer p-1 rounded transition-all duration-200 flex-shrink-0" onclick="deleteChat('${chat.id}', this)">
                                <i class="fas fa-trash text-xs"></i>
                            </button>
                        `;
                        
                        chatItem.addEventListener('click', (e) => {
                            if (e.target.closest('.chat-item-delete')) return;
                            
                            // Immediately set active state before loading
                            updateActiveChatButton(chat.id);
                            
                            // Set currentChatId immediately for UI consistency
                            currentChatId = chat.id;
                            
                            loadChat(chat.id);
                        });
                        
                        chatsList.appendChild(chatItem);
                    });
                } else {
                    console.warn('⚠️ chatsList element not found');
                }
            } else {
                console.error('❌ Failed to load chats:', data.message || 'Unknown error');
            }
        } catch (error) {
            console.error('❌ Error loading chats:', error);
        }
    };
    
    // Auto-load the last (most recent) chat if no chat is currently active
    const autoLoadLastChatIfNeeded = async () => {
        console.log('🔵 Checking if auto-load is needed... currentChatId:', currentChatId, 'autoLoadAttempted:', autoLoadAttempted);
        
        // Only auto-load if user is authenticated, no chat is currently active, and we haven't already attempted auto-load
        if (!isUserAuthenticated || currentChatId || autoLoadAttempted) {
            console.log('🔵 Auto-load skipped: not authenticated, chat already active, or already attempted');
            return;
        }
        
        // Mark that we've attempted auto-load to prevent multiple attempts
        autoLoadAttempted = true;
        
        try {
            // Get the list of chats (they're already sorted by updated_at desc in getUserChats)
            const response = await fetch('chat_manager.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_chats' })
            });
            
            const data = await response.json();
            console.log('🔵 Auto-load chats response:', data);
            
            if (data.success && data.chats && data.chats.length > 0) {
                // Load the most recent chat (first in the sorted list)
                const lastChatId = data.chats[0].id;
                console.log('✅ Auto-loading last chat:', lastChatId);
                await loadChat(lastChatId);
            } else {
                console.log('🔵 No chats found to auto-load');
            }
        } catch (error) {
            console.error('❌ Error during auto-load:', error);
        }
    };
    
    const loadChat = async (chatId) => {
        let loadingSpinner = null;
        
        try {
            // Показываем спиннер если есть история для загрузки
            const response = await fetch('chat_manager.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_chat', chat_id: chatId })
            });
            
            const data = await response.json();
            if (data.success) {
                currentChatId = chatId;
                const chat = data.chat;
                
                // Clear current messages сразу
                chatMessages.innerHTML = '';
                conversationHistory = [];
                
                // Reset auto-load flag since we're manually loading a chat
                autoLoadAttempted = false;
                
                // Check if we should restore thread history based on message size
                let shouldRestoreThread = true;
                if (chat.messages.length > 0) {
                    const testPayload = {
                        action: 'restore_thread_history',
                        thread_id: 'test',
                        messages: chat.messages
                    };
                    const payloadSize = JSON.stringify(testPayload).length;
                    console.log('🔵 Chat payload size:', (payloadSize / 1024 / 1024).toFixed(2), 'MB');
                    
                    if (payloadSize > 7 * 1024 * 1024) {
                        console.warn('⚠️ Chat history too large for thread restoration, will skip thread setup');
                        shouldRestoreThread = false;
                    }
                }
                
                // Switch to chat's thread or create new one (only if we can restore history)
                let chatThreadId = chat.thread_id;
                if (!chatThreadId && shouldRestoreThread) {
                    console.log('🔵 No thread for chat, creating new one...');
                    chatThreadId = await createNewThread();
                    if (chatThreadId) {
                        await updateChatThreadId(chatId, chatThreadId);
                    }
                } else if (!chatThreadId && !shouldRestoreThread) {
                    console.log('🔵 Skipping thread creation due to large chat history');
                }
                
                // Параллельно выполняем переключение thread и отображение сообщений
                const promises = [];
                
                if (chatThreadId && shouldRestoreThread) {
                    promises.push(setSessionThread(chatThreadId));
                    console.log('✅ Switched to chat thread:', chatThreadId);
                    
                    // Restore thread history в фоне, только если есть сообщения
                    if (chat.messages.length > 0) {
                        console.log('🔵 Restoring thread history...');
                        promises.push(restoreThreadHistory(chatThreadId, chat.messages));
                    }
                } else if (!shouldRestoreThread) {
                    console.log('🔵 Skipping thread restoration due to large payload size');
                } else {
                    console.warn('⚠️ Failed to setup thread for chat');
                }
                
                // Отображаем сообщения сразу, не ждем thread history
                if (chat.messages.length > 0) {
                    // Hide greeting if there are messages
                    const greeting = document.querySelector('.greeting');
                    if (greeting) {
                        greeting.style.display = 'none';
                    }
                    
                    // Detect user language from chat history first
                    await detectUserLanguageFromHistory(chat.messages);
                    
                    // Load messages using new rendering system (быстро)
                    for (const message of chat.messages) {
                        await renderMessageFromHistory(message);
                        
                        // Add to conversation history
                        conversationHistory.push({
                            type: message.type,
                            text: message.content,
                            timestamp: message.timestamp,
                            message_type: message.message_type,
                            extra_data: message.extra_data
                        });
                    }
                    
                    // Scroll to bottom
                    scrollToBottom();
                }
                
                // Ждем завершения thread операций в фоне
                await Promise.all(promises);
                
                // Hide loading spinner
                if (loadingSpinner) {
                    hideHistoryLoadingSpinner(loadingSpinner);
                }
                
                // Update active chat in sidebar
                document.querySelectorAll('.chat-item').forEach(item => {
                    item.classList.remove('active', 'bg-gray-100', 'dark:bg-gray-700');
                });
                const activeItem = document.querySelector(`[onclick*="${chatId}"]`)?.closest('.chat-item');
                if (activeItem) {
                    activeItem.classList.add('active', 'bg-gray-100', 'dark:bg-gray-700');
                }
                
                // Scroll to bottom
                setTimeout(() => {
                    scrollToBottom();
                }, 100);
                
                firstMessageInChat = chat.messages.length > 0;
                
            } else {
                console.error('Failed to load chat:', data.message);
                if (loadingSpinner) {
                    hideHistoryLoadingSpinner(loadingSpinner);
                }
            }
        } catch (error) {
            console.error('Error loading chat:', error);
            if (loadingSpinner) {
                hideHistoryLoadingSpinner(loadingSpinner);
            }
        }
    };
    
    const saveMessageToCurrentChat = async (message, isUser, messageType = 'text', extraData = null) => {
        if (!currentChatId) {
            console.warn('⚠️ No current chat ID, cannot save message');
            return false;
        }
        
        try {
            const requestData = {
                action: 'save_message',
                chat_id: currentChatId,
                message: message,
                is_user: isUser,
                message_type: messageType
            };
            
            if (extraData) {
                requestData.extra_data = extraData;
            }
            
            const response = await fetch('chat_manager.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error saving message:', error);
            return false;
        }
    };
    
    const updateChatTitle = async (chatId, title) => {
        // Immediately update the title in the DOM for instant visual feedback
        const activeChat = document.querySelector('.chat-item.active .chat-item-title');
        if (activeChat) {
            activeChat.textContent = title;
        }
        
        try {
            const response = await fetch('chat_manager.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_title',
                    chat_id: chatId,
                    title: title
                })
            });
            
            const data = await response.json();
            if (data.success) {
                // Refresh sidebar to ensure consistency
                loadUserChats();
            }
            return data.success;
        } catch (error) {
            console.error('Error updating chat title:', error);
            return false;
        }
    };
    
    // Global function for deleting chats (called from HTML)
    window.deleteChat = async (chatId, buttonElement) => {
        if (!confirm('Are you sure you want to delete this chat?')) {
            return;
        }
        
        try {
            const response = await fetch('chat_manager.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete_chat',
                    chat_id: chatId
                })
            });
            
            const data = await response.json();
            if (data.success) {
                // If this was the current chat, clear it
                if (chatId === currentChatId) {
                    currentChatId = null;
                    chatMessages.innerHTML = '';
                    conversationHistory = [];
                    const greeting = document.querySelector('.greeting');
                    if (greeting) {
                        greeting.style.display = 'block';
                    }
                }
                
                // Reload chats list
                loadUserChats();
            } else {
                alert('Failed to delete chat: ' + data.message);
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
            alert('Error deleting chat');
        }
    };
    
    // Global variable to store message history
    let conversationHistory = [];
    
    // User authentication flag
    let isUserAuthenticated = false;
    
    // Current chat ID
    let currentChatId = null;
    
    // Flag to track if first message was sent in current chat
    let firstMessageInChat = false;
    
    // Flag to prevent multiple auto-loads
    let autoLoadAttempted = false;
    
    // UI elements - только иконка NEW PROJECT, кнопки больше нет
    const newProjectIcon = document.querySelector('.new-project-icon');
    
    // Add a flag to track when we're waiting for a project name


    // Флаг для блокировки ввода во время выбора изображения
    let isImageSelectionActive = false;
    
    // Quick Response Functions
    const detectEnvironmentQuestion = async (text) => {
        // Сначала переводим текст на английский для унифицированной детекции
        const englishText = await translateToEnglish(text);
        
        // Ключевые слова ТОЛЬКО для вопросов об окружении/локации/среде
        const environmentKeywords = [
            'environment', 'setting', 'surroundings', 'neighborhood', 'location', 'area',
            'village', 'city', 'suburb', 'industrial', 'seaside', 'downtown', 'beach',
            'countryside', 'urban', 'rural', 'coastal', 'mountain', 'forest',
            'development type', 'urban planning', 'development style', 'zone',
            'district', 'region', 'place', 'locale', 'site', 'terrain'
        ];
        
        // Расширенные исключающие слова - если они есть, то это НЕ вопрос об окружении
        const excludeKeywords = [
            'building type', 'type of building', 'kind of building', 'building category',
            'residential building', 'commercial building', 'office building',
            'apartment building', 'house design', 'structure type',
            'construction type', 'architectural style', 'building style',
            'floors', 'rooms', 'square', 'meters', 'size', 'height', 'material',
            'construction materials', 'building materials', 'how many floors',
            'how many rooms', 'square meters', 'building size'
        ];
        
        const questionKeywords = [
            'what', 'which', 'where', 'choose', 'select', 'describe', 'specify',
            'tell', 'indicate', 'determine', 'pick', 'decide', 'prefer', 'like',
            'want', 'need', 'about', 'kind', 'sort', 'variety', 'how many'
        ];
        
        const lowerText = englishText.toLowerCase();
        
        // Проверяем наличие ключевых слов об окружении
        const hasEnvironmentKeyword = environmentKeywords.some(keyword => lowerText.includes(keyword));
        const hasQuestionKeyword = questionKeywords.some(keyword => lowerText.includes(keyword));
        
        // Проверяем отсутствие исключающих слов (про тип здания)
        const hasExcludingKeyword = excludeKeywords.some(keyword => lowerText.includes(keyword));
        
        // Дополнительная проверка: если в тексте есть и environment слова, и building слова - приоритет у building
        const hasBuildingWords = ['building', 'structure', 'construction'].some(word => lowerText.includes(word));
        const hasTypeWords = ['type', 'kind', 'category'].some(word => lowerText.includes(word));
        
        // Если есть "building" + "type" - точно не показываем кнопки
        if (hasBuildingWords && hasTypeWords) {
            return false;
        }
        
        // Результат: есть слова об окружении + есть вопросительные слова + НЕТ слов о типе здания
        const shouldShow = hasEnvironmentKeyword && hasQuestionKeyword && !hasExcludingKeyword;
        
        // Debug logging only in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🔍 Detecting environment question:', {
                originalText: text.substring(0, 100) + '...',
                englishText: englishText.substring(0, 100) + '...',
                hasEnvironmentKeyword,
                hasQuestionKeyword,
                hasExcludingKeyword,
                hasBuildingWords,
                hasTypeWords,
                result: shouldShow
            });
        }
        
        return shouldShow;
    };
    
    const showQuickResponseButtons = () => {
        if (quickResponseContainer) {
            // Обновляем переводы кнопок перед показом
            updateQuickResponseButtonsText();
            
            quickResponseContainer.style.display = 'flex';
            quickResponseContainer.classList.add('show');
            quickResponseContainer.classList.remove('hide');
        }
    };
    
    const hideQuickResponseButtons = () => {
        if (quickResponseContainer) {
            quickResponseContainer.classList.add('hide');
            quickResponseContainer.classList.remove('show');
            
            setTimeout(() => {
                if (quickResponseContainer.classList.contains('hide')) {
                    quickResponseContainer.style.display = 'none';
                    quickResponseContainer.classList.remove('hide');
                }
            }, 300); // Соответствует длительности анимации
        }
    };
    
    const updateQuickResponseButtonsText = () => {
        const translations = getQuickResponseButtonTranslations();
        const buttons = document.querySelectorAll('.quick-response-btn');
        
        if (buttons.length >= 5) {
            buttons[0].textContent = translations.village;
            buttons[0].setAttribute('data-response', translations.village);
            
            buttons[1].textContent = translations.densecity;
            buttons[1].setAttribute('data-response', translations.densecity);
            
            buttons[2].textContent = translations.suburb;
            buttons[2].setAttribute('data-response', translations.suburb);
            
            buttons[3].textContent = translations.seaside;
            buttons[3].setAttribute('data-response', translations.seaside);
            
            buttons[4].textContent = translations.industrial;
            buttons[4].setAttribute('data-response', translations.industrial);
        }
    };

    const addQuickResponseToTextarea = (responseText) => {
        const currentText = userMessage.value.trim();
        
        // Если в textarea уже есть текст, добавляем через пробел
        if (currentText) {
            userMessage.value = currentText + ' ' + responseText;
        } else {
            userMessage.value = responseText;
        }
        
        // Скрываем кнопки после выбора
        hideQuickResponseButtons();
        
        // Обновляем высоту textarea и кнопки
        autoResizeTextarea();
        toggleSendButton();
        
        // Устанавливаем фокус на textarea
        userMessage.focus();
    };

    // Auto-resize textarea function
    const autoResizeTextarea = () => {
        // Reset height to auto to get the correct scrollHeight
        userMessage.style.height = 'auto';
        
        // Get the scroll height
        const scrollHeight = userMessage.scrollHeight;
        const maxHeight = 200; // Maximum height in pixels
        const minHeight = 24; // Minimum height for single line
        
        // Ensure minimum height
        const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
        
        userMessage.style.height = newHeight + 'px';
        
        if (scrollHeight > maxHeight) {
            userMessage.style.overflowY = 'auto';
        } else {
            userMessage.style.overflowY = 'hidden';
        }
    };

    // Clean textarea value from unwanted whitespace
    const cleanTextareaValue = () => {
        const currentValue = userMessage.value;
        
        // Only clean if the value consists entirely of whitespace characters
        // This preserves normal spaces in text but removes unwanted whitespace-only content
        if (currentValue.trim() === '' && currentValue !== '') {
            userMessage.value = '';
            return true;
        }
        
        return false;
    };

    // Toggle between microphone and send button
    const toggleSendButton = () => {
        const hasContent = userMessage.value.trim().length > 0;
        
        if (hasContent) {
            // Show send button, hide microphone button
            if (sendButton.style.display === 'none') {
                micButton.style.display = 'none';
                sendButton.style.display = 'flex';
                // Add fade in animation
                sendButton.classList.add('fade-in');
                setTimeout(() => sendButton.classList.remove('fade-in'), 200);
            }
        } else {
            // Show microphone button, hide send button
            if (micButton.style.display === 'none' || micButton.style.display === '') {
                sendButton.style.display = 'none';
                micButton.style.display = 'flex';
                // Add fade in animation
                micButton.classList.add('fade-in');
                setTimeout(() => micButton.classList.remove('fade-in'), 200);
            }
            // Ensure placeholder is visible when no content
            userMessage.setAttribute('placeholder', 'Ask something...');
        }
    };

    // Event listeners for textarea
    userMessage.addEventListener('input', () => {
        autoResizeTextarea();
        toggleSendButton();
        
        // Hide quick response buttons when user starts typing manually
        if (userMessage.value.trim() && quickResponseContainer && quickResponseContainer.style.display === 'flex') {
            hideQuickResponseButtons();
        }
    });

    userMessage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (userMessage.value.trim()) {
                sendMessage(userMessage.value.trim());
            }
        }
    });

    // Prevent unwanted spaces on focus
    userMessage.addEventListener('focus', () => {
        // Only clean on focus if textarea contains only whitespace
        if (cleanTextareaValue()) {
            autoResizeTextarea();
            toggleSendButton();
        }
    });

    // Clean up whitespace on blur
    userMessage.addEventListener('blur', () => {
        if (cleanTextareaValue()) {
            autoResizeTextarea();
            toggleSendButton();
        }
    });

    // Handle paste events
    userMessage.addEventListener('paste', (e) => {
        // Let the paste happen first, then clean up
        setTimeout(() => {
            if (cleanTextareaValue()) {
                autoResizeTextarea();
                toggleSendButton();
            }
        }, 10);
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        autoResizeTextarea();
    });

    // Initialize textarea state
    // Clear any whitespace that might be in textarea from HTML
    userMessage.value = '';
    userMessage.textContent = ''; // Also clear textContent just in case
    autoResizeTextarea();
    toggleSendButton();
    
    // Focus textarea on page load with a slight delay to ensure DOM is ready
    setTimeout(() => {
        userMessage.focus();
        // Ensure cursor is at the beginning
        userMessage.setSelectionRange(0, 0);
    }, 150);

    // Add MutationObserver to watch for any DOM changes to textarea
    const textareaObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                // Only clean if the content is purely whitespace
                if (userMessage.value.trim() === '' && userMessage.value !== '') {
                    userMessage.value = '';
                    autoResizeTextarea();
                    toggleSendButton();
                }
            }
        });
    });

    // Start observing
    textareaObserver.observe(userMessage, {
        childList: true,
        characterData: true,
        subtree: true
    });

    // Event listeners for quick response buttons
    console.log('🔧 Initializing quick response buttons:', quickResponseButtons.length);
    quickResponseButtons.forEach((button, index) => {
        console.log(`🔘 Button ${index}:`, button.getAttribute('data-response'));
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const responseText = button.getAttribute('data-response');
            console.log('🖱️ Quick response button clicked:', responseText);
            if (responseText) {
                addQuickResponseToTextarea(responseText);
            }
        });
    });

	async function detectLanguage(text) {
		const response = await fetch("detect-language.php", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ text })
		});
		const data = await response.json();

		if (data.choices?.[0]?.message?.content) {
			return data.choices[0].message.content.trim();
		}
		return "unknown";
	}
    
    // Check authentication status when page loads
    const checkAuthStatus = async () => {
        console.log('🔵 Checking authentication status...');
        try {
            const response = await fetch('check_auth.php');
            const data = await response.json();
            console.log('🔵 Auth check response:', data);
            
            isUserAuthenticated = data.authenticated;
            console.log('✅ User authenticated:', isUserAuthenticated);
            
            // Update "New Project" button style based on authentication status
            if (isUserAuthenticated) {
                // Load user chats if authenticated and auto-load last chat if needed
                setTimeout(async () => {
                    await loadUserChats();
                    await autoLoadLastChatIfNeeded();
                }, 100);
            }
        } catch (error) {
            console.error('❌ Error checking authentication:', error);
        }
    };

	const extractJson = (str) => {
		const start = str.indexOf('{');
		const end = str.lastIndexOf('}');
		
		if (start !== -1 && end !== -1 && end > start) {
			const jsonStr = str.substring(start, end + 1);
			try {
			return JSON.parse(jsonStr);
			} catch (e) {
			console.error("Error parsing JSON:", e);
			}
		}
		return null;
	};
    
    // Call authentication check
    checkAuthStatus();
    
    // Initialize chat functionality for authenticated users
    if (sidebar) {
        console.log('🔵 Initializing chat functionality...');
        // New Chat button handler
        const newChatBtn = document.getElementById('newChatBtn');
        const newChatBtnCollapsed = document.getElementById('newChatBtnCollapsed');
        
        if (newChatBtn) {
            console.log('✅ Found newChatBtn, adding event listener');
            newChatBtn.addEventListener('click', async () => {
                console.log('🔵 New Chat button clicked (expanded)');
                await createNewChat();
            });
        } else {
            console.warn('⚠️ newChatBtn not found');
        }
        
        if (newChatBtnCollapsed) {
            console.log('✅ Found newChatBtnCollapsed, adding event listener');
            newChatBtnCollapsed.addEventListener('click', async () => {
                console.log('🔵 New Chat button clicked (collapsed)');
                await createNewChat();
            });
        } else {
            console.warn('⚠️ newChatBtnCollapsed not found');
        }
        
        // Load user chats on page load
        loadUserChats();
    } else {
        console.log('⚠️ Sidebar not found - user likely not authenticated');
    }
    
    // Initialize icon buttons state
    const initializeIconButtons = () => {
        const newProjectIcon = document.querySelector('.new-project-icon');
        
        if (newProjectIcon) {
            newProjectIcon.style.opacity = '1';
            newProjectIcon.style.cursor = 'pointer';
        }
    };
    
    // Initialize after DOM is ready
    setTimeout(initializeIconButtons, 100);
    
    // Modified function to add message to chat and history
    const addMessageToChat = async (text, isUser, skipTranslate = false) => {
        let displayText = text;
        if (!isUser && !skipTranslate) {
            try {
                displayText = await translateToUserLanguage(text);
            } catch (error) {
                console.error('Translation error:', error);
                displayText = text; // fallback to original text
            }
        }
        const messageDiv = document.createElement('div');
        
        // Tailwind CSS styling for chat messages
        if (isUser) {
            messageDiv.className = 'flex justify-end mb-4';
            messageDiv.innerHTML = `
                <div class="max-w-xs lg:max-w-md px-4 py-2 bg-blue-500 text-white rounded-lg rounded-br-none shadow-md">
                    <p class="text-sm leading-relaxed">${displayText}</p>
                    <div class="text-xs opacity-75 mt-1">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            `;
        } else {
            messageDiv.className = 'flex justify-start mb-4';
            messageDiv.innerHTML = `
                <div class="max-w-lg lg:max-w-xl px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg rounded-bl-none shadow-md">
                    <p class="text-sm leading-relaxed">${displayText}</p>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            `;
        }
        appendToChat(messageDiv);
        
        // Save message to history
        conversationHistory.push({
            type: isUser ? 'user' : 'bot',
            text: displayText,
            timestamp: new Date().toISOString()
        });
        
        // Save message to database if user is authenticated
        if (isUserAuthenticated) {
            await saveMessageToCurrentChat(displayText, isUser);
            
            // If this is the first user message in a new chat, update the title immediately
            if (isUser && !firstMessageInChat && currentChatId) {
                firstMessageInChat = true;
                const title = displayText.length > 50 ? displayText.substring(0, 50) + '...' : displayText;
                await updateChatTitle(currentChatId, title);
            }
        }
        
        // Check if AI message contains environment questions and show quick response buttons
        if (!isUser) {
            detectEnvironmentQuestion(displayText).then(shouldShow => {
                if (shouldShow) {
                    setTimeout(() => {
                        showQuickResponseButtons();
                    }, 500); // Small delay to show after message appears
                }
            }).catch(err => {
                console.error('Error detecting environment question:', err);
            });
        }
    };
    
    // Functions available for internal use
    
    // Function to show typing animation
    const showTypingAnimation = () => {
        userMessage.disabled = true;
        sendButton.disabled = true;
        
        // Block icon buttons
        if (newProjectIcon) {
            newProjectIcon.disabled = true;
            newProjectIcon.style.opacity = '0.3';
            newProjectIcon.style.cursor = 'not-allowed';
        }
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        // Create typing dots
        const dot1 = document.createElement('span');
        const dot2 = document.createElement('span');
        const dot3 = document.createElement('span');
        
        dot1.className = 'typing-dot';
        dot2.className = 'typing-dot';
        dot3.className = 'typing-dot';
        
        typingDiv.appendChild(dot1);
        typingDiv.appendChild(dot2);
        typingDiv.appendChild(dot3);
        
        appendToChat(typingDiv);
    };
    
    // Function to hide typing animation
    const hideTypingAnimation = () => {
        userMessage.disabled = false;
        sendButton.disabled = false;
        
        // Restore icon buttons
        if (newProjectIcon) {
            newProjectIcon.disabled = false;
            newProjectIcon.style.opacity = '1';
            newProjectIcon.style.cursor = 'pointer';
        }
        
        const typingDiv = document.getElementById('typingIndicator');
        if (typingDiv) {
            typingDiv.remove();
        }
        userMessage.focus(); // Перемещаем курсор в textarea после разблокировки
    };

    // Function to check image status
    const checkImageStatus = async (imageId) => {
        try {
            console.log('Requesting status for ID:', imageId);
            const response = await fetch("images-status-check.php", {
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
                console.error('Error requesting image status:', response.status);
                return null;
            }
            
            const result = await response.json();
            console.log('Received status:', JSON.stringify(result));
            return result;
        } catch (error) {
            console.error("Error checking image status:", error);
            return null;
        }
    };

    // Function to check high-resolution image generation status
    const checkUpscaledImageStatus = async (imageId) => {
        try {
            console.log('Checking upscaled image status for ID:', imageId);
            const response = await fetch("images-status-check.php", {
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
                console.error('Error requesting upscaled image status:', response.status);
                return null;
            }
            
            const result = await response.json();
            console.log('Upscaled image status:', JSON.stringify(result));
            return result;
        } catch (error) {
            console.error("Error checking upscaled image status:", error);
            return null;
        }
    };

    // Recursive function for periodic checking of upscaled image status
    const pollUpscaledImageStatus = async (imageId, attempt = 1, clientId) => {
        userMessage.disabled = true;
        sendButton.disabled = true;
        if (newProjectIcon) {
            newProjectIcon.disabled = true;
            newProjectIcon.style.opacity = '0.3';
            newProjectIcon.style.cursor = 'not-allowed';
        }
        isImageSelectionActive = true;
        if (attempt > 30) { // Limit attempts
            hideTypingAnimation();
            addMessageToChat("Maximum time for high-resolution image generation exceeded", false);
            userMessage.disabled = false;
            sendButton.disabled = false;
            if (newProjectIcon) {
                newProjectIcon.disabled = false;
                newProjectIcon.style.opacity = '1';
                newProjectIcon.style.cursor = 'pointer';
            }
            isImageSelectionActive = false;
            return;
        }
        
        console.log(`Checking upscaled image status, attempt ${attempt}/30`);
        const result = await checkUpscaledImageStatus(imageId);
        
        if (result && result.completed === true && result.images && result.images.length > 0) {
            hideTypingAnimation();
            console.log(`Upscaled image ready!`);
            // Image ready, display it
            displayUpscaledImage(result.images[0], imageId, clientId);
            
            // Clear server resources after successful display
            clearServerResources(clientId, imageId);
        } else {
            // Not ready yet, wait 10 seconds and check again
            setTimeout(() => pollUpscaledImageStatus(imageId, attempt + 1, clientId), 10000);
        }
    };

    // Function to display upscaled image
    const displayUpscaledImage = async (imageUrl, upscaleId, clientId) => {
        userMessage.disabled = true;
        sendButton.disabled = true;
        if (newProjectIcon) {
            newProjectIcon.disabled = true;
            newProjectIcon.style.opacity = '0.3';
            newProjectIcon.style.cursor = 'not-allowed';
        }
        isImageSelectionActive = true;
        // Create container for high-quality image
        const highResContainer = document.createElement('div');
        highResContainer.className = 'message bot-message high-res-image';
        highResContainer.style.textAlign = 'center';
        highResContainer.style.marginTop = '20px';
        highResContainer.style.marginBottom = '20px';

        // Удаляем heading

        // Create image
        const imgElement = document.createElement('img');
        imgElement.src = imageUrl;
        imgElement.alt = "High-resolution image";
        imgElement.style.maxWidth = "70%";
        imgElement.style.borderRadius = "8px";
        imgElement.style.boxShadow = "0 6px 12px rgba(0,0,0,0.3)";
        
        // Add to container and chat
        highResContainer.appendChild(imgElement);
        appendToChat(highResContainer);
        
        // Scroll chat down
        scrollToBottom();
        
        // Save final image to chat history
        await saveFinalImageToChat(imageUrl, upscaleId, clientId);
        
        // Create container for action buttons
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'message bot-message actions-container';
        actionsContainer.style.display = 'flex';
        actionsContainer.style.justifyContent = 'left';
        actionsContainer.style.gap = '10px';
        actionsContainer.style.marginTop = '10px';
        
        // Add download button
        const downloadButton = document.createElement('a');
        downloadButton.textContent = await translateToUserLanguage('Download Image');
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
        
        appendToChat(actionsContainer);
        
        // Scroll chat down
        scrollToBottom();
        
        // Clear server resources after successful display
        clearServerResources(clientId, upscaleId);

        // После появления кнопок разблокируем ввод
        setTimeout(() => {
            userMessage.disabled = false;
            sendButton.disabled = false;
            if (newProjectIcon) {
                newProjectIcon.disabled = false;
                newProjectIcon.style.opacity = '1';
                newProjectIcon.style.cursor = 'pointer';
            }
            isImageSelectionActive = false;
        }, 500);
    };



    // Function for displaying images with selection options
    const displayImages = async (images, imageId) => {
        if (!images || !images.length) return;
        
        // Remove previous gallery if exists
        const existingGallery = document.querySelector('.image-gallery');
        if (existingGallery) existingGallery.remove();
        
        const existingActions = document.querySelector('.image-actions');
        if (existingActions) existingActions.remove();
        
        // Create container for image gallery
        const galleryContainer = document.createElement('div');
        galleryContainer.className = 'message bot-message image-gallery';
        galleryContainer.style.display = 'grid';
        galleryContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
        galleryContainer.style.gap = '10px';
        galleryContainer.style.marginBottom = '20px';
        galleryContainer.style.maxWidth = '50%';
        
        // Add all images to gallery with selection option
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
            imgElement.alt = `AI image ${index + 1}`;
            imgElement.style.maxWidth = "100%";
            imgElement.style.borderRadius = "5px";
            
            // Image number
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
            
            // Hover effect
            imageCard.addEventListener('mouseover', () => {
                imageCard.style.transform = 'scale(1.03)';
            });
            
            imageCard.addEventListener('mouseout', () => {
                imageCard.style.transform = 'scale(1)';
            });
            
            // Click handler for image selection
            imageCard.addEventListener('click', () => {
                selectImage(imageUrl, index, lastClientId);
            });
            
            galleryContainer.appendChild(imageCard);
        });
        
        // Add gallery to chat
        appendToChat(galleryContainer);
        
        // Create regenerate button
        const actionContainer = document.createElement('div');
        actionContainer.className = 'message bot-message image-actions';
        actionContainer.style.display = 'flex';
        actionContainer.style.justifyContent = 'center';
        actionContainer.style.gap = '10px';
        actionContainer.style.marginTop = '10px';
        actionContainer.style.marginBottom = '20px';
        
        const regenerateButton = document.createElement('button');
        regenerateButton.textContent = await translateToUserLanguage('Regenerate All');
        regenerateButton.className = 'action-button regenerate';
        regenerateButton.style.padding = '8px 16px';
        regenerateButton.style.backgroundColor = '#f0f0f0';
        regenerateButton.style.border = '1px solid #ddd';
        regenerateButton.style.borderRadius = '5px';
        regenerateButton.style.cursor = 'pointer';
        regenerateButton.style.fontWeight = 'bold';
        
        regenerateButton.addEventListener('click', async () => {
            // Remove current gallery and action buttons
            galleryContainer.remove();
            actionContainer.remove();
            userMessage.disabled = true;
            sendButton.disabled = true;
            if (newProjectIcon) {
                newProjectIcon.disabled = true;
                newProjectIcon.style.opacity = '0.3';
                newProjectIcon.style.cursor = 'not-allowed';
            }
            isImageSelectionActive = true;
            addMessageToChat("Regenerating images...", false);
            // Повторяем генерацию ракурсов, а не только prompt!
            try {
                showTypingAnimation();
                const responseApi1 = await fetch("images-generate.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ response: currentJsonData })
                });
                if (!responseApi1.ok) {
                    console.error('Error requesting image API:', responseApi1.status);
                    addMessageToChat("Ошибка генерации изображений", false);
                    hideTypingAnimation();
                    return;
                }
                const resultApi1 = await responseApi1.json();
                if (Array.isArray(resultApi1) && resultApi1.length > 0) {
                    displayViewpoints(resultApi1, currentJsonData);
                } else {
                    addMessageToChat("Ошибка: Неверный формат ответа от сервера", false);
                }
                hideTypingAnimation();
            } catch (err) {
                hideTypingAnimation();
                console.error("Error starting image generation:", err);
                addMessageToChat("Произошла ошибка при генерации изображений", false);
            }
        });
        
        actionContainer.appendChild(regenerateButton);
        appendToChat(actionContainer);
        
        // Scroll chat down
        scrollToBottom();
        
        // Save image gallery to chat
        await saveImageGalleryToChat(images, imageId);
        
        // Save image actions to chat
        const actions = [{
            label: await translateToUserLanguage('Regenerate All'),
            type: 'regenerate'
        }];
        await saveImageActionsToChat(actions);
        
        // Перевод и добавление сообщения
        const translatedMessage = await translateToUserLanguage("Select an image or regenerate all");
        addMessageToChat(translatedMessage, false, true);

        // Блокируем ввод до выбора или регенерации
        userMessage.disabled = true;
        sendButton.disabled = true;
        if (newProjectIcon) {
            newProjectIcon.disabled = true;
            newProjectIcon.style.opacity = '0.3';
            newProjectIcon.style.cursor = 'not-allowed';
        }
        isImageSelectionActive = true;
    };

    // Функция для обработки выбора изображения
    const selectImage = async (imageUrl, index, clientId) => {
        // Удаляем галерею с четырьмя картинками, если она есть
        const existingGallery = document.querySelector('.image-gallery');
        if (existingGallery) existingGallery.remove();
        const existingActions = document.querySelector('.image-actions');
        if (existingActions) existingActions.remove();

        // СРАЗУ блокируем ввод и кнопки
        userMessage.disabled = true;
        sendButton.disabled = true;
        if (newProjectIcon) {
            newProjectIcon.disabled = true;
            newProjectIcon.style.opacity = '0.3';
            newProjectIcon.style.cursor = 'not-allowed';
        }
        isImageSelectionActive = true;

        // Display selected image larger
        const selectedImgContainer = document.createElement('div');
        selectedImgContainer.className = 'message bot-message selected-image';
        selectedImgContainer.style.textAlign = 'center';
        selectedImgContainer.style.marginBottom = '20px';
        const selectedImg = document.createElement('img');
        selectedImg.src = imageUrl;
        selectedImg.alt = "Selected image";
        selectedImg.style.maxWidth = "50%";
        selectedImg.style.borderRadius = "5px";
        selectedImg.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
        selectedImgContainer.appendChild(selectedImg);
        appendToChat(selectedImgContainer);
        scrollToBottom();
        
        // Save selected image to chat
        await saveSelectedImageToChat(imageUrl, index);
        
        const translatedMessage = await translateToUserLanguage("Creating a maximum resolution image...");
        addMessageToChat(translatedMessage, false, true);
        showTypingAnimation();
        try {
            console.log('upscale...');
            const response = await fetch("image-upscale.php", {
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
                console.error('Error upscale:', response.status);
                return null;
            }
            
            const result = await response.json();
            console.log('Received upscale response:', JSON.stringify(result));
            
            // Check for ID to track status
            if (result && result.id) {
                const upscaleId = result.id;
                
                // Start process of tracking high-resolution image readiness
                pollUpscaledImageStatus(upscaleId, 1, clientId);
            } else {
                hideTypingAnimation();
                addMessageToChat("Failed to start high-resolution image generation", false);
                console.error("Response does not contain ID for tracking:", result);
            }
            
            return result;
        } catch (error) {
            hideTypingAnimation();
            console.error("Error during upscale:", error);
            addMessageToChat("An error occurred while creating high-resolution image", false);
            return null;
        }

        // Save selected image to chat
        await saveSelectedImageToChat(imageUrl, index);
    };

    // Recursive function for periodic status checking
    const pollImageStatus = async (imageId, attempt = 1) => {
        if (attempt > 30) { // Increase attempts to 30 (5 minutes)
            hideTypingAnimation();
            addMessageToChat("Maximum time for image generation exceeded", false);
            return;
        }
        
        if (attempt === 1) {
            // Показываем анимацию и сообщение только один раз
            const translatedMessage = await translateToUserLanguage("Images are generated...");
            addMessageToChat(translatedMessage, false, true);
			showTypingAnimation();
        }

        console.log(`Image status check, attempt ${attempt}/30`);
        const result = await checkImageStatus(imageId);
        
        if (result && result.completed === true && result.images && result.images.length > 0) {
            hideTypingAnimation();
            console.log(`Images ready! Count: ${result.images.length}`);
            // Images ready, display them with selection options
            displayImages(result.images, imageId);
        } else {
            // Not ready yet, wait 10 seconds and check again
            setTimeout(() => pollImageStatus(imageId, attempt + 1), 10000);
        }
    };

    // Function to check and display images
    const checkAndDisplayImages = async (imageId) => {
        try {
            // Initial status check
            const responseApi2 = await fetch("images-status-check.php", {
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
                console.error('Error requesting image API:', responseApi2.status);
                return;
            }
            const resultApi2 = await responseApi2.json();
            
            console.log("Response from image API:", resultApi2);
            
            // Check image generation status
            if (resultApi2.completed === true && resultApi2.images && resultApi2.images.length > 0) {
                // Images already ready, display them
                displayImages(resultApi2.images, imageId);
                
                // Clear server resources after successful display
                clearServerResources(lastClientId, imageId);
            } else {
                pollImageStatus(imageId);
            }
        } catch (error) {
            console.error("Error processing image:", error);
        }
    };

    // Function to clear server resources
    const clearServerResources = async (clientId, id) => {
        try {
            console.log(`Cleaning server resources: clientId=${clientId}, id=${id}`);
            
            // Instead of direct API call to DreamsGenerator, use n8n webhook as proxy
            const response = await fetch("server-resources-clear.php", {
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
                console.error('Error clearing server resources:', response.status);
                return;
            }
            
            const result = await response.json();
            console.log('Resources successfully cleared:', result);
        } catch (error) {
            // Suppress error to not block main functionality
            console.error("Error clearing server resources:", error);
            console.log("Continuing without resource cleanup");
        }
    };

    // Global variable for current JSON data
    let currentJsonData = null;

    // Global variable to save client ID
    let lastClientId;

    // Новая функция для отображения ракурсов
    const displayViewpoints = async (viewpoints, originalPayload) => {
        if (!viewpoints || !viewpoints.length) return;
        
        // Удаляем предыдущую галерею, если она существует
        const existingGallery = document.querySelector('.image-gallery');
        if (existingGallery) existingGallery.remove();
        
        const existingActions = document.querySelector('.image-actions');
        if (existingActions) existingActions.remove();
        
        // Добавляем заголовок
        const viewpointHeader = document.createElement('div');
        viewpointHeader.className = 'message bot-message';
        const translatedHeader = await translateToUserLanguage("Select a building angle:");
        viewpointHeader.textContent = translatedHeader;
        appendToChat(viewpointHeader);
        
        // Сохраняем сообщение-заголовок в историю
        if (isUserAuthenticated && currentChatId) {
            await saveMessageToCurrentChat(translatedHeader, false);
        }
        
        // Создаем контейнер для галереи ракурсов
        const galleryContainer = document.createElement('div');
        galleryContainer.className = 'message bot-message image-gallery viewpoint-gallery';
        galleryContainer.style.display = 'grid';
        galleryContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
        galleryContainer.style.gap = '10px';
        galleryContainer.style.maxWidth = '50%';
        
        // Добавляем все ракурсы в галерею
        viewpoints.forEach((viewpoint, index) => {
            const imageCard = document.createElement('div');
            imageCard.style.position = 'relative';
            imageCard.style.border = '1px solid #ddd';
            imageCard.style.borderRadius = '5px';
            imageCard.style.padding = '5px';
            imageCard.style.cursor = 'pointer';
            imageCard.style.transition = 'transform 0.2s';
            
            const imgElement = document.createElement('img');
            imgElement.src = viewpoint.base64;
            imgElement.alt = `Ракурс ${index + 1}`;
            imgElement.style.maxWidth = "100%";
            imgElement.style.borderRadius = "5px";
            
            // Номер ракурса
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
            
            // Обработчик клика для выбора ракурса
            imageCard.addEventListener('click', () => {
                selectViewpoint(viewpoint, originalPayload);
            });
            
            galleryContainer.appendChild(imageCard);
        });
        
        // Добавляем галерею в чат
        appendToChat(galleryContainer);
        
        // Сохраняем галерею ракурсов в историю
        if (isUserAuthenticated && currentChatId) {
            await saveViewpointsToChat(viewpoints, originalPayload);
        }
        
        // Прокручиваем чат вниз
        scrollToBottom();
    };



    // Функция для обработки выбора ракурса
    const selectViewpoint = async (selectedViewpoint, originalPayload) => {
        // Отображаем выбранный ракурс
        const selectedContainer = document.createElement('div');
        selectedContainer.className = 'message bot-message';
        selectedContainer.style.textAlign = 'center';
        
        const selectedImg = document.createElement('img');
        selectedImg.src = selectedViewpoint.base64;
        selectedImg.alt = "Выбранный ракурс";
        selectedImg.style.maxWidth = "70%";
        selectedImg.style.borderRadius = "5px";
        
        selectedContainer.appendChild(selectedImg);
        appendToChat(selectedContainer);
        
        // Создаем новый payload с добавлением выбранного ракурса
        const promptPayload = { ...originalPayload };
        promptPayload.images = [{
            base64: selectedViewpoint.base64,
            type: selectedViewpoint.type,
            filename: selectedViewpoint.filename
        }];
        
        try {
            // Отправляем запрос на генерацию финального изображения
            const response = await fetch("images-prompt.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ response: promptPayload })
            });
            
            if (!response.ok) {
                console.error('Error requesting prompt API:', response.status);
                addMessageToChat("Ошибка при генерации финального изображения", false);
                return;
            }
            
            const result = await response.json();
            console.log("Response from prompt API:", result);
            
            // Сохраняем client_id для последующего использования
            if (result.client_id) {
                lastClientId = result.client_id;
                console.log('Saved client_id:', lastClientId);
            }
            
            // Запускаем проверку готовности финальных изображений
            if (result.id) {
                checkAndDisplayImages(result.id);
            } else {
                console.warn("No ID returned from server");
                addMessageToChat("Ошибка: Сервер не вернул ID изображения", false);
            }
        } catch (err) {
            console.error("Error in prompt API:", err);
            addMessageToChat("Произошла ошибка при обработке изображения", false);
        }
    };

    // Function to send message to webhook and get response
    const sendMessage = async (text) => {
        if (isImageSelectionActive) return; // Блокируем отправку, если ожидается выбор изображения
        if (!text.trim()) return;
        
        // Сохраняем текст перед очисткой поля
        const messageText = text;
        
        // КРИТИЧЕСКИ ВАЖНО: Создаем чат ДО любых других действий если его нет
        if (!currentChatId && isUserAuthenticated) {
            console.log('🔵 No current chat, creating new chat before sending message...');
            window.creatingChatFromSendMessage = true; // Флаг для предотвращения очистки интерфейса
            currentChatId = await createNewChat();
            window.creatingChatFromSendMessage = false; // Сбрасываем флаг
            
            if (!currentChatId) {
                console.error('❌ Failed to create chat, cannot send message');
                return;
            }
            console.log('✅ Chat created, proceeding with message sending...');
        }
        
        // Очищаем поле ввода СРАЗУ после нажатия кнопки отправки
        userMessage.value = '';
        
        // Reset textarea height and hide send button
        autoResizeTextarea();
        toggleSendButton();
        
        // Detect language and update lastUserLanguage
        detectLanguage(messageText).then(lang => {
            console.log("Detected:", lang);
            updateUserLanguage(lang);
        }).catch(err => {
            console.error("Language detection failed:", err);
        });


        
        // Add user message to chat
        addMessageToChat(messageText, true);
        
        // Show typing animation while waiting for response
        showTypingAnimation();
        
        try {
            const response = await fetch('ai-send-message.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question: messageText }) // Используем сохраненную копию текста
            });
            console.log(response, 11111);
			
            if (response.ok) {
                // Hide typing animation before displaying the response
                hideTypingAnimation();
                
                // Get response from webhook
                const result = await response.json();
                console.log("Received data from API:", result);
                
                if (result.output) {
					match = '';
                    // Check data type of result.output
					if (typeof result.output === 'object') {
						// If it's an object, serialize it to a string
  						result.output = JSON.stringify(result.output, null, 2);
						match = result.output;
					}
                    if (typeof result.output === 'string') {
                        // Check if the response contains a JSON block
                        //const match = result.output.match(/```json\s*([\s\S]*?)```/);

						if (result.output.includes('"user": "dreamsWizard"')) {
							match = extractJson(result.output);
						}
                        if (match) {
                            console.log(match);
                            
                            // Save JSON data for possible regeneration
                            const jsonData = match;
                            currentJsonData = jsonData;  // Сохраняем в глобальную переменную
                            
                            // Save client_id for later use
                            let lastClientId;
                            
                            // Function for generating images
                            const generateImages = async (jsonPayload) => {
								showTypingAnimation();
                                try {
                                    // Отправляем JSON на PHP-сервер для генерации ракурсов
                                    const responseApi1 = await fetch("images-generate.php", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ response: jsonPayload })
                                    });

                                    if (!responseApi1.ok) {
                                        console.error('Error requesting image API:', responseApi1.status);
                                        addMessageToChat("Ошибка генерации изображений", false);
                                        return;
                                    }

                                    // Ответ от PHP-сервера - теперь это массив из 4 ракурсов
                                    const resultApi1 = await responseApi1.json();
                                    console.log("Response from image API:", resultApi1);

                                    // Проверяем, что ответ содержит массив изображений
                                    if (Array.isArray(resultApi1) && resultApi1.length > 0) {
                                        // Отображаем ракурсы для выбора пользователем
                                        displayViewpoints(resultApi1, jsonPayload);
                                    } else {
                                        console.warn("Неверный формат ответа от API");
                                        addMessageToChat("Ошибка: Неверный формат ответа от сервера", false);
                                    }
                                } catch (err) {
                                    console.error("Error starting image generation:", err);
                                    addMessageToChat("Произошла ошибка при генерации изображений", false);
                                }
								hideTypingAnimation();
                            };

                            // Start image generation process
                            generateImages(jsonData);
                        } else {
                            // Regular text response
                            addMessageToChat(result.output, false, true); // skipTranslate=true, чтобы не было двойного перевода
                        }
                    } else {
                        // Unknown format
                        addMessageToChat(`Received response in unknown format: ${typeof result.output}`, false, true);
                    }
                } else {
                    // If no output field, show entire response
                    addMessageToChat(`Raw response: ${JSON.stringify(result)}`, false, true);
                }
            } else {
                // Hide typing animation on error
                hideTypingAnimation();
                console.error('Error sending message');
                addMessageToChat("Error: Failed to get response", false, true);
            }
        } catch (error) {
            // Hide typing animation on error
            hideTypingAnimation();
            console.error('Error sending message:', error);
            addMessageToChat("Error: Failed to connect to server", false, true);
        }
    };
    
    // Event listener for send button
    sendButton.addEventListener('click', () => {
        if (isImageSelectionActive) return;
        if (userMessage.value.trim()) {
            sendMessage(userMessage.value.trim());
        }
    });
    
    // Event listener for microphone button
    micButton.addEventListener('click', () => {
        if (isImageSelectionActive) return;
        
        // Пока просто показываем сообщение о том, что функция в разработке
        console.log('🎤 Microphone button clicked - functionality to be implemented');
        
        // Можно добавить визуальную индикацию клика
        micButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            micButton.style.transform = 'scale(1)';
        }, 150);
        
        // TODO: Здесь будет реализация голосового ввода
        // Например: startVoiceRecognition();
    });
    
    // Event listener for Enter key (removed - handled in textarea event listeners above)
    
    // Improved error handling
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
    });
    
    // Handle unhandled Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled Promise rejection:', event.reason);
    });
    
    // Icon button functionality
    document.querySelector('.new-project-icon').addEventListener('click', async (e) => {
        if (e.target.disabled || isImageSelectionActive) return;
        
        const translatedMessage = await translateToUserLanguage("let's create a project");
		sendMessage(translatedMessage);
    });
    
    // Hide greeting after first interaction
    const hideGreetingAfterFirstMessage = () => {
        const greeting = document.querySelector('.greeting');
        if (greeting && chatMessages.children.length > 0) {
            greeting.style.display = 'none';
        }
    };
    
    // Observe changes in message container
    const observer = new MutationObserver(hideGreetingAfterFirstMessage);
    observer.observe(chatMessages, { childList: true });
    
    // Function to check validity of base64 image string
    function isValidBase64Image(str) {
        if (!str) return false;
        // Check if string starts with data:image/
        return typeof str === 'string' && str.startsWith('data:image/');
    }

    // Глобальная переменная для хранения языка последнего сообщения пользователя
    let lastUserLanguage = "en"; // По умолчанию английский

    /**
     * Определяет язык пользователя из истории сообщений чата
     * @param {Array} messages - Массив сообщений чата
     */
    async function detectUserLanguageFromHistory(messages) {
        // Найти последнее сообщение пользователя для определения языка
        const userMessages = messages.filter(msg => msg.type === 'user' && msg.content && msg.content.trim().length > 10);
        
        if (userMessages.length > 0) {
            // Берем последнее сообщение пользователя
            const lastUserMessage = userMessages[userMessages.length - 1];
            
            try {
                console.log('🌐 Detecting language from chat history...');
                const detectedLang = await detectLanguage(lastUserMessage.content);
                if (detectedLang && detectedLang !== 'unknown') {
                    updateUserLanguage(detectedLang);
                    console.log(`✅ Language detected from history: ${lastUserLanguage}`);
                }
            } catch (error) {
                console.warn('⚠️ Could not detect language from history:', error);
            }
        }
    }

    /**
     * Обновляет язык пользователя на основе определенного языка из сообщения
     * @param {string} detectedLangString - Строка с языком в формате "код: название" 
     */
    function updateUserLanguage(detectedLangString) {
        try {
            // Извлекаем код языка из строки формата "ru: Russian"
            const langCode = detectedLangString.split(':')[0].trim().toLowerCase();
            if (langCode && langCode.length === 2) {
                lastUserLanguage = langCode;
                console.log(`Установлен язык пользователя: ${lastUserLanguage}`);
            }
        } catch (error) {
            console.error("Ошибка при обновлении языка пользователя:", error);
        }
    }

    /**
     * Переводит текст на язык последнего сообщения пользователя
     * @param {string} text - Текст для перевода
     * @returns {Promise<string>} - Переведенный текст
     */
    async function translateToUserLanguage(text) {
        // Проверка, что text - строка
        if (typeof text !== 'string' || !text || lastUserLanguage === "en" || lastUserLanguage === "unknown") {
            return Promise.resolve(text instanceof String ? text : String(text));
        }

        try {
            console.log(`Attempting translation to ${lastUserLanguage}: "${text}"`);
            // Отправляем запрос на перевод
            const response = await fetch("translate-text.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    text: text,
                    targetLang: lastUserLanguage 
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.translation) {
                console.log(`Text translated to ${lastUserLanguage}:`, 
                           (text.length > 20 ? text.substring(0, 20) + '...' : text), 
                           "→", 
                           (data.translation.length > 20 ? data.translation.substring(0, 20) + '...' : data.translation));
				data.translation = data.translation.replace(/^["']|["']$/g, '');
                return data.translation;
            } else {
                console.error("Translation error:", data.error || "Unknown error");
                return text; // Return original text on error
            }
        } catch (error) {
            console.error("Error during translation:", error);
            return text; // Return original text on error
        }
    }

    // Make translateToUserLanguage available globally for testing
    window.translateToUserLanguage = translateToUserLanguage;

    /**
     * Переводит текст на английский для унифицированной детекции
     * @param {string} text - Текст для перевода
     * @returns {Promise<string>} - Текст на английском
     */
    async function translateToEnglish(text) {
        if (typeof text !== 'string' || !text) {
            return text;
        }

        try {
            const response = await fetch("translate-text.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    text: text,
                    targetLang: "en"
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.translation) {
                const cleanTranslation = data.translation.replace(/^["']|["']$/g, '');
                return cleanTranslation;
            } else {
                return text; // Return original text on error
            }
        } catch (error) {
            console.error("Error during English translation:", error);
            return text; // Return original text on error
        }
    }

    /**
     * Многоязычные переводы для кнопок быстрых ответов
     */
    const quickResponseTranslations = {
        en: {
            village: "village",
            densecity: "dense city",
            suburb: "suburb", 
            seaside: "seaside",
            industrial: "industrial zone"
        },
        ru: {
            village: "деревня",
            densecity: "город плотная застройка", 
            suburb: "пригород",
            seaside: "на берегу моря",
            industrial: "промзона"
        },
        uk: {
            village: "село",
            densecity: "місто щільна забудова",
            suburb: "передмістя", 
            seaside: "на березі моря",
            industrial: "промзона"
        },
        de: {
            village: "Dorf",
            densecity: "dichte Stadt",
            suburb: "Vorort",
            seaside: "am Meer",
            industrial: "Industriegebiet"
        },
        fr: {
            village: "village",
            densecity: "ville dense",
            suburb: "banlieue",
            seaside: "au bord de mer", 
            industrial: "zone industrielle"
        },
        es: {
            village: "pueblo",
            densecity: "ciudad densa",
            suburb: "suburbio",
            seaside: "junto al mar",
            industrial: "zona industrial"
        }
    };

    /**
     * Получает переводы кнопок для текущего языка пользователя
     * @returns {Object} - Объект с переводами кнопок
     */
    function getQuickResponseButtonTranslations() {
        const userLang = lastUserLanguage && lastUserLanguage !== "unknown" ? lastUserLanguage : "en";
        return quickResponseTranslations[userLang] || quickResponseTranslations.en;
    }

    // Функции для сохранения расширенных типов сообщений
    const saveImageGalleryToChat = async (images, imageId) => {
        if (!isUserAuthenticated || !currentChatId) return false;
        
        const extraData = {
            images: images,
            image_id: imageId,
            gallery_type: 'selection',
            client_id: lastClientId  // Сохраняем для восстановления интерактивности
        };
        
        return await saveMessageToCurrentChat(
            'Image gallery generated', 
            false, 
            'image_gallery', 
            extraData
        );
    };
    
    const saveImageActionsToChat = async (actions) => {
        if (!isUserAuthenticated || !currentChatId) return false;
        
        const extraData = {
            actions: actions
        };
        
        return await saveMessageToCurrentChat(
            'Image actions available',
            false,
            'image_actions',
            extraData
        );
    };
    
    const saveSelectedImageToChat = async (imageUrl, index) => {
        if (!isUserAuthenticated || !currentChatId) return false;
        
        const extraData = {
            image_url: imageUrl,
            selected_index: index
        };
        
        return await saveMessageToCurrentChat(
            'Image selected',
            false,
            'selected_image',
            extraData
        );
    };
    
    const saveViewpointsToChat = async (viewpoints, originalPayload) => {
        if (!isUserAuthenticated || !currentChatId) return false;
        
        const extraData = {
            viewpoints: viewpoints,
            original_payload: originalPayload,
            gallery_type: 'viewpoints'
        };
        
        return await saveMessageToCurrentChat(
            'Viewpoint selection gallery',
            false,
            'viewpoint_gallery',
            extraData
        );
    };
    
    const saveFinalImageToChat = async (imageUrl, upscaleId, clientId) => {
        if (!isUserAuthenticated || !currentChatId) return false;
        
        const extraData = {
            image_url: imageUrl,
            upscale_id: upscaleId,
            client_id: clientId
        };
        
        return await saveMessageToCurrentChat(
            'Final high-resolution image',
            false,
            'final_image',
            extraData
        );
    };
    
    // Функция для восстановления сообщений из истории чата
    const renderMessageFromHistory = async (message) => {
        const messageType = message.message_type || 'text';
        
        switch (messageType) {
            case 'text':
                renderTextMessage(message);
                break;
            case 'image_gallery':
                renderImageGallery(message);
                break;
            case 'image_actions':
                renderImageActions(message);
                break;
            case 'selected_image':
                renderSelectedImage(message);
                break;
            case 'viewpoint_gallery':
                await renderViewpointGallery(message);
                break;
            case 'final_image':
                await renderFinalImage(message);
                break;
            default:
                renderTextMessage(message);
        }
    };
    
    const renderTextMessage = (message) => {
        const messageDiv = document.createElement('div');
        const isUser = message.type === 'user';
        
        // Tailwind CSS styling for text messages
        if (isUser) {
            messageDiv.className = 'flex justify-end mb-4';
            messageDiv.innerHTML = `
                <div class="max-w-xs lg:max-w-md px-4 py-2 bg-blue-500 text-white rounded-lg rounded-br-none shadow-md">
                    <p class="text-sm leading-relaxed">${message.content}</p>
                    <div class="text-xs opacity-75 mt-1">${message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            `;
        } else {
            messageDiv.className = 'flex justify-start mb-4';
            messageDiv.innerHTML = `
                <div class="max-w-lg lg:max-w-xl px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg rounded-bl-none shadow-md">
                    <p class="text-sm leading-relaxed">${message.content}</p>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            `;
        }
        appendToChat(messageDiv);
    };
    
    const renderImageGallery = (message) => {
        if (!message.extra_data || !message.extra_data.images) return;
        
        const images = message.extra_data.images;
        const imageId = message.extra_data.image_id;
        
        // Create container for image gallery with Tailwind CSS
        const galleryContainer = document.createElement('div');
        galleryContainer.className = 'flex justify-start mb-4';
        galleryContainer.style.marginBottom = '20px';
        
        const galleryContent = document.createElement('div');
        galleryContent.className = 'px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg rounded-bl-none shadow-md';
        galleryContent.style.maxWidth = '50%';
        
        const galleryGrid = document.createElement('div');
        galleryGrid.className = 'grid grid-cols-2 gap-3';
        
        // Add all images to gallery with Tailwind CSS
        images.forEach((imageUrl, index) => {
            const imageCard = document.createElement('div');
            imageCard.className = 'relative border border-gray-300 dark:border-gray-600 rounded-lg p-2 cursor-pointer transition-transform hover:scale-105';
            
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imgElement.alt = `AI image ${index + 1}`;
            imgElement.className = 'w-full h-auto rounded-md';
            
            // Image number with Tailwind
            const imageNumber = document.createElement('div');
            imageNumber.textContent = `${index + 1}`;
            imageNumber.className = 'absolute top-2 left-2 bg-black bg-opacity-60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium';
            
            imageCard.appendChild(imgElement);
            imageCard.appendChild(imageNumber);
            
            // Добавляем интерактивность даже в истории
            imageCard.addEventListener('mouseover', () => {
                imageCard.style.transform = 'scale(1.03)';
            });
            
            imageCard.addEventListener('mouseout', () => {
                imageCard.style.transform = 'scale(1)';
            });
            
            // Обработчик клика - восстанавливаем правильную интерактивность
            imageCard.addEventListener('click', () => {
                const galleryType = message.extra_data.gallery_type;
                const clientId = message.extra_data.client_id;
                
                if (galleryType === 'selection' && clientId) {
                    // Это галерея для выбора изображения - вызываем selectImage
                    selectImage(imageUrl, index, clientId);
                } else {
                    // Это обычная галерея - открываем в полном размере
                    openImageModal(imageUrl);
                }
            });
            
            galleryContainer.appendChild(imageCard);
        });
        
        appendToChat(galleryContainer);
    };
    
    // Функция для открытия изображения в модальном окне
    const openImageModal = (imageUrl) => {
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '10000';
        modal.style.cursor = 'pointer';
        
        const fullImg = document.createElement('img');
        fullImg.src = imageUrl;
        fullImg.style.maxWidth = '90%';
        fullImg.style.maxHeight = '90%';
        fullImg.style.borderRadius = '10px';
        
        modal.appendChild(fullImg);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    };
    
    const renderImageActions = (message) => {
        if (!message.extra_data || !message.extra_data.actions) return;
        
        const actionContainer = document.createElement('div');
        actionContainer.className = 'message bot-message image-actions';
        actionContainer.style.display = 'flex';
        actionContainer.style.justifyContent = 'center';
        actionContainer.style.gap = '10px';
        actionContainer.style.marginTop = '10px';
        
        message.extra_data.actions.forEach(action => {
            const button = document.createElement('button');
            button.textContent = action.label;
            button.className = `action-button ${action.type}`;
            button.style.padding = '8px 16px';
            button.style.backgroundColor = '#f0f0f0';
            button.style.border = '1px solid #ddd';
            button.style.borderRadius = '5px';
            button.style.cursor = 'pointer';
            button.style.opacity = '1';
            
            // Делаем кнопки кликабельными в истории
            if (action.type === 'regenerate') {
                button.addEventListener('click', async () => {
                    // Показываем информационное сообщение
                    const infoMsg = await translateToUserLanguage('This is a historical action. Use "NEW PROJECT" to create new images.');
                    addMessageToChat(infoMsg, false, true);
                });
            }
            
            actionContainer.appendChild(button);
        });
        
        appendToChat(actionContainer);
    };
    
    const renderSelectedImage = (message) => {
        if (!message.extra_data || !message.extra_data.image_url) return;
        
        const selectedImgContainer = document.createElement('div');
        selectedImgContainer.className = 'message bot-message selected-image';
        selectedImgContainer.style.textAlign = 'center';
        
        const selectedImg = document.createElement('img');
        selectedImg.src = message.extra_data.image_url;
        selectedImg.alt = "Selected image";
        selectedImg.style.maxWidth = "80%";
        selectedImg.style.borderRadius = "5px";
        selectedImg.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
        
        selectedImgContainer.appendChild(selectedImg);
        appendToChat(selectedImgContainer);
    };
    
    const renderViewpointGallery = async (message) => {
        if (!message.extra_data || !message.extra_data.viewpoints) return;
        
        const viewpoints = message.extra_data.viewpoints;
        const originalPayload = message.extra_data.original_payload;
        
        // Создаем контейнер для галереи ракурсов
        const galleryContainer = document.createElement('div');
        galleryContainer.className = 'message bot-message image-gallery viewpoint-gallery';
        galleryContainer.style.display = 'grid';
        galleryContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
        galleryContainer.style.gap = '10px';
        galleryContainer.style.maxWidth = '50%';
        
        // Добавляем все ракурсы в галерею с интерактивностью
        viewpoints.forEach((viewpoint, index) => {
            const imageCard = document.createElement('div');
            imageCard.style.position = 'relative';
            imageCard.style.border = '1px solid #ddd';
            imageCard.style.borderRadius = '5px';
            imageCard.style.padding = '5px';
            imageCard.style.cursor = 'pointer';
            imageCard.style.transition = 'transform 0.2s';
            
            const imgElement = document.createElement('img');
            imgElement.src = viewpoint.base64;
            imgElement.alt = `Ракурс ${index + 1}`;
            imgElement.style.maxWidth = "100%";
            imgElement.style.borderRadius = "5px";
            
            // Номер ракурса
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
            
            // Обработчик клика для выбора ракурса (восстанавливаем интерактивность)
            imageCard.addEventListener('click', () => {
                selectViewpoint(viewpoint, originalPayload);
            });
            
            galleryContainer.appendChild(imageCard);
        });
        
        appendToChat(galleryContainer);
    };
    
    const renderFinalImage = async (message) => {
        if (!message.extra_data || !message.extra_data.image_url) return;
        
        const imageUrl = message.extra_data.image_url;
        
        // Create container for high-quality image
        const highResContainer = document.createElement('div');
        highResContainer.className = 'message bot-message high-res-image';
        highResContainer.style.textAlign = 'center';
        highResContainer.style.marginTop = '20px';
        highResContainer.style.marginBottom = '20px';

        // Create image
        const imgElement = document.createElement('img');
        imgElement.src = imageUrl;
        imgElement.alt = "High-resolution image";
        imgElement.style.maxWidth = "70%";
        imgElement.style.borderRadius = "8px";
        imgElement.style.boxShadow = "0 6px 12px rgba(0,0,0,0.3)";
        
        // Add to container and chat
        highResContainer.appendChild(imgElement);
        appendToChat(highResContainer);
        
        // Create container for action buttons
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'message bot-message actions-container';
        actionsContainer.style.display = 'flex';
        actionsContainer.style.justifyContent = 'left';
        actionsContainer.style.gap = '10px';
        actionsContainer.style.marginTop = '10px';
        
        // Add download button - always functional with translated text
        const downloadButton = document.createElement('a');
        downloadButton.textContent = await translateToUserLanguage('Download Image');
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
        
        appendToChat(actionsContainer);
    };

    // Функции управления thread'ами для корректной работы ИИ
    const createNewThread = async () => {
        console.log('🔵 Creating new OpenAI thread...');
        try {
            const response = await fetch('thread_manager.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_thread' })
            });
            
            const data = await response.json();
            console.log('🔵 Create thread response:', data);
            
            if (data.success) {
                console.log('✅ New thread created:', data.thread_id);
                return data.thread_id;
            } else {
                console.error('❌ Failed to create thread:', data.message);
                return null;
            }
        } catch (error) {
            console.error('❌ Error creating thread:', error);
            return null;
        }
    };
    
    const resetSessionThread = async () => {
        console.log('🔵 Resetting session thread...');
        try {
            const response = await fetch('thread_manager.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset_session_thread' })
            });
            
            const data = await response.json();
            console.log('🔵 Reset thread response:', data);
            return data.success;
        } catch (error) {
            console.error('❌ Error resetting thread:', error);
            return false;
        }
    };
    
    const setSessionThread = async (threadId) => {
        console.log('🔵 Setting session thread to:', threadId);
        try {
            const response = await fetch('thread_manager.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'set_session_thread',
                    thread_id: threadId 
                })
            });
            
            const data = await response.json();
            console.log('🔵 Set thread response:', data);
            return data.success;
        } catch (error) {
            console.error('❌ Error setting thread:', error);
            return false;
        }
    };
    
    const updateChatThreadId = async (chatId, threadId) => {
        console.log('🔵 Updating chat thread ID:', chatId, threadId);
        try {
            const response = await fetch('chat_manager.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_thread_id',
                    chat_id: chatId,
                    thread_id: threadId
                })
            });
            
            const data = await response.json();
            console.log('🔵 Update chat thread response:', data);
            return data.success;
        } catch (error) {
            console.error('❌ Error updating chat thread:', error);
            return false;
        }
    };
    
    const getChatThreadId = async (chatId) => {
        console.log('🔵 Getting chat thread ID for:', chatId);
        try {
            const response = await fetch('chat_manager.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_thread_id',
                    chat_id: chatId
                })
            });
            
            const data = await response.json();
            console.log('🔵 Get chat thread response:', data);
            
            if (data.success) {
                return data.thread_id;
            }
            return null;
        } catch (error) {
            console.error('❌ Error getting chat thread:', error);
            return null;
        }
    };
    
    const restoreThreadHistory = async (threadId, messages) => {
        console.log('🔵 Restoring thread history:', threadId, messages.length, 'messages');
        
        // Calculate approximate payload size
        const payload = {
            action: 'restore_thread_history',
            thread_id: threadId,
            messages: messages
        };
        const payloadSize = JSON.stringify(payload).length;
        console.log('🔵 Payload size:', (payloadSize / 1024 / 1024).toFixed(2), 'MB');
        
        // If payload is too large (>7MB to be safe), skip thread restoration
        if (payloadSize > 7 * 1024 * 1024) {
            console.warn('⚠️ Payload too large for thread restoration, skipping to prevent server errors');
            return true; // Return success to not break the flow
        }
        
        try {
            const response = await fetch('thread_manager.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            // Get response text first for better error debugging
            const responseText = await response.text();
            console.log('🔵 Raw response:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ JSON parsing error:', parseError);
                console.error('❌ Raw response text:', responseText);
                throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`);
            }
            
            console.log('🔵 Restore thread history response:', data);
            
            if (data.success) {
                console.log(`✅ Restored ${data.restored_count} messages to thread`);
                return true;
            } else {
                console.warn('⚠️ Failed to restore thread history:', data.message);
                return false;
            }
        } catch (error) {
            console.error('❌ Error restoring thread history:', error);
            return false;
        }
    };

    // Function to update active chat button state
    const updateActiveChatButton = (activeChatId) => {
        const allChatItems = document.querySelectorAll('.chat-item');
        allChatItems.forEach(item => {
            item.classList.remove('active', 'bg-gray-100', 'dark:bg-gray-700');
            
            // Check if this item corresponds to the active chat using data attribute
            if (item.getAttribute('data-chat-id') === activeChatId) {
                item.classList.add('active', 'bg-gray-100', 'dark:bg-gray-700');
            }
        });
    };

    // ===== ТЕСТОВАЯ ФУНКЦИЯ ДЛЯ ОТЛАДКИ ПРОКРУТКИ =====
    window.testScrollToBottom = function() {
        console.log('🧪 === MANUAL SCROLL TEST ===');
        
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) {
            console.error('❌ chatMessages not found');
            return;
        }
        
        console.log('📦 chatMessages element:', chatMessages);
        console.log('📏 chatMessages scrollHeight:', chatMessages.scrollHeight);
        console.log('📏 chatMessages clientHeight:', chatMessages.clientHeight);
        console.log('📍 chatMessages scrollTop BEFORE:', chatMessages.scrollTop);
        
        // Добавим тестовое сообщение если нужно
        const hasMessages = chatMessages.querySelector('.max-w-800').children.length > 0;
        if (!hasMessages) {
            console.log('💬 Adding test message...');
            const testMessage = document.createElement('div');
            testMessage.className = 'flex justify-end mb-4';
            testMessage.innerHTML = `
                <div class="max-w-xs lg:max-w-md px-4 py-2 bg-blue-500 text-white rounded-lg rounded-br-none shadow-md">
                    <p class="text-sm leading-relaxed">Test message for scroll testing</p>
                    <div class="text-xs opacity-75 mt-1">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            `;
            
            const targetContainer = chatMessages.querySelector('.max-w-800') || chatMessages;
            targetContainer.appendChild(testMessage);
            
            // Добавим еще несколько сообщений для создания прокрутки
            for (let i = 1; i <= 5; i++) {
                const msg = testMessage.cloneNode(true);
                msg.querySelector('p').textContent = `Test message ${i + 1}`;
                targetContainer.appendChild(msg);
            }
        }
        
        // Теперь попробуем прокрутить
        setTimeout(() => {
            console.log('📦 After adding messages:');
            console.log('📏 chatMessages scrollHeight:', chatMessages.scrollHeight);
            console.log('📏 chatMessages clientHeight:', chatMessages.clientHeight);
            console.log('📍 chatMessages scrollTop BEFORE scroll:', chatMessages.scrollTop);
            
            // Прокрутить основной контейнер с улучшенным методом
            scrollToBottom();
            console.log('📍 Enhanced scroll applied via scrollToBottom()');
            
            // Проверить родительские контейнеры
            const parent = chatMessages.parentElement;
            if (parent) {
                console.log('👆 parent element:', parent.tagName, parent.className);
                console.log('📏 parent scrollHeight:', parent.scrollHeight);
                console.log('📏 parent clientHeight:', parent.clientHeight);
                console.log('📍 parent scrollTop BEFORE:', parent.scrollTop);
                
                parent.scrollTop = parent.scrollHeight;
                console.log('📍 parent scrollTop AFTER:', parent.scrollTop);
                
                const grandParent = parent.parentElement;
                if (grandParent) {
                    console.log('👴 grandparent element:', grandParent.tagName, grandParent.className);
                    console.log('📏 grandparent scrollHeight:', grandParent.scrollHeight);
                    console.log('📏 grandparent clientHeight:', grandParent.clientHeight);
                    console.log('📍 grandparent scrollTop BEFORE:', grandParent.scrollTop);
                    
                    grandParent.scrollTop = grandParent.scrollHeight;
                    console.log('📍 grandparent scrollTop AFTER:', grandParent.scrollTop);
                }
            }
            
            console.log('🏁 Manual scroll test completed');
        }, 100);
    };
    

});
