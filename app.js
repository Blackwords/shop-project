// Конфігурація
const OWNER_PHONE = "+380000000000"; 
// const ADMIN_PASSWORD = "admin55"; // Пароль тепер у storeSettings

// Supabase Конфігурація
const SUPABASE_URL = 'https://usqxkzoerbebaighyuik.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ksAch6V-TJOTWYdzFyC9xw_8MFqYRU6';

// Функція перемикання видимості паролю
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const svg = button.querySelector('svg');

    if (input.type === 'password') {
        input.type = 'text';
        // Eye Off icon
        svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />';
    } else {
        input.type = 'password';
        // Eye icon
        svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
    }
}

// Функція відправки замовлення на Email
async function sendEmailOrder(cartItems, totalAmount) {
    if (!storeSettings.email) {
        // Email for notifications is not set
        return;
    }

    // Отримуємо дані покупця
    const customerName = document.getElementById('customer-name')?.value || 'Не вказано';
    const customerPhone = document.getElementById('customer-phone')?.value || 'Не вказано';
    const customerEmail = document.getElementById('customer-email')?.value || '';

    // Формуємо деталі замовлення
    const orderDetails = cartItems.map(item => 
        `${item.name} (${item.quantity} шт.) - ${item.price} ${storeSettings.currency}`
    ).join('\n');

    const totalStr = `${totalAmount.toLocaleString()} ${storeSettings.currency}`;
    const dateStr = new Date().toLocaleString('uk-UA');

    // Параметри для шаблону EmailJS
    const templateParams = {
        to_email: storeSettings.email,
        store_name: storeSettings.name,
        order_details: orderDetails,
        total_amount: totalStr,
        order_date: dateStr,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail
    };

    try {
        // Відправка через EmailJS
        await emailjs.send('service_621igog', 'template_dsnkd4r', templateParams);
        showToast('Копія замовлення надіслана на пошту', 'success');
    } catch (error) {
        // Не показуємо помилку користувачу, щоб не лякати, але логуємо
    }
}

// Функціонал входу для покупця
function initUserAuth() {
    if (!userLoginBtn || !userModal) return;

    // Відкриття модального вікна
    userLoginBtn.addEventListener('click', () => {
        userModal.classList.remove('hidden');
        // Анімація появи
        setTimeout(() => {
            userModal.classList.remove('opacity-0');
            userModal.querySelector('div').classList.remove('scale-95');
            userModal.querySelector('div').classList.add('scale-100');
        }, 10);

        // Заповнення полів, якщо дані вже є
        const user = JSON.parse(localStorage.getItem('customerData') || '{}');
        if (user.name) {
            document.getElementById('user-login-name').value = user.name;
            document.getElementById('user-login-phone').value = user.phone;
            document.getElementById('user-login-email').value = user.email || '';
            userLogoutBtn.classList.remove('hidden');
        } else {
            userLogoutBtn.classList.add('hidden');
        }
    });

    // Закриття модального вікна
    const closeModal = () => {
        userModal.classList.add('opacity-0');
        userModal.querySelector('div').classList.remove('scale-100');
        userModal.querySelector('div').classList.add('scale-95');
        setTimeout(() => {
            userModal.classList.add('hidden');
        }, 300);
    };

    if (closeUserModal) closeUserModal.addEventListener('click', closeModal);
    
    // Закриття по кліку на фон
    userModal.addEventListener('click', (e) => {
        if (e.target === userModal) closeModal();
    });

    // Обробка форми входу
    if (userLoginForm) {
        userLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('user-login-name').value.trim();
            const phone = document.getElementById('user-login-phone').value.trim();
            const email = document.getElementById('user-login-email').value.trim();

            if (!name || !phone) {
                showToast("Будь ласка, введіть ім'я та телефон", "error");
                return;
            }

            const customerData = { name, phone, email };
            localStorage.setItem('customerData', JSON.stringify(customerData));
            
            showToast(`Вітаємо, ${name}!`, "success");
            checkUserAuth(); // Оновити UI
            closeModal();
            
            // Якщо кошик відкритий, оновити поля там теж
            updateCartCustomerData();
        });
    }

    // Вихід
    if (userLogoutBtn) {
        userLogoutBtn.addEventListener('click', () => {
            if (confirm('Ви впевнені, що хочете вийти? Ваші дані будуть видалені з цього пристрою.')) {
                localStorage.removeItem('customerData');
                document.getElementById('user-login-form').reset();
                checkUserAuth();
                closeModal();
                showToast('Ви вийшли з системи', 'success');
            }
        });
    }

    // Перевірка при завантаженні
    checkUserAuth();
}

function checkUserAuth() {
    const user = JSON.parse(localStorage.getItem('customerData') || 'null');
    if (user && userLoginBtn) {
        // Змінюємо іконку на "активну" або показуємо галочку
        userLoginBtn.innerHTML = `
            <div class="relative">
                <svg class="w-6 h-6 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <div class="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white dark:border-dark-bg">
                    <svg class="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>
        `;
        userLoginBtn.title = `Ви увійшли як ${user.name}`;
    } else if (userLoginBtn) {
        // Повертаємо звичайну іконку
        userLoginBtn.innerHTML = `
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        `;
        userLoginBtn.title = "Вхід для покупця";
    }
}

