<?php
require_once __DIR__ . '/vendor/autoload.php';

?><pre><?=var_dump($_SERVER);?></pre><?

if (in_array($_SERVER['SERVER_NAME'], ['127.0.0.1', 'localhost'])) {
    echo "Локальная среда";

	try {
		// Подключение к MongoDB с указанием базы аутентификации
		$client = new MongoDB\Client(
			'mongodb://aiwpre:ewfwef90ewfvf@20.56.52.242:27017/aiwpre?authSource=aiwpre'
		);

		// Выбор базы
		$db = $client->aiwpre;

		// Получаем список коллекций
		$collections = $db->listCollections();

		echo "Подключение к MongoDB успешно!\n";
		echo "Коллекции в базе 'aiwpre':\n";
		foreach ($collections as $collection) {
			echo "- " . $collection->getName() . "\n";
		}
	} catch (Exception $e) {
		echo "Ошибка подключения: " . $e->getMessage();
	}
	
} else {
    echo "Продакшн";

	try {
		// Подключение к MongoDB с указанием базы аутентификации
		$connection = new \MongoDB\Client($_SERVER['CONNECTION_STRING']);
		$db = $connection->selectDatabase($_SERVER['DATABASE']);

		// Получаем список коллекций
		$collections = $db->listCollections();

		echo "Подключение к MongoDB успешно!\n";
		echo "Коллекции в базе 'aiwpre':\n";
		foreach ($collections as $collection) {
			echo "- " . $collection->getName() . "\n";
		}
	} catch (Exception $e) {
		echo "Ошибка подключения: " . $e->getMessage();
	}
}
