// Telegram Bot налаштування
// Використовуємо збережені налаштування або дефолтні
const DEFAULT_BOT_TOKEN = '8334765824:AAHpLAeeL6DJapQMyhtvvOzd6P_adlKpTaQ';
const DEFAULT_CHAT_ID = '365697372';

function getBotToken() {
    return localStorage.getItem('tgBotToken') || DEFAULT_BOT_TOKEN;
}

function getChatId() {
    return localStorage.getItem('tgChatId') || DEFAULT_CHAT_ID;
}

// Надсилання повідомлення в Telegram
async function sendTelegramMessage(messageText) {
  const token = getBotToken();
  const chatId = getChatId();
  
  if (!token || !chatId) {
      console.error('Telegram credentials missing');
      return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  // Якщо повідомлення не містить переносу рядка, додаємо префікс (для сумісності зі старими викликами)
  let text = messageText;
  if (!messageText.includes('\n') && !messageText.startsWith('🛒')) {
      text = `Нове замовлення! Клієнт цікавиться товаром: ${messageText}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          chat_id: chatId, 
          text: text,
          parse_mode: 'Markdown' // Додаємо підтримку Markdown для жирного тексту
      }),
    });

    if (response.ok) {
      return true; // Успішно
    } else {
      const errText = await response.text();
      console.error('Telegram error:', errText);
      return false; // Помилка API
    }
  } catch (error) {
    console.error('Помилка Telegram API:', error);
    return false; // Помилка мережі
  }
}