function updateCartCustomerData() {
    const user = JSON.parse(localStorage.getItem('customerData') || 'null');
    if (user) {
        const nameInput = document.getElementById('customer-name');
        const phoneInput = document.getElementById('customer-phone');
        const emailInput = document.getElementById('customer-email');

        if (nameInput) nameInput.value = user.name;
        if (phoneInput) phoneInput.value = user.phone;
        if (emailInput) emailInput.value = user.email || '';
    }
}

// Ініціалізація Supabase
let sb;
if (typeof window.supabaseClientInstance === 'undefined') {
    window.supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
sb = window.supabaseClientInstance;

// DOM елементи

const productList = document.getElementById('product-list');
const searchInput = document.getElementById('search-input');
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
const seedBtn = document.getElementById('seed-btn');
const exportBtn = document.getElementById('export-btn');
const importFileInput = document.getElementById('import-file');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const ordersList = document.getElementById('orders-list');
const totalSalesEl = document.getElementById('total-sales');
const submitBtnText = document.getElementById('submit-btn-text');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const settingStoreName = document.getElementById('setting-store-name');
const settingEmail = document.getElementById('setting-email');
const settingCurrency = document.getElementById('setting-currency');
const settingEmailNotification = document.getElementById('setting-email-notification');
const saveSettingsBtn = document.getElementById('save-settings-btn');

// Cart Elements
const cartBtn = document.getElementById('cart-btn');
const cartCountEl = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const cartPanel = document.getElementById('cart-panel');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

// User Auth Elements
const userLoginBtn = document.getElementById('user-login-btn');
const userModal = document.getElementById('user-modal');
const closeUserModal = document.getElementById('close-user-modal');
const userLoginForm = document.getElementById('user-login-form');
const userLogoutBtn = document.getElementById('user-logout-btn');

// Store Settings State
let storeSettings = {
    name: 'MY STORE',
    email: 'owner@example.com',
    currency: '₴',
    adminEmail: 'admin@example.com',
    adminPassword: 'admin55',
    emailNotification: false
};

// Cart State
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];

