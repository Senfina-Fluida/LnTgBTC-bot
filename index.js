// ... existing code ...
require('dotenv').config();  // Load environment variables
console.log('Environment variables loaded.');

const { Telegraf } = require('telegraf');

const Datastore = require('nedb');
const path = require('path');

if (!process.env.BOT_TOKEN) {
  console.error('Error: BOT_TOKEN is not defined in the .env file');
  process.exit(1); // Terminate process if BOT_TOKEN is not defined
}

const bot = new Telegraf(process.env.BOT_TOKEN);
console.log('Telegraf instance created.');

// Initialize the NeDB database
const dbPath = path.join('./data', 'bot.db');
const db = new Datastore({ filename: dbPath, autoload: true });


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
              url: 'https://db71-177-238-22-24.ngrok-free.app'
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
  console.log(ctx)
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

    if (data.action === 'get_pending_swaps'){
      const query = {
        status: "pending"
      }
      db.find(query).limit(10).exec();
    } else if (data.action === 'connection') {
      console.log(ctx.webAppData)
      ctx.telegram.answerWebAppQuery(ctx.message.chat.id,{
        id: ctx.message.chat.id,
        type: "article",
        input_message_content: {
          message_text: "All ok, connected" // Your JSON data as a string
        },
        title: 'test'
      });
    } else if (data.action === 'create_swap') {
      const { recipient, amount, hashLock } = data;
      ctx.telegram.answerWebAppQuery(ctx.message.chat.id,{
        id: ctx.message.chat.id,
        type: "article",
        input_message_content: {
          message_text: "All ok, connected" // Your JSON data as a string
        },
        title: 'test'
      });
    } else if(ctx.webAppData.query_id){
      ctx.telegram.answerWebAppQuery(ctx.message.chat.id,{
        id: ctx.message.chat.id,
        type: "article",
        input_message_content: {
          message_text: "All ok, connected" // Your JSON data as a string
        },
        title: 'test'
      });
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