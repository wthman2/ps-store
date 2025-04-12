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
  // Мобильное меню
  document
    .querySelector(".mobile-menu-toggle")
    .addEventListener("click", function () {
      document.querySelector("nav").classList.toggle("active");
    });
  // Поиск игр
  document.getElementById("game-search").addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    filterGames(searchTerm);
  });
  // Переключение темы
  document
    .getElementById("theme-toggle")
    .addEventListener("click", function (e) {
      e.preventDefault();
      toggleTheme();
    });
  // Вход в админ-панель
  document
    .getElementById("admin-login-link")
    .addEventListener("click", function (e) {
      e.preventDefault();
      showAdminLoginModal();
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

      // Отправляем запрос на сервер для аутентификации
      fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: password }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Неверный пароль");
          }
          return response.json();
        })
        .then((data) => {
          // Сохраняем токен в localStorage
          localStorage.setItem("adminToken", data.token);
          localStorage.setItem("adminSession", Date.now());
          document.getElementById("admin-login-modal").style.display = "none";
          showPage("admin");
          showNotification("Вы вошли в админ-панель");
        })
        .catch((error) => {
          console.error("Ошибка:", error);
          showNotification("Неверный пароль", "error");
        });
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
    return false;
  }

  // Обновляем время сессии
  localStorage.setItem("adminSession", now);
  return true;
}

// Простая функция хеширования для демонстрации
// Оставляем для совместимости, но не используем
function simpleHash(str) {
  return Array.from(str)
    .map((char) => char.charCodeAt(0))
    .join("-");
}

// Функция для загрузки игр с сервера
function loadGames() {
  // GET-запрос к серверу для получения списка игр
  fetch("/api/games")
    .then((response) => response.json())
    .then((games) => {
      renderGames(games);
    })
    .catch((error) => {
      console.error("Ошибка при загрузке игр:", error);
      showNotification("Не удалось загрузить игры", "error");

      // Если не удалось загрузить с сервера, пробуем использовать локальные данные
      const localGames = JSON.parse(localStorage.getItem("games")) || [];
      if (localGames.length > 0) {
        renderGames(localGames);
        showNotification("Загружены локальные данные", "warning");
      }
    });
}