// Функція ініціалізації подій
function initEventListeners() {
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const password = prompt('Введіть пароль адміністратора:');
            if (password === storeSettings.adminPassword) {
                sessionStorage.setItem('isAdmin', 'true');
                checkAuth();
            } else if (password !== null) {
                alert('Невірний пароль!');
            }
        });
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
            fetchOrders(); // Завантажуємо статистику при відкритті
        });
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', async () => {
            if (!confirm('Видалити всю історію замовлень? Цю дію неможливо скасувати.')) return;
            
            const { error } = await sb.from('orders').delete().neq('id', 0); // Видаляємо всі
            
            if (error) {
                alert('Помилка видалення: ' + error.message);
            } else {
                fetchOrders(); // Оновлюємо статистику
            }
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

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value;
            renderProducts();
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            resetForm();
        });
    }

    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentPhotoData) {
                alert('Будь ласка, додайте фото товару');
                return;
            }

            const productData = {
                name: document.getElementById('name').value,
                description: document.getElementById('description').value,
                price: parseFloat(document.getElementById('price').value) || 0,
                tag: document.getElementById('tag').value, 
                category: document.getElementById('category').value, 
                photo: currentPhotoData
            };

            let error = null;

            if (isEditing && editingProductId) {
                // Оновлення існуючого товару
                const response = await sb
                    .from('products')
                    .update(productData)
                    .eq('id', editingProductId);
                error = response.error;
            } else {
                // Додавання нового товару
                const response = await sb
                    .from('products')
                    .insert([productData]);
                error = response.error;
            }

            if (error) {
                alert('Помилка при збереженні: ' + error.message);
                return;
            }

            fetchProducts();
            resetForm();
            adminModal.classList.add('hidden');
        });
    }

    if (seedBtn) {
        seedBtn.addEventListener('click', async () => {
            if (!confirm('Це додасть тестові товари в базу. Продовжити?')) return;
            
            const dummyProducts = [
                {
                    name: 'Nike Air Max',
                    description: 'Класичні кросівки для бігу та прогулянок.',
                    price: 3500,
                    tag: 'NEW',
                    category: 'Взуття',
                    photo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000'
                },
                {
                    name: 'Adidas Superstar',
                    description: 'Легендарні кеди для стильних людей.',
                    price: 2800,
                    tag: 'SALE',
                    category: 'Взуття',
                    photo: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=1000'
                },
                {
                    name: 'Футболка Basic',
                    description: 'Базова футболка з якісної бавовни.',
                    price: 800,
                    tag: '',
                    category: 'Одяг',
                    photo: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000'
                },
                {
                    name: 'Джинсова куртка',
                    description: 'Стильна куртка на весну/осінь.',
                    price: 2200,
                    tag: '-20%',
                    category: 'Одяг',
                    photo: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1000'
                },
                {
                    name: 'Рюкзак Urban',
                    description: 'Зручний рюкзак для міста.',
                    price: 1500,
                    tag: 'HIT',
                    category: 'Аксесуари',
                    photo: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000'
                },
                {
                    name: 'Кепка Snapback',
                    description: 'Модна кепка для захисту від сонця.',
                    price: 600,
                    tag: '',
                    category: 'Аксесуари',
                    photo: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000'
                }
            ];

            const { error } = await sb.from('products').insert(dummyProducts);
            
            if (error) {
                alert('Помилка при додаванні: ' + error.message);
            } else {
                alert('Тестові товари успішно додані!');
                fetchProducts();
            }
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

    // Cart Events
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            cartModal.classList.remove('hidden');
            setTimeout(() => {
                cartPanel.classList.remove('translate-x-full');
            }, 10);
            renderCart();
            updateCartCustomerData(); // Заповнюємо дані покупця
        });
    }

    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', closeCart);
    }

    if (cartModal) {
        cartModal.addEventListener('click', (e) => {
            if (e.target === cartModal) closeCart();
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }

    // Initial Cart Render
    updateCartCount();
}

function closeCart() {
    cartPanel.classList.add('translate-x-full');
    setTimeout(() => {
        cartModal.classList.add('hidden');
    }, 300);
}

let currentPhotoData = ''; 
let isEditing = false;
let editingProductId = null;

// Масив товарів
let products = [];
let currentCategory = 'all';
let currentSearchQuery = '';

// Глобальна функція для фільтрації
window.setCategory = function(cat) {
    currentCategory = cat;
    renderCategories();
    renderProducts();
};

// Функція підготовки форми до редагування
window.editProduct = function(id) {
    const product = products.find(p => p.id == id); // Loose equality for string/number match
    if (!product) {
        return;
    }

    // Заповнюємо поля форми
    document.getElementById('name').value = product.name;
    document.getElementById('description').value = product.description || '';
    document.getElementById('price').value = product.price;
    document.getElementById('tag').value = product.tag || '';
    document.getElementById('category').value = product.category || '';
    
    // Оновлюємо прев'ю фото
    updatePreview(product.photo);

    // Змінюємо стан на редагування
    isEditing = true;
    editingProductId = id;

    // Змінюємо інтерфейс кнопки
    if (submitBtnText) submitBtnText.textContent = 'Зберегти зміни';
    if (cancelEditBtn) cancelEditBtn.classList.remove('hidden');

    // Скрол до форми
    if (addProductForm) {
        addProductForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

// Функція скидання форми
function resetForm() {
    if (addProductForm) addProductForm.reset();
    updatePreview('');
    isEditing = false;
    editingProductId = null;
    if (submitBtnText) submitBtnText.textContent = 'Додати товар';
    if (cancelEditBtn) cancelEditBtn.classList.add('hidden');
}

// Завантаження товарів з Supabase
async function fetchProducts() {
    try {
        const { data, error } = await sb
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return;
        }

        products = data;
        renderCategories(); // Оновлюємо фільтри
        renderProducts();
        renderAdminList();
    } catch (err) {
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

// Функція відображення категорій
function renderCategories() {
    const filtersContainer = document.getElementById('category-filters');
    if (!filtersContainer) return;

    // Отримуємо унікальні категорії
    const categories = ['all', ...new Set(products.map(p => p.category).filter(c => c && c.trim() !== ''))];
    
    // Якщо категорій немає (крім 'all'), ховаємо фільтри
    if (categories.length <= 1) {
         filtersContainer.innerHTML = '';
         return;
    }

    filtersContainer.innerHTML = categories.map(cat => {
        const label = cat === 'all' ? 'Всі' : cat;
        const isActive = cat === currentCategory;
        
        // Стилі кнопок
        const activeClasses = "bg-black text-white border-black shadow-lg dark:bg-white dark:text-black";
        const inactiveClasses = "bg-white text-gray-400 border-transparent hover:border-gray-200 hover:text-black dark:bg-dark-surface dark:hover:text-white dark:hover:border-dark-border";
        
        return `
            <button onclick="window.setCategory('${cat}')" 
                    class="px-6 py-2 rounded-full text-sm uppercase tracking-wider transition-all border ${isActive ? activeClasses : inactiveClasses}">
                ${label}
            </button>
        `;
    }).join('');
}

// Функція відображення Toast-сповіщень
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `
        bg-white text-black px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 
        transform transition-all duration-500 translate-x-full opacity-0 border border-gray-100
        dark:bg-dark-surface dark:text-white dark:border-dark-border
    `;
    
    // Іконка
    const icon = type === 'success' 
        ? '<svg class="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>'
        : '<svg class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';

    toast.innerHTML = `
        ${icon}
        <span class="font-medium text-sm tracking-wide">${message}</span>
    `;

    container.appendChild(toast);

    // Анімація появи
    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    });

    // Видалення через 3 секунди
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}



// Функція відображення великого Alert
function showLargeAlert(title, message, type = 'success') {
    const modal = document.getElementById('admin-alert-modal');
    const iconContainer = document.getElementById('alert-icon');
    const titleEl = document.getElementById('alert-title');
    const messageEl = document.getElementById('alert-message');
    const closeBtn = document.getElementById('alert-close-btn');

    if (!modal) return;

    titleEl.textContent = title;
    messageEl.textContent = message;

    if (type === 'success') {
        iconContainer.innerHTML = '<svg class="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
        iconContainer.className = "mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20";
    } else {
        iconContainer.innerHTML = '<svg class="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
        iconContainer.className = "mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20";
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
        modal.querySelector('div').classList.add('scale-100');
    }, 10);

    const close = () => {
        modal.classList.add('opacity-0');
        modal.querySelector('div').classList.remove('scale-100');
        modal.querySelector('div').classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
        closeBtn.removeEventListener('click', close);
    };

    closeBtn.addEventListener('click', close);
}

