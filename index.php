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
    <!-- ✅ PRODUCTION: Optimized Tailwind CSS -->
    <link rel="stylesheet" href="dist/output.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Dark mode script - должен быть в head для предотвращения мигания -->
    <script>
        // Применяем темную тему до загрузки страницы
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
    </script>
</head>
<body class="bg-white dark:bg-dark-primary transition-colors duration-200">
    <?php if (!$is_logged_in): ?>
	<!-- Dark mode toggle button -->
    <button id="darkModeToggle" class="fixed top-6 left-6 z-50 p-3 bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
        <svg class="w-5 h-5 text-gray-600 dark:text-gray-300 dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
        </svg>
        <svg class="w-5 h-5 text-yellow-400 hidden dark:block" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM18.894 17.834a.75.75 0 00-1.06 1.06l-1.591-1.59a.75.75 0 111.06-1.061l1.591 1.59zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"></path>
        </svg>
    </button>
    <!-- Authentication button in top right corner (only for non-logged users) -->
    <div class="fixed top-6 right-6 z-50">
        <button id="authButton" class="flex items-center gap-2 bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border rounded-lg px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm">
            <i class="fas fa-user"></i>
            <span>Login</span>
        </button>
    </div>
    <?php endif; ?>

    <?php if ($is_logged_in): ?>
    <!-- Sidebar for logged in users -->
    <div class="fixed top-0 left-0 w-sidebar h-screen bg-sidebar-bg dark:bg-dark-primary border-r border-chat-border dark:border-dark-border flex flex-col z-40 transition-all duration-300 transform md:translate-x-0" id="sidebar">
        <div class="flex items-center justify-between p-4 border-b border-chat-border dark:border-dark-border">
            <button class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors" id="sidebarToggle">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="text-gray-600 dark:text-gray-300">
                    <path d="M6.83496 3.99992C6.38353 4.00411 6.01421 4.0122 5.69824 4.03801C5.31232 4.06954 5.03904 4.12266 4.82227 4.20012L4.62207 4.28606C4.18264 4.50996 3.81498 4.85035 3.55859 5.26848L3.45605 5.45207C3.33013 5.69922 3.25006 6.01354 3.20801 6.52824C3.16533 7.05065 3.16504 7.71885 3.16504 8.66301V11.3271C3.16504 12.2712 3.16533 12.9394 3.20801 13.4618C3.25006 13.9766 3.33013 14.2909 3.45605 14.538L3.55859 14.7216C3.81498 15.1397 4.18266 15.4801 4.62207 15.704L4.82227 15.79C5.03904 15.8674 5.31234 15.9205 5.69824 15.9521C6.01398 15.9779 6.383 15.986 6.83398 15.9902L6.83496 3.99992ZM18.165 11.3271C18.165 12.2493 18.1653 12.9811 18.1172 13.5702C18.0745 14.0924 17.9916 14.5472 17.8125 14.9648L17.7295 15.1415C17.394 15.8 16.8834 16.3511 16.2568 16.7353L15.9814 16.8896C15.5157 17.1268 15.0069 17.2285 14.4102 17.2773C13.821 17.3254 13.0893 17.3251 12.167 17.3251H7.83301C6.91071 17.3251 6.17898 17.3254 5.58984 17.2773C5.06757 17.2346 4.61294 17.1508 4.19531 16.9716L4.01855 16.8896C3.36014 16.5541 2.80898 16.0434 2.4248 15.4169L2.27051 15.1415C2.03328 14.6758 1.93158 14.167 1.88281 13.5702C1.83468 12.9811 1.83496 12.2493 1.83496 11.3271V8.66301C1.83496 7.74072 1.83468 7.00898 1.88281 6.41985C1.93157 5.82309 2.03329 5.31432 2.27051 4.84856L2.4248 4.57317C2.80898 3.94666 3.36012 3.436 4.01855 3.10051L4.19531 3.0175C4.61285 2.83843 5.06771 2.75548 5.58984 2.71281C6.17898 2.66468 6.91071 2.66496 7.83301 2.66496H12.167C13.0893 2.66496 13.821 2.66468 14.4102 2.71281C15.0069 2.76157 15.5157 2.86329 15.9814 3.10051L16.2568 3.25481C16.8833 3.63898 17.394 4.19012 17.7295 4.84856L17.8125 5.02531C17.9916 5.44285 18.0745 5.89771 18.1172 6.41985C18.1653 7.00898 18.165 7.74072 18.165 8.66301V11.3271ZM8.16406 15.995H12.167C13.1112 15.995 13.7794 15.9947 14.3018 15.9521C14.8164 15.91 15.1308 15.8299 15.3779 15.704L15.5615 15.6015C15.9797 15.3451 16.32 14.9774 16.5439 14.538L16.6299 14.3378C16.7074 14.121 16.7605 13.8478 16.792 13.4618C16.8347 12.9394 16.835 12.2712 16.835 11.3271V8.66301C16.835 7.71885 16.8347 7.05065 16.792 6.52824C16.7605 6.14232 16.7073 5.86904 16.6299 5.65227L16.5439 5.45207C16.32 5.01264 15.9796 4.64498 15.5615 4.3886L15.3779 4.28606C15.1308 4.16013 14.8165 4.08006 14.3018 4.03801C13.7794 3.99533 13.1112 3.99504 12.167 3.99504H8.16406C8.16407 3.99667 8.16504 3.99829 8.16504 3.99992L8.16406 15.995Z"></path>
                </svg>
            </button>
            <span class="text-lg font-semibold text-gray-800 dark:text-white">AI Wizard</span>
			<!-- Dark mode toggle button -->
			<button id="darkModeToggle" class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
				<svg class="w-5 h-5 text-gray-600 dark:text-gray-300 dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
				</svg>
				<svg class="w-5 h-5 text-yellow-400 hidden dark:block" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM18.894 17.834a.75.75 0 00-1.06 1.06l-1.591-1.59a.75.75 0 111.06-1.061l1.591 1.59zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"></path>
				</svg>
			</button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4">
            <button class="flex items-center gap-3 w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left mb-4" id="newChatBtn">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="text-gray-600 dark:text-gray-300">
                    <path d="M2.6687 11.333V8.66699C2.6687 7.74455 2.66841 7.01205 2.71655 6.42285C2.76533 5.82612 2.86699 5.31731 3.10425 4.85156L3.25854 4.57617C3.64272 3.94975 4.19392 3.43995 4.85229 3.10449L5.02905 3.02149C5.44666 2.84233 5.90133 2.75849 6.42358 2.71582C7.01272 2.66769 7.74445 2.66797 8.66675 2.66797H9.16675C9.53393 2.66797 9.83165 2.96586 9.83179 3.33301C9.83179 3.70028 9.53402 3.99805 9.16675 3.99805H8.66675C7.7226 3.99805 7.05438 3.99834 6.53198 4.04102C6.14611 4.07254 5.87277 4.12568 5.65601 4.20313L5.45581 4.28906C5.01645 4.51293 4.64872 4.85345 4.39233 5.27149L4.28979 5.45508C4.16388 5.7022 4.08381 6.01663 4.04175 6.53125C3.99906 7.05373 3.99878 7.7226 3.99878 8.66699V11.333C3.99878 12.2774 3.99906 12.9463 4.04175 13.4688C4.08381 13.9833 4.16389 14.2978 4.28979 14.5449L4.39233 14.7285C4.64871 15.1465 5.01648 15.4871 5.45581 15.7109L5.65601 15.7969C5.87276 15.8743 6.14614 15.9265 6.53198 15.958C7.05439 16.0007 7.72256 16.002 8.66675 16.002H11.3337C12.2779 16.002 12.9461 16.0007 13.4685 15.958C13.9829 15.916 14.2976 15.8367 14.5447 15.7109L14.7292 15.6074C15.147 15.3511 15.4879 14.9841 15.7117 14.5449L15.7976 14.3447C15.8751 14.128 15.9272 13.8546 15.9587 13.4688C16.0014 12.9463 16.0017 12.2774 16.0017 11.333V10.833C16.0018 10.466 16.2997 10.1681 16.6667 10.168C17.0339 10.168 17.3316 10.4659 17.3318 10.833V11.333C17.3318 12.2555 17.3331 12.9879 17.2849 13.5771C17.2422 14.0993 17.1584 14.5541 16.9792 14.9717L16.8962 15.1484C16.5609 15.8066 16.0507 16.3571 15.4246 16.7412L15.1492 16.8955C14.6833 17.1329 14.1739 17.2354 13.5769 17.2842C12.9878 17.3323 12.256 17.332 11.3337 17.332H8.66675C7.74446 17.332 7.01271 17.3323 6.42358 17.2842C5.90135 17.2415 5.44665 17.1577 5.02905 16.9785L4.85229 16.8955C4.19396 16.5601 3.64271 16.0502 3.25854 15.4238L3.10425 15.1484C2.86697 14.6827 2.76534 14.1739 2.71655 13.5771C2.66841 12.9879 2.6687 12.2555 2.6687 11.333ZM13.4646 3.11328C14.4201 2.334 15.8288 2.38969 16.7195 3.28027L16.8865 3.46485C17.6141 4.35685 17.6143 5.64423 16.8865 6.53613L16.7195 6.7207L11.6726 11.7686C11.1373 12.3039 10.4624 12.6746 9.72827 12.8408L9.41089 12.8994L7.59351 13.1582C7.38637 13.1877 7.17701 13.1187 7.02905 12.9707C6.88112 12.8227 6.81199 12.6134 6.84155 12.4063L7.10132 10.5898L7.15991 10.2715C7.3262 9.53749 7.69692 8.86241 8.23218 8.32715L13.2791 3.28027L13.4646 3.11328ZM15.7791 4.2207C15.3753 3.81702 14.7366 3.79124 14.3035 4.14453L14.2195 4.2207L9.17261 9.26856C8.81541 9.62578 8.56774 10.0756 8.45679 10.5654L8.41772 10.7773L8.28296 11.7158L9.22241 11.582L9.43433 11.543C9.92426 11.432 10.3749 11.1844 10.7322 10.8271L15.7791 5.78027L15.8552 5.69629C16.185 5.29194 16.1852 4.708 15.8552 4.30371L15.7791 4.2207Z"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300 font-medium">New Chat</span>
            </button>
            
            <!-- Chats section -->
            <div class="mt-6">
                <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 px-2">Chats</h3>
                <div class="space-y-2" id="chatsList">
                    <!-- Chat items will be loaded here -->
                </div>
            </div>
        </div>
        
        <div class="p-4 border-t border-chat-border dark:border-dark-border">
            <button id="authButton" class="flex items-center justify-between w-full p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                <span class="text-gray-700 dark:text-gray-300 font-medium"><?php echo htmlspecialchars($username); ?></span>
                <i class="fas fa-sign-out-alt text-gray-500 dark:text-gray-400"></i>
            </button>
        </div>
    </div>
    
    <!-- Collapsed sidebar (thin bar) -->
    <div class="fixed top-0 left-0 w-sidebar-collapsed h-screen bg-sidebar-bg dark:bg-dark-primary border-r border-chat-border dark:border-dark-border flex flex-col items-center py-4 z-40 transition-all duration-300 -translate-x-full" id="sidebarCollapsedBar">
        <button class="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors mb-4" id="sidebarToggleCollapsed">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="text-gray-600 dark:text-gray-300">
                <path d="M6.83496 3.99992C6.38353 4.00411 6.01421 4.0122 5.69824 4.03801C5.31232 4.06954 5.03904 4.12266 4.82227 4.20012L4.62207 4.28606C4.18264 4.50996 3.81498 4.85035 3.55859 5.26848L3.45605 5.45207C3.33013 5.69922 3.25006 6.01354 3.20801 6.52824C3.16533 7.05065 3.16504 7.71885 3.16504 8.66301V11.3271C3.16504 12.2712 3.16533 12.9394 3.20801 13.4618C3.25006 13.9766 3.33013 14.2909 3.45605 14.538L3.55859 14.7216C3.81498 15.1397 4.18266 15.4801 4.62207 15.704L4.82227 15.79C5.03904 15.8674 5.31234 15.9205 5.69824 15.9521C6.01398 15.9779 6.383 15.986 6.83398 15.9902L6.83496 3.99992ZM18.165 11.3271C18.165 12.2493 18.1653 12.9811 18.1172 13.5702C18.0745 14.0924 17.9916 14.5472 17.8125 14.9648L17.7295 15.1415C17.394 15.8 16.8834 16.3511 16.2568 16.7353L15.9814 16.8896C15.5157 17.1268 15.0069 17.2285 14.4102 17.2773C13.821 17.3254 13.0893 17.3251 12.167 17.3251H7.83301C6.91071 17.3251 6.17898 17.3254 5.58984 17.2773C5.06757 17.2346 4.61294 17.1508 4.19531 16.9716L4.01855 16.8896C3.36014 16.5541 2.80898 16.0434 2.4248 15.4169L2.27051 15.1415C2.03328 14.6758 1.93158 14.167 1.88281 13.5702C1.83468 12.9811 1.83496 12.2493 1.83496 11.3271V8.66301C1.83496 7.74072 1.83468 7.00898 1.88281 6.41985C1.93157 5.82309 2.03329 5.31432 2.27051 4.84856L2.4248 4.57317C2.80898 3.94666 3.36012 3.436 4.01855 3.10051L4.19531 3.0175C4.61285 2.83843 5.06771 2.75548 5.58984 2.71281C6.17898 2.66468 6.91071 2.66496 7.83301 2.66496H12.167C13.0893 2.66496 13.821 2.66468 14.4102 2.71281C15.0069 2.76157 15.5157 2.86329 15.9814 3.10051L16.2568 3.25481C16.8833 3.63898 17.394 4.19012 17.7295 4.84856L17.8125 5.02531C17.9916 5.44285 18.0745 5.89771 18.1172 6.41985C18.1653 7.00898 18.165 7.74072 18.165 8.66301V11.3271ZM8.16406 15.995H12.167C13.1112 15.995 13.7794 15.9947 14.3018 15.9521C14.8164 15.91 15.1308 15.8299 15.3779 15.704L15.5615 15.6015C15.9797 15.3451 16.32 14.9774 16.5439 14.538L16.6299 14.3378C16.7074 14.121 16.7605 13.8478 16.792 13.4618C16.8347 12.9394 16.835 12.2712 16.835 11.3271V8.66301C16.835 7.71885 16.8347 7.05065 16.792 6.52824C16.7605 6.14232 16.7073 5.86904 16.6299 5.65227L16.5439 5.45207C16.32 5.01264 15.9796 4.64498 15.5615 4.3886L15.3779 4.28606C15.1308 4.16013 14.8165 4.08006 14.3018 4.03801C13.7794 3.99533 13.1112 3.99504 12.167 3.99504H8.16406C8.16407 3.99667 8.16504 3.99829 8.16504 3.99992L8.16406 15.995Z"></path>
            </svg>
        </button>
        <button class="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors" id="newChatBtnCollapsed" title="New Chat">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="text-gray-600 dark:text-gray-300">
                <path d="M2.6687 11.333V8.66699C2.6687 7.74455 2.66841 7.01205 2.71655 6.42285C2.76533 5.82612 2.86699 5.31731 3.10425 4.85156L3.25854 4.57617C3.64272 3.94975 4.19392 3.43995 4.85229 3.10449L5.02905 3.02149C5.44666 2.84233 5.90133 2.75849 6.42358 2.71582C7.01272 2.66769 7.74445 2.66797 8.66675 2.66797H9.16675C9.53393 2.66797 9.83165 2.96586 9.83179 3.33301C9.83179 3.70028 9.53402 3.99805 9.16675 3.99805H8.66675C7.7226 3.99805 7.05438 3.99834 6.53198 4.04102C6.14611 4.07254 5.87277 4.12568 5.65601 4.20313L5.45581 4.28906C5.01645 4.51293 4.64872 4.85345 4.39233 5.27149L4.28979 5.45508C4.16388 5.7022 4.08381 6.01663 4.04175 6.53125C3.99906 7.05373 3.99878 7.7226 3.99878 8.66699V11.333C3.99878 12.2774 3.99906 12.9463 4.04175 13.4688C4.08381 13.9833 4.16389 14.2978 4.28979 14.5449L4.39233 14.7285C4.64871 15.1465 5.01648 15.4871 5.45581 15.7109L5.65601 15.7969C5.87276 15.8743 6.14614 15.9265 6.53198 15.958C7.05439 16.0007 7.72256 16.002 8.66675 16.002H11.3337C12.2779 16.002 12.9461 16.0007 13.4685 15.958C13.9829 15.916 14.2976 15.8367 14.5447 15.7109L14.7292 15.6074C15.147 15.3511 15.4879 14.9841 15.7117 14.5449L15.7976 14.3447C15.8751 14.128 15.9272 13.8546 15.9587 13.4688C16.0014 12.9463 16.0017 12.2774 16.0017 11.333V10.833C16.0018 10.466 16.2997 10.1681 16.6667 10.168C17.0339 10.168 17.3316 10.4659 17.3318 10.833V11.333C17.3318 12.2555 17.3331 12.9879 17.2849 13.5771C17.2422 14.0993 17.1584 14.5541 16.9792 14.9717L16.8962 15.1484C16.5609 15.8066 16.0507 16.3571 15.4246 16.7412L15.1492 16.8955C14.6833 17.1329 14.1739 17.2354 13.5769 17.2842C12.9878 17.3323 12.256 17.332 11.3337 17.332H8.66675C7.74446 17.332 7.01271 17.3323 6.42358 17.2842C5.90135 17.2415 5.44665 17.1577 5.02905 16.9785L4.85229 16.8955C4.19396 16.5601 3.64271 16.0502 3.25854 15.4238L3.10425 15.1484C2.86697 14.6827 2.76534 14.1739 2.71655 13.5771C2.66841 12.9879 2.6687 12.2555 2.6687 11.333ZM13.4646 3.11328C14.4201 2.334 15.8288 2.38969 16.7195 3.28027L16.8865 3.46485C17.6141 4.35685 17.6143 5.64423 16.8865 6.53613L16.7195 6.7207L11.6726 11.7686C11.1373 12.3039 10.4624 12.6746 9.72827 12.8408L9.41089 12.8994L7.59351 13.1582C7.38637 13.1877 7.17701 13.1187 7.02905 12.9707C6.88112 12.8227 6.81199 12.6134 6.84155 12.4063L7.10132 10.5898L7.15991 10.2715C7.3262 9.53749 7.69692 8.86241 8.23218 8.32715L13.2791 3.28027L13.4646 3.11328ZM15.7791 4.2207C15.3753 3.81702 14.7366 3.79124 14.3035 4.14453L14.2195 4.2207L9.17261 9.26856C8.81541 9.62578 8.56774 10.0756 8.45679 10.5654L8.41772 10.7773L8.28296 11.7158L9.22241 11.582L9.43433 11.543C9.92426 11.432 10.3749 11.1844 10.7322 10.8271L15.7791 5.78027L15.8552 5.69629C16.185 5.29194 16.1852 4.708 15.8552 4.30371L15.7791 4.2207Z"></path>
            </svg>
        </button>
    </div>
    
    <!-- Overlay for mobile sidebar -->
    <div class="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" id="sidebarOverlay" style="display: none;"></div>
    <?php endif; ?>

    <!-- Main content area -->
    <div class="chat-container <?php echo $is_logged_in ? 'ml-sidebar md:ml-sidebar' : ''; ?> min-h-screen bg-white dark:bg-dark-primary transition-all duration-300 relative" id="mainContent">
        <!-- Welcome message -->
        <div class="greeting text-center py-16 px-8">
            <?php if ($is_logged_in): ?>
                <h2 class="text-3xl font-bold text-gray-800 dark:text-white mb-6">Good afternoon, <?php echo htmlspecialchars($username); ?></h2>
            <?php else: ?>
                <h2 class="text-3xl font-bold text-gray-800 dark:text-white mb-6">Good afternoon</h2>
            <?php endif; ?>
            <div class="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
                Hey there! Welcome to our project wizard. I'm here to guide you step by step to create your dream project. 
                Just answer a few simple questions about your project and I'll help you put it all together smoothly. 
                Ready to get started? Let's make your vision a reality!
            </div>
        </div>
        
        <!-- Chat messages container -->
		<div class="flex-1 flex justify-center overflow-y-auto px-6 py-4 pb-111">
			<div class="flex-1 overflow-y-auto py-4 chat-messages max-w-4xl" id="chatMessages">
				<div class="max-w-800 mx-auto">
					<!-- Messages will be displayed here -->
				</div>
			</div>
		</div>
    </div>
    
    <!-- Message input area - FIXED AT BOTTOM -->
    <div class="fixed bottom-0 left-0 right-0 <?php echo $is_logged_in ? 'ml-sidebar md:ml-sidebar' : ''; ?> p-6 border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-primary z-30 transition-all duration-300" id="messageInputArea">
            <!-- Quick response buttons -->
            <div id="quickResponseButtons" class="flex flex-wrap gap-2 mb-4 justify-center" style="display: none;">
                <button class="bg-quick-btn dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-full px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 hover:-translate-y-px transition-all duration-200" data-response="деревня">деревня</button>
                <button class="bg-quick-btn dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-full px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 hover:-translate-y-px transition-all duration-200" data-response="город плотная застройка">город плотная застройка</button>
                <button class="bg-quick-btn dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-full px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 hover:-translate-y-px transition-all duration-200" data-response="пригород">пригород</button>
                <button class="bg-quick-btn dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-full px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 hover:-translate-y-px transition-all duration-200" data-response="на берегу моря">на берегу моря</button>
                <button class="bg-quick-btn dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-full px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 hover:-translate-y-px transition-all duration-200" data-response="промзона">промзона</button>
            </div>
            
            <!-- Input container -->
            <div class="max-w-4xl mx-auto">
                <div class="relative bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border rounded-2xl shadow-sm focus-within:shadow-md transition-all duration-200">
                    <div class="flex items-end min-h-[60px]">
                        <!-- Leading buttons -->
                        <div class="flex items-center px-4 py-3">
                            <button type="button" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors my-projects-icon" style="display: none;" title="MY PROJECTS">
                                <i class="fas fa-folder text-gray-600 dark:text-gray-400"></i>
                            </button>
                            
                            <button type="button" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors new-project-icon" style="display: none;" title="NEW PROJECT">
                                <i class="fas fa-plus text-gray-600 dark:text-gray-400"></i>
                            </button>
                        </div>
                        
                        <!-- Text input -->
                        <div class="flex-1 min-w-0">
                            <div class="px-4 py-3">
                                <textarea id="userMessage" placeholder="Ask something..." rows="1" 
                                    class="w-full resize-none border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 text-base leading-6" 
                                    style="overflow: hidden;" spellcheck="false"></textarea>
                            </div>
                        </div>
                        
                        <!-- Trailing buttons -->
                        <div class="flex items-center px-4 py-3 gap-2">
                            <button id="micButton" aria-label="Кнопка диктовки" type="button" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="text-gray-600 dark:text-gray-400">
                                    <path d="M15.7806 10.1963C16.1326 10.3011 16.3336 10.6714 16.2288 11.0234L16.1487 11.2725C15.3429 13.6262 13.2236 15.3697 10.6644 15.6299L10.6653 16.835H12.0833L12.2171 16.8486C12.5202 16.9106 12.7484 17.1786 12.7484 17.5C12.7484 17.8214 12.5202 18.0894 12.2171 18.1514L12.0833 18.165H7.91632C7.5492 18.1649 7.25128 17.8672 7.25128 17.5C7.25128 17.1328 7.5492 16.8351 7.91632 16.835H9.33527L9.33429 15.6299C6.775 15.3697 4.6558 13.6262 3.84992 11.2725L3.76984 11.0234L3.74445 10.8906C3.71751 10.5825 3.91011 10.2879 4.21808 10.1963C4.52615 10.1047 4.84769 10.2466 4.99347 10.5195L5.04523 10.6436L5.10871 10.8418C5.8047 12.8745 7.73211 14.335 9.99933 14.335C12.3396 14.3349 14.3179 12.7789 14.9534 10.6436L15.0052 10.5195C15.151 10.2466 15.4725 10.1046 15.7806 10.1963ZM12.2513 5.41699C12.2513 4.17354 11.2437 3.16521 10.0003 3.16504C8.75675 3.16504 7.74835 4.17343 7.74835 5.41699V9.16699C7.74853 10.4104 8.75685 11.418 10.0003 11.418C11.2436 11.4178 12.2511 10.4103 12.2513 9.16699V5.41699ZM13.5814 9.16699C13.5812 11.1448 11.9781 12.7479 10.0003 12.748C8.02232 12.748 6.41845 11.1449 6.41828 9.16699V5.41699C6.41828 3.43889 8.02221 1.83496 10.0003 1.83496C11.9783 1.83514 13.5814 3.439 13.5814 5.41699V9.16699Z"></path>
                                </svg>
                            </button>
                            <button id="sendButton" class="bg-black dark:bg-white text-white dark:text-black p-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style="display: none;">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8.99992 16V6.41407L5.70696 9.70704C5.31643 10.0976 4.68342 10.0976 4.29289 9.70704C3.90237 9.31652 3.90237 8.6835 4.29289 8.29298L9.29289 3.29298L9.36907 3.22462C9.76184 2.90427 10.3408 2.92686 10.707 3.29298L15.707 8.29298L15.7753 8.36915C16.0957 8.76192 16.0731 9.34092 15.707 9.70704C15.3408 10.0732 14.7618 10.0958 14.3691 9.7754L14.2929 9.70704L10.9999 6.41407V16C10.9999 16.5523 10.5522 17 9.99992 17C9.44764 17 8.99992 16.5523 8.99992 16Z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Action buttons -->
                <div class="flex justify-center gap-4 mt-6" id="actionButtons">
                    <button class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm my-projects">
                        <i class="fas fa-folder"></i>
                        MY PROJECTS
                    </button>
                    <button class="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm new-project">
                        <i class="fas fa-plus"></i>
                        NEW PROJECT
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Authentication modal -->
    <div id="overlay" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style="display: none;"></div>
    
    <div id="authModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="display: none;">
        <div class="bg-white dark:bg-dark-secondary rounded-2xl shadow-xl w-full max-w-md relative">
            <button class="close-modal absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <i class="fas fa-times text-gray-500 dark:text-gray-400"></i>
            </button>
            
            <!-- Tab switcher -->
            <div class="flex border-b border-gray-200 dark:border-gray-600 mb-6 mt-8">
                <button class="auth-tab flex-1 py-3 text-center font-medium border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 active" data-tab="login">Login</button>
                <button class="auth-tab flex-1 py-3 text-center font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" data-tab="register">Register</button>
            </div>
            
            <!-- Login form -->
            <div class="auth-form-container px-6 pb-6" id="loginForm">
                <form action="auth_process.php" method="post" class="auth-form space-y-4">
                    <input type="hidden" name="action" value="login">
                    
                    <div class="form-group">
                        <label for="login_username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                        <input type="text" id="login_username" name="username" required 
                               class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                    </div>
                    
                    <div class="form-group">
                        <label for="login_password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                        <input type="password" id="login_password" name="password" required
                               class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                    </div>
                    
                    <div class="form-error text-red-500 dark:text-red-400 text-sm" id="loginError"></div>
                    
                    <button type="submit" class="auth-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors">Login</button>
                </form>
            </div>
            
            <!-- Registration form -->
            <div class="auth-form-container px-6 pb-6" id="registerForm" style="display: none;">
                <form action="auth_process.php" method="post" class="auth-form space-y-4">
                    <input type="hidden" name="action" value="register">
                    
                    <div class="form-group">
                        <label for="register_username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                        <input type="text" id="register_username" name="username" required
                               class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                    </div>
                    
                    <div class="form-group">
                        <label for="register_password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                        <input type="password" id="register_password" name="password" required
                               class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                    </div>
                    
                    <div class="form-group">
                        <label for="confirm_password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                        <input type="password" id="confirm_password" name="confirm_password" required
                               class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                    </div>
                    
                    <div class="form-error text-red-500 dark:text-red-400 text-sm" id="registerError"></div>
                    
                    <button type="submit" class="auth-submit-btn w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors">Register</button>
                </form>
            </div>
        </div>
    </div>
    
    <script src="debug.js"></script>
    <script src="script.js"></script>
    <script src="auth.js"></script>
    
    <!-- Enhanced JavaScript for production -->
    <script>
        // Dark mode functionality - enhanced version
        function initDarkMode() {
            const darkModeToggles = document.querySelectorAll('#darkModeToggle');
            const html = document.documentElement;
            
            // Apply saved theme immediately (already done in head)
            
            // Add click handlers to all toggle buttons
            darkModeToggles.forEach(toggle => {
                toggle?.addEventListener('click', () => {
                    html.classList.toggle('dark');
                    const isDark = html.classList.contains('dark');
                    localStorage.setItem('theme', isDark ? 'dark' : 'light');
                    
                    // Optional: Dispatch custom event for other components
                    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark } }));
                });
            });
        }

        // Enhanced sidebar functionality
        function initSidebar() {
            const sidebar = document.getElementById('sidebar');
            const sidebarCollapsedBar = document.getElementById('sidebarCollapsedBar');
            const mainContent = document.getElementById('mainContent');
            const messageInputArea = document.getElementById('messageInputArea');
            const sidebarOverlay = document.getElementById('sidebarOverlay');
            
            function toggleSidebar() {
                if (sidebar && sidebarCollapsedBar && mainContent) {
                    const isCollapsed = sidebar.classList.contains('-translate-x-full');
                    
                    if (isCollapsed) {
                        // Show full sidebar
                        sidebar.classList.remove('-translate-x-full');
                        sidebarCollapsedBar.classList.add('-translate-x-full');
                        mainContent.classList.add('ml-sidebar', 'md:ml-sidebar');
                        mainContent.classList.remove('ml-sidebar-collapsed', 'md:ml-sidebar-collapsed');
                        // Update message input area margin
                        if (messageInputArea) {
                            messageInputArea.classList.add('ml-sidebar', 'md:ml-sidebar');
                            messageInputArea.classList.remove('ml-sidebar-collapsed', 'md:ml-sidebar-collapsed');
                        }
                    } else {
                        // Show collapsed sidebar and chat-container gets margin-left: 60px
                        sidebar.classList.add('-translate-x-full');
                        sidebarCollapsedBar.classList.remove('-translate-x-full'); // Show collapsed bar
                        mainContent.classList.remove('ml-sidebar', 'md:ml-sidebar');
                        mainContent.classList.add('ml-sidebar-collapsed', 'md:ml-sidebar-collapsed'); // margin-left: 60px
                        // Update message input area margin to 60px
                        if (messageInputArea) {
                            messageInputArea.classList.remove('ml-sidebar', 'md:ml-sidebar');
                            messageInputArea.classList.add('ml-sidebar-collapsed', 'md:ml-sidebar-collapsed'); // margin-left: 60px
                        }
                    }
                }
            }
            
            // Add event listeners for sidebar toggles
            document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
            document.getElementById('sidebarToggleCollapsed')?.addEventListener('click', toggleSidebar);
            
            // Mobile sidebar handling
            function handleMobileSidebar() {
                if (window.innerWidth < 768 && sidebar) {
                    sidebar.classList.add('-translate-x-full');
                    if (mainContent) {
                        mainContent.classList.remove('ml-sidebar', 'md:ml-sidebar', 'ml-sidebar-collapsed', 'md:ml-sidebar-collapsed');
                    }
                    if (messageInputArea) {
                        messageInputArea.classList.remove('ml-sidebar', 'md:ml-sidebar', 'ml-sidebar-collapsed', 'md:ml-sidebar-collapsed');
                    }
                    if (sidebarCollapsedBar) {
                        sidebarCollapsedBar.classList.add('-translate-x-full');
                    }
                }
            }
            
            // Mobile sidebar overlay click
            sidebarOverlay?.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    sidebar?.classList.add('-translate-x-full');
                    if (mainContent) {
                        mainContent.classList.remove('ml-sidebar', 'md:ml-sidebar', 'ml-sidebar-collapsed', 'md:ml-sidebar-collapsed');
                    }
                    if (messageInputArea) {
                        messageInputArea.classList.remove('ml-sidebar', 'md:ml-sidebar', 'ml-sidebar-collapsed', 'md:ml-sidebar-collapsed');
                    }
                    sidebarOverlay.style.display = 'none';
                }
            });
            
            window.addEventListener('resize', handleMobileSidebar);
            handleMobileSidebar();
        }
        
        // Enhanced textarea functionality
        function initTextarea() {
            const textarea = document.getElementById('userMessage');
            if (textarea) {
                textarea.addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
                });
                
                // Add keyboard shortcuts
                textarea.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        // Trigger send message
                        document.getElementById('sendButton')?.click();
                    }
                });
            }
        }
        
        // Performance monitoring
        function logPerformanceMetrics() {
            if (window.performance) {
                const perfData = window.performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                console.log(`🚀 Page load time: ${pageLoadTime}ms`);
                
                // Log CSS load time (approximate)
                const cssLoadTime = perfData.domContentLoadedEventStart - perfData.navigationStart;
                console.log(`🎨 CSS load time: ${cssLoadTime}ms`);
            }
        }
        
        // Initialize everything when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            initDarkMode();
            initSidebar();
            initTextarea();
            
            console.log('✅ Production Tailwind CSS Implementation Loaded');
            console.log('📦 CSS: Optimized and minified');
            console.log('📱 Responsive: ✅');
            console.log('🌙 Dark mode: ✅'); 
            console.log('🎨 Modern UI: ✅');
            console.log('⚡ Performance: Optimized');
            
            // Log performance metrics after a short delay
            setTimeout(logPerformanceMetrics, 1000);
            
            // Test message function
            window.testMessage = function() {
                console.log('🧪 Testing messages...');
                
                // Direct DOM manipulation test
                const chatMessages = document.getElementById('chatMessages');
                console.log('📦 Chat container:', chatMessages);
                
                if (chatMessages) {
                    const innerContainer = chatMessages.querySelector('.max-w-800');
                    console.log('🎯 Inner container:', innerContainer);
                    
                    // Create test message directly
                    const testDiv = document.createElement('div');
                    testDiv.className = 'flex justify-end mb-4';
                    testDiv.innerHTML = `
                        <div class="max-w-xs lg:max-w-md px-4 py-2 bg-blue-500 text-white rounded-lg rounded-br-none shadow-md">
                            <p class="text-sm leading-relaxed">Test message - direct DOM</p>
                            <div class="text-xs opacity-75 mt-1">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                    `;
                    
                    const targetContainer = innerContainer || chatMessages;
                    targetContainer.appendChild(testDiv);
                    console.log('✅ Test message added to:', targetContainer);
                    
                    // Scroll to bottom
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                    // Test addMessageToChat function
                    setTimeout(() => {
                        if (typeof window.addMessageToChat === 'function') {
                            console.log('🧪 Testing addMessageToChat function...');
                            window.addMessageToChat('Test via function', false, true); // skipTranslate = true
                        }
                    }, 2000);
                } else {
                    console.error('❌ Chat container not found');
                }
            };
        });


    </script>
    <!-- Enhanced JavaScript for production -->
</body>
</html>
