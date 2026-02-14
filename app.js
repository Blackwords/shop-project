// Конфігурація
const OWNER_PHONE = "+380000000000"; 
const ADMIN_PASSWORD = "admin55"; 

// Supabase Конфігурація
const SUPABASE_URL = 'https://usqxkzoerbebaighyuik.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ksAch6V-TJOTWYdzFyC9xw_8MFqYRU6';

// Ініціалізація Supabase
let sb;
if (typeof window.supabaseClientInstance === 'undefined') {
    window.supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
sb = window.supabaseClientInstance;

// DOM елементиTelegram налаштування тепер у script.js

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

// Функція ініціалізації подій
function initEventListeners() {
    console.log("Initializing Event Listeners...");

    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Login button clicked!");
            const password = prompt('Введіть пароль адміністратора:');
            if (password === ADMIN_PASSWORD) {
                sessionStorage.setItem('isAdmin', 'true');
                checkAuth();
            } else if (password !== null) {
                alert('Невірний пароль!');
            }
        });
    } else {
        console.error("CRITICAL: login-btn not found!");
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('isAdmin');
            checkAuth();
        });
    }

    if (adminTrigger) {
        adminTrigger.addEventListener('click', () => {
            adminModal.classList.remove('hidden');
            renderAdminList();
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            adminModal.classList.add('hidden');
        });
    }

    if (adminModal) {
        adminModal.addEventListener('click', (e) => {
            if (e.target === adminModal) {
                adminModal.classList.add('hidden');
            }
        });
    }

    if (photoFileInput) {
        photoFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    updatePreview(event.target.result);
                    if (photoUrlInput) photoUrlInput.value = '';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (photoUrlInput) {
        photoUrlInput.addEventListener('input', (e) => {
            const url = e.target.value;
            if (url) {
                updatePreview(url);
                if (photoFileInput) photoFileInput.value = '';
            } else {
                updatePreview('');
            }
        });
    }

    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
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
            const { data, error } = await sb.from('products').insert([newProduct]);
            if (error) {
                alert('Помилка при збереженні: ' + error.message);
                return;
            }
            fetchProducts();
            addProductForm.reset();
            updatePreview('');
            adminModal.classList.add('hidden');
        });
    }

    if (tgSettingsBtn) {
        tgSettingsBtn.addEventListener('click', () => {
            const action = confirm('Що ви хочете змінити?\nOK - Chat ID\nСкасувати - Токен бота');
            if (action) {
                const currentId = localStorage.getItem('tgChatId') || "";
                const newId = prompt('Введіть ваш Telegram Chat ID:', currentId);
                if (newId !== null && newId.trim() !== "") {
                    localStorage.setItem('tgChatId', newId.trim());
                    alert('Chat ID збережено!');
                }
            } else {
                const currentToken = localStorage.getItem('tgBotToken') || "";
                const newToken = prompt('Введіть новий токен бота:', currentToken);
                if (newToken !== null && newToken.trim() !== "") {
                    localStorage.setItem('tgBotToken', newToken.trim());
                    alert('Токен бота збережено! Перезавантаження...');
                    location.reload();
                }
            }
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (products.length === 0) return alert('Немає товарів');
            const dataStr = JSON.stringify(products);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', 'products.json');
            linkElement.click();
        });
    }

    if (importFileInput) {
        importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    if (Array.isArray(imported)) {
                        if (confirm('Замінити всі товари?')) {
                            products = imported;
                            saveAndRender();
                        }
                    }
                } catch (err) { alert('Помилка файлу'); }
            };
            reader.readAsText(file);
        });
    }
}

let currentPhotoData = ''; 

// Масив товарів
let products = [];

// Завантаження товарів з Supabase
async function fetchProducts() {
    console.log("Спроба завантажити товари з Supabase...");
    try {
        const { data, error } = await sb
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Помилка Supabase:', error.message);
            // Якщо таблиці немає, ми це побачимо в консолі
            return;
        }

        console.log("Товари завантажено успішно:", data);
        products = data;
        renderProducts();
        renderAdminList();
    } catch (err) {
        console.error('Критична помилка підключення:', err);
    }
}

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

// Функція відображення товарів на вітрині
function renderProducts() {
    if (!productList) return;
    productList.innerHTML = products.map(product => `
        <div class="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-2 border border-gray-50">
            <div class="aspect-[4/5] overflow-hidden relative">
                <img src="${product.photo || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000'}" 
                     alt="${product.name}" 
                     class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110">
                <div class="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-700"></div>
                <div class="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <button onclick="sendTelegramMessage('${product.name}')" 
                            class="w-full bg-black text-white py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-light hover:bg-zinc-800 transition-colors shadow-xl">
                        Замовити зараз
                    </button>
                </div>
            </div>
            <div class="p-8 text-center">
                <h3 class="text-xs uppercase tracking-[0.3em] font-light text-gray-400 mb-3">${product.name}</h3>
                <div class="h-px w-8 bg-black mx-auto mb-4 opacity-10"></div>
                <p class="text-lg font-light tracking-tight text-gray-900 mb-2">${product.price} ₴</p>
                ${product.description ? `<p class="text-xs text-gray-400 font-light leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-700">${product.description}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// Функція відображення списку в адмінці
function renderAdminList() {
    if (!adminProductList) return;
    adminProductList.innerHTML = products.map(product => `
        <div class="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 group hover:border-red-100 transition-all">
            <img src="${product.photo}" class="w-12 h-12 rounded-xl object-cover">
            <div class="flex-grow">
                <h4 class="text-sm font-medium text-gray-900">${product.name}</h4>
                <p class="text-xs text-gray-400">${product.price} ₴</p>
            </div>
            <button onclick="deleteProduct(${product.id})" class="p-2 text-gray-300 hover:text-red-500 transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
    `).join('');
}

// Функція видалення товару
async function deleteProduct(id) {
    if (!confirm('Ви впевнені, що хочете видалити цей товар?')) return;
    
    const { error } = await sb
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Помилка при видаленні: ' + error.message);
        return;
    }

    fetchProducts();
}

// Перевірка авторизації
function checkAuth() {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (isAdmin) {
        if (loginBtn) loginBtn.classList.add('hidden');
        if (adminControls) adminControls.classList.remove('hidden');
    } else {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (adminControls) adminControls.classList.add('hidden');
    }
}

// Видаляємо дубльовані старі обробники внизу файлу, вони тепер в initEventListeners
// Початковий рендер
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    fetchProducts();
    checkAuth();
});
