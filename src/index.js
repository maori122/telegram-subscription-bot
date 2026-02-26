// Telegram Bot на Cloudflare Workers с кнопками
export default {
  async fetch(request, env) {
    if (request.method === 'POST') {
      const update = await request.json();
      await handleUpdate(update, env);
      return new Response('OK');
    }
    return new Response('Telegram Bot is running!');
  }
};

// Обработка обновлений от Telegram
async function handleUpdate(update, env) {
  if (update.message) {
    await handleMessage(update.message, env);
  } else if (update.callback_query) {
    await handleCallback(update.callback_query, env);
  }
}

// Обработка текстовых сообщений
async function handleMessage(message, env) {
  const chatId = message.chat.id;
  const text = message.text || '';
  const userId = message.from.id.toString();
  const username = message.from.username || 'Без username';
  const firstName = message.from.first_name || 'Пользователь';

  // Команда /start
  if (text === '/start') {
    const users = await getUsers(env);
    if (!users[userId]) {
      users[userId] = { username, firstName, registered: true };
      await saveUsers(users, env);
      await sendMessage(chatId, `Привет, ${firstName}! Вы успешно зарегистрированы.`, null, env);
    } else {
      await sendMessage(chatId, `Вы уже зарегистрированы, ${firstName}!`, null, env);
    }
    return;
  }

  // Команда /admin
  if (text.startsWith('/admin ')) {
    const password = text.substring(7);
    const isAdmin = await checkAdmin(userId, env);
    
    if (isAdmin) {
      await sendMessage(chatId, 'Вы уже авторизованы как администратор!', null, env);
      return;
    }

    if (await verifyPassword(password, env)) {
      const admins = await getAdmins(env);
      admins[userId] = { username, firstName, authorized: true };
      await saveAdmins(admins, env);
      
      await deleteMessage(chatId, message.message_id, env);
      await sendMessage(chatId, `✅ ${firstName}, вы успешно авторизованы как администратор!`, getAdminKeyboard(), env);
    } else {
      await deleteMessage(chatId, message.message_id, env);
      await sendMessage(chatId, '❌ Неверный пароль!', null, env);
    }
    return;
  }

  // Команда /help
  if (text === '/help') {
    const isAdmin = await checkAdmin(userId, env);
    if (isAdmin) {
      await sendMessage(chatId, 
        '🤖 Команды администратора:\n\n' +
        'Используйте кнопки ниже для управления ботом.\n\n' +
        'Или команды:\n' +
        '/start - Регистрация\n' +
        '/admin <пароль> - Авторизация\n' +
        '/help - Помощь',
        getAdminKeyboard(),
        env
      );
    } else {
      await sendMessage(chatId,
        '🤖 Доступные команды:\n\n' +
        '/start - Регистрация в боте\n' +
        '/admin <пароль> - Авторизация как администратор\n' +
        '/help - Помощь',
        null,
        env
      );
    }
    return;
  }

  // Проверяем, является ли пользователь админом
  const isAdmin = await checkAdmin(userId, env);
  if (!isAdmin) {
    await sendMessage(chatId, 'Используйте /help для просмотра доступных команд.', null, env);
    return;
  }

  // Админ отправил текст - это может быть сообщение для рассылки или отправки
  const state = await getUserState(userId, env);
  
  if (state === 'waiting_broadcast') {
    await clearUserState(userId, env);
    await handleBroadcast(chatId, text, env);
  } else if (state && state.startsWith('waiting_send_')) {
    const targetUser = state.substring(13);
    await clearUserState(userId, env);
    await handleSendToUser(chatId, targetUser, text, env);
  } else {
    await sendMessage(chatId, 'Используйте кнопки для управления ботом.', getAdminKeyboard(), env);
  }
}

