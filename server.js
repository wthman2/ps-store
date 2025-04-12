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
  const initialGames = require("./data/games.json");
  fs.writeFileSync(GAMES_FILE, JSON.stringify(initialGames, null, 2));
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