// Тестові функції
window.testTelegram = async function() {
    const chatId = localStorage.getItem('tgChatId');
    const token = localStorage.getItem('tgBotToken');
    
    if (!chatId || !token) {
        showLargeAlert('Помилка', 'Спочатку налаштуйте Telegram (кнопка з шестернею біля товарів)', 'error');
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: "🔔 Тестове повідомлення від MY STORE!\nЯкщо ви це читаєте, значить все працює.",
                parse_mode: 'Markdown'
            })
        });

        if (response.ok) {
            showLargeAlert('Успіх!', 'Тестове повідомлення надіслано в Telegram', 'success');
        } else {
            throw new Error('Telegram API error');
        }
    } catch (e) {
        showLargeAlert('Помилка', 'Не вдалося надіслати повідомлення. Перевірте токен та Chat ID.', 'error');
    }
};

window.testEmail = async function() {
    if (!storeSettings.email) {
        showLargeAlert('Помилка', 'Вкажіть Email для сповіщень у налаштуваннях', 'error');
        return;
    }

    const templateParams = {
        to_email: storeSettings.email,
        store_name: storeSettings.name,
        order_details: "Це тестове замовлення для перевірки зв'язку.",
        total_amount: "0.00",
        order_date: new Date().toLocaleString('uk-UA'),
        customer_name: "Власник (Тест)",
        customer_phone: "-",
        customer_email: storeSettings.email
    };

    try {
        await emailjs.send('service_621igog', 'template_dsnkd4r', templateParams);
        showLargeAlert('Успіх!', `Тестовий лист надіслано на ${storeSettings.email}`, 'success');
    } catch (error) {
        showLargeAlert('Помилка', 'Не вдалося надіслати лист. Перевірте налаштування EmailJS.', 'error');
    }
};

