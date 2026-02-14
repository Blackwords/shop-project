// Конфігурація
const OWNER_PHONE = "+380000000000"; 
const ADMIN_PASSWORD = "admin55"; 

// Telegram налаштування тепер у script.js

// DOM елементи
const productList = document.getElementById('product-list');
const adminTrigger = document.getElementById('admin-trigger');
const tgSettingsBtn = document.getElementById('tg-settings-btn');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const adminControls = document.getElementById('admin-controls');
const adminModal = document.getElementById('admin-modal');
const closeModal = document.getElementById('close-modal');
const addProductForm = document.getElementById('add-product-form');
const adminProductList = document.getElementById('admin-product-list');
const photoUrlInput = document.getElementById('photo-url');
const photoFileInput = document.getElementById('photo-file');
const photoPreviewSmall = document.getElementById('photo-preview-small');
const exportBtn = document.getElementById('export-btn');
const importFileInput = document.getElementById('import-file');

let currentPhotoData = ''; 

// Завантаження товарів з localStorage
let products = JSON.parse(localStorage.getItem('products')) || [];

// Функція для оновлення прев'ю
function updatePreview(source) {
    if (source) {
        photoPreviewSmall.innerHTML = `<img src="${source}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='❌'">`;
        currentPhotoData = source;
    } else {
        photoPreviewSmall.innerHTML = '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-width="1"/></svg>';
        currentPhotoData = '';
    }
}

// Обробка вибору файлу
photoFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            updatePreview(event.target.result);
            photoUrlInput.value = ''; // Очищаємо url якщо вибрано файл
        };
        reader.readAsDataURL(file);
    }
});

// Обробка введення URL
photoUrlInput.addEventListener('input', (e) => {
    const url = e.target.value;
    if (url) {
        updatePreview(url);
        photoFileInput.value = ''; // Очищаємо файл якщо введено url
    } else {
        updatePreview('');
    }
});

// Додавання товару
addProductForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!currentPhotoData) {
        alert('Будь ласка, додайте фото товару');
        return;
    }

    const newProduct = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        price: document.getElementById('price').value,
        photo: currentPhotoData
    };
    
    products.push(newProduct);
    saveAndRender();
    
    // Скидання форми та закриття
    addProductForm.reset();
    updatePreview('');
    adminModal.classList.add('hidden');
});

// Функція sendTelegramMessage тепер визначена у script.js

// Функція для рендеру списку в адмінці
function renderAdminList() {
    adminProductList.innerHTML = '';
    
    if (products.length === 0) {
        adminProductList.innerHTML = '<p class="text-gray-400 font-light italic text-center py-10">Список порожній</p>';
        return;
    }

    products.forEach((product, index) => {
        const item = document.createElement('div');
        item.className = 'bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-gray-100 group';
        item.innerHTML = `
            <img src="${product.photo}" class="w-12 h-12 rounded-lg object-cover bg-gray-50">
            <div class="flex-grow min-w-0">
                <h4 class="font-medium text-gray-900 truncate">${product.name}</h4>
                <p class="text-sm text-gray-400">${product.price} ₴</p>
            </div>
            <button onclick="deleteProduct(${index})" class="p-2 text-gray-300 hover:text-red-500 transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        `;
        adminProductList.appendChild(item);
    });
}

