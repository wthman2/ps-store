// Инициализация приложения
document.addEventListener("DOMContentLoaded", function () {
  // Загрузка данных с сервера вместо localStorage
  loadGames();

  // Обработчики навигации
  setupNavigation();

  // Обработчики событий для модальных окон
  setupModalHandlers();

  // Обработчики для кнопок в hero-секции
  document
    .querySelector('[data-action="show-catalog"]')
    .addEventListener("click", function () {
      showPage("catalog");
    });

  document
    .querySelector('[data-action="how-it-works"]')
    .addEventListener("click", function () {
      showPage("how-it-works");
    });

  // Лого как ссылка на главную
  document.querySelector(".logo").addEventListener("click", function () {
    showPage("catalog");
  });

  // Мобильное меню
  document
    .querySelector(".mobile-menu-toggle")
    .addEventListener("click", function () {
      document.querySelector("nav").classList.toggle("active");
    });

  // Поиск игр
  document.getElementById("game-search").addEventListener("input", function () {
    applyFilters();
  });

  // Фильтры
  document
    .getElementById("genre-filter")
    .addEventListener("change", function () {
      applyFilters();
    });

  document
    .getElementById("ps-version-filter")
    .addEventListener("change", function () {
      applyFilters();
    });

  document
    .getElementById("availability-filter")
    .addEventListener("change", function () {
      applyFilters();
    });

  document.getElementById("price-min").addEventListener("input", function () {
    updatePriceSlider();
    applyFilters();
  });

  document.getElementById("price-max").addEventListener("input", function () {
    updatePriceSlider();
    applyFilters();
  });

  document.getElementById("price-range").addEventListener("input", function () {
    const value = this.value;
    document.getElementById("price-value-max").textContent = value + "₸";
    document.getElementById("price-max").value = value;
    applyFilters();
  });

  document
    .getElementById("reset-filters")
    .addEventListener("click", function () {
      resetFilters();
    });

  // Переключение темы
  document
    .getElementById("theme-toggle")
    .addEventListener("click", function (e) {
      e.preventDefault();
      toggleTheme();
    });

  // Вход в админ-панель через поиск
  document.getElementById("game-search").addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase().trim();
    if (searchTerm === "medet1977") {
      showAdminLoginModal();
      this.value = "";
    }
  });

  // Проверка темы
  checkTheme();

  // Проверка корзины при загрузке
  updateCartCounter();
});

// Функция для настройки навигации
function setupNavigation() {
  const navLinks = document.querySelectorAll("[data-page]");
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const page = this.getAttribute("data-page");
      showPage(page);
      // Закрыть мобильное меню если открыто
      document.querySelector("nav").classList.remove("active");
    });
  });
}

// Функция для отображения выбранной страницы
function showPage(pageId) {
  // Скрыть hero секцию если не главная страница
  if (pageId !== "catalog") {
    document.getElementById("hero").style.display = "none";
  } else {
    document.getElementById("hero").style.display = "flex";
  }

  // Скрыть все страницы
  const pages = document.querySelectorAll(".page");
  pages.forEach((page) => {
    page.style.display = "none";
  });

  // Показать выбранную страницу
  document.getElementById(pageId).style.display = "block";

  // Обновить активную ссылку в навигации
  const navLinks = document.querySelectorAll("[data-page]");
  navLinks.forEach((link) => {
    if (link.getAttribute("data-page") === pageId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Если открыта корзина, обновить её содержимое
  if (pageId === "basket") {
    renderBasket();
  } else if (pageId === "admin") {
    renderAdminGamesList();
  }

  // Прокрутить страницу вверх
  window.scrollTo(0, 0);
}

// Функция для настройки обработчиков модальных окон
function setupModalHandlers() {
  // Закрытие модальных окон при клике на крестик
  const closeButtons = document.querySelectorAll(".close-modal");
  closeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const modal = this.closest(".modal");
      modal.style.display = "none";
    });
  });

  // Закрытие модальных окон при клике вне содержимого
  window.addEventListener("click", function (e) {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
  });

  // Настройка формы входа в админ-панель с улучшенной защитой
  document
    .getElementById("admin-login-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      const password = document.getElementById("admin-password").value;

      // Проверка пароля (для демо используем простую проверку)
      if (password === "medet1977") {
        // Сохраняем сессию в localStorage
        localStorage.setItem("adminSession", Date.now());
        localStorage.setItem("adminToken", "demo-token");

        document.getElementById("admin-login-modal").style.display = "none";
        showPage("admin");
        showNotification("Вы вошли в админ-панель");

        // Показать ссылку на админ-панель
        document.getElementById("admin-login-link").style.display = "block";
      } else {
        showNotification("Неверный пароль", "error");
      }
    });

  // Настройка формы добавления игры
  document
    .getElementById("add-game-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      // Проверка сессии админа
      if (!checkAdminSession()) {
        showAdminLoginModal();
        showNotification(
          "Сессия администратора истекла. Пожалуйста, войдите снова.",
          "error"
        );
        return;
      }
      addNewGame();
    });

  // Настройка формы редактирования игры
  document
    .getElementById("edit-game-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      // Проверка сессии админа
      if (!checkAdminSession()) {
        showAdminLoginModal();
        showNotification(
          "Сессия администратора истекла. Пожалуйста, войдите снова.",
          "error"
        );
        return;
      }
      saveGameChanges();
    });

  // Кнопка удаления игры
  document.getElementById("delete-game").addEventListener("click", function () {
    // Проверка сессии админа
    if (!checkAdminSession()) {
      showAdminLoginModal();
      showNotification(
        "Сессия администратора истекла. Пожалуйста, войдите снова.",
        "error"
      );
      return;
    }
    const gameId = document.getElementById("edit-game-id").value;
    deleteGame(gameId);
  });

  // Кнопка отмены добавления игры
  document
    .getElementById("cancel-add-game")
    .addEventListener("click", function () {
      document.getElementById("add-game-form").reset();
      showAdminTab("games-list");
    });

  // Настройка табов в админ-панели
  const adminTabs = document.querySelectorAll(".admin-tab");
  adminTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab");
      showAdminTab(tabId);
    });
  });

  // Поиск в админ-панели
  document
    .getElementById("admin-search-input")
    .addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase();
      filterAdminGames(searchTerm);
    });
}