// Завантаження статистики замовлень
async function fetchOrders() {
    if (!ordersList || !totalSalesEl) return;

    // Отримуємо останні 20 замовлень
    const { data: lastOrders, error: listError } = await sb
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    // Отримуємо всі замовлення для підрахунку суми (тільки виконані або нові, скасовані не рахуємо)
    const { data: allOrders, error: totalError } = await sb
        .from('orders')
        .select('price, status')
        .neq('status', 'cancelled'); // Не рахуємо скасовані

    if (listError || totalError) {
        ordersList.innerHTML = '<p class="text-red-400 text-xs">Помилка завантаження статистики.</p>';
        return;
    }

    // Рахуємо суму
    const total = allOrders.reduce((sum, order) => sum + (order.price || 0), 0);
    totalSalesEl.textContent = `${total.toLocaleString()} ${storeSettings.currency}`;

    // Відображаємо список
    if (lastOrders.length === 0) {
        ordersList.innerHTML = '<p class="text-gray-300 italic text-xs">Замовлень поки немає...</p>';
    } else {
        ordersList.innerHTML = lastOrders.map(order => {
            const date = new Date(order.created_at).toLocaleString('uk-UA', { 
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            });

            // Визначаємо стилі залежно від статусу
            let statusClass = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
            let rowClass = '';
            
            const status = order.status || 'new'; // Дефолт, якщо null

            if (status === 'completed') {
                statusClass = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
                rowClass = 'bg-green-50/50 dark:bg-green-900/10';
            } else if (status === 'cancelled') {
                statusClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                rowClass = 'bg-red-50/50 dark:bg-red-900/10 opacity-75';
            } else if (status === 'new') {
                statusClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            }

            return `
                <div class="flex flex-col gap-2 p-3 rounded-lg border border-gray-100 mb-2 dark:border-dark-border ${rowClass} transition-colors">
                    <div class="flex justify-between items-start">
                        <span class="font-medium text-gray-800 truncate pr-2 dark:text-white text-sm">${order.product_name}</span>
                        <span class="block text-green-600 font-semibold text-sm whitespace-nowrap">${order.price} ${storeSettings.currency}</span>
                    </div>
                    
                    <div class="flex justify-between items-center mt-1">
                        <span class="text-[10px] text-gray-400 dark:text-gray-500">${date}</span>
                        
                        <select onchange="changeOrderStatus('${order.id}', this.value)" 
                                class="text-[10px] py-1 px-2 rounded border-0 cursor-pointer outline-none font-medium ${statusClass}">
                            <option value="new" ${status === 'new' ? 'selected' : ''}>Нове</option>
                            <option value="completed" ${status === 'completed' ? 'selected' : ''}>Виконано</option>
                            <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Скасовано</option>
                        </select>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Функція зміни статусу замовлення
async function changeOrderStatus(id, newStatus) {
    const { error } = await sb
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);

    if (error) {
        showToast('Помилка оновлення статусу', 'error');
    } else {
        showToast('Статус оновлено', 'success');
        fetchOrders(); // Оновлюємо список
    }
}

// Функція відображення товарів на вітрині
function renderProducts() {
    if (!productList) return;

    let filteredProducts = products;

    // 1. Category Filter
    if (currentCategory !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.category === currentCategory);
    }

    // 2. Search Filter
    if (currentSearchQuery) {
        const query = currentSearchQuery.toLowerCase().trim();
        filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(query));
    }

    // No Results Message
    if (filteredProducts.length === 0) {
        productList.innerHTML = `
            <div class="col-span-full text-center py-20">
                <p class="text-xl text-gray-400 font-light">Товарів не знайдено</p>
                <button onclick="currentSearchQuery=''; document.getElementById('search-input').value=''; renderProducts();" class="mt-4 text-sm text-black underline dark:text-white">Очистити пошук</button>
            </div>
        `;
        return;
    }

    productList.innerHTML = filteredProducts.map(product => {
        let badgeColorClass = 'bg-black text-white dark:bg-white dark:text-black';
        if (product.tag) {
            const tagUpper = product.tag.toUpperCase();
            if (tagUpper.includes('SALE') || tagUpper.includes('%')) {
                badgeColorClass = 'bg-red-500 text-white';
            } else if (tagUpper.includes('NEW')) {
                badgeColorClass = 'bg-green-500 text-white';
            } else if (tagUpper.includes('TOP') || tagUpper.includes('HIT')) {
                badgeColorClass = 'bg-blue-500 text-white';
            }
        }

        return `
        <div class="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-2 border border-gray-50 relative animate-fade-in dark:bg-dark-surface dark:border-dark-border">
            
            ${product.tag ? `
            <div class="absolute top-4 left-4 z-10">
                <span class="${badgeColorClass} px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-semibold shadow-md">
                    ${product.tag}
                </span>
            </div>
            ` : ''}

            <div class="relative overflow-hidden aspect-[4/5]">
                <button onclick="toggleFavorite('${product.id}')" 
                        class="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-gray-400 hover:text-red-500 transition-colors shadow-sm ${favorites.includes(product.id) ? 'text-red-500' : ''}">
                    <svg class="w-5 h-5" fill="${favorites.includes(product.id) ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </button>
                <img src="${product.photo || 'https://via.placeholder.com/400'}" alt="${product.name}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
                
                <div class="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <button onclick="addToCart(this, '${product.id}', '${product.name}', ${product.price || 0}, '${product.photo || ''}')" 
                            class="w-full bg-black text-white py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-light hover:bg-zinc-800 transition-all shadow-xl transform active:scale-95 dark:bg-white dark:text-black dark:hover:bg-gray-200">
                        Додати в кошик
                    </button>
                </div>
            </div>
            
            <div class="p-6">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-sm font-medium text-gray-900 tracking-wide uppercase truncate pr-4 dark:text-white">${product.name}</h3>
                    <span class="text-sm font-semibold text-gray-900 whitespace-nowrap dark:text-white">${product.price || '0'} ${storeSettings.currency}</span>
                </div>
                <p class="text-xs text-gray-400 font-light truncate">${product.category}</p>
                
                <!-- Admin Controls -->
                <div class="mt-4 flex gap-2 pt-4 border-t border-gray-50 dark:border-dark-border ${sessionStorage.getItem('isAdmin') === 'true' ? '' : 'hidden'}">
                    <button onclick="editProduct('${product.id}')" class="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs hover:bg-blue-100 transition-colors dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40">Редагувати</button>
                    <button onclick="deleteProduct('${product.id}')" class="flex-1 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-xs hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40">Видалити</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// --- Cart Logic ---

function addToCart(btn, id, name, price, photo) {
    // Ефект натискання
    btn.classList.add('scale-95');
    setTimeout(() => btn.classList.remove('scale-95'), 150);

    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id,
            name,
            price: parseFloat(price),
            photo,
            quantity: 1
        });
    }

    saveCart();
    updateCartCount();
    showToast('Товар додано до кошика');

    // Зміна тексту кнопки
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Додано! ✅';
    btn.classList.add('bg-green-600', 'text-white');
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('bg-green-600', 'text-white');
    }, 2000);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCart();
    updateCartCount();
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
            renderCart();
            updateCartCount();
        }
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    if (!cartCountEl) return;
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountEl.textContent = count;
    cartCountEl.classList.toggle('hidden', count === 0);
}

function renderCart() {
    if (!cartItemsContainer || !cartTotalEl) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-gray-400">
                <svg class="w-16 h-16 mb-4 text-gray-200 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p>Кошик порожній</p>
                <button onclick="closeCart()" class="mt-4 text-black underline text-sm dark:text-white">Повернутися до покупок</button>
            </div>
        `;
        cartTotalEl.textContent = '0 ₴';
        checkoutBtn.disabled = true;
        checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    checkoutBtn.disabled = false;
    checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');

    let total = 0;

    cartItemsContainer.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        return `
        <div class="flex gap-4 animate-fade-in">
            <div class="w-20 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 dark:bg-dark-bg">
                <img src="${item.photo || 'https://via.placeholder.com/100'}" alt="${item.name}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 flex flex-col justify-between">
                <div>
                    <h4 class="font-medium text-gray-900 line-clamp-2 text-sm dark:text-white">${item.name}</h4>
                    <p class="text-gray-500 text-xs mt-1 dark:text-gray-400">${item.price} ${storeSettings.currency}</p>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center border border-gray-200 rounded-lg dark:border-dark-border">
                        <button onclick="updateQuantity('${item.id}', -1)" class="px-2 py-1 hover:bg-gray-50 text-gray-500 dark:text-gray-400 dark:hover:bg-gray-800">-</button>
                        <span class="text-xs font-medium px-2 w-6 text-center dark:text-white">${item.quantity}</span>
                        <button onclick="updateQuantity('${item.id}', 1)" class="px-2 py-1 hover:bg-gray-50 text-gray-500 dark:text-gray-400 dark:hover:bg-gray-800">+</button>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" class="text-red-400 hover:text-red-600">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    cartTotalEl.textContent = `${total.toLocaleString()} ${storeSettings.currency}`;
}

