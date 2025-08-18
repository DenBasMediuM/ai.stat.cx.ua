document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const authButton = document.getElementById('authButton');
    const authModal = document.getElementById('authModal');
    const overlay = document.getElementById('overlay');
    const closeModalBtn = document.querySelector('.close-modal');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Check if user is logged in
    const isLoggedIn = authButton.querySelector('i').classList.contains('fa-sign-out-alt');
    
    // Show/hide authentication modal
    function toggleAuthModal() {
        if (isLoggedIn) {
            // If user is already authenticated - logout
            window.location.href = 'auth_process.php?action=logout';
        } else {
            // Otherwise show modal
            authModal.style.display = 'block';
            overlay.style.display = 'block';
        }
    }
    
    // Close modal
    function closeAuthModal() {
        authModal.style.display = 'none';
        overlay.style.display = 'none';
    }
    
    // Switch between login and registration forms
    function switchAuthForm(tab) {
        const formType = tab.getAttribute('data-tab');
        
        // Activate selected tab
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show corresponding form
        if (formType === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    }
    
    // Handle login form submission
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
            console.log('Server response:', data);
            
            if (data.success) {
                // On successful login, show message
                errorEl.textContent = 'Login successful! Redirecting...';
                errorEl.style.color = 'green';
                
                // Force page reload with parameter to bypass cache
                setTimeout(() => {
                    window.location.href = window.location.pathname + '?t=' + new Date().getTime();
                }, 1000);
            } else {
                // Show error
                errorEl.textContent = data.message || 'Authentication error';
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            errorEl.textContent = 'Error submitting form';
        }
    }
    
    // Handle registration form submission
    async function handleRegisterSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const errorEl = document.getElementById('registerError');
        
        // Check password match
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');
        
        if (password !== confirmPassword) {
            errorEl.textContent = 'Passwords do not match';
            return;
        }
        
        try {
            const response = await fetch('auth_process.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Successful registration - switch to login form
                authTabs.forEach(tab => {
                    if (tab.getAttribute('data-tab') === 'login') {
                        switchAuthForm(tab);
                    }
                });
                errorEl.textContent = '';
                document.getElementById('loginError').textContent = 'Registration successful! You can now log in.';
            } else {
                // Show error
                errorEl.textContent = data.error || 'Registration error';
            }
        } catch (error) {
            errorEl.textContent = 'Error submitting form';
        }
    }
    
    // Assign event handlers
    authButton.addEventListener('click', toggleAuthModal);
    closeModalBtn.addEventListener('click', closeAuthModal);
    overlay.addEventListener('click', closeAuthModal);
    
    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => switchAuthForm(tab));
    });
    
    // Form submission handling
    document.querySelector('#loginForm form').addEventListener('submit', handleLoginSubmit);
    document.querySelector('#registerForm form').addEventListener('submit', handleRegisterSubmit);
});
