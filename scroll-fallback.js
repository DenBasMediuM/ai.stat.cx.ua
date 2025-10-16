// Fallback scroll function - простой и надежный подход
window.scrollToBottomFallback = () => {
    console.log('🔄 Using fallback scroll method...');
    
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) {
        console.warn('❌ chatMessages not found for fallback scroll');
        return;
    }
    
    // Найти все сообщения в чате
    const messages = chatMessages.querySelectorAll('.message, .flex.justify-start, .flex.justify-end');
    console.log('📨 Found messages:', messages.length);
    
    if (messages.length > 0) {
        // Прокрутить к последнему сообщению
        const lastMessage = messages[messages.length - 1];
        console.log('📍 Scrolling to last message:', lastMessage);
        
        // Попробовать scrollIntoView
        lastMessage.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest'
        });
        
        // Альтернативный метод - прокрутка окна к элементу
        setTimeout(() => {
            const rect = lastMessage.getBoundingClientRect();
            const absoluteElementTop = rect.top + window.pageYOffset;
            window.scrollTo({
                top: absoluteElementTop - window.innerHeight + lastMessage.offsetHeight + 100,
                behavior: 'smooth'
            });
            console.log('✅ Fallback scroll completed');
        }, 100);
    } else {
        console.warn('⚠️ No messages found for scrolling');
    }
};

// Замените основную функцию на fallback для тестирования
window.testFallbackScroll = () => {
    console.log('🧪 Testing fallback scroll...');
    
    // Добавить несколько сообщений
    for (let i = 1; i <= 3; i++) {
        setTimeout(() => {
            addMessageToChat(`Fallback test message ${i} - This tests the alternative scroll method using scrollIntoView.`, i % 2 === 0);
            
            // Использовать fallback scroll вместо обычного
            setTimeout(() => {
                scrollToBottomFallback();
            }, 100);
        }, i * 1500);
    }
};