async function handleCheckout() {
    if (cart.length === 0) return;

    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<span class="animate-pulse">Обробка...</span>';

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Отримуємо дані покупця
    const customerName = document.getElementById('customer-name')?.value || 'Не вказано';
    const customerPhone = document.getElementById('customer-phone')?.value || 'Не вказано';
    const customerEmail = document.getElementById('customer-email')?.value || '';

    // Формування повідомлення для Telegram (видаляємо старий блок, бо він формується перед відправкою)
    
    try {
        // 1. Відправка в Telegram
        let message = `🛒 *НОВЕ ЗАМОВЛЕННЯ*\n\n`;
        cart.forEach(item => {
            message += `▫️ ${item.name}\n   ${item.quantity} шт. x ${item.price} ${storeSettings.currency} = ${item.quantity * item.price} ${storeSettings.currency}\n\n`;
        });
        message += `💰 *РАЗОМ: ${total.toLocaleString()} ${storeSettings.currency}*\n\n`;
        
        message += `👤 *Клієнт:*\n`;
        message += `Ім'я: ${customerName}\n`;
        message += `Телефон: ${customerPhone}\n`;
        if (customerEmail) message += `Email: ${customerEmail}`;

        const telegramSuccess = await sendTelegramMessage(message);

        if (!telegramSuccess) {
            throw new Error('Помилка Telegram');
        }

        // 1.1 Відправка Email (якщо увімкнено)
        if (storeSettings.emailNotification) {
            // Ми не блокуємо оформлення, якщо email не пішов, але логуємо це
            sendEmailOrder(cart, total).catch(err => {});
        }

        // 2. Запис в Supabase (кожен товар окремо для статистики)
        const orderPromises = cart.map(item => {
            return sb.from('orders').insert([{
                product_name: `${item.name} (${item.quantity} шт.)`,
                price: item.price * item.quantity,
                status: 'new'
            }]);
        });

        await Promise.all(orderPromises);

        // 3. Save to Local History
        const newOrder = {
            id: Date.now(),
            date: new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
            items: [...cart],
            total: total
        };
        orderHistory.unshift(newOrder);
        saveOrderHistory();

        // Успіх
        cart = [];
        saveCart();
        renderCart();
        updateCartCount();
        closeCart();
        showToast('Замовлення успішно оформлено!', 'success');
        
    } catch (error) {
        console.error('Checkout error:', error);
        showToast('Помилка оформлення. Спробуйте ще раз.', 'error');
    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = 'Оформити замовлення';
    }
}