// Функция для проверки сессии администратора
function checkAdminSession() {
  const sessionTime = localStorage.getItem("adminSession");
  const token = localStorage.getItem("adminToken");

  if (!sessionTime || !token) return false;

  // Проверяем, не истекла ли сессия (30 минут)
  const now = Date.now();
  const sessionDuration = 30 * 60 * 1000; // 30 минут в миллисекундах

  if (now - sessionTime > sessionDuration) {
    // Сессия истекла, удаляем её
    localStorage.removeItem("adminSession");
    localStorage.removeItem("adminToken");
    document.getElementById("admin-login-link").style.display = "none";
    return false;
  }

  // Обновляем время сессии
  localStorage.setItem("adminSession", now);
  return true;
}

// Функция для загрузки игр с сервера
function loadGames() {
  // В демо-версии используем локальное хранилище
  let games = JSON.parse(localStorage.getItem("games"));

  // Если игр нет, создаем демо-данные
  if (!games || games.length === 0) {
    games = [
      {
        id: "1",
        name: "God of War Ragnarök",
        description:
          "Продолжение приключений Кратоса и Атрея в мире скандинавской мифологии. Игра предлагает эпические сражения, глубокий сюжет и потрясающую графику.",
        image:
          "https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png",
        priceOffline: 15000,
        priceOnline: 20000,
        priceUniversal: 30000,
        availableOffline: true,
        availableOnline: true,
        availableUniversal: true,
        isNew: true,
        genre: "action",
        psVersion: "ps5",
      },
      {
        id: "2",
        name: "Horizon Forbidden West",
        description:
          "Элой отправляется в опасное путешествие по таинственному западному региону, где её ждут новые машины и загадочная угроза.",
        image:
          "https://image.api.playstation.com/vulcan/ap/rnd/202107/3100/HO8vkR9dQMfHJXpVQMw9WmFX.png",
        priceOffline: 12000,
        priceOnline: 17000,
        priceUniversal: 25000,
        availableOffline: true,
        availableOnline: true,
        availableUniversal: false,
        isNew: false,
        genre: "adventure",
        psVersion: "both",
      },
      {
        id: "3",
        name: "Spider-Man 2",
        description:
          "Питер Паркер и Майлз Моралес объединяют силы в новом приключении. Сражайтесь с Веномом и другими злодеями в открытом мире Нью-Йорка.",
        image:
          "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7afc402d11f8e7c66bf8b7f9c4fed0a7c0e2d9e0d7f1c4.png",
        priceOffline: 18000,
        priceOnline: 22000,
        priceUniversal: 32000,
        availableOffline: true,
        availableOnline: true,
        availableUniversal: true,
        isNew: true,
        genre: "action",
        psVersion: "ps5",
      },
      {
        id: "4",
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
      {
        id: "5",
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
        id: "6",
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
    ];

    localStorage.setItem("games", JSON.stringify(games));
  }

  renderGames(games);
}

// Функция для отображения игр в каталоге
function renderGames(games) {
  const gamesContainer = document.getElementById("games-container");
  gamesContainer.innerHTML = "";

  if (games.length === 0) {
    gamesContainer.innerHTML = `
      <div class="empty-catalog">
        <i class="fas fa-search"></i>
        <p>Игры не найдены</p>
        <button class="btn secondary" id="reset-filters-empty">Сбросить фильтры</button>
      </div>
    `;

    document
      .getElementById("reset-filters-empty")
      .addEventListener("click", function () {
        resetFilters();
      });

    return;
  }

  games.forEach((game) => {
    // Проверяем, доступна ли хотя бы одна версия игры
    const isAvailable =
      game.availableOffline || game.availableOnline || game.availableUniversal;

    const gameCard = document.createElement("div");
    gameCard.className = "game-card";
    gameCard.setAttribute("data-game", game.name);
    gameCard.setAttribute("data-id", game.id);
    gameCard.setAttribute("data-genre", game.genre || "");
    gameCard.setAttribute("data-ps-version", game.psVersion || "");
    gameCard.setAttribute(
      "data-price",
      Math.min(
        game.availableOffline ? game.priceOffline : Infinity,
        game.availableOnline ? game.priceOnline : Infinity,
        game.availableUniversal ? game.priceUniversal : Infinity
      )
    );

    gameCard.innerHTML = `
      <div class="game-image">
        <img src="${game.image}" alt="${game.name}">
        ${game.isNew ? '<div class="game-badge">Новинка</div>' : ""}
        <div class="availability-badge ${isAvailable ? "" : "out-of-stock"}">${
      isAvailable ? "В наличии" : "Нет в наличии"
    }</div>
      </div>
      <div class="game-info">
        <div class="game-title">${game.name}</div>
        <div class="game-price">
          <span class="price">от ${game.priceOffline}₸</span>
          <button class="btn primary btn-sm">Подробнее</button>
        </div>
      </div>
    `;

    gameCard.addEventListener("click", function () {
      showGameDetails(game);
    });

    gamesContainer.appendChild(gameCard);
  });
}

// Функция для применения фильтров
function applyFilters() {
  const searchTerm = document.getElementById("game-search").value.toLowerCase();
  const genreFilter = document.getElementById("genre-filter").value;
  const psVersionFilter = document.getElementById("ps-version-filter").value;
  const availabilityFilter = document.getElementById(
    "availability-filter"
  ).value;
  const priceMin = parseInt(document.getElementById("price-min").value) || 0;
  const priceMax =
    parseInt(document.getElementById("price-max").value) || 50000;

  const allGames = JSON.parse(localStorage.getItem("games")) || [];

  // Фильтрация игр
  const filteredGames = allGames.filter((game) => {
    // Поиск по названию
    if (searchTerm && !game.name.toLowerCase().includes(searchTerm)) {
      return false;
    }

    // Фильтр по жанру
    if (genreFilter && game.genre !== genreFilter) {
      return false;
    }

    // Фильтр по версии PS
    if (psVersionFilter) {
      if (psVersionFilter === "both" && game.psVersion !== "both") {
        return false;
      } else if (
        psVersionFilter !== "both" &&
        game.psVersion !== psVersionFilter &&
        game.psVersion !== "both"
      ) {
        return false;
      }
    }

    // Фильтр по наличию
    if (availabilityFilter) {
      if (availabilityFilter === "available") {
        if (
          !game.availableOffline &&
          !game.availableOnline &&
          !game.availableUniversal
        ) {
          return false;
        }
      } else if (availabilityFilter === "offline" && !game.availableOffline) {
        return false;
      } else if (availabilityFilter === "online" && !game.availableOnline) {
        return false;
      } else if (
        availabilityFilter === "universal" &&
        !game.availableUniversal
      ) {
        return false;
      }
    }

    // Фильтр по цене
    const minPrice = Math.min(
      game.availableOffline ? game.priceOffline : Infinity,
      game.availableOnline ? game.priceOnline : Infinity,
      game.availableUniversal ? game.priceUniversal : Infinity
    );

    if (minPrice < priceMin || minPrice > priceMax) {
      return false;
    }

    return true;
  });

  renderGames(filteredGames);
}

// Функция для обновления ценового слайдера
function updatePriceSlider() {
  const minInput = document.getElementById("price-min");
  const maxInput = document.getElementById("price-max");
  const slider = document.getElementById("price-range");
  const minValue = document.getElementById("price-value-min");
  const maxValue = document.getElementById("price-value-max");

  const min = parseInt(minInput.value) || 0;
  const max = parseInt(maxInput.value) || 50000;

  minValue.textContent = min + "₸";
  maxValue.textContent = max + "₸";
  slider.value = max;
}

// Функция для сброса фильтров
function resetFilters() {
  document.getElementById("game-search").value = "";
  document.getElementById("genre-filter").value = "";
  document.getElementById("ps-version-filter").value = "";
  document.getElementById("availability-filter").value = "";
  document.getElementById("price-min").value = "";
  document.getElementById("price-max").value = "";
  document.getElementById("price-range").value = 50000;
  document.getElementById("price-value-min").textContent = "0₸";
  document.getElementById("price-value-max").textContent = "50000₸";

  // Загружаем все игры заново
  const allGames = JSON.parse(localStorage.getItem("games")) || [];
  renderGames(allGames);
}

// Функция для отображения деталей игры в модальном окне
function showGameDetails(game) {
  const modal = document.getElementById("game-modal");
  const modalContent = document.getElementById("game-modal-content");

  // Проверяем доступность версий
  const offlineAvailable = game.availableOffline;
  const onlineAvailable = game.availableOnline;
  const universalAvailable = game.availableUniversal;

  // Формируем информацию о версии PS
  let psVersionText = "";
  if (game.psVersion === "ps4") {
    psVersionText =
      '<span class="ps-version ps4"><i class="fab fa-playstation"></i> PS4</span>';
  } else if (game.psVersion === "ps5") {
    psVersionText =
      '<span class="ps-version ps5"><i class="fab fa-playstation"></i> PS5</span>';
  } else if (game.psVersion === "both") {
    psVersionText =
      '<span class="ps-version ps4"><i class="fab fa-playstation"></i> PS4</span> <span class="ps-version ps5"><i class="fab fa-playstation"></i> PS5</span>';
  }

  // Формируем информацию о жанре
  let genreText = "";
  switch (game.genre) {
    case "action":
      genreText = "Экшен";
      break;
    case "adventure":
      genreText = "Приключения";
      break;
    case "rpg":
      genreText = "RPG";
      break;
    case "shooter":
      genreText = "Шутер";
      break;
    case "sports":
      genreText = "Спортивная";
      break;
    case "racing":
      genreText = "Гонки";
      break;
    case "strategy":
      genreText = "Стратегия";
      break;
    default:
      genreText = "";
  }

  modalContent.innerHTML = `
    <div class="game-modal-header">
      <div class="game-modal-image">
        <img src="${game.image}" alt="${game.name}">
      </div>
      <div class="game-modal-info">
        <h2 class="game-modal-title">${game.name}</h2>
        <div class="game-meta">
          ${psVersionText}
          ${genreText ? `<span class="game-genre">${genreText}</span>` : ""}
          ${game.isNew ? '<span class="game-badge">Новинка</span>' : ""}
        </div>
        <p class="game-modal-description">${game.description}</p>
      </div>
    </div>
    
    <div class="version-compatibility-warning">
      <p><i class="fas fa-exclamation-triangle"></i> Обратите внимание: в один заказ можно добавить только игры одного типа (оффлайн или онлайн). Универсальные аккаунты всегда продаются отдельно.</p>
    </div>
    
    <div class="game-modal-versions">
      <h3 class="version-title">Выберите версию аккаунта:</h3>
      <div class="version-options">
        <div class="version-option ${
          offlineAvailable ? "" : "disabled"
        }" data-version="Offline" ${
    offlineAvailable ? "" : 'title="Нет в наличии"'
  }>
          <div class="version-name"><i class="fas fa-lock"></i> Оффлайн</div>
          <div class="version-description">Доступ к игре на 2 устройствах</div>
          <div class="version-price">${game.priceOffline}₸</div>
        </div>
        
        <div class="version-option ${
          onlineAvailable ? "" : "disabled"
        }" data-version="Online" ${
    onlineAvailable ? "" : 'title="Нет в наличии"'
  }>
          <div class="version-name"><i class="fas fa-globe"></i> Онлайн</div>
          <div class="version-description">Доступ к игре и онлайн режиму на 2 устройствах</div>
          <div class="version-price">${game.priceOnline}₸</div>
        </div>
        
        <div class="version-option ${
          universalAvailable ? "" : "disabled"
        }" data-version="Universal" ${
    universalAvailable ? "" : 'title="Нет в наличии"'
  }>
          <div class="version-name"><i class="fas fa-star"></i> Универсальный</div>
          <div class="version-description">Полный доступ на 1 устройстве</div>
          <div class="version-price">${game.priceUniversal}₸</div>
        </div>
      </div>
    </div>
    
    <div class="game-modal-actions">
      <button class="btn secondary" id="modal-back">Назад к каталогу</button>
      <button class="btn primary" id="modal-add-to-cart" disabled>Добавить в корзину</button>
    </div>
  `;

  // Обработчики для выбора версии
  const versionOptions = modalContent.querySelectorAll(
    ".version-option:not(.disabled)"
  );

  let selectedVersion = null;

  versionOptions.forEach((option) => {
    option.addEventListener("click", function () {
      versionOptions.forEach((opt) => opt.classList.remove("selected"));
      this.classList.add("selected");

      selectedVersion = {
        id: game.id,
        game: game.name,
        version: this.getAttribute("data-version"),
        price:
          this.getAttribute("data-version") === "Offline"
            ? game.priceOffline
            : this.getAttribute("data-version") === "Online"
            ? game.priceOnline
            : game.priceUniversal,
        image: game.image,
      };

      document.getElementById("modal-add-to-cart").removeAttribute("disabled");
    });
  });

  // Обработчик для кнопки "Назад к каталогу"
  document.getElementById("modal-back").addEventListener("click", function () {
    modal.style.display = "none";
  });

  // Обработчик для кнопки "Добавить в корзину"
  document
    .getElementById("modal-add-to-cart")
    .addEventListener("click", function () {
      if (selectedVersion) {
        // Получаем текущую версию из выбранного элемента
        const version = document
          .querySelector(".version-option.selected")
          .getAttribute("data-version");

        // Определяем цену в зависимости от версии
        let price = 0;
        if (version === "Offline") price = game.priceOffline;
        else if (version === "Online") price = game.priceOnline;
        else if (version === "Universal") price = game.priceUniversal;

        // Создаем объект для добавления в корзину
        const cartItem = {
          id: game.id,
          game: game.name,
          version: version,
          price: price,
          image: game.image,
        };

        addToCart(cartItem);
        modal.style.display = "none";

        // Показать уведомление
        showNotification(`Игра ${game.name} (${version}) добавлена в корзину`);
      }
    });

  modal.style.display = "block";
}

// Функция для добавления игры в корзину
function addToCart(item) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Проверяем совместимость версий в корзине
  if (cart.length > 0) {
    const cartVersion = cart[0].version;
    const newVersion = item.version;

    // Если в корзине есть универсальная версия или добавляется универсальная версия
    if (cartVersion === "Universal" || newVersion === "Universal") {
      showNotification(
        "Универсальные аккаунты нельзя комбинировать с другими версиями. Пожалуйста, оформите отдельный заказ.",
        "error"
      );
      return;
    }

    // Если версии не совпадают (Offline vs Online)
    if (
      (cartVersion === "Offline" && newVersion === "Online") ||
      (cartVersion === "Online" && newVersion === "Offline")
    ) {
      showNotification(
        "В один заказ можно добавить только игры одного типа (оффлайн или онлайн).",
        "error"
      );
      return;
    }
  }

  cart.push(item);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCounter();
}

// Функция для обновления счетчика товаров в корзине
function updateCartCounter() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const counter = document.querySelector(".cart-count");
  counter.textContent = cart.length;
}

