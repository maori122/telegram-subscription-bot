// Telegram Bot для рекламных ссылок с отслеживанием подписок
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

// Обработка обновлений
async function handleUpdate(update, env) {
  if (update.message) {
    await handleMessage(update.message, env);
  } else if (update.callback_query) {
    await handleCallback(update.callback_query, env);
  }
}

// Обработка сообщений
async function handleMessage(message, env) {
  const chatId = message.chat.id;
  const userId = message.from.id.toString();
  const username = message.from.username || 'Без username';
  const firstName = message.from.first_name || 'Пользователь';

  // Команда /start
  if (message.text === '/start') {
    // Проверяем, может это админ
    const isAdmin = await checkAdmin(userId, env);
    if (isAdmin) {
      await sendMessage(chatId, 
        '🤖 Панель администратора',
        getAdminKeyboard(),
        env
      );
      return;
    }

    const keyboard = {
      inline_keyboard: [[
        { text: '✅ Зарегистрироваться', callback_data: 'register' }
      ]]
    };
    
    await sendMessage(chatId, 
      'Привет! Я бот, который выдает рекламные ссылки.\n\n' +
      'Нажми ✅ чтобы зарегистрироваться',
      keyboard,
      env
    );
    return;
  }

  // Команда /admin
  if (message.text && message.text.startsWith('/admin ')) {
    const password = message.text.substring(7);
    
    if (await verifyPassword(password, env)) {
      const admins = await getAdmins(env);
      admins[userId] = { username, firstName, authorized: true };
      await saveAdmins(admins, env);
      
      await deleteMessage(chatId, message.message_id, env);
      await sendMessage(chatId, 
        `✅ ${firstName}, вы авторизованы как администратор!`,
        getAdminKeyboard(),
        env
      );
    } else {
      await deleteMessage(chatId, message.message_id, env);
      await sendMessage(chatId, '❌ Неверный пароль!', null, env);
    }
    return;
  }

  // Проверяем, зарегистрирован ли пользователь
  const users = await getUsers(env);
  
  // Админские команды через текст
  const isAdmin = await checkAdmin(userId, env);
  if (isAdmin) {
    const state = await getUserState(userId, env);
    
    if (state === 'waiting_broadcast') {
      await clearUserState(userId, env);
      await handleBroadcast(chatId, message.text, env);
    } else if (state === 'waiting_response') {
      await clearUserState(userId, env);
      await handleSetResponse(chatId, message.text, env);
    } else if (state && state.startsWith('waiting_message_')) {
      const targetUserId = state.substring(16);
      await clearUserState(userId, env);
      await handleSendMessageToUser(chatId, targetUserId, message.text, env);
    } else if (state && state.startsWith('waiting_price_')) {
      const targetUserId = state.substring(14);
      await clearUserState(userId, env);
      await handleSetPrice(chatId, targetUserId, message.text, env);
    } else {
      await sendMessage(chatId, 
        'Используйте кнопки для управления ботом.',
        getAdminKeyboard(),
        env
      );
    }
    return;
  }
  
  // Обычные пользователи должны быть зарегистрированы
  if (!users[userId]) {
    await sendMessage(chatId, 
      'Сначала зарегистрируйтесь, нажав /start',
      null,
      env
    );
    return;
  }

  // Обработка фото (скриншот подписки)
  if (message.photo) {
    // Проверяем, это ответ на сообщение с ссылкой?
    if (!message.reply_to_message) {
      await sendMessage(chatId, 
        '❌ Отправьте скриншот ответом на сообщение с ссылкой от администратора.',
        null,
        env
      );
      return;
    }
    
    // Проверяем, что это ответ на сообщение от бота
    if (message.reply_to_message.from.is_bot) {
      await handleScreenshot(chatId, userId, message.photo, message.reply_to_message.text, env);
    } else {
      await sendMessage(chatId, 
        '❌ Отправьте скриншот ответом на сообщение с ссылкой от администратора.',
        null,
        env
      );
    }
    return;
  }

  await sendMessage(chatId, 
    'Отправьте скриншот подписки, чтобы получить подтверждение.',
    null,
    env
  );
}

