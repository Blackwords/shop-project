// Telegram Bot налаштування
const TELEGRAM_BOT_TOKEN = '8334765824:AAHpLAeeL6DJapQMyhtvvOzd6P_adlKpTaQ';
const CHAT_ID = '365697372';

// Надсилання повідомлення в Telegram
async function sendTelegramMessage(itemTitle) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const text = `Нове замовлення! Клієнт цікавиться товаром: ${itemTitle}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text }),
    });

    if (response.ok) {
      alert('Замовлення успішно надіслано!');
    } else {
      const errText = await response.text();
      console.error('Telegram error:', errText);
      alert('Помилка при відправці замовлення. Спробуйте пізніше або зателефонуйте.');
    }
  } catch (error) {
    console.error('Помилка Telegram API:', error);
    alert('Мережна помилка. Спробуйте пізніше або зателефонуйте.');
  }
}