// Функция для отображения игр в каталоге
function renderGames(games) {
  const gamesContainer = document.getElementById("games-container");
  gamesContainer.innerHTML = "";
  games.forEach((game) => {
    // Проверяем, доступна ли хотя бы одна версия игры
    const isAvailable =
      game.availableOffline || game.availableOnline || game.availableUniversal;
    const gameCard = document.createElement("div");
    gameCard.className = "game-card";
    gameCard.setAttribute("data-game", game.name);
    gameCard.setAttribute("data-id", game.id);
    gameCard.innerHTML = `
            <div class="game-image">
                <img src="${game.image}" alt="${game.name}">
                ${game.isNew ? '<div class="game-badge">Новинка</div>' : ""}
                <div class="availability-badge ${
                  isAvailable ? "" : "out-of-stock"
                }">${isAvailable ? "В наличии" : "Нет в наличии"}</div>
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

// Функция для фильтрации игр по поисковому запросу
function filterGames(searchTerm) {
  const gameCards = document.querySelectorAll(".game-card");
  gameCards.forEach((card) => {
    const gameName = card.getAttribute("data-game").toLowerCase();
    if (gameName.includes(searchTerm)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

// Функция для отображения деталей игры в модальном окне
function showGameDetails(game) {
  const modal = document.getElementById("game-modal");
  const modalContent = document.getElementById("game-modal-content");
  // Проверяем доступность версий
  const offlineAvailable = game.availableOffline;
  const onlineAvailable = game.availableOnline;
  const universalAvailable = game.availableUniversal;
  modalContent.innerHTML = `
        <div class="game-modal-header">
            <div class="game-modal-image">
                <img src="${game.image}" alt="${game.name}">
            </div>
            <div class="game-modal-info">
                <h2 class="game-modal-title">${game.name}</h2>
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
                    <div class="basket-item-version">${getVersionIcon(
                      item.version
                    )} ${item.version}</div>
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
    type === "error" ? "var(--error-color)" : "var(--success-color)"
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

  // Получаем список игр с сервера
  fetch("/api/games")
    .then((response) => response.json())
    .then((games) => {
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
    })
    .catch((error) => {
      console.error("Ошибка при загрузке игр:", error);
      showNotification("Не удалось загрузить список игр", "error");

      // Если не удалось загрузить с сервера, пробуем использовать локальные данные
      const games = JSON.parse(localStorage.getItem("games")) || [];
      if (games.length > 0) {
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

        showNotification("Загружены локальные данные", "warning");
      }
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

  // Получаем данные игры с сервера
  fetch(`/api/games/${gameId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Игра не найдена");
      }
      return response.json();
    })
    .then((game) => {
      // Заполняем форму данными игры
      document.getElementById("edit-game-id").value = game.id;
      document.getElementById("edit-game-name").value = game.name;
      document.getElementById("edit-game-description").value = game.description;
      document.getElementById("edit-game-image").value = game.image;
      document.getElementById("edit-price-offline").value = game.priceOffline;
      document.getElementById("edit-price-online").value = game.priceOnline;
      document.getElementById("edit-price-universal").value =
        game.priceUniversal;
      document.getElementById("edit-availability-offline").checked =
        game.availableOffline;
      document.getElementById("edit-availability-online").checked =
        game.availableOnline;
      document.getElementById("edit-availability-universal").checked =
        game.availableUniversal;
      document.getElementById("edit-is-new").checked = game.isNew;

      // Показываем модальное окно
      document.getElementById("edit-game-modal").style.display = "block";
    })
    .catch((error) => {
      console.error("Ошибка:", error);
      showNotification("Ошибка при загрузке данных игры", "error");

      // Если не удалось загрузить с сервера, пробуем использовать локальные данные
      const games = JSON.parse(localStorage.getItem("games")) || [];
      const game = games.find((g) => g.id === gameId);

      if (game) {
        // Заполняем форму данными игры
        document.getElementById("edit-game-id").value = game.id;
        document.getElementById("edit-game-name").value = game.name;
        document.getElementById("edit-game-description").value =
          game.description;
        document.getElementById("edit-game-image").value = game.image;
        document.getElementById("edit-price-offline").value = game.priceOffline;
        document.getElementById("edit-price-online").value = game.priceOnline;
        document.getElementById("edit-price-universal").value =
          game.priceUniversal;
        document.getElementById("edit-availability-offline").checked =
          game.availableOffline;
        document.getElementById("edit-availability-online").checked =
          game.availableOnline;
        document.getElementById("edit-availability-universal").checked =
          game.availableUniversal;
        document.getElementById("edit-is-new").checked = game.isNew;

        // Показываем модальное окно
        document.getElementById("edit-game-modal").style.display = "block";

        showNotification("Загружены локальные данные", "warning");
      } else {
        showNotification("Игра не найдена", "error");
      }
    });
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

  // PUT-запрос к серверу для обновления игры
  fetch(`/api/games/${gameId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("adminToken"),
    },
    body: JSON.stringify(updatedGame),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Ошибка при обновлении игры");
      }
      return response.json();
    })
    .then((data) => {
      // Закрываем модальное окно
      document.getElementById("edit-game-modal").style.display = "none";
      // Обновляем список игр
      renderAdminGamesList();
      // Обновляем каталог игр
      loadGames();
      showNotification("Игра успешно обновлена");
    })
    .catch((error) => {
      console.error("Ошибка:", error);
      showNotification(
        "Ошибка при обновлении игры. Попытка сохранить локально.",
        "warning"
      );

      // Если не удалось обновить на сервере, обновляем локально
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

        showNotification("Игра успешно обновлена локально", "warning");
      } else {
        showNotification("Игра не найдена", "error");
      }
    });
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
    // DELETE-запрос к серверу для удаления игры
    fetch(`/api/games/${gameId}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Ошибка при удалении игры");
        }
        return response.json();
      })
      .then((data) => {
        // Закрываем модальное окно
        document.getElementById("edit-game-modal").style.display = "none";
        // Обновляем список игр
        renderAdminGamesList();
        // Обновляем каталог игр
        loadGames();
        showNotification("Игра успешно удалена");
      })
      .catch((error) => {
        console.error("Ошибка:", error);
        showNotification(
          "Ошибка при удалении игры. Попытка удалить локально.",
          "warning"
        );

        // Если не удалось удалить на сервере, удаляем локально
        const games = JSON.parse(localStorage.getItem("games")) || [];
        const filteredGames = games.filter((g) => g.id !== gameId);

        localStorage.setItem("games", JSON.stringify(filteredGames));

        // Закрываем модальное окно
        document.getElementById("edit-game-modal").style.display = "none";
        // Обновляем список игр в админ-панели
        renderAdminGamesList();
        // Обновляем каталог игр
        renderGames(filteredGames);

        showNotification("Игра успешно удалена локально", "warning");
      });
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
    name: document.getElementById("game-name").value,
    description: document.getElementById("game-description").value,
    image: document.getElementById("game-image").value,
    priceOffline: parseInt(document.getElementById("price-offline").value),
    priceOnline: parseInt(document.getElementById("price-online").value),
    priceUniversal: parseInt(document.getElementById("price-universal").value),
    availableOffline: document.getElementById("availability-offline").checked,
    availableOnline: document.getElementById("availability-online").checked,
    availableUniversal: document.getElementById("availability-universal")
      .checked,
    isNew: document.getElementById("is-new").checked,
  };

  // POST-запрос к серверу для добавления игры
  fetch("/api/games", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("adminToken"),
    },
    body: JSON.stringify(newGame),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Ошибка при добавлении игры");
      }
      return response.json();
    })
    .then((data) => {
      // Сбрасываем форму
      document.getElementById("add-game-form").reset();
      // Переключаемся на вкладку со списком игр
      showAdminTab("games-list");
      // Обновляем список игр
      renderAdminGamesList();
      // Обновляем каталог игр
      loadGames();
      showNotification("Игра успешно добавлена");
    })
    .catch((error) => {
      console.error("Ошибка:", error);
      showNotification(
        "Ошибка при добавлении игры. Попытка сохранить локально.",
        "warning"
      );

      // Если не удалось добавить на сервере, добавляем локально
      const games = JSON.parse(localStorage.getItem("games")) || [];

      // Создаем новую игру с ID
      const gameWithId = {
        ...newGame,
        id: generateId(),
      };

      // Добавляем игру в массив
      games.push(gameWithId);

      // Сохраняем изменения
      localStorage.setItem("games", JSON.stringify(games));

      // Сбрасываем форму
      document.getElementById("add-game-form").reset();

      // Переключаемся на вкладку со списком игр
      showAdminTab("games-list");

      // Обновляем список игр в админ-панели
      renderAdminGamesList();

      // Обновляем каталог игр
      renderGames(games);

      showNotification("Игра успешно добавлена локально", "warning");
    });
}

// Функция для генерации уникального ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