// Обработка нажатий на кнопки
async function handleCallback(callbackQuery, env) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id.toString();
  const username = callbackQuery.from.username || 'Без username';
  const firstName = callbackQuery.from.first_name || 'Пользователь';

  // Регистрация пользователя
  if (data === 'register') {
    const users = await getUsers(env);
    
    if (!users[userId]) {
      users[userId] = {
        username,
        firstName,
        subscriptions: 0,
        registered: true,
        registeredAt: new Date().toISOString()
      };
      await saveUsers(users, env);
      
      await editMessage(chatId, messageId,
        `✅ Отлично, ${firstName}! Вы зарегистрированы.\n\n` +
        'Теперь ожидайте рекламные ссылки от администратора.\n' +
        'После подписки отправьте скриншот в этот чат.',
        null,
        env
      );
    } else {
      await editMessage(chatId, messageId,
        `Вы уже зарегистрированы, ${firstName}!\n\n` +
        `Подписок: ${users[userId].subscriptions}`,
        null,
        env
      );
    }
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  // Проверка админа
  const isAdmin = await checkAdmin(userId, env);
  if (!isAdmin) {
    await answerCallback(callbackQuery.id, '❌ У вас нет доступа', env);
    return;
  }

  // Админ-панель
  if (data === 'admin_users') {
    await showUsersList(chatId, messageId, 0, env);
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  if (data === 'admin_broadcast') {
    await setUserState(userId, 'waiting_broadcast', env);
    await editMessage(chatId, messageId,
      '📢 Напишите текст новости для рассылки всем пользователям:\n\n' +
      'Это сообщение получат все зарегистрированные пользователи.',
      getCancelKeyboard(),
      env
    );
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  if (data === 'admin_set_response') {
    await setUserState(userId, 'waiting_response', env);
    await editMessage(chatId, messageId,
      '💬 Напишите текст ответа, который будет отправляться после получения скриншота:\n\n' +
      'Используйте {count} для вставки количества подписок.\n' +
      'Например: "Зафиксировано {count} подписок"',
      getCancelKeyboard(),
      env
    );
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  // Управление подписками конкретного пользователя
  if (data.startsWith('user_')) {
    const targetUserId = data.substring(5);
    await showUserManagement(chatId, messageId, targetUserId, env);
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  if (data.startsWith('sub_add_')) {
    const targetUserId = data.substring(8);
    await modifySubscriptions(targetUserId, 1, env);
    await showUserManagement(chatId, messageId, targetUserId, env);
    await answerCallback(callbackQuery.id, '✅ +1 подписка', env);
    return;
  }

  if (data.startsWith('sub_add10_')) {
    const targetUserId = data.substring(10);
    await modifySubscriptions(targetUserId, 10, env);
    await showUserManagement(chatId, messageId, targetUserId, env);
    await answerCallback(callbackQuery.id, '✅ +10 подписок', env);
    return;
  }

  if (data.startsWith('sub_remove_')) {
    const targetUserId = data.substring(11);
    await modifySubscriptions(targetUserId, -1, env);
    await showUserManagement(chatId, messageId, targetUserId, env);
    await answerCallback(callbackQuery.id, '✅ -1 подписка', env);
    return;
  }

  if (data.startsWith('sub_reset_')) {
    const targetUserId = data.substring(10);
    await resetSubscriptions(targetUserId, env);
    await showUserManagement(chatId, messageId, targetUserId, env);
    await answerCallback(callbackQuery.id, '✅ Обнулено', env);
    return;
  }

  if (data.startsWith('send_msg_')) {
    const targetUserId = data.substring(9);
    await setUserState(userId, `waiting_message_${targetUserId}`, env);
    const users = await getUsers(env);
    const user = users[targetUserId];
    await editMessage(chatId, messageId,
      `✉️ Отправьте ссылки для ${user.firstName} (@${user.username}):\n\n` +
      `Каждую ссылку с новой строки:\n` +
      `https://t.me/channel1\n` +
      `https://t.me/channel2\n` +
      `https://t.me/channel3\n\n` +
      `Пользователь получит их отдельными сообщениями.`,
      getCancelKeyboard(),
      env
    );
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  // Удаление пользователя
  if (data.startsWith('delete_user_')) {
    const targetUserId = data.substring(12);
    await deleteUser(chatId, messageId, targetUserId, env);
    await answerCallback(callbackQuery.id, '🗑️ Пользователь удален', env);
    return;
  }

  // Установка цены за подписку
  if (data.startsWith('set_price_')) {
    const targetUserId = data.substring(10);
    await setUserState(userId, `waiting_price_${targetUserId}`, env);
    const users = await getUsers(env);
    const user = users[targetUserId];
    const currentPrice = user.pricePerSub || 'не настроено';
    await editMessage(chatId, messageId,
      `💰 Назначьте цену за подписку для ${user.firstName} (@${user.username}):\n\n` +
      `Текущая цена: ${currentPrice}\n\n` +
      'Отправьте число (например: 15 или 20.5)',
      getCancelKeyboard(),
      env
    );
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  // Одобрение скриншота
  if (data.startsWith('approve_')) {
    const screenshotId = data.substring(8);
    await approveScreenshot(chatId, messageId, screenshotId, env);
    await answerCallback(callbackQuery.id, '✅ Одобрено!', env);
    return;
  }

  // Отклонение скриншота
  if (data.startsWith('reject_')) {
    const screenshotId = data.substring(7);
    await rejectScreenshot(chatId, messageId, screenshotId, env);
    await answerCallback(callbackQuery.id, '❌ Отклонено', env);
    return;
  }

  // Список ожидающих скриншотов
  if (data === 'admin_pending_screenshots') {
    await showPendingScreenshots(chatId, messageId, env);
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  if (data === 'back') {
    await clearUserState(userId, env);
    await editMessage(chatId, messageId,
      '🤖 Панель администратора',
      getAdminKeyboard(),
      env
    );
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  if (data === 'back_users') {
    await showUsersList(chatId, messageId, 0, env);
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  // Пагинация пользователей
  if (data.startsWith('users_page_')) {
    const page = parseInt(data.substring(11));
    await showUsersList(chatId, messageId, page, env);
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  if (data === 'cancel') {
    await clearUserState(userId, env);
    await editMessage(chatId, messageId,
      '❌ Действие отменено.',
      getAdminKeyboard(),
      env
    );
    await answerCallback(callbackQuery.id, '', env);
    return;
  }

  await answerCallback(callbackQuery.id, '', env);
}

// Обработка скриншота
async function handleScreenshot(chatId, userId, photos, originalMessage, env) {
  const users = await getUsers(env);
  const user = users[userId];
  
  if (!user) {
    await sendMessage(chatId, 'Сначала зарегистрируйтесь через /start', null, env);
    return;
  }

  // Получаем самое большое фото (лучшее качество)
  const photo = photos[photos.length - 1];
  const fileId = photo.file_id;

  // Извлекаем ссылку из оригинального сообщения
  const channelLink = originalMessage || 'Ссылка не найдена';

  // Отправляем пользователю подтверждение получения
  await sendMessage(chatId, 
    '📸 Скриншот получен! Ожидайте проверки администратором...',
    null, 
    env
  );

  // Создаем запись о скриншоте
  const screenshotId = `screenshot_${userId}_${Date.now()}`;
  const screenshotData = {
    userId: userId,
    userName: user.firstName,
    userUsername: user.username,
    channelLink: channelLink,
    fileId: fileId,
    status: 'pending', // pending, approved, rejected
    timestamp: Date.now()
  };
  
  await env.USERS.put(screenshotId, JSON.stringify(screenshotData));

  // Отправляем скриншот всем админам с кнопками модерации
  const admins = await getAdmins(env);
  for (const adminId of Object.keys(admins)) {
    try {
      // Отправляем фото админу
      const result = await sendPhoto(adminId, fileId, 
        `📸 Новый скриншот от ${user.firstName} (@${user.username})\n\n` +
        `📊 Текущее количество подписок: ${user.subscriptions || 0}\n` +
        `🔗 Канал: ${channelLink}\n\n` +
        `Одобрить или отклонить?`,
        {
          inline_keyboard: [
            [
              { text: '✅ Одобрить (+1)', callback_data: `approve_${screenshotId}` },
              { text: '❌ Отклонить', callback_data: `reject_${screenshotId}` }
            ]
          ]
        },
        env
      );
      
      // Сохраняем ID сообщения для возможности удаления
      if (result && result.result) {
        screenshotData.adminMessageId = result.result.message_id;
        screenshotData.adminChatId = adminId;
        await env.USERS.put(screenshotId, JSON.stringify(screenshotData));
      }
    } catch (e) {
      console.error('Error sending to admin:', e);
    }
  }
}

// Рассылка ссылки всем пользователям
async function handleSendLink(chatId, link, env) {
  const users = await getUsers(env);
  const userIds = Object.keys(users);
  
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      await sendMessage(userId,
        `🔗 Новая рекламная ссылка:\n\n${link}\n\n` +
        'После подписки отправьте скриншот в этот чат.',
        null,
        env
      );
      success++;
    } catch (error) {
      failed++;
    }
  }

  await sendMessage(chatId,
    `✅ Ссылка разослана!\n\n` +
    `Успешно: ${success}\n` +
    `Ошибок: ${failed}`,
    getAdminKeyboard(),
    env
  );
}

// Общая рассылка (новости)
async function handleBroadcast(chatId, text, env) {
  const users = await getUsers(env);
  const admins = await getAdmins(env);
  
  // Фильтруем - рассылаем только обычным пользователям, не админам
  const userIds = Object.keys(users).filter(id => !admins[id]);
  
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      await sendMessage(userId,
        `📢 Новость от администратора:\n\n${text}`,
        null,
        env
      );
      success++;
    } catch (error) {
      failed++;
    }
  }

  await sendMessage(chatId,
    `✅ Новость разослана!\n\n` +
    `Успешно: ${success}\n` +
    `Ошибок: ${failed}`,
    getAdminKeyboard(),
    env
  );
}

// Установка текста ответа
async function handleSetResponse(chatId, text, env) {
  await env.USERS.put('response_template', text);
  
  await sendMessage(chatId,
    `✅ Текст ответа установлен:\n\n${text}\n\n` +
    'Теперь пользователи будут получать это сообщение после отправки скриншота.',
    getAdminKeyboard(),
    env
  );
}

// Отправка сообщения конкретному пользователю
async function handleSendMessageToUser(chatId, targetUserId, text, env) {
  const users = await getUsers(env);
  const user = users[targetUserId];
  
  if (!user) {
    await sendMessage(chatId,
      '❌ Пользователь не найден.',
      getAdminKeyboard(),
      env
    );
    return;
  }

  // Разбиваем текст на строки (каждая строка = отдельная ссылка)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  let successCount = 0;
  let failCount = 0;

  for (const line of lines) {
    try {
      await sendMessage(targetUserId,
        `🔗 Новая ссылка на канал:\n\n${line}\n\n` +
        `📸 Подпишитесь на канал и отправьте скриншот подписки ОТВЕТОМ на это сообщение.\n\n` +
        `⚠️ Если вы уже подписаны, отправлять скриншот не нужно.`,
        null,
        env
      );
      successCount++;
      
      // Небольшая задержка между сообщениями
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      failCount++;
    }
  }

  await sendMessage(chatId,
    `✅ Ссылки отправлены пользователю ${user.firstName} (@${user.username})\n\n` +
    `Успешно: ${successCount}\n` +
    `Ошибок: ${failCount}`,
    getAdminKeyboard(),
    env
  );
}

// Одобрение скриншота
async function approveScreenshot(chatId, messageId, screenshotId, env) {
  // Получаем данные скриншота
  const screenshotDataStr = await env.USERS.get(screenshotId);
  if (!screenshotDataStr) {
    await editMessageCaption(chatId, messageId, '❌ Скриншот не найден.', null, env);
    return;
  }
  
  const screenshotData = JSON.parse(screenshotDataStr);
  const targetUserId = screenshotData.userId;
  
  const users = await getUsers(env);
  const user = users[targetUserId];
  
  if (!user) {
    await editMessageCaption(chatId, messageId, '❌ Пользователь не найден.', null, env);
    return;
  }

  // Увеличиваем счетчик подписок
  user.subscriptions = (user.subscriptions || 0) + 1;
  users[targetUserId] = user;
  await saveUsers(users, env);

  // Обновляем статус скриншота
  screenshotData.status = 'approved';
  screenshotData.approvedAt = Date.now();
  await env.USERS.put(screenshotId, JSON.stringify(screenshotData));

  // Получаем текст ответа
  const responseTemplate = await getResponseTemplate(env);
  const responseText = responseTemplate.replace('{count}', user.subscriptions);

  // Отправляем подтверждение пользователю
  try {
    await sendMessage(targetUserId, responseText, null, env);
  } catch (e) {
    console.error('Error sending to user:', e);
  }

  // Удаляем сообщение со скриншотом
  await deleteMessage(chatId, messageId, env);
  
  // Отправляем уведомление админу
  await sendMessage(chatId,
    `✅ Одобрено: ${user.firstName} (@${user.username})\n` +
    `Новое количество подписок: ${user.subscriptions}`,
    null,
    env
  );
}

// Отклонение скриншота
async function rejectScreenshot(chatId, messageId, screenshotId, env) {
  // Получаем данные скриншота
  const screenshotDataStr = await env.USERS.get(screenshotId);
  if (!screenshotDataStr) {
    await editMessageCaption(chatId, messageId, '❌ Скриншот не найден.', null, env);
    return;
  }
  
  const screenshotData = JSON.parse(screenshotDataStr);
  const targetUserId = screenshotData.userId;
  
  const users = await getUsers(env);
  const user = users[targetUserId];
  
  if (!user) {
    await editMessageCaption(chatId, messageId, '❌ Пользователь не найден.', null, env);
    return;
  }

  // Обновляем статус скриншота
  screenshotData.status = 'rejected';
  screenshotData.rejectedAt = Date.now();
  await env.USERS.put(screenshotId, JSON.stringify(screenshotData));

  // Отправляем уведомление пользователю
  try {
    await sendMessage(targetUserId,
      '❌ Ваш скриншот был отклонен администратором.\n\n' +
      'Пожалуйста, убедитесь что:\n' +
      '• Вы действительно подписались\n' +
      '• Скриншот четкий и читаемый\n' +
      '• Видно подтверждение подписки\n\n' +
      'Попробуйте отправить скриншот снова.',
      null,
      env
    );
  } catch (e) {
    console.error('Error sending to user:', e);
  }

  // Удаляем сообщение со скриншотом
  await deleteMessage(chatId, messageId, env);
  
  // Отправляем уведомление админу
  await sendMessage(chatId,
    `❌ Отклонено: ${user.firstName} (@${user.username})\n` +
    `Количество подписок: ${user.subscriptions || 0} (не изменилось)`,
    null,
    env
  );
}

// Показать список ожидающих скриншотов
async function showPendingScreenshots(chatId, messageId, env) {
  // Получаем все ключи из KV
  const list = await env.USERS.list({ prefix: 'screenshot_' });
  
  const pending = [];
  const approved = [];
  const rejected = [];
  
  for (const key of list.keys) {
    const dataStr = await env.USERS.get(key.name);
    if (dataStr) {
      const data = JSON.parse(dataStr);
      if (data.status === 'pending') {
        pending.push(data);
      } else if (data.status === 'approved') {
        approved.push(data);
      } else if (data.status === 'rejected') {
        rejected.push(data);
      }
    }
  }
  
  let text = '📸 Статус скриншотов:\n\n';
  
  text += `⏳ Ожидают проверки: ${pending.length}\n`;
  if (pending.length > 0) {
    pending.slice(0, 5).forEach(s => {
      text += `  • ${s.userName} (@${s.userUsername})\n`;
    });
    if (pending.length > 5) {
      text += `  ... и еще ${pending.length - 5}\n`;
    }
  }
  
  text += `\n✅ Одобрено сегодня: ${approved.length}\n`;
  text += `❌ Отклонено сегодня: ${rejected.length}\n`;
  
  await editMessage(chatId, messageId, text, 
    { inline_keyboard: [[{ text: '🔙 Назад', callback_data: 'back' }]] },
    env
  );
}

// Показать список пользователей
async function showUsersList(chatId, messageId, page, env) {
  const users = await getUsers(env);
  const admins = await getAdmins(env);
  
  // Фильтруем пользователей - убираем админов из списка
  const userList = Object.entries(users).filter(([id]) => !admins[id]);
  
  if (userList.length === 0) {
    await editMessage(chatId, messageId,
      '📋 Нет зарегистрированных пользователей.',
      getAdminKeyboard(),
      env
    );
    return;
  }

  // Пагинация: 10 пользователей на страницу
  const perPage = 10;
  const totalPages = Math.ceil(userList.length / perPage);
  const currentPage = Math.max(0, Math.min(page, totalPages - 1));
  const start = currentPage * perPage;
  const end = start + perPage;
  const pageUsers = userList.slice(start, end);

  const buttons = [];
  pageUsers.forEach(([id, data]) => {
    buttons.push([{
      text: `${data.firstName} (@${data.username}) - ${data.subscriptions || 0} подписок`,
      callback_data: `user_${id}`
    }]);
  });

  // Кнопки навигации
  const navButtons = [];
  if (currentPage > 0) {
    navButtons.push({ text: '⬅️ Назад', callback_data: `users_page_${currentPage - 1}` });
  }
  if (currentPage < totalPages - 1) {
    navButtons.push({ text: 'Вперёд ➡️', callback_data: `users_page_${currentPage + 1}` });
  }
  if (navButtons.length > 0) {
    buttons.push(navButtons);
  }

  buttons.push([{ text: '🔙 В меню', callback_data: 'back' }]);

  await editMessage(chatId, messageId,
    `👥 Список пользователей (${start + 1}-${Math.min(end, userList.length)} из ${userList.length}):`,
    { inline_keyboard: buttons },
    env
  );
}

// Показать управление пользователем
async function showUserManagement(chatId, messageId, targetUserId, env) {
  const users = await getUsers(env);
  const user = users[targetUserId];

  if (!user) {
    await editMessage(chatId, messageId,
      '❌ Пользователь не найден.',
      getAdminKeyboard(),
      env
    );
    return;
  }

  const pricePerSub = user.pricePerSub || 'не настроено';
  const priceDisplay = typeof user.pricePerSub === 'number' ? `${user.pricePerSub}р` : pricePerSub;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '➕ +1 подписка', callback_data: `sub_add_${targetUserId}` },
        { text: '➖ -1 подписка', callback_data: `sub_remove_${targetUserId}` }
      ],
      [
        { text: '➕ +10 подписок', callback_data: `sub_add10_${targetUserId}` },
        { text: '🔄 Обнулить', callback_data: `sub_reset_${targetUserId}` }
      ],
      [
        { text: '✉️ Отправить сообщение', callback_data: `send_msg_${targetUserId}` }
      ],
      [
        { text: `💰 ПДП (${priceDisplay})`, callback_data: `set_price_${targetUserId}` }
      ],
      [
        { text: '🗑️ Удалить пользователя', callback_data: `delete_user_${targetUserId}` }
      ],
      [
        { text: '🔙 К списку', callback_data: 'back_users' }
      ]
    ]
  };

  await editMessage(chatId, messageId,
    `👤 ${user.firstName} (@${user.username})\n\n` +
    `📊 Подписок: ${user.subscriptions || 0}\n` +
    `💰 ПДП: ${priceDisplay}\n` +
    `📅 Регистрация: ${new Date(user.registeredAt).toLocaleDateString('ru-RU')}`,
    keyboard,
    env
  );
}

// Изменить количество подписок
async function modifySubscriptions(userId, delta, env) {
  const users = await getUsers(env);
  const user = users[userId];
  
  if (user) {
    user.subscriptions = Math.max(0, (user.subscriptions || 0) + delta);
    users[userId] = user;
    await saveUsers(users, env);
  }
}

// Обнулить подписки
async function resetSubscriptions(userId, env) {
  const users = await getUsers(env);
  const user = users[userId];
  
  if (user) {
    user.subscriptions = 0;
    users[userId] = user;
    await saveUsers(users, env);
  }
}

// Удалить пользователя
async function deleteUser(chatId, messageId, targetUserId, env) {
  const users = await getUsers(env);
  const user = users[targetUserId];
  
  if (!user) {
    await editMessage(chatId, messageId,
      '❌ Пользователь не найден.',
      getAdminKeyboard(),
      env
    );
    return;
  }

  const userName = `${user.firstName} (@${user.username})`;
  
  // Удаляем пользователя
  delete users[targetUserId];
  await saveUsers(users, env);

  // Возвращаемся к списку пользователей
  await editMessage(chatId, messageId,
    `🗑️ Пользователь ${userName} удален из базы данных.`,
    { inline_keyboard: [[{ text: '🔙 К списку', callback_data: 'back_users' }]] },
    env
  );
}

// Установить цену за подписку
async function handleSetPrice(chatId, targetUserId, text, env) {
  const users = await getUsers(env);
  const user = users[targetUserId];
  
  if (!user) {
    await sendMessage(chatId,
      '❌ Пользователь не найден.',
      getAdminKeyboard(),
      env
    );
    return;
  }

  // Парсим цену
  const price = parseFloat(text.replace(',', '.'));
  
  if (isNaN(price) || price < 0) {
    await sendMessage(chatId,
      '❌ Неверный формат цены. Отправьте число (например: 15 или 20.5)',
      getAdminKeyboard(),
      env
    );
    return;
  }

  // Сохраняем цену
  user.pricePerSub = price;
  users[targetUserId] = user;
  await saveUsers(users, env);

  // Показываем обновленную панель управления пользователем
  await sendMessage(chatId,
    `✅ Цена установлена: ${price}р`,
    null,
    env
  );
  
  // Возвращаемся к управлению пользователем
  const messageId = (await sendMessage(chatId, 'Загрузка...', null, env)).result.message_id;
  await showUserManagement(chatId, messageId, targetUserId, env);
}

// Клавиатуры
function getAdminKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '👥 Список пользователей', callback_data: 'admin_users' }
      ],
      [
        { text: '� Скриншоты на проверке', callback_data: 'admin_pending_screenshots' }
      ],
      [
        { text: '�� Общая рассылка (новости)', callback_data: 'admin_broadcast' }
      ]
    ]
  };
}

function getCancelKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '❌ Отмена', callback_data: 'cancel' }]
    ]
  };
}

// Работа с данными
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

async function getResponseTemplate(env) {
  const template = await env.USERS.get('response_template');
  return template || 'Зафиксировано {count} подписок';
}

// Telegram API
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

async function sendPhoto(chatId, photoId, caption, keyboard, env) {
  const params = {
    chat_id: chatId,
    photo: photoId,
    caption: caption,
    parse_mode: 'HTML'
  };
  
  if (keyboard) {
    params.reply_markup = keyboard;
  }

  return await callTelegramAPI('sendPhoto', params, env);
}

async function editMessageCaption(chatId, messageId, caption, keyboard, env) {
  const params = {
    chat_id: chatId,
    message_id: messageId,
    caption: caption,
    parse_mode: 'HTML'
  };
  
  if (keyboard) {
    params.reply_markup = keyboard;
  }

  return await callTelegramAPI('editMessageCaption', params, env);
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