// Функція для рендеру товарів
function renderProducts() {
    productList.innerHTML = '';
    
    if (products.length === 0) {
        productList.innerHTML = `
            <div class="col-span-full text-center py-32">
                <div class="mb-6 opacity-20">
                    <svg class="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                </div>
                <p class="text-3xl text-gray-300 font-light">Ваша вітрина порожня</p>
                <p class="mt-2 text-gray-400 font-light">Натисніть "Налаштування вітрини" внизу, щоб додати товари</p>
            </div>
        `;
        return;
    }

    products.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = 'group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 flex flex-col h-full border border-gray-100/50';
        
        const photoUrl = product.photo || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop';

        productCard.innerHTML = `
            <div class="aspect-[4/5] overflow-hidden bg-gray-50">
                <img src="${photoUrl}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out">
            </div>
            <div class="p-10 flex flex-col flex-grow">
                <div class="mb-6">
                    <div class="flex justify-between items-baseline gap-4 mb-2">
                        <h3 class="text-3xl font-normal tracking-tight text-gray-900">${product.name}</h3>
                        <span class="text-2xl font-light text-gray-400 whitespace-nowrap">${product.price} ₴</span>
                    </div>
                    <p class="text-lg text-gray-500 font-light leading-relaxed line-clamp-3">${product.description || ''}</p>
                </div>
                <div class="mt-auto space-y-3">
                    <button onclick="sendTelegramMessage('${product.name}')" class="block w-full text-center py-5 px-8 rounded-2xl bg-[#0088cc] text-white hover:bg-[#0077b5] transition-all duration-300 text-xl font-light tracking-wide shadow-lg shadow-[#0088cc]/10 active:scale-[0.98] flex items-center justify-center gap-2">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.52-.46-.01-1.33-.26-1.98-.48-.8-.27-1.43-.42-1.37-.89.03-.25.38-.51 1.03-.78 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.13-.03.19z"/></svg>
                        Замовити в Telegram
                    </button>
                    <a href="tel:${OWNER_PHONE}" class="block w-full text-center py-4 px-8 rounded-2xl border border-gray-100 text-gray-400 hover:text-black hover:border-black transition-all duration-300 text-lg font-light tracking-wide">
                        Зателефонувати
                    </a>
                </div>
            </div>
        `;
        productList.appendChild(productCard);
    });
}

// Функція для видалення товару
window.deleteProduct = function(index) {
    if (confirm('Ви впевнені, що хочете видалити цей товар?')) {
        products.splice(index, 1);
        saveAndRender();
    }
};

// Збереження в localStorage та рендер
function saveAndRender() {
    localStorage.setItem('products', JSON.stringify(products));
    renderProducts();
    renderAdminList();
}

// Функція перевірки авторизації
function checkAuth() {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (isAdmin) {
        loginBtn.classList.add('hidden');
        adminControls.classList.remove('hidden');
    } else {
        loginBtn.classList.remove('hidden');
        adminControls.classList.add('hidden');
    }
}

// Логіка входу
loginBtn.addEventListener('click', () => {
    const password = prompt('Введіть пароль адміністратора:');
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('isAdmin', 'true');
        checkAuth();
    } else if (password !== null) {
        alert('Невірний пароль!');
    }
});

// Функція виходу
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('isAdmin');
    checkAuth();
});

// Налаштування Telegram
tgSettingsBtn.addEventListener('click', () => {
    const action = confirm('Що ви хочете змінити?\nOK - Chat ID (куди приходять повідомлення)\nСкасувати - Токен бота');
    
    if (action) {
        // Зміна Chat ID
        const currentId = localStorage.getItem('tgChatId') || "";
        const newId = prompt('Введіть ваш Telegram Chat ID:', currentId);
        if (newId !== null && newId.trim() !== "") {
            localStorage.setItem('tgChatId', newId.trim());
            alert('Chat ID збережено!');
        }
    } else {
        // Зміна Токена
        const currentToken = localStorage.getItem('tgBotToken') || "";
        const newToken = prompt('Введіть новий токен бота:', currentToken);
        if (newToken !== null && newToken.trim() !== "") {
            localStorage.setItem('tgBotToken', newToken.trim());
            alert('Токен бота збережено! Сторінка буде перезавантажена для застосування змін.');
            location.reload();
        }
    }
});

// Експорт даних
exportBtn.addEventListener('click', () => {
    if (products.length === 0) {
        alert('Немає товарів для експорту');
        return;
    }
    const dataStr = JSON.stringify(products);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'vitrina_products.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
});

// Імпорт даних
importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedProducts = JSON.parse(event.target.result);
            if (Array.isArray(importedProducts)) {
                if (confirm('Це замінить всі ваші поточні товари. Продовжити?')) {
                    products = importedProducts;
                    saveAndRender();
                    alert('Дані успішно імпортовано!');
                }
            } else {
                alert('Невірний формат файлу');
            }
        } catch (err) {
            alert('Помилка при читанні файлу');
        }
    };
    reader.readAsText(file);
});

// Обробка модального вікна
adminTrigger.addEventListener('click', () => {
    adminModal.classList.remove('hidden');
    renderAdminList();
});

closeModal.addEventListener('click', () => {
    adminModal.classList.add('hidden');
});

// Закриття при кліку поза модалкою
adminModal.addEventListener('click', (e) => {
    if (e.target === adminModal) {
        adminModal.classList.add('hidden');
    }
});


// Початковий рендер
renderProducts();
checkAuth();
