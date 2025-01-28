// ... existing code ...
require('dotenv').config();  // Load environment variables
console.log('Environment variables loaded.');

const { Telegraf } = require('telegraf');

if (!process.env.BOT_TOKEN) {
  console.error('Error: BOT_TOKEN is not defined in the .env file');
  process.exit(1); // Terminate process if BOT_TOKEN is not defined
}

const bot = new Telegraf(process.env.BOT_TOKEN);
console.log('Telegraf instance created.');

bot.use((ctx, next) => {
  console.log('Received update:', ctx.update);
  return next();
});

bot.start((ctx) => {
  console.log('/start command received.');
  ctx.reply('Hello! Press the button to open the miniapp:', {
    reply_markup: {
      keyboard: [
        [
          {
            text: 'Open miniapp',
            web_app: {
              url: 'https://3775-189-216-171-48.ngrok-free.app'
            }
          }
        ]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

bot.on('message', (ctx) => {
  console.log('Message received.');
  const message = ctx.message;
  if (message.web_app_data) {
    const rawData = message.web_app_data.data;
    console.log('Raw data received from WebApp:', rawData);

    let data;
    try {
      data = JSON.parse(rawData);
    } catch (err) {
      console.error('Error parsing JSON:', err);
      return ctx.reply('Error parsing received data.');
    }

    if (data.action === 'connection') {
      ctx.reply('Received "connection" action from miniapp. All OK!');
    } else if (data.action === 'create_swap') {
      const { recipient, amount, hashLock } = data;
      ctx.reply(`Swap created. Recipient: ${recipient}, Amount: ${amount}, HashLock: ${hashLock}`);
    } else {
      ctx.reply(`Action received: ${data.action}. I don't have logic for this!`);
    }
  } else {
    ctx.reply('Hello, you can type /start to see the WebApp button.');
  }
});

bot.catch((err, ctx) => {
  console.error('Oops', err);
  ctx.reply('An error occurred in the bot. Please try again.');
});

bot.launch().then(() => {
  console.log('Telegraf bot running...');
}).catch(err => {
  console.error('Error starting bot:', err);
  process.exit(1);
});

// ... existing code ...