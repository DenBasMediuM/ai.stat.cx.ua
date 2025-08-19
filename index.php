<?php
// Начинаем сессию
session_start();

// Улучшенная проверка авторизации
$is_logged_in = isset($_SESSION['user_id']) && isset($_SESSION['username']) && !empty($_SESSION['username']);
$username = $is_logged_in ? $_SESSION['username'] : 'user';

// Отладочная информация
error_log("Session check: is_logged_in=" . ($is_logged_in ? 'true' : 'false') . ", username=" . $username);
error_log("Session data: " . print_r($_SESSION, true));
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Assistant</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <!-- Authentication button in top right corner -->
    <div class="auth-container">
        <?php if ($is_logged_in): ?>
            <button id="authButton" class="auth-btn">
                <span><?php echo htmlspecialchars($username); ?></span>
                <i class="fas fa-sign-out-alt"></i>
            </button>
        <?php else: ?>
            <button id="authButton" class="auth-btn">
                <i class="fas fa-user"></i>
                <span>Login</span>
            </button>
        <?php endif; ?>
    </div>

    <div class="chat-container">
        <div class="logo">
            <img src="logo.svg" alt="Logo">
        </div>
        
        <div class="greeting">
			<?php if ($is_logged_in): ?>
				<h2>Good afternoon, <?php echo htmlspecialchars($username); ?></h2>
			<?php else: ?>
            	<h2>Good afternoon</h2>
			<?php endif; ?>
            <div style="margin: 0 50px">Hey there! Welcome to our project wizard. I’m here to guide you step by step to create your dream project. Just answer a few simple questions about your project and I’ll help you put it all together smoothly. Ready to get started? Let’s make your vision a reality!</div>
        </div>
        
        <!-- Добавляем контейнер для сообщений -->
        <div class="chat-messages" id="chatMessages">
            <!-- Здесь будут отображаться сообщения -->
        </div>
        
        <div class="message-input">
            <textarea id="userMessage" placeholder="Type a message..."></textarea>
            
            <div class="button-container">
                <button id="sendButton" class="send-button">
                    <i class="fas fa-paper-plane"></i>
                </button>
                
                <div class="action-buttons">
                    <button class="project-button my-projects">
                        <i class="fas fa-folder"></i>
                        MY PROJECTS
                    </button>
                    <button class="project-button new-project">
                        <i class="fas fa-plus"></i>
                        NEW PROJECT
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Darkening background for modal -->
    <div id="overlay" class="overlay"></div>
    
    <!-- Authentication modal window -->
    <div id="authModal" class="auth-modal">
        <div class="auth-modal-content">
            <button class="close-modal"><i class="fas fa-times"></i></button>
            
            <!-- Tab switcher -->
            <div class="auth-tabs">
                <button class="auth-tab active" data-tab="login">Login</button>
                <button class="auth-tab" data-tab="register">Register</button>
            </div>
            
            <!-- Login form -->
            <div class="auth-form-container" id="loginForm">
                <form action="auth_process.php" method="post" class="auth-form">
                    <input type="hidden" name="action" value="login">
                    
                    <div class="form-group">
                        <label for="login_username">Username</label>
                        <input type="text" id="login_username" name="username" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="login_password">Password</label>
                        <input type="password" id="login_password" name="password" required>
                    </div>
                    
                    <div class="form-error" id="loginError"></div>
                    
                    <button type="submit" class="auth-submit-btn">Login</button>
                </form>
            </div>
            
            <!-- Registration form -->
            <div class="auth-form-container" id="registerForm" style="display: none;">
                <form action="auth_process.php" method="post" class="auth-form">
                    <input type="hidden" name="action" value="register">
                    
                    <div class="form-group">
                        <label for="register_username">Username</label>
                        <input type="text" id="register_username" name="username" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="register_password">Password</label>
                        <input type="password" id="register_password" name="password" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="confirm_password">Confirm Password</label>
                        <input type="password" id="confirm_password" name="confirm_password" required>
                    </div>
                    
                    <div class="form-error" id="registerError"></div>
                    
                    <button type="submit" class="auth-submit-btn">Register</button>
                </form>
            </div>
        </div>
    </div>
    
    <script src="debug.js"></script>
    <script src="script.js"></script>
    <script src="auth.js"></script>
</body>
</html>
