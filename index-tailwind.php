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
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Font Awesome для иконок -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Настройка Tailwind для темной темы и кастомных стилей -->
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        'chat-bg': '#f6f8fa',
                        'chat-border': '#d0d7de',
                        'user-bg': '#e1ece6',
                        'user-border': '#9ebdab',
                        'bot-bg': '#f6f8fa',
                        'bot-border': '#d0d7de',
                        'sidebar-bg': '#f6f8fa',
                        'quick-btn': '#f8fafc',
                        'dark-primary': '#161b22',
                        'dark-secondary': '#21262d',
                        'dark-border': '#30363d',
                        'dark-accent': '#404040'
                    },
                    width: {
                        'sidebar': '260px',
                        'sidebar-collapsed': '60px'
                    },
                    animation: {
                        'slide-down': 'slideDown 0.3s ease-out',
                        'slide-up': 'slideUp 0.2s ease-out forwards',
                        'fade-in': 'fadeIn 0.2s ease-in',
                        'fade-out': 'fadeOut 0.2s ease-out',
                        'typing-dot': 'typingDot 1.4s infinite'
                    },
                    keyframes: {
                        slideDown: {
                            '0%': { opacity: '0', transform: 'translateY(-8px)' },
                            '100%': { opacity: '1', transform: 'translateY(0)' }
                        },
                        slideUp: {
                            '0%': { opacity: '1', transform: 'translateY(0)' },
                            '100%': { opacity: '0', transform: 'translateY(-8px)' }
                        },
                        fadeIn: {
                            '0%': { opacity: '0', transform: 'scale(0.8)' },
                            '100%': { opacity: '1', transform: 'scale(1)' }
                        },
                        fadeOut: {
                            '0%': { opacity: '1', transform: 'scale(1)' },
                            '100%': { opacity: '0', transform: 'scale(0.8)' }
                        },
                        typingDot: {
                            '0%': { transform: 'translateY(0px)', opacity: '0.2' },
                            '25%': { transform: 'translateY(-5px)', opacity: '0.9' },
                            '50%': { transform: 'translateY(0px)', opacity: '0.2' },
                            '100%': { opacity: '0.2' }
                        }
                    }
                }
            }
        }
    </script>
    <style>
        /* Дополнительные кастомные стили */
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        /* Скроллбары */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
            background-color: #4a4a4a; 
            border-radius: 3px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #5a5a5a; }
        
        /* Анимация для placeholder */
        textarea::placeholder { color: #8e8ea0; opacity: 1; }
        textarea:focus::placeholder { color: #a0a0a0; opacity: 0.8; }
    </style>
</head>
<body class="font-sans leading-relaxed">
    <?php if (!$is_logged_in): ?>
    <!-- Authentication button в правом верхнем углу (только для незалогиненых пользователей) -->
    <div class="fixed top-4 right-4 z-50">
        <button id="authButton" class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
            <i class="fas fa-user text-gray-600"></i>
            <span class="text-gray-700">Login</span>
        </button>
    </div>
    <?php endif; ?>

    <?php if ($is_logged_in): ?>
    <!-- Sidebar для залогиненых пользователей -->
    <div class="sidebar fixed top-0 left-0 w-sidebar h-screen bg-sidebar-bg border-r border-chat-border flex flex-col z-50 transition-transform duration-300 dark:bg-dark-primary dark:border-dark-accent" id="sidebar">
        <!-- Sidebar Header -->
        <div class="flex items-center gap-3 p-4 border-b border-chat-border dark:border-dark-accent">
            <button class="sidebar-toggle p-2 rounded-md hover:bg-gray-200 dark:hover:bg-dark-secondary transition-colors w-8 h-8 flex items-center justify-center" id="sidebarToggle">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" class="text-gray-600 dark:text-gray-300">
                    <path d="M6.83496 3.99992C6.38353 4.00411 6.01421 4.0122 5.69824 4.03801C5.31232 4.06954 5.03904 4.12266 4.82227 4.20012L4.62207 4.28606C4.18264 4.50996 3.81498 4.85035 3.55859 5.26848L3.45605 5.45207C3.33013 5.69922 3.25006 6.01354 3.20801 6.52824C3.16533 7.05065 3.16504 7.71885 3.16504 8.66301V11.3271C3.16504 12.2712 3.16533 12.9394 3.20801 13.4618C3.25006 13.9766 3.33013 14.2909 3.45605 14.538L3.55859 14.7216C3.81498 15.1397 4.18266 15.4801 4.62207 15.704L4.82227 15.79C5.03904 15.8674 5.31234 15.9205 5.69824 15.9521C6.01398 15.9779 6.383 15.986 6.83398 15.9902L6.83496 3.99992ZM18.165 11.3271C18.165 12.2493 18.1653 12.9811 18.1172 13.5702C18.0745 14.0924 17.9916 14.5472 17.8125 14.9648L17.7295 15.1415C17.394 15.8 16.8834 16.3511 16.2568 16.7353L15.9814 16.8896C15.5157 17.1268 15.0069 17.2285 14.4102 17.2773C13.821 17.3254 13.0893 17.3251 12.167 17.3251H7.83301C6.91071 17.3251 6.17898 17.3254 5.58984 17.2773C5.06757 17.2346 4.61294 17.1508 4.19531 16.9716L4.01855 16.8896C3.36014 16.5541 2.80898 16.0434 2.4248 15.4169L2.27051 15.1415C2.03328 14.6758 1.93158 14.167 1.88281 13.5702C1.83468 12.9811 1.83496 12.2493 1.83496 11.3271V8.66301C1.83496 7.74072 1.83468 7.00898 1.88281 6.41985C1.93157 5.82309 2.03329 5.31432 2.27051 4.84856L2.4248 4.57317C2.80898 3.94666 3.36012 3.436 4.01855 3.10051L4.19531 3.0175C4.61285 2.83843 5.06771 2.75548 5.58984 2.71281C6.17898 2.66468 6.91071 2.66496 7.83301 2.66496H12.167C13.0893 2.66496 13.821 2.66468 14.4102 2.71281C15.0069 2.76157 15.5157 2.86329 15.9814 3.10051L16.2568 3.25481C16.8833 3.63898 17.394 4.19012 17.7295 4.84856L17.8125 5.02531C17.9916 5.44285 18.0745 5.89771 18.1172 6.41985C18.1653 7.00898 18.165 7.74072 18.165 8.66301V11.3271ZM8.16406 15.995H12.167C13.1112 15.995 13.7794 15.9947 14.3018 15.9521C14.8164 15.91 15.1308 15.8299 15.3779 15.704L15.5615 15.6015C15.9797 15.3451 16.32 14.9774 16.5439 14.538L16.6299 14.3378C16.7074 14.121 16.7605 13.8478 16.792 13.4618C16.8347 12.9394 16.835 12.2712 16.835 11.3271V8.66301C16.835 7.71885 16.8347 7.05065 16.792 6.52824C16.7605 6.14232 16.7073 5.86904 16.6299 5.65227L16.5439 5.45207C16.32 5.01264 15.9796 4.64498 15.5615 4.3886L15.3779 4.28606C15.1308 4.16013 14.8165 4.08006 14.3018 4.03801C13.7794 3.99533 13.1112 3.99504 12.167 3.99504H8.16406C8.16407 3.99667 8.16504 3.99829 8.16504 3.99992L8.16406 15.995Z"></path>
                </svg>
            </button>
            <span class="font-semibold text-sm text-gray-700 dark:text-gray-200">AI Wizard</span>
        </div>
        
        <!-- Sidebar Content -->
        <div class="flex-1 p-2 overflow-y-auto custom-scrollbar">
            <!-- New Chat Button -->
            <button class="new-chat-btn w-full bg-transparent border border-sidebar-bg rounded-lg p-3 hover:bg-gray-200 dark:hover:bg-dark-secondary transition-colors mb-4 flex items-center gap-2 text-sm dark:border-dark-accent dark:text-gray-200" id="newChatBtn">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.6687 11.333V8.66699C2.6687 7.74455 2.66841 7.01205 2.71655 6.42285C2.76533 5.82612 2.86699 5.31731 3.10425 4.85156L3.25854 4.57617C3.64272 3.94975 4.19392 3.43995 4.85229 3.10449L5.02905 3.02149C5.44666 2.84233 5.90133 2.75849 6.42358 2.71582C7.01272 2.66769 7.74445 2.66797 8.66675 2.66797H9.16675C9.53393 2.66797 9.83165 2.96586 9.83179 3.33301C9.83179 3.70028 9.53402 3.99805 9.16675 3.99805H8.66675C7.7226 3.99805 7.05438 3.99834 6.53198 4.04102C6.14611 4.07254 5.87277 4.12568 5.65601 4.20313L5.45581 4.28906C5.01645 4.51293 4.64872 4.85345 4.39233 5.27149L4.28979 5.45508C4.16388 5.7022 4.08381 6.01663 4.04175 6.53125C3.99906 7.05373 3.99878 7.7226 3.99878 8.66699V11.333C3.99878 12.2774 3.99906 12.9463 4.04175 13.4688C4.08381 13.9833 4.16389 14.2978 4.28979 14.5449L4.39233 14.7285C4.64871 15.1465 5.01648 15.4871 5.45581 15.7109L5.65601 15.7969C5.87276 15.8743 6.14614 15.9265 6.53198 15.958C7.05439 16.0007 7.72256 16.002 8.66675 16.002H11.3337C12.2779 16.002 12.9461 16.0007 13.4685 15.958C13.9829 15.916 14.2976 15.8367 14.5447 15.7109L14.7292 15.6074C15.147 15.3511 15.4879 14.9841 15.7117 14.5449L15.7976 14.3447C15.8751 14.128 15.9272 13.8546 15.9587 13.4688C16.0014 12.9463 16.0017 12.2774 16.0017 11.333V10.833C16.0018 10.466 16.2997 10.1681 16.6667 10.168C17.0339 10.168 17.3316 10.4659 17.3318 10.833V11.333C17.3318 12.2555 17.3331 12.9879 17.2849 13.5771C17.2422 14.0993 17.1584 14.5541 16.9792 14.9717L16.8962 15.1484C16.5609 15.8066 16.0507 16.3571 15.4246 16.7412L15.1492 16.8955C14.6833 17.1329 14.1739 17.2354 13.5769 17.2842C12.9878 17.3323 12.256 17.332 11.3337 17.332H8.66675C7.74446 17.332 7.01271 17.3323 6.42358 17.2842C5.90135 17.2415 5.44665 17.1577 5.02905 16.9785L4.85229 16.8955C4.19396 16.5601 3.64271 16.0502 3.25854 15.4238L3.10425 15.1484C2.86697 14.6827 2.76534 14.1739 2.71655 13.5771C2.66841 12.9879 2.6687 12.2555 2.6687 11.333ZM13.4646 3.11328C14.4201 2.334 15.8288 2.38969 16.7195 3.28027L16.8865 3.46485C17.6141 4.35685 17.6143 5.64423 16.8865 6.53613L16.7195 6.7207L11.6726 11.7686C11.1373 12.3039 10.4624 12.6746 9.72827 12.8408L9.41089 12.8994L7.59351 13.1582C7.38637 13.1877 7.17701 13.1187 7.02905 12.9707C6.88112 12.8227 6.81199 12.6134 6.84155 12.4063L7.10132 10.5898L7.15991 10.2715C7.3262 9.53749 7.69692 8.86241 8.23218 8.32715L13.2791 3.28027L13.4646 3.11328ZM15.7791 4.2207C15.3753 3.81702 14.7366 3.79124 14.3035 4.14453L14.2195 4.2207L9.17261 9.26856C8.81541 9.62578 8.56774 10.0756 8.45679 10.5654L8.41772 10.7773L8.28296 11.7158L9.22241 11.582L9.43433 11.543C9.92426 11.432 10.3749 11.1844 10.7322 10.8271L15.7791 5.78027L15.8552 5.69629C16.185 5.29194 16.1852 4.708 15.8552 4.30371L15.7791 4.2207Z"></path>
                </svg>
                New Chat
            </button>
            
            <!-- Chats Section -->
            <div class="mt-4">
                <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 pb-2 mb-2 border-b border-chat-border dark:border-dark-accent">Chats</h3>
                <div class="chats-list flex flex-col gap-1" id="chatsList">
                    <!-- Chat items will be loaded here -->
                </div>
            </div>
        </div>
        
        <!-- Sidebar Footer -->
        <div class="p-4 border-t border-chat-border dark:border-dark-accent">
            <button id="authButton" class="w-full flex items-center justify-between bg-transparent border border-sidebar-bg rounded-lg p-3 hover:bg-gray-200 dark:hover:bg-dark-secondary transition-colors dark:border-dark-accent dark:text-gray-200">
                <span><?php echo htmlspecialchars($username); ?></span>
                <i class="fas fa-sign-out-alt text-gray-600 dark:text-gray-400"></i>
            </button>
        </div>
    </div>
    
    <!-- Collapsed Sidebar (тонкая панель) -->
    <div class="fixed top-0 left-0 w-sidebar-collapsed h-screen border-r border-chat-border bg-sidebar-bg dark:bg-dark-primary dark:border-dark-accent flex flex-col items-center p-4 gap-3 z-50 transition-transform duration-300 hidden" id="sidebarCollapsedBar">
        <button class="p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-secondary transition-colors w-11 h-11 flex items-center justify-center" id="sidebarToggleCollapsed">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" class="text-gray-600 dark:text-gray-300">
                <path d="M6.83496 3.99992C6.38353 4.00411 6.01421 4.0122 5.69824 4.03801C5.31232 4.06954 5.03904 4.12266 4.82227 4.20012L4.62207 4.28606C4.18264 4.50996 3.81498 4.85035 3.55859 5.26848L3.45605 5.45207C3.33013 5.69922 3.25006 6.01354 3.20801 6.52824C3.16533 7.05065 3.16504 7.71885 3.16504 8.66301V11.3271C3.16504 12.2712 3.16533 12.9394 3.20801 13.4618C3.25006 13.9766 3.33013 14.2909 3.45605 14.538L3.55859 14.7216C3.81498 15.1397 4.18266 15.4801 4.62207 15.704L4.82227 15.79C5.03904 15.8674 5.31234 15.9205 5.69824 15.9521C6.01398 15.9779 6.383 15.986 6.83398 15.9902L6.83496 3.99992ZM18.165 11.3271C18.165 12.2493 18.1653 12.9811 18.1172 13.5702C18.0745 14.0924 17.9916 14.5472 17.8125 14.9648L17.7295 15.1415C17.394 15.8 16.8834 16.3511 16.2568 16.7353L15.9814 16.8896C15.5157 17.1268 15.0069 17.2285 14.4102 17.2773C13.821 17.3254 13.0893 17.3251 12.167 17.3251H7.83301C6.91071 17.3251 6.17898 17.3254 5.58984 17.2773C5.06757 17.2346 4.61294 17.1508 4.19531 16.9716L4.01855 16.8896C3.36014 16.5541 2.80898 16.0434 2.4248 15.4169L2.27051 15.1415C2.03328 14.6758 1.93158 14.167 1.88281 13.5702C1.83468 12.9811 1.83496 12.2493 1.83496 11.3271V8.66301C1.83496 7.74072 1.83468 7.00898 1.88281 6.41985C1.93157 5.82309 2.03329 5.31432 2.27051 4.84856L2.4248 4.57317C2.80898 3.94666 3.36012 3.436 4.01855 3.10051L4.19531 3.0175C4.61285 2.83843 5.06771 2.75548 5.58984 2.71281C6.17898 2.66468 6.91071 2.66496 7.83301 2.66496H12.167C13.0893 2.66496 13.821 2.66468 14.4102 2.71281C15.0069 2.76157 15.5157 2.86329 15.9814 3.10051L16.2568 3.25481C16.8833 3.63898 17.394 4.19012 17.7295 4.84856L17.8125 5.02531C17.9916 5.44285 18.0745 5.89771 18.1172 6.41985C18.1653 7.00898 18.165 7.74072 18.165 8.66301V11.3271ZM8.16406 15.995H12.167C13.1112 15.995 13.7794 15.9947 14.3018 15.9521C14.8164 15.91 15.1308 15.8299 15.3779 15.704L15.5615 15.6015C15.9797 15.3451 16.32 14.9774 16.5439 14.538L16.6299 14.3378C16.7074 14.121 16.7605 13.8478 16.792 13.4618C16.8347 12.9394 16.835 12.2712 16.835 11.3271V8.66301C16.835 7.71885 16.8347 7.05065 16.792 6.52824C16.7605 6.14232 16.7073 5.86904 16.6299 5.65227L16.5439 5.45207C16.32 5.01264 15.9796 4.64498 15.5615 4.3886L15.3779 4.28606C15.1308 4.16013 14.8165 4.08006 14.3018 4.03801C13.7794 3.99533 13.1112 3.99504 12.167 3.99504H8.16406C8.16407 3.99667 8.16504 3.99829 8.16504 3.99992L8.16406 15.995Z"></path>
            </svg>
        </button>
        <button class="p-3 bg-transparent border border-sidebar-bg rounded-lg hover:bg-gray-200 dark:hover:bg-dark-secondary transition-colors w-11 h-11 flex items-center justify-center dark:border-dark-accent" id="newChatBtnCollapsed">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" class="text-gray-600 dark:text-gray-300">
                <path d="M2.6687 11.333V8.66699C2.6687 7.74455 2.66841 7.01205 2.71655 6.42285C2.76533 5.82612 2.86699 5.31731 3.10425 4.85156L3.25854 4.57617C3.64272 3.94975 4.19392 3.43995 4.85229 3.10449L5.02905 3.02149C5.44666 2.84233 5.90133 2.75849 6.42358 2.71582C7.01272 2.66769 7.74445 2.66797 8.66675 2.66797H9.16675C9.53393 2.66797 9.83165 2.96586 9.83179 3.33301C9.83179 3.70028 9.53402 3.99805 9.16675 3.99805H8.66675C7.7226 3.99805 7.05438 3.99834 6.53198 4.04102C6.14611 4.07254 5.87277 4.12568 5.65601 4.20313L5.45581 4.28906C5.01645 4.51293 4.64872 4.85345 4.39233 5.27149L4.28979 5.45508C4.16388 5.7022 4.08381 6.01663 4.04175 6.53125C3.99906 7.05373 3.99878 7.7226 3.99878 8.66699V11.333C3.99878 12.2774 3.99906 12.9463 4.04175 13.4688C4.08381 13.9833 4.16389 14.2978 4.28979 14.5449L4.39233 14.7285C4.64871 15.1465 5.01648 15.4871 5.45581 15.7109L5.65601 15.7969C5.87276 15.8743 6.14614 15.9265 6.53198 15.958C7.05439 16.0007 7.72256 16.002 8.66675 16.002H11.3337C12.2779 16.002 12.9461 16.0007 13.4685 15.958C13.9829 15.916 14.2976 15.8367 14.5447 15.7109L14.7292 15.6074C15.147 15.3511 15.4879 14.9841 15.7117 14.5449L15.7976 14.3447C15.8751 14.128 15.9272 13.8546 15.9587 13.4688C16.0014 12.9463 16.0017 12.2774 16.0017 11.333V10.833C16.0018 10.466 16.2997 10.1681 16.6667 10.168C17.0339 10.168 17.3316 10.4659 17.3318 10.833V11.333C17.3318 12.2555 17.3331 12.9879 17.2849 13.5771C17.2422 14.0993 17.1584 14.5541 16.9792 14.9717L16.8962 15.1484C16.5609 15.8066 16.0507 16.3571 15.4246 16.7412L15.1492 16.8955C14.6833 17.1329 14.1739 17.2354 13.5769 17.2842C12.9878 17.3323 12.256 17.332 11.3337 17.332H8.66675C7.74446 17.332 7.01271 17.3323 6.42358 17.2842C5.90135 17.2415 5.44665 17.1577 5.02905 16.9785L4.85229 16.8955C4.19396 16.5601 3.64271 16.0502 3.25854 15.4238L3.10425 15.1484C2.86697 14.6827 2.76534 14.1739 2.71655 13.5771C2.66841 12.9879 2.6687 12.2555 2.6687 11.333ZM13.4646 3.11328C14.4201 2.334 15.8288 2.38969 16.7195 3.28027L16.8865 3.46485C17.6141 4.35685 17.6143 5.64423 16.8865 6.53613L16.7195 6.7207L11.6726 11.7686C11.1373 12.3039 10.4624 12.6746 9.72827 12.8408L9.41089 12.8994L7.59351 13.1582C7.38637 13.1877 7.17701 13.1187 7.02905 12.9707C6.88112 12.8227 6.81199 12.6134 6.84155 12.4063L7.10132 10.5898L7.15991 10.2715C7.3262 9.53749 7.69692 8.86241 8.23218 8.32715L13.2791 3.28027L13.4646 3.11328ZM15.7791 4.2207C15.3753 3.81702 14.7366 3.79124 14.3035 4.14453L14.2195 4.2207L9.17261 9.26856C8.81541 9.62578 8.56774 10.0756 8.45679 10.5654L8.41772 10.7773L8.28296 11.7158L9.22241 11.582L9.43433 11.543C9.92426 11.432 10.3749 11.1844 10.7322 10.8271L15.7791 5.78027L15.8552 5.69629C16.185 5.29194 16.1852 4.708 15.8552 4.30371L15.7791 4.2207Z"></path>
            </svg>
        </button>
    </div>
    
    <!-- Overlay для мобильного sidebar -->
    <div class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden" id="sidebarOverlay"></div>
    <?php endif; ?>

    <!-- Main Chat Container -->
    <div class="flex flex-col min-h-screen w-full max-w-4xl mx-auto bg-white p-5 gap-5 transition-all duration-300 <?php echo $is_logged_in ? 'ml-sidebar' : ''; ?>" id="mainContent">
        <!-- Greeting Section -->
        <div class="text-center mb-5">
            <?php if ($is_logged_in): ?>
                <h2 class="text-2xl font-bold mb-1 text-gray-800 dark:text-gray-200">Good afternoon, <?php echo htmlspecialchars($username); ?></h2>
            <?php else: ?>
                <h2 class="text-2xl font-bold mb-1 text-gray-800 dark:text-gray-200">Good afternoon</h2>
            <?php endif; ?>
            <div class="mx-12 text-gray-600 dark:text-gray-400 leading-relaxed">
                Hey there! Welcome to our project wizard. I'm here to guide you step by step to create your dream project. Just answer a few simple questions about your project and I'll help you put it all together smoothly. Ready to get started? Let's make your vision a reality!
            </div>
        </div>
        
        <!-- Chat Messages Container -->
        <div class="flex flex-col gap-4 max-h-96 overflow-y-auto p-2 custom-scrollbar" id="chatMessages">
            <!-- Messages will be displayed here -->
        </div>
        
        <!-- Message Input Container -->
        <div class="relative w-full">
            <!-- Quick Response Buttons - positioned above input -->
            <div id="quickResponseButtons" class="hidden flex-row flex-wrap justify-start items-center gap-2 mb-3 p-3 bg-white bg-opacity-95 border border-gray-200 rounded-2xl animate-slide-down shadow-sm w-full box-border">
                <button class="quick-response-btn bg-quick-btn border border-gray-300 rounded-3xl px-4 py-2 text-sm text-gray-600 cursor-pointer transition-all duration-200 whitespace-nowrap font-medium select-none outline-none flex-shrink-0 min-h-10 inline-flex items-center justify-center hover:bg-gray-200 hover:border-gray-400 hover:-translate-y-px hover:shadow-sm active:translate-y-0 active:bg-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:border-gray-500 dark:active:bg-gray-800" data-response="деревня">деревня</button>
                <button class="quick-response-btn bg-quick-btn border border-gray-300 rounded-3xl px-4 py-2 text-sm text-gray-600 cursor-pointer transition-all duration-200 whitespace-nowrap font-medium select-none outline-none flex-shrink-0 min-h-10 inline-flex items-center justify-center hover:bg-gray-200 hover:border-gray-400 hover:-translate-y-px hover:shadow-sm active:translate-y-0 active:bg-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:border-gray-500 dark:active:bg-gray-800" data-response="город плотная застройка">город плотная застройка</button>
                <button class="quick-response-btn bg-quick-btn border border-gray-300 rounded-3xl px-4 py-2 text-sm text-gray-600 cursor-pointer transition-all duration-200 whitespace-nowrap font-medium select-none outline-none flex-shrink-0 min-h-10 inline-flex items-center justify-center hover:bg-gray-200 hover:border-gray-400 hover:-translate-y-px hover:shadow-sm active:translate-y-0 active:bg-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:border-gray-500 dark:active:bg-gray-800" data-response="пригород">пригород</button>
                <button class="quick-response-btn bg-quick-btn border border-gray-300 rounded-3xl px-4 py-2 text-sm text-gray-600 cursor-pointer transition-all duration-200 whitespace-nowrap font-medium select-none outline-none flex-shrink-0 min-h-10 inline-flex items-center justify-center hover:bg-gray-200 hover:border-gray-400 hover:-translate-y-px hover:shadow-sm active:translate-y-0 active:bg-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:border-gray-500 dark:active:bg-gray-800" data-response="на берегу моря">на берегу моря</button>
                <button class="quick-response-btn bg-quick-btn border border-gray-300 rounded-3xl px-4 py-2 text-sm text-gray-600 cursor-pointer transition-all duration-200 whitespace-nowrap font-medium select-none outline-none flex-shrink-0 min-h-10 inline-flex items-center justify-center hover:bg-gray-200 hover:border-gray-400 hover:-translate-y-px hover:shadow-sm active:translate-y-0 active:bg-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:border-gray-500 dark:active:bg-gray-800" data-response="промзона">промзона</button>
            </div>
            
            <!-- Input Wrapper -->
            <div class="flex flex-col gap-3">
                <!-- Composer Container (ChatGPT-style input) -->
                <div class="bg-gray-100 rounded-3xl p-2 border border-gray-300 transition-all duration-200 focus-within:border-black dark:bg-gray-700 dark:border-gray-600 dark:focus-within:border-gray-400">
                    <div class="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
                        <!-- Leading Area -->
                        <div class="flex items-center gap-1 min-w-fit">
                            <button type="button" class="hidden p-2 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-400" title="MY PROJECTS">
                                <i class="fas fa-folder"></i>
                            </button>
                            
                            <button type="button" class="hidden p-2 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-400" title="NEW PROJECT">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        
                        <!-- Primary Area (Textarea) -->
                        <div class="flex items-center min-h-9 overflow-hidden py-1">
                            <div class="w-full max-h-48 overflow-y-auto custom-scrollbar">
                                <textarea id="userMessage" placeholder="Ask something..." rows="1" class="w-full border-0 outline-0 bg-transparent resize-none min-h-6 max-h-48 overflow-y-hidden p-0 m-0 break-words whitespace-pre-wrap align-top box-border text-base leading-6 text-gray-800 dark:text-gray-200" spellcheck="false"></textarea>
                            </div>
                        </div>
                        
                        <!-- Trailing Area -->
                        <div class="flex items-center gap-2">
                            <!-- Microphone Button -->
                            <button id="micButton" aria-label="Кнопка диктовки" type="button" class="p-2 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-400">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M15.7806 10.1963C16.1326 10.3011 16.3336 10.6714 16.2288 11.0234L16.1487 11.2725C15.3429 13.6262 13.2236 15.3697 10.6644 15.6299L10.6653 16.835H12.0833L12.2171 16.8486C12.5202 16.9106 12.7484 17.1786 12.7484 17.5C12.7484 17.8214 12.5202 18.0894 12.2171 18.1514L12.0833 18.165H7.91632C7.5492 18.1649 7.25128 17.8672 7.25128 17.5C7.25128 17.1328 7.5492 16.8351 7.91632 16.835H9.33527L9.33429 15.6299C6.775 15.3697 4.6558 13.6262 3.84992 11.2725L3.76984 11.0234L3.74445 10.8906C3.71751 10.5825 3.91011 10.2879 4.21808 10.1963C4.52615 10.1047 4.84769 10.2466 4.99347 10.5195L5.04523 10.6436L5.10871 10.8418C5.8047 12.8745 7.73211 14.335 9.99933 14.335C12.3396 14.3349 14.3179 12.7789 14.9534 10.6436L15.0052 10.5195C15.151 10.2466 15.4725 10.1046 15.7806 10.1963ZM12.2513 5.41699C12.2513 4.17354 11.2437 3.16521 10.0003 3.16504C8.75675 3.16504 7.74835 4.17343 7.74835 5.41699V9.16699C7.74853 10.4104 8.75685 11.418 10.0003 11.418C11.2436 11.4178 12.2511 10.4103 12.2513 9.16699V5.41699ZM13.5814 9.16699C13.5812 11.1448 11.9781 12.7479 10.0003 12.748C8.02232 12.748 6.41845 11.1449 6.41828 9.16699V5.41699C6.41828 3.43889 8.02221 1.83496 10.0003 1.83496C11.9783 1.83514 13.5814 3.439 13.5814 5.41699V9.16699Z"></path>
                                </svg>
                            </button>
                            
                            <!-- Send Button -->
                            <button id="sendButton" class="hidden p-2 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-400">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M8.99992 16V6.41407L5.70696 9.70704C5.31643 10.0976 4.68342 10.0976 4.29289 9.70704C3.90237 9.31652 3.90237 8.6835 4.29289 8.29298L9.29289 3.29298L9.36907 3.22462C9.76184 2.90427 10.3408 2.92686 10.707 3.29298L15.707 8.29298L15.7753 8.36915C16.0957 8.76192 16.0731 9.34092 15.707 9.70704C15.3408 10.0732 14.7618 10.0958 14.3691 9.7754L14.2929 9.70704L10.9999 6.41407V16C10.9999 16.5523 10.5522 17 9.99992 17C9.44764 17 8.99992 16.5523 8.99992 16Z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex gap-2" id="actionButtons">
                    <button class="flex items-center gap-2 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600">
                        <i class="fas fa-folder text-gray-600 dark:text-gray-400"></i>
                        <span class="font-medium">MY PROJECTS</span>
                    </button>
                    <button class="flex items-center gap-2 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600">
                        <i class="fas fa-plus text-gray-600 dark:text-gray-400"></i>
                        <span class="font-medium">NEW PROJECT</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- JavaScript Files -->
    <script src="script.js"></script>
    
    <!-- Additional JavaScript for Tailwind-specific functionality -->
    <script>
        // Dark mode toggle functionality
        function toggleDarkMode() {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
        }
        
        // Load dark mode preference
        if (localStorage.getItem('darkMode') === 'true') {
            document.documentElement.classList.add('dark');
        }
        
        // Responsive sidebar handling for Tailwind classes
        function updateSidebarClasses() {
            const mainContent = document.getElementById('mainContent');
            const sidebar = document.getElementById('sidebar');
            const collapsedBar = document.getElementById('sidebarCollapsedBar');
            
            if (window.innerWidth <= 768) {
                // Mobile: remove margin, sidebar slides over content
                if (mainContent) {
                    mainContent.classList.remove('ml-sidebar', 'ml-sidebar-collapsed');
                }
            } else {
                // Desktop: adjust margin based on sidebar state
                if (mainContent && sidebar && !sidebar.classList.contains('hidden')) {
                    if (collapsedBar && !collapsedBar.classList.contains('hidden')) {
                        mainContent.classList.remove('ml-sidebar');
                        mainContent.classList.add('ml-sidebar-collapsed');
                    } else {
                        mainContent.classList.remove('ml-sidebar-collapsed');
                        mainContent.classList.add('ml-sidebar');
                    }
                }
            }
        }
        
        // Update classes on window resize
        window.addEventListener('resize', updateSidebarClasses);
        
        // Initial setup
        document.addEventListener('DOMContentLoaded', updateSidebarClasses);
    </script>
</body>
</html>