// Обработка нажатий на кнопки
async function handleCallback(callbackQuery, env) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id.toString();

  const isAdmin = await checkAdmin(userId, env);
  if (!isAdmin) {
    await answerCallback(callbackQuery.id, '❌ У вас нет доступа', env);
    return;
  }

  // Список пользователей
  if (data === 'list_users') {
    const users = await getUsers(env);
    const userList = Object.entries(users);
    
    if (userList.length === 0) {
      await editMessage(chatId, messageId, '📋 Нет зарегистрированных пользователей.', getAdminKeyboard(), env);
    } else {
      let message = '📋 Зарегистрированные пользователи:\n\n';
      userList.forEach(([id, data]) => {
        message += `👤 ${data.firstName}\n`;
        message += `   @${data.username}\n`;
        message += `   ID: ${id}\n\n`;
      });
      await editMessage(chatId, messageId, message, getBackKeyboard(), env);
    }
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  // Рассылка всем
  if (data === 'broadcast') {
    await setUserState(userId, 'waiting_broadcast', env);
    await editMessage(chatId, messageId, 
      '📢 Отправьте сообщение, которое нужно разослать всем пользователям.\n\n' +
      'Можно отправить текст, фото, видео или документ.',
      getCancelKeyboard(),
      env
    );
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  // Отправить конкретному пользователю
  if (data === 'send_user') {
    const users = await getUsers(env);
    const keyboard = getUserListKeyboard(users);
    await editMessage(chatId, messageId, 
      '👤 Выберите пользователя для отправки сообщения:',
      keyboard,
      env
    );
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  // Выбран конкретный пользователь для отправки
  if (data.startsWith('send_to_')) {
    const targetUserId = data.substring(8);
    await setUserState(userId, `waiting_send_${targetUserId}`, env);
    
    const users = await getUsers(env);
    const targetUser = users[targetUserId];
    
    await editMessage(chatId, messageId,
      `✉️ Отправьте сообщение для пользователя ${targetUser.firstName} (@${targetUser.username})\n\n` +
      'Можно отправить текст, фото, видео или документ.',
      getCancelKeyboard(),
      env
    );
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  // Отмена действия
  if (data === 'cancel') {
    await clearUserState(userId, env);
    await editMessage(chatId, messageId, '❌ Действие отменено.', getAdminKeyboard(), env);
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  // Назад в главное меню
  if (data === 'back') {
    await clearUserState(userId, env);
    await editMessage(chatId, messageId, '🤖 Панель администратора', getAdminKeyboard(), env);
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  await answerCallback(callbackQuery.id, '', env);
}

// Рассылка сообщения всем пользователям
async function handleBroadcast(chatId, text, env) {
  const users = await getUsers(env);
  const userIds = Object.keys(users);
  
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      await sendMessage(userId, text, null, env);
      success++;
    } catch (error) {
      failed++;
    }
  }

  await sendMessage(chatId,
    `✅ Рассылка завершена!\n\n` +
    `Успешно: ${success}\n` +
    `Ошибок: ${failed}`,
    getAdminKeyboard(),
    env
  );
}

// Отправка сообщения конкретному пользователю
async function handleSendToUser(chatId, targetUserId, text, env) {
  const users = await getUsers(env);
  const targetUser = users[targetUserId];

  if (!targetUser) {
    await sendMessage(chatId, '❌ Пользователь не найден.', getAdminKeyboard(), env);
    return;
  }

  try {
    await sendMessage(targetUserId, text, null, env);
    await sendMessage(chatId,
      `✅ Сообщение отправлено пользователю ${targetUser.firstName} (@${targetUser.username})`,
      getAdminKeyboard(),
      env
    );
  } catch (error) {
    await sendMessage(chatId, `❌ Ошибка отправки: ${error.message}`, getAdminKeyboard(), env);
  }
}

// Клавиатуры
function getAdminKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '👥 Список пользователей', callback_data: 'list_users' }
      ],
      [
        { text: '📢 Рассылка всем', callback_data: 'broadcast' }
      ],
      [
        { text: '✉️ Отправить конкретному', callback_data: 'send_user' }
      ]
    ]
  };
}

function getUserListKeyboard(users) {
  const buttons = [];
  Object.entries(users).forEach(([id, data]) => {
    buttons.push([{
      text: `${data.firstName} (@${data.username})`,
      callback_data: `send_to_${id}`
    }]);
  });
  buttons.push([{ text: '🔙 Назад', callback_data: 'back' }]);
  return { inline_keyboard: buttons };
}

function getCancelKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '❌ Отмена', callback_data: 'cancel' }]
    ]
  };
}

function getBackKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🔙 Назад', callback_data: 'back' }]
    ]
  };
}

// Работа с Cloudflare KV
async function getUsers(env) {
  const data = await env.USERS.get('users');
  return data ? JSON.parse(data) : {};
}

async function saveUsers(users, env) {
  await env.USERS.put('users', JSON.stringify(users));
}

async function getAdmins(env) {
  const data = await env.USERS.get('admins');
  return data ? JSON.parse(data) : {};
}

async function saveAdmins(admins, env) {
  await env.USERS.put('admins', JSON.stringify(admins));
}

async function checkAdmin(userId, env) {
  const admins = await getAdmins(env);
  return !!admins[userId];
}

async function verifyPassword(password, env) {
  return password === env.ADMIN_PASSWORD;
}

async function getUserState(userId, env) {
  return await env.USERS.get(`state_${userId}`);
}

async function setUserState(userId, state, env) {
  await env.USERS.put(`state_${userId}`, state, { expirationTtl: 3600 });
}

async function clearUserState(userId, env) {
  await env.USERS.delete(`state_${userId}`);
}

// Telegram API методы
async function sendMessage(chatId, text, keyboard, env) {
  const params = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  };
  
  if (keyboard) {
    params.reply_markup = keyboard;
  }

  return await callTelegramAPI('sendMessage', params, env);
}

async function editMessage(chatId, messageId, text, keyboard, env) {
  const params = {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: 'HTML'
  };
  
  if (keyboard) {
    params.reply_markup = keyboard;
  }

  return await callTelegramAPI('editMessageText', params, env);
}

async function deleteMessage(chatId, messageId, env) {
  return await callTelegramAPI('deleteMessage', {
    chat_id: chatId,
    message_id: messageId
  }, env);
}

async function answerCallback(callbackQueryId, text, env) {
  return await callTelegramAPI('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text: text
  }, env);
}

async function callTelegramAPI(method, params, env) {
  const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return await response.json();
}