// Функция для отображения содержимого корзины
function renderBasket() {
  const basketContainer = document.getElementById("basket-items");
  const basketSummary = document.getElementById("basket-summary");
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    basketContainer.innerHTML = `
      <div class="empty-basket">
        <i class="fas fa-shopping-cart"></i>
        <p>Ваша корзина пуста</p>
        <button class="btn primary" data-action="go-to-catalog">Перейти в каталог</button>
      </div>
    `;

    basketSummary.innerHTML = "";

    document
      .querySelector('[data-action="go-to-catalog"]')
      .addEventListener("click", function () {
        showPage("catalog");
      });

    return;
  }

  let basketHTML = "";
  let totalPrice = 0;

  cart.forEach((item, index) => {
    basketHTML += `
      <div class="basket-item">
        <div class="basket-item-image">
          <img src="${item.image}" alt="${item.game}">
        </div>
        <div class="basket-item-info">
          <div class="basket-item-title">${item.game}</div>
          <div class="basket-item-version">${getVersionIcon(item.version)} ${
      item.version
    }</div>
        </div>
        <div class="basket-item-price">${item.price}₸</div>
        <div class="basket-item-remove" data-index="${index}">
          <i class="fas fa-trash-alt"></i>
        </div>
      </div>
    `;

    totalPrice += item.price;
  });

  basketContainer.innerHTML = basketHTML;

  basketSummary.innerHTML = `
    <div class="basket-total">
      <span>Итого:</span>
      <span class="basket-total-price">${totalPrice}₸</span>
    </div>
    <div class="basket-actions">
      <button class="btn secondary" data-action="continue-shopping">Продолжить покупки</button>
      <button class="btn primary" data-action="checkout">Оформить заказ</button>
    </div>
  `;

  // Обработчики для кнопок удаления товаров
  const removeButtons = document.querySelectorAll(".basket-item-remove");
  removeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const index = parseInt(this.getAttribute("data-index"));
      removeFromCart(index);
      renderBasket();
    });
  });

  // Обработчик для кнопки "Продолжить покупки"
  document
    .querySelector('[data-action="continue-shopping"]')
    .addEventListener("click", function () {
      showPage("catalog");
    });

  // Обработчик для кнопки "Оформить заказ"
  document
    .querySelector('[data-action="checkout"]')
    .addEventListener("click", function () {
      proceedToWhatsApp();
    });
}

