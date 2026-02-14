// Конфігурація
const OWNER_PHONE = "+380000000000"; 
const ADMIN_PASSWORD = "admin55"; 

// Supabase Конфігурація
const SUPABASE_URL = 'https://usqxkzoerbebaighyuik.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ksAch6V-TJOTWYdzFyC9xw_8MFqYRU6';

// Ініціалізація Supabase (перевіряємо чи не ініціалізовано вже)
let supabase;
if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
supabase = window.supabaseClient;

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
            const { data, error } = await supabase.from('products').insert([newProduct]);
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
        const { data, error } = await supabase
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

// Видаляємо дубльовані старі обробники внизу файлу, вони тепер в initEventListeners
// Початковий рендер
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    fetchProducts();
    checkAuth();
});
