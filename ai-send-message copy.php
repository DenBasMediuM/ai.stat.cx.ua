<?php
session_start();

// Загрузка переменных из .env файла
function loadEnv($file)
{
    if (!file_exists($file)) return;
    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

loadEnv(__DIR__ . '/.env');

// Настройка заголовков
header("Content-Type: application/json");

// Получаем текст из POST-запроса
$rawInput = file_get_contents("php://input");
error_log("Raw input: " . $rawInput);

// Пробуем декодировать как JSON
$input = json_decode($rawInput, true);

// Выясняем, что именно пришло в запросе
if (is_array($input) && isset($input['question'])) {
    // Случай когда приходит объект {"question": "текст"}
    $text = $input['question'];
} else {
    // Случай когда приходит просто строка текста
    $text = $rawInput;
}
file_put_contents(__DIR__ . "/debug_raw.txt", $text);

error_log("Extracted text: " . $text);

if (empty($text)) {
    echo json_encode(['error' => 'No text provided']);
    exit;
}

// API-ключ
$apiKey = $_ENV['OPENAI_API_KEY'] ?? 'YOUR_FALLBACK_API_KEY';

// Инициализация истории чата
if (!isset($_SESSION['chat_history'])) {
    $_SESSION['chat_history'] = [];
}

// Добавляем новое сообщение пользователя в историю
$_SESSION['chat_history'][] = [
    'role' => 'user',
    'content' => $text  // Теперь здесь точно строка
];

// Формируем payload для OpenAI
$payload = [
    'model' => 'gpt-4.1-mini',
    'messages' => array_merge([
        [
            'role' => 'system',
            'content' => "
				Текущий ответ пользователя: \"$text\"
				ВАЖНО!!! - Отвечай на том же языке на котором написано это - \"$text\"

                Общайся с пользователем в свободной форме и дружелюбно.
				Если пользователь написал, что хочет создать проект — ты становишься интервьюером.  
				Задавай вопросы по одному, в таком порядке:  
				1. Название проекта - projectName
				2. Размер участка (всегда переводи в квадратные метры) (plotSize)  
				3. Тип здания (резиденция, торговывй центр, и т.д.) - project_type
				4. Тип окружения (город, деревня, пляж). Тут так же должна быть возможность скинуть реальный адрес и ИИ должна сама определить тип окружения и спросить у пользователя правильно ли определен тип - environment_type
				5. Тип архитектуры (модерн, классика, итальянский и т.п.) — architecture_type
				6. Кол-во зданий  
				7. Для каждого здания — кол-во этажей и кол-во квартир 

				Правила:  
				- Неточные ответы засчитывай как точные, не переспрашивай.  
				- Любой вопрос не является обязательным его можно пропустить или ответить 'не знаю'
				- Не задавай следующий вопрос, пока не получен ответ на текущий.  
				- Не задавай все вопросы сразу.  
				- Отвечай дружелюбно, можно в свободной форме.  
				- Когда получишь все ответы, сразу после получения ответа на последний вопрос не переспрашивая все ли верно (такое тоже не пиши 'Отлично, у меня есть все нужные данные для составления проекта. Сейчас подготовлю итоговый JSON. Минуточку!' а сразу давай json) - сформируй и выдай строгий JSON такого вида (в финальном ответе должен быть ТОЛЬКО json). Все слова в json должны быть английскими:
				{
					'user': 'dreamsWizard',
					'password': 'dreamsWizard2024',
					'plotSize': 40000,
					'project_type': 'residential',
					'architecture_type': 'classic',
					'environment_type': 'common for this project type',
					'environment_features': 'a lot of plants and flowers',
					'background_type': 'clear gradient skies',
					'buildings':[
						{
							'number_of_floors': 15
						},
						{
							'number_of_floors': 10
						}
					]
				}
            "
        ]
    ], $_SESSION['chat_history']),
    'temperature' => 0.3,
    'max_tokens' => 200
];

// Выполняем запрос к OpenAI
$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo json_encode(['error' => curl_error($ch)]);
    exit;
}
curl_close($ch);

// Сохраняем ответ ИИ в историю и преобразуем формат для клиента
$responseData = json_decode($response, true);
$aiMessage = $responseData['choices'][0]['message'] ?? null;

if ($aiMessage && isset($aiMessage['content'])) {
    // Сохраняем в историю чата
    $_SESSION['chat_history'][] = [
        'role' => 'assistant',
        'content' => $aiMessage['content']
    ];
    
    // Преобразуем в формат, ожидаемый клиентом
    $clientResponse = [
        'output' => $aiMessage['content']
    ];
    
    // Отправляем форматированный ответ
    echo json_encode($clientResponse);
} else {
    // В случае ошибки вернуть оригинальный ответ
    echo json_encode(['error' => 'Failed to parse AI response', 'raw_response' => $responseData]);
}