// Функция для удаления товара из корзины
function removeFromCart(index) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCounter();

  // Показать уведомление
  showNotification("Товар удален из корзины");
}

// Функция для перехода в WhatsApp с информацией о заказе
function proceedToWhatsApp() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    return;
  }

  // Формируем текст сообщения
  let message = "Здравствуйте! Хочу оформить заказ:\n\n";

  // Добавляем информацию о консоли (запрашиваем у пользователя)
  const consoleType = prompt("Укажите вашу консоль (PS4 или PS5):", "PS5");

  if (consoleType) {
    message += `Консоль: ${consoleType}\n\n`;
  }

  // Добавляем список игр
  message += "Игры:\n";
  let totalPrice = 0;

  cart.forEach((item, index) => {
    message += `${index + 1}. ${item.game} (${item.version}) - ${
      item.price
    }₸\n`;
    totalPrice += item.price;
  });

  message += `\nОбщая сумма: ${totalPrice}₸`;

  // Кодируем сообщение для URL
  const encodedMessage = encodeURIComponent(message);

  // Формируем ссылку на WhatsApp
  const whatsappLink = `https://wa.me/77766707172?text=${encodedMessage}`;

  // Очищаем корзину
  localStorage.setItem("cart", JSON.stringify([]));
  updateCartCounter();

  // Показать уведомление
  showNotification("Переходим в WhatsApp для оформления заказа");

  // Открываем WhatsApp в новой вкладке
  setTimeout(() => {
    window.open(whatsappLink, "_blank");
  }, 1000);
}

