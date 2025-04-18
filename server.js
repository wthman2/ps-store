const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "ps_store_secret_key"; // В продакшене используйте переменные окружения

// Middleware
app.use(bodyParser.json());
app.use(express.static("public")); // Папка с клиентскими файлами

// Путь к файлу с данными игр
const DATA_DIR = path.join(__dirname, "data");
const GAMES_FILE = path.join(DATA_DIR, "games.json");

// Создаем папку data, если она не существует
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Создаем файл с играми, если он не существует
if (!fs.existsSync(GAMES_FILE)) {
  // Инициализируем демо-данные
  const initialGames = [
    {
      id: "k8yw3n5x7z",
      name: "God of War Ragnarök",
      description:
        "Отправляйтесь в эпическое и душераздирающее путешествие, в котором Кратос и Атрей должны принять решение: сохранить себя или спасти девять миров. Тем временем Асгард готовится к предсказанной битве, которая приведет к концу света.",
      image:
        "https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png",
      priceOffline: 12000,
      priceOnline: 15000,
      priceUniversal: 18000,
      availableOffline: true,
      availableOnline: true,
      availableUniversal: true,
      isNew: true,
      genre: "action",
      psVersion: "ps5",
    },
    {
      id: "a2c4e6g8i0",
      name: "Spider-Man 2",
      description:
        "Питер Паркер и Майлз Моралес возвращаются в захватывающем новом приключении в серии Marvel's Spider-Man для PS5. Качайтесь, прыгайте и используйте новые способности паутины, чтобы передвигаться по Нью-Йорку, переключаясь между Питером и Майлзом для разных историй.",
      image:
        "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7b42fcf9ccc3e4283e83eda63eecb2.png",
      priceOffline: 14000,
      priceOnline: 17000,
      priceUniversal: 20000,
      availableOffline: true,
      availableOnline: true,
      availableUniversal: false,
      isNew: true,
      genre: "action",
      psVersion: "ps5",
    },
    {
      id: "b3d5f7h9j1",
      name: "Horizon Forbidden West",
      description:
        "Присоединяйтесь к Элой в ее путешествии по величественному, но опасному пограничному региону Запретный Запад, где она столкнется с новыми загадочными угрозами и раскроет тайны, которые могут изменить судьбу всего мира.",
      image:
        "https://image.api.playstation.com/vulcan/ap/rnd/202107/3100/HO8vkO9pfXhwbHi5WHECQJdN.png",
      priceOffline: 10000,
      priceOnline: 13000,
      priceUniversal: 16000,
      availableOffline: true,
      availableOnline: false,
      availableUniversal: true,
      isNew: false,
      genre: "adventure",
      psVersion: "both",
    },
    {
      id: "c4e6g8i0k2",
      name: "Gran Turismo 7",
      description:
        "Самый реалистичный автосимулятор для PlayStation. Сотни лицензированных автомобилей, детальная физика и потрясающая графика.",
      image:
        "https://image.api.playstation.com/vulcan/ap/rnd/202109/1321/yZ7dpmjtHr1olhutHT57IFRh.png",
      priceOffline: 14000,
      priceOnline: 19000,
      priceUniversal: 28000,
      availableOffline: true,
      availableOnline: true,
      availableUniversal: true,
      isNew: false,
      genre: "racing",
      psVersion: "both",
    },
    {
      id: "d5f7h9j1l3",
      name: "Demon's Souls",
      description:
        "Полностью переработанная версия классической игры. Сражайтесь с ужасающими боссами в мрачном фэнтезийном мире.",
      image:
        "https://image.api.playstation.com/vulcan/ap/rnd/202011/0402/GwRVgYSfT7kKzJKpHQWJEHpN.png",
      priceOffline: 16000,
      priceOnline: 21000,
      priceUniversal: 30000,
      availableOffline: true,
      availableOnline: true,
      availableUniversal: false,
      isNew: false,
      genre: "rpg",
      psVersion: "ps5",
    },
    {
      id: "e6g8i0k2m4",
      name: "The Last of Us Part II",
      description:
        "Продолжение истории Элли и Джоэла в постапокалиптическом мире. Эмоциональный сюжет, реалистичные персонажи и жестокий геймплей.",
      image:
        "https://image.api.playstation.com/vulcan/ap/rnd/202010/0222/niMUubpU9y1PxNvYmDfb8QFD.png",
      priceOffline: 10000,
      priceOnline: 15000,
      priceUniversal: 22000,
      availableOffline: true,
      availableOnline: false,
      availableUniversal: true,
      isNew: false,
      genre: "adventure",
      psVersion: "ps4",
    },
  ];

  try {
    fs.writeFileSync(GAMES_FILE, JSON.stringify(initialGames, null, 2));
    console.log("Создан файл с начальными данными игр");
  } catch (error) {
    console.error("Ошибка при создании файла игр:", error);
  }
}

