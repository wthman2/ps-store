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
    res.json(games);
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

  // В реальном приложении пароль должен быть захеширован и сохранен в базе данных
  // Здесь для простоты используем захардкоженный пароль
  if (password === "admin123") {
    // Создаем JWT токен
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Неверный пароль" });
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