// Функція відображення списку в адмінці
function renderAdminList() {
    if (!adminProductList) return;
    adminProductList.innerHTML = products.map(product => `
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-xl dark:bg-dark-bg gap-4">
            <div class="flex items-center gap-4 w-full sm:w-auto">
                <img src="${product.photo || 'https://via.placeholder.com/50'}" alt="${product.name}" class="w-12 h-12 object-cover rounded-lg flex-shrink-0">
                <div class="overflow-hidden">
                    <h4 class="font-medium text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">${product.name}</h4>
                    <p class="text-sm text-gray-500">${product.price} ₴</p>
                </div>
            </div>
            <div class="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button onclick="editProduct('${product.id}')" class="flex-1 sm:flex-none px-4 py-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 text-center">
                    Редагувати
                </button>
                <button onclick="deleteProduct('${product.id}')" class="flex-1 sm:flex-none px-4 py-3 bg-red-500 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-red-600 transition-colors shadow-md text-center">
                    Видалити
                </button>
            </div>
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

// Theme Logic
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');

    // Check for saved user preference, if any, on load
    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        if (lightIcon) lightIcon.classList.remove('hidden');
        if (darkIcon) darkIcon.classList.add('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        if (lightIcon) lightIcon.classList.add('hidden');
        if (darkIcon) darkIcon.classList.remove('hidden');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            // toggle icons inside button
            if (darkIcon) darkIcon.classList.toggle('hidden');
            if (lightIcon) lightIcon.classList.toggle('hidden');

            // if set via local storage previously
            if (localStorage.getItem('color-theme')) {
                if (localStorage.getItem('color-theme') === 'light') {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                } else {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                }
            } else {
                // if NOT set via local storage previously
                if (document.documentElement.classList.contains('dark')) {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                } else {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                }
            }
        });
    }
}

// Завантаження налаштувань магазину
async function fetchSettings() {
    const { data, error } = await sb
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        // Error fetching settings
    } else if (data) {
        storeSettings = {
            name: data.store_name || 'MY STORE',
            email: data.contact_email || 'owner@example.com',
            currency: data.currency || '₴',
            adminEmail: data.admin_email || 'admin@example.com',
            adminPassword: data.admin_password || 'admin55',
            emailNotification: data.email_notification || false
        };
        applySettings();
    } else {
        // Якщо налаштувань немає, створюємо дефолтні
        await sb.from('settings').insert([{
            id: 1,
            store_name: 'MY STORE',
            contact_email: 'owner@example.com',
            currency: '₴',
            admin_email: 'admin@example.com',
            admin_password: 'admin55',
            email_notification: false
        }]);
    }
}

// Застосування налаштувань до UI
function applySettings() {
    // Оновлюємо заголовок сторінки
    document.title = `${storeSettings.name} | Магазин`;
    
    // Оновлюємо логотип/назву в шапці
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
        headerTitle.innerHTML = storeSettings.name.split(' ').map((word, index) => 
            index === 1 ? `<span class="font-semibold">${word}</span>` : word
        ).join(' ');
    }

    // Заповнюємо поля в адмінці
    if (settingStoreName) settingStoreName.value = storeSettings.name;
    if (settingEmail) settingEmail.value = storeSettings.email;
    if (settingCurrency) settingCurrency.value = storeSettings.currency;
    if (settingEmailNotification) settingEmailNotification.checked = storeSettings.emailNotification;
    
    // Заповнюємо поле пошти адміна
    const settingAdminEmail = document.getElementById('setting-admin-email');
    if (settingAdminEmail) settingAdminEmail.value = storeSettings.adminEmail;

    // Оновлюємо валюту в товарах (якщо потрібно перерендерити)
    renderProducts();
    renderCart();
}

// Функція оновлення даних доступу
async function updateAccessData() {
    const settingAdminEmail = document.getElementById('setting-admin-email');
    const settingOldPassword = document.getElementById('setting-old-password');
    const settingNewPassword = document.getElementById('setting-new-password');
    const settingConfirmPassword = document.getElementById('setting-confirm-password');
    const updateAccessBtn = document.getElementById('update-access-btn');

    if (!settingAdminEmail || !settingOldPassword || !settingNewPassword) return;

    const newEmail = settingAdminEmail.value.trim();
    const oldPass = settingOldPassword.value;
    const newPass = settingNewPassword.value;
    const confirmPass = settingConfirmPassword ? settingConfirmPassword.value : '';

    if (!newEmail) {
        showToast('Введіть email адміністратора', 'error');
        return;
    }

    // Перевірка старого паролю
    if (oldPass !== storeSettings.adminPassword) {
        showToast('Невірний поточний пароль!', 'error');
        return;
    }

    // Перевірка співпадіння нових паролів
    if (newPass && newPass !== confirmPass) {
        showToast('Нові паролі не співпадають!', 'error');
        return;
    }

    // Якщо новий пароль не введено, залишаємо старий
    const finalPassword = newPass ? newPass : storeSettings.adminPassword;

    // UI feedback
    const originalText = updateAccessBtn.textContent;
    updateAccessBtn.textContent = 'Оновлення...';
    updateAccessBtn.disabled = true;

    // Оновлюємо в Supabase
    const { error } = await sb
        .from('settings')
        .update({ 
            admin_email: newEmail,
            admin_password: finalPassword
        })
        .eq('id', 1);

    if (error) {
        showToast('Помилка оновлення даних', 'error');
    } else {
        // Оновлюємо локальний стан
        storeSettings.adminEmail = newEmail;
        storeSettings.adminPassword = finalPassword;
        
        // Очищаємо поля паролів
        settingOldPassword.value = '';
        settingNewPassword.value = '';
        if (settingConfirmPassword) settingConfirmPassword.value = '';

        showToast('Дані успішно змінено! Використовуйте новий пароль при наступному вході', 'success');
    }

    updateAccessBtn.textContent = originalText;
    updateAccessBtn.disabled = false;
}

// Збереження налаштувань
async function saveSettings() {
    if (!saveSettingsBtn) return;

    const originalText = saveSettingsBtn.textContent;
    saveSettingsBtn.textContent = 'Збереження...';
    saveSettingsBtn.disabled = true;

    const newSettings = {
        store_name: settingStoreName.value,
        contact_email: settingEmail.value,
        currency: settingCurrency.value,
        email_notification: settingEmailNotification.checked
    };

    const { error } = await sb
        .from('settings')
        .upsert({ id: 1, ...newSettings });

    if (error) {
        showToast('Помилка збереження налаштувань', 'error');
    } else {
        showToast('Налаштування успішно збережено!', 'success');
        storeSettings = {
            name: newSettings.store_name,
            email: newSettings.contact_email,
            currency: newSettings.currency,
            adminEmail: storeSettings.adminEmail,
            adminPassword: storeSettings.adminPassword,
            emailNotification: newSettings.email_notification
        };
        applySettings();
    }

    saveSettingsBtn.textContent = originalText;
    saveSettingsBtn.disabled = false;
}

// --- Profile Logic ---

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function saveOrderHistory() {
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
}

function toggleFavorite(id) {
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
        showToast('Видалено з обраного');
    } else {
        favorites.push(id);
        showToast('Додано в обране');
    }
    saveFavorites();
    renderProducts(); // Re-render to update icons
    renderProfile(); // Update profile list if open
}

function clearFavorites() {
    if(confirm('Ви впевнені?')) {
        favorites = [];
        saveFavorites();
        renderProfile();
        renderProducts();
    }
}

function clearHistory() {
    if(confirm('Ви впевнені?')) {
        orderHistory = [];
        saveOrderHistory();
        renderProfile();
    }
}

function renderProfile() {
    const favoritesList = document.getElementById('favorites-list');
    const historyList = document.getElementById('history-list');
    
    // Render Favorites
    if (favoritesList) {
        if (favorites.length === 0) {
            favoritesList.innerHTML = '<p class="text-gray-400 font-light italic text-center py-8">Список порожній</p>';
        } else {
            const favProducts = products.filter(p => favorites.includes(p.id));
            favoritesList.innerHTML = favProducts.map(p => `
                <div class="flex items-center justify-between bg-gray-50 p-4 rounded-xl dark:bg-dark-bg">
                    <div class="flex items-center gap-4">
                        <img src="${p.photo || 'https://via.placeholder.com/50'}" class="w-16 h-16 rounded-lg object-cover bg-white">
                        <div>
                            <h4 class="text-lg font-light dark:text-white">${p.name}</h4>
                            <p class="text-sm text-gray-500 font-bold">${p.price} ${storeSettings.currency || 'UAH'}</p>
                        </div>
                    </div>
                    <button onclick="toggleFavorite('${p.id}')" class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors dark:hover:bg-red-900/20">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                </div>
            `).join('');
        }
    }

    // Render History
    if (historyList) {
        if (orderHistory.length === 0) {
            historyList.innerHTML = '<p class="text-gray-400 font-light italic text-center py-8">Історія порожня</p>';
        } else {
            // Sort history by date desc
            const sortedHistory = [...orderHistory].sort((a, b) => b.id - a.id);
            
            historyList.innerHTML = sortedHistory.map(order => `
                <div class="bg-gray-50 p-6 rounded-2xl dark:bg-dark-bg border border-gray-100 dark:border-dark-border">
                    <div class="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <span class="text-sm text-gray-500 uppercase tracking-widest">${order.date}</span>
                        <span class="text-xl font-light dark:text-white">${order.total.toLocaleString()} ${storeSettings.currency || 'UAH'}</span>
                    </div>
                    <div class="space-y-2">
                        ${order.items.map(item => `
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-800 dark:text-gray-300 font-medium">${item.name}</span>
                                <span class="text-gray-500">x${item.quantity}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-4 pt-2 text-xs text-green-600 uppercase tracking-widest font-bold text-right">
                        Виконано
                    </div>
                </div>
            `).join('');
        }
    }
}