// Функция для отображения уведомления
function showNotification(message, type = "success") {
  // Удаляем предыдущие уведомления
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((notification) => {
    document.body.removeChild(notification);
  });

  // Создаем элемент уведомления
  const notification = document.createElement("div");
  notification.className = "notification";

  // Определяем иконку в зависимости от типа уведомления
  let icon = "check-circle";
  if (type === "error") icon = "exclamation-circle";
  else if (type === "warning") icon = "exclamation-triangle";
  else if (type === "info") icon = "info-circle";

  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${icon}" style="color: ${
    type === "error"
      ? "var(--error-color)"
      : type === "warning"
      ? "var(--warning-color)"
      : "var(--success-color)"
  }"></i>
      <span>${message}</span>
    </div>
  `;

  // Добавляем уведомление в DOM
  document.body.appendChild(notification);

  // Автоматическое скрытие через 3 секунды
  setTimeout(() => {
    notification.classList.add("hide");

    // Удаление элемента после завершения анимации
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Вспомогательная функция для получения иконки версии
function getVersionIcon(version) {
  switch (version) {
    case "Offline":
      return '<i class="fas fa-lock"></i>';
    case "Online":
      return '<i class="fas fa-globe"></i>';
    case "Universal":
      return '<i class="fas fa-star"></i>';
    default:
      return "";
  }
}

// Функция для переключения темы
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  // Обновляем иконку
  const themeIcon = document.querySelector("#theme-toggle i");

  if (newTheme === "dark") {
    themeIcon.className = "fas fa-sun";
  } else {
    themeIcon.className = "fas fa-moon";
  }
}

// Функция для проверки сохраненной темы
function checkTheme() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Обновляем иконку
    const themeIcon = document.querySelector("#theme-toggle i");

    if (savedTheme === "dark") {
      themeIcon.className = "fas fa-sun";
    } else {
      themeIcon.className = "fas fa-moon";
    }
  }
}

// Функция для отображения модального окна входа в админ-панель
function showAdminLoginModal() {
  document.getElementById("admin-password").value = "";
  document.getElementById("admin-login-modal").style.display = "block";
}

// Функция для отображения выбранной вкладки в админ-панели
function showAdminTab(tabId) {
  // Проверка сессии админа
  if (!checkAdminSession()) {
    showAdminLoginModal();
    showNotification(
      "Сессия администратора истекла. Пожалуйста, войдите снова.",
      "error"
    );
    return;
  }

  // Обновляем активную вкладку
  const tabs = document.querySelectorAll(".admin-tab");
  tabs.forEach((tab) => {
    if (tab.getAttribute("data-tab") === tabId) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  // Скрываем все контейнеры вкладок
  const tabContents = document.querySelectorAll(".admin-content");
  tabContents.forEach((content) => {
    content.style.display = "none";
  });

  // Показываем выбранный контейнер
  document.getElementById(tabId).style.display = "block";
}

// Функция для отображения списка игр в админ-панели
function renderAdminGamesList() {
  // Проверка сессии админа
  if (!checkAdminSession()) {
    showAdminLoginModal();
    showNotification(
      "Сессия администратора истекла. Пожалуйста, войдите снова.",
      "error"
    );
    return;
  }

  // Получаем список игр из localStorage
  const games = JSON.parse(localStorage.getItem("games")) || [];
  const gamesList = document.getElementById("admin-games-list");
  let html = "";

  games.forEach((game) => {
    html += `
      <tr data-id="${game.id}">
        <td>${game.name}</td>
        <td>${game.priceOffline}₸</td>
        <td>${game.priceOnline}₸</td>
        <td>${game.priceUniversal}₸</td>
        <td>
          ${
            game.availableOffline
              ? '<span class="badge success">Оффлайн</span>'
              : ""
          }
          ${
            game.availableOnline
              ? '<span class="badge success">Онлайн</span>'
              : ""
          }
          ${
            game.availableUniversal
              ? '<span class="badge success">Универсал</span>'
              : ""
          }
        </td>
        <td>
          <button class="btn btn-sm primary edit-game" data-id="${
            game.id
          }">Редактировать</button>
        </td>
      </tr>
    `;
  });

  gamesList.innerHTML = html;

  // Добавляем обработчики для кнопок редактирования
  const editButtons = document.querySelectorAll(".edit-game");
  editButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const gameId = this.getAttribute("data-id");
      showEditGameModal(gameId);
    });
  });
}

// Функция для фильтрации игр в админ-панели
function filterAdminGames(searchTerm) {
  const rows = document.querySelectorAll("#admin-games-list tr");

  rows.forEach((row) => {
    const gameName = row.querySelector("td").textContent.toLowerCase();

    if (gameName.includes(searchTerm)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

// Функция для отображения модального окна редактирования игры
function showEditGameModal(gameId) {
  // Проверка сессии админа
  if (!checkAdminSession()) {
    showAdminLoginModal();
    showNotification(
      "Сессия администратора истекла. Пожалуйста, войдите снова.",
      "error"
    );
    return;
  }

  // Получаем данные игры из localStorage
  const games = JSON.parse(localStorage.getItem("games")) || [];
  const game = games.find((g) => g.id === gameId);

  if (game) {
    // Заполняем форму данными игры
    document.getElementById("edit-game-id").value = game.id;
    document.getElementById("edit-game-name").value = game.name;
    document.getElementById("edit-game-description").value = game.description;
    document.getElementById("edit-game-image").value = game.image;
    document.getElementById("edit-game-genre").value = game.genre || "action";
    document.getElementById("edit-ps-version").value = game.psVersion || "ps4";
    document.getElementById("edit-price-offline").value = game.priceOffline;
    document.getElementById("edit-price-online").value = game.priceOnline;
    document.getElementById("edit-price-universal").value = game.priceUniversal;
    document.getElementById("edit-availability-offline").checked =
      game.availableOffline;
    document.getElementById("edit-availability-online").checked =
      game.availableOnline;
    document.getElementById("edit-availability-universal").checked =
      game.availableUniversal;
    document.getElementById("edit-is-new").checked = game.isNew;

    // Показываем модальное окно
    document.getElementById("edit-game-modal").style.display = "block";
  } else {
    showNotification("Игра не найдена", "error");
  }
}

// Функция для сохранения изменений игры
function saveGameChanges() {
  // Проверка сессии админа
  if (!checkAdminSession()) {
    showAdminLoginModal();
    showNotification(
      "Сессия администратора истекла. Пожалуйста, войдите снова.",
      "error"
    );
    return;
  }

  const gameId = document.getElementById("edit-game-id").value;

  // Обновляем данные игры
  const updatedGame = {
    id: gameId,
    name: document.getElementById("edit-game-name").value,
    description: document.getElementById("edit-game-description").value,
    image: document.getElementById("edit-game-image").value,
    genre: document.getElementById("edit-game-genre").value,
    psVersion: document.getElementById("edit-ps-version").value,
    priceOffline: parseInt(document.getElementById("edit-price-offline").value),
    priceOnline: parseInt(document.getElementById("edit-price-online").value),
    priceUniversal: parseInt(
      document.getElementById("edit-price-universal").value
    ),
    availableOffline: document.getElementById("edit-availability-offline")
      .checked,
    availableOnline: document.getElementById("edit-availability-online")
      .checked,
    availableUniversal: document.getElementById("edit-availability-universal")
      .checked,
    isNew: document.getElementById("edit-is-new").checked,
  };

  // Обновляем игру в localStorage
  const games = JSON.parse(localStorage.getItem("games")) || [];
  const gameIndex = games.findIndex((g) => g.id === gameId);

  if (gameIndex !== -1) {
    games[gameIndex] = updatedGame;
    localStorage.setItem("games", JSON.stringify(games));

    // Закрываем модальное окно
    document.getElementById("edit-game-modal").style.display = "none";

    // Обновляем список игр в админ-панели
    renderAdminGamesList();

    // Обновляем каталог игр
    renderGames(games);

    showNotification("Игра успешно обновлена");
  } else {
    showNotification("Игра не найдена", "error");
  }
}

// Функция для удаления игры
function deleteGame(gameId) {
  // Проверка сессии админа
  if (!checkAdminSession()) {
    showAdminLoginModal();
    showNotification(
      "Сессия администратора истекла. Пожалуйста, войдите снова.",
      "error"
    );
    return;
  }

  if (confirm("Вы уверены, что хотите удалить эту игру?")) {
    // Удаляем игру из localStorage
    const games = JSON.parse(localStorage.getItem("games")) || [];
    const filteredGames = games.filter((g) => g.id !== gameId);

    localStorage.setItem("games", JSON.stringify(filteredGames));

    // Закрываем модальное окно
    document.getElementById("edit-game-modal").style.display = "none";

    // Обновляем список игр в админ-панели
    renderAdminGamesList();

    // Обновляем каталог игр
    renderGames(filteredGames);

    showNotification("Игра успешно удалена");
  }
}

// Функция для добавления новой игры
function addNewGame() {
  // Проверка сессии админа
  if (!checkAdminSession()) {
    showAdminLoginModal();
    showNotification(
      "Сессия администратора истекла. Пожалуйста, войдите снова.",
      "error"
    );
    return;
  }

  // Создаем новую игру
  const newGame = {
    id: generateId(),
    name: document.getElementById("game-name").value,
    description: document.getElementById("game-description").value,
    image: document.getElementById("game-image").value,
    genre: document.getElementById("game-genre").value,
    psVersion: document.getElementById("ps-version").value,
    priceOffline: parseInt(document.getElementById("price-offline").value),
    priceOnline: parseInt(document.getElementById("price-online").value),
    priceUniversal: parseInt(document.getElementById("price-universal").value),
    availableOffline: document.getElementById("availability-offline").checked,
    availableOnline: document.getElementById("availability-online").checked,
    availableUniversal: document.getElementById("availability-universal")
      .checked,
    isNew: document.getElementById("is-new").checked,
  };

  // Добавляем игру в localStorage
  const games = JSON.parse(localStorage.getItem("games")) || [];
  games.push(newGame);
  localStorage.setItem("games", JSON.stringify(games));

  // Сбрасываем форму
  document.getElementById("add-game-form").reset();

  // Переключаемся на вкладку со списком игр
  showAdminTab("games-list");

  // Обновляем список игр в админ-панели
  renderAdminGamesList();

  // Обновляем каталог игр
  renderGames(games);

  showNotification("Игра успешно добавлена");
}

// Функция для генерации уникального ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
