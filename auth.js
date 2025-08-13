document.addEventListener('DOMContentLoaded', () => {
    // Получаем элементы DOM
    const authButton = document.getElementById('authButton');
    const authModal = document.getElementById('authModal');
    const overlay = document.getElementById('overlay');
    const closeModalBtn = document.querySelector('.close-modal');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Проверяем, авторизован ли пользователь
    const isLoggedIn = authButton.querySelector('i').classList.contains('fa-sign-out-alt');
    
    // Показ/скрытие модального окна авторизации
    function toggleAuthModal() {
        if (isLoggedIn) {
            // Если пользователь уже авторизован - делаем логаут
            window.location.href = 'auth_process.php?action=logout';
        } else {
            // Иначе показываем модальное окно
            authModal.style.display = 'block';
            overlay.style.display = 'block';
        }
    }
    
    // Закрытие модального окна
    function closeAuthModal() {
        authModal.style.display = 'none';
        overlay.style.display = 'none';
    }
    
    // Переключение между формами входа и регистрации
    function switchAuthForm(tab) {
        const formType = tab.getAttribute('data-tab');
        
        // Активируем выбранную вкладку
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Показываем соответствующую форму
        if (formType === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    }
    
    // Обработчик отправки формы входа
    async function handleLoginSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const errorEl = document.getElementById('loginError');
        
        try {
            const response = await fetch('auth_process.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Успешная авторизация - перезагружаем страницу
                window.location.reload();
            } else {
                // Показываем ошибку
                errorEl.textContent = data.error || 'Ошибка авторизации';
            }
        } catch (error) {
            errorEl.textContent = 'Ошибка при отправке формы';
        }
    }
    
    // Обработчик отправки формы регистрации
    async function handleRegisterSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const errorEl = document.getElementById('registerError');
        
        // Проверка совпадения паролей
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');
        
        if (password !== confirmPassword) {
            errorEl.textContent = 'Пароли не совпадают';
            return;
        }
        
        try {
            const response = await fetch('auth_process.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Успешная регистрация - переключаемся на форму входа
                authTabs.forEach(tab => {
                    if (tab.getAttribute('data-tab') === 'login') {
                        switchAuthForm(tab);
                    }
                });
                errorEl.textContent = '';
                document.getElementById('loginError').textContent = 'Регистрация успешна! Теперь вы можете войти.';
            } else {
                // Показываем ошибку
                errorEl.textContent = data.error || 'Ошибка регистрации';
            }
        } catch (error) {
            errorEl.textContent = 'Ошибка при отправке формы';
        }
    }
    
    // Назначаем обработчики событий
    authButton.addEventListener('click', toggleAuthModal);
    closeModalBtn.addEventListener('click', closeAuthModal);
    overlay.addEventListener('click', closeAuthModal);
    
    // Переключение вкладок
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => switchAuthForm(tab));
    });
    
    // Обработка отправки форм
    document.querySelector('#loginForm form').addEventListener('submit', handleLoginSubmit);
    document.querySelector('#registerForm form').addEventListener('submit', handleRegisterSubmit);
});