function switchProfileTab(tab) {
    const tabFavorites = document.getElementById('tab-favorites');
    const tabHistory = document.getElementById('tab-history');
    const sectionFavorites = document.getElementById('favorites-section');
    const sectionHistory = document.getElementById('history-section');

    if (tab === 'favorites') {
        tabFavorites.classList.add('border-black', 'text-black', 'dark:text-white', 'dark:border-white');
        tabFavorites.classList.remove('border-transparent', 'text-gray-400');
        
        tabHistory.classList.remove('border-black', 'text-black', 'dark:text-white', 'dark:border-white');
        tabHistory.classList.add('border-transparent', 'text-gray-400');
        
        sectionFavorites.classList.remove('hidden');
        sectionHistory.classList.add('hidden');
    } else {
        tabHistory.classList.add('border-black', 'text-black', 'dark:text-white', 'dark:border-white');
        tabHistory.classList.remove('border-transparent', 'text-gray-400');
        
        tabFavorites.classList.remove('border-black', 'text-black', 'dark:text-white', 'dark:border-white');
        tabFavorites.classList.add('border-transparent', 'text-gray-400');
        
        sectionHistory.classList.remove('hidden');
        sectionFavorites.classList.add('hidden');
    }
}

function clearAllData() {
    if (confirm('Ви впевнені, що хочете видалити ВСІ дані (кошик, обране, історію)? Цю дію неможливо скасувати.')) {
        localStorage.removeItem('cart');
        localStorage.removeItem('favorites');
        localStorage.removeItem('orderHistory');
        // Також можна очистити дані покупця, якщо вони є
        
        cart = [];
        favorites = [];
        orderHistory = [];
        
        saveCart();
        renderCart();
        updateCartCount();
        renderProfile();
        renderProducts();
        
        showToast('Всі дані успішно видалено', 'success');
        
        // Close profile modal after clearing
        const profileModal = document.getElementById('profile-modal');
        const profilePanel = document.getElementById('profile-panel');
        if (profileModal && profilePanel) {
            profilePanel.classList.add('translate-x-full');
            setTimeout(() => {
                profileModal.classList.add('hidden');
            }, 300);
        }
    }
}

function initProfile() {
    const profileBtn = document.getElementById('profile-btn');
    const profileModal = document.getElementById('profile-modal');
    const closeProfileBtn = document.getElementById('close-profile');
    const profilePanel = document.getElementById('profile-panel');

    function openProfile() {
        if (profileModal && profilePanel) {
            profileModal.classList.remove('hidden');
            setTimeout(() => {
                profilePanel.classList.remove('translate-x-full');
            }, 10);
            renderProfile();
        }
    }

    function closeProfile() {
        if (profileModal && profilePanel) {
            profilePanel.classList.add('translate-x-full');
            setTimeout(() => {
                profileModal.classList.add('hidden');
            }, 300);
        }
    }

    if (profileBtn) {
        profileBtn.addEventListener('click', openProfile);
    }

    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', closeProfile);
    }

    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) closeProfile();
        });
    }
}

// Ініціалізація
async function init() {
    initTheme();
    initEventListeners();
    initUserAuth(); // Ініціалізація входу для покупців
    initProfile(); // Ініціалізація профілю
    await fetchSettings(); // Завантажуємо налаштування першими
    await fetchProducts();
    updateCartCount();
    checkAuth(); // Перевірка адмінського доступу
}

init();