// Middleware для проверки аутентификации
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Генерация уникального ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// API для получения всех игр
app.get("/api/games", (req, res) => {
  try {
    const gamesData = fs.readFileSync(GAMES_FILE, "utf8");
    const games = JSON.parse(gamesData);

    // Фильтрация по параметрам запроса
    let filteredGames = [...games];

    // Фильтр по жанру
    if (req.query.genre) {
      filteredGames = filteredGames.filter(
        (game) => game.genre === req.query.genre
      );
    }

    // Фильтр по версии PS
    if (req.query.psVersion) {
      if (req.query.psVersion === "both") {
        filteredGames = filteredGames.filter(
          (game) => game.psVersion === "both"
        );
      } else {
        filteredGames = filteredGames.filter(
          (game) =>
            game.psVersion === req.query.psVersion || game.psVersion === "both"
        );
      }
    }

    // Фильтр по наличию
    if (req.query.availability) {
      switch (req.query.availability) {
        case "offline":
          filteredGames = filteredGames.filter((game) => game.availableOffline);
          break;
        case "online":
          filteredGames = filteredGames.filter((game) => game.availableOnline);
          break;
        case "universal":
          filteredGames = filteredGames.filter(
            (game) => game.availableUniversal
          );
          break;
        case "available":
          filteredGames = filteredGames.filter(
            (game) =>
              game.availableOffline ||
              game.availableOnline ||
              game.availableUniversal
          );
          break;
      }
    }

    // Фильтр по цене
    if (req.query.minPrice) {
      const minPrice = parseInt(req.query.minPrice);
      filteredGames = filteredGames.filter((game) => {
        const lowestPrice = Math.min(
          game.availableOffline ? game.priceOffline : Infinity,
          game.availableOnline ? game.priceOnline : Infinity,
          game.availableUniversal ? game.priceUniversal : Infinity
        );
        return lowestPrice >= minPrice;
      });
    }

    if (req.query.maxPrice) {
      const maxPrice = parseInt(req.query.maxPrice);
      filteredGames = filteredGames.filter((game) => {
        const lowestPrice = Math.min(
          game.availableOffline ? game.priceOffline : Infinity,
          game.availableOnline ? game.priceOnline : Infinity,
          game.availableUniversal ? game.priceUniversal : Infinity
        );
        return lowestPrice <= maxPrice;
      });
    }

    // Поиск по названию
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredGames = filteredGames.filter((game) =>
        game.name.toLowerCase().includes(searchTerm)
      );
    }

    res.json(filteredGames);
  } catch (error) {
    console.error("Ошибка при чтении файла игр:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// API для получения конкретной игры по ID
app.get("/api/games/:id", (req, res) => {
  try {
    const gameId = req.params.id;
    const gamesData = fs.readFileSync(GAMES_FILE, "utf8");
    const games = JSON.parse(gamesData);

    const game = games.find((g) => g.id === gameId);
    if (!game) {
      return res.status(404).json({ error: "Игра не найдена" });
    }

    res.json(game);
  } catch (error) {
    console.error("Ошибка при чтении файла игр:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// API для добавления новой игры (только для админа)
app.post("/api/games", authenticateToken, (req, res) => {
  try {
    const gamesData = fs.readFileSync(GAMES_FILE, "utf8");
    const games = JSON.parse(gamesData);

    const newGame = {
      id: generateId(),
      ...req.body,
    };

    games.push(newGame);
    fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2));

    res.status(201).json(newGame);
  } catch (error) {
    console.error("Ошибка при добавлении игры:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// API для обновления игры (только для админа)
app.put("/api/games/:id", authenticateToken, (req, res) => {
  try {
    const gameId = req.params.id;
    const gamesData = fs.readFileSync(GAMES_FILE, "utf8");
    let games = JSON.parse(gamesData);

    const gameIndex = games.findIndex((g) => g.id === gameId);
    if (gameIndex === -1) {
      return res.status(404).json({ error: "Игра не найдена" });
    }

    games[gameIndex] = {
      ...req.body,
      id: gameId, // Убедимся, что ID не изменился
    };

    fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2));

    res.json(games[gameIndex]);
  } catch (error) {
    console.error("Ошибка при обновлении игры:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// API для удаления игры (только для админа)
app.delete("/api/games/:id", authenticateToken, (req, res) => {
  try {
    const gameId = req.params.id;
    const gamesData = fs.readFileSync(GAMES_FILE, "utf8");
    let games = JSON.parse(gamesData);

    const gameIndex = games.findIndex((g) => g.id === gameId);
    if (gameIndex === -1) {
      return res.status(404).json({ error: "Игра не найдена" });
    }

    const deletedGame = games[gameIndex];
    games = games.filter((g) => g.id !== gameId);

    fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2));

    res.json({ message: "Игра успешно удалена", game: deletedGame });
  } catch (error) {
    console.error("Ошибка при удалении игры:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// API для аутентификации администратора
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;

  // Проверяем пароль для входа в админ-панель
  if (password === "medet1977") {
    // Создаем JWT токен
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Неверный пароль" });
  }
});

// API для получения жанров
app.get("/api/genres", (req, res) => {
  try {
    const gamesData = fs.readFileSync(GAMES_FILE, "utf8");
    const games = JSON.parse(gamesData);

    // Получаем уникальные жанры из всех игр
    const genres = [...new Set(games.map((game) => game.genre))].filter(
      Boolean
    );

    res.json(genres);
  } catch (error) {
    console.error("Ошибка при получении жанров:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// API для получения версий PlayStation
app.get("/api/ps-versions", (req, res) => {
  try {
    const gamesData = fs.readFileSync(GAMES_FILE, "utf8");
    const games = JSON.parse(gamesData);

    // Получаем уникальные версии PlayStation из всех игр
    const psVersions = [...new Set(games.map((game) => game.psVersion))].filter(
      Boolean
    );

    res.json(psVersions);
  } catch (error) {
    console.error("Ошибка при получении версий PlayStation:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// API для получения ценового диапазона
app.get("/api/price-range", (req, res) => {
  try {
    const gamesData = fs.readFileSync(GAMES_FILE, "utf8");
    const games = JSON.parse(gamesData);

    // Находим минимальную и максимальную цены
    let minPrice = Infinity;
    let maxPrice = 0;

    games.forEach((game) => {
      const prices = [
        game.availableOffline ? game.priceOffline : Infinity,
        game.availableOnline ? game.priceOnline : Infinity,
        game.availableUniversal ? game.priceUniversal : Infinity,
      ];

      const lowestPrice = Math.min(...prices);
      const highestPrice = Math.max(...prices.filter((p) => p !== Infinity));

      if (lowestPrice < minPrice && lowestPrice !== Infinity) {
        minPrice = lowestPrice;
      }

      if (highestPrice > maxPrice) {
        maxPrice = highestPrice;
      }
    });

    res.json({ minPrice, maxPrice });
  } catch (error) {
    console.error("Ошибка при получении ценового диапазона:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Обработка всех остальных маршрутов - отдаем index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
