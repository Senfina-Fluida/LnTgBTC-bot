import 'dotenv/config'; // Load environment variables using import

import { Telegraf } from 'telegraf';
import { queryDocuments, insertDocument } from './db.js';


console.log('Environment variables loaded.');

const MINIAPP_URL = process.env.MINIAPP_URL;
if(!MINIAPP_URL){
  console.error('Error: MINIAPP_URL is not defined in the .env file');
  process.exit(1); // Terminate process if MINIAPP_URL is not defined

}


if (!process.env.BOT_TOKEN) {
  console.error('Error: BOT_TOKEN is not defined in the .env file');
  process.exit(1); // Terminate process if BOT_TOKEN is not defined
}

const bot = new Telegraf(process.env.BOT_TOKEN);
console.log('Telegraf instance created.');

// Helper function to format swap data
function formatSwap(swap, index) {
  return `${index + 1}. Source: ${swap.source}, Destination: ${swap.destiny}, Amount: ${swap.amount}\n`;
}

// Helper function to send messages in chunks
async function sendChunkedMessage(ctx, message) {
  const chunkSize = 4096;
  for (let i = 0; i < message.length; i += chunkSize) {
    const chunk = message.substring(i, i + chunkSize);
    await ctx.reply(chunk);
  }
}

// Generic swap listing function (reusable)
async function listSwaps(ctx, query, title) {
  try {
    const docs = await queryDocuments(query);
    if (docs.length === 0) {
      return ctx.reply("No swaps found.");
    }

    let message = `${title}\n`;

    message += docs.map(formatSwap).join(''); //More efficient than forEach

    await sendChunkedMessage(ctx, message);

  } catch (err) {
    console.error("Error listing swaps:", err); // Log the error for debugging
    return ctx.reply("Error listing swaps from the database.");
  }
}


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
              url: MINIAPP_URL
            }
          }
        ]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});
bot.command('listSwaps', async (ctx) => {
  const query = {};
  await listSwaps(ctx, query, "Here are all the swaps:");
});

bot.command('myPendingSwaps', async (ctx) => {
  const query = { status: "pending", chatId: ctx.message.chat.id };
  await listSwaps(ctx, query, "Here are your pending swaps:");
});
bot.on('message', async (ctx) => {
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

   if (data.action === 'post_swap'){
      const doc = {
        status: "pending",
        source: data.source,
        destiny: data.destiny,
        amount: data.amount,
        chatId: ctx.message.chat.id
      }
      console.log(ctx.message.chat)
      const docId = await insertDocument(doc);
      const query = {
        chatId: ctx.message.chat.id,
        status: "pending"
      }
      const docs = await queryDocuments(query);
      console.log(docs)
      console.log(`${MINIAPP_URL}/myPendingSwaps?params=${encodeURIComponent(JSON.stringify(docs))}`)
      ctx.reply("Action performed, connect app to see your pending swaps", {
        reply_markup: {
          keyboard: [
            [{
            text: "Open Web App",
            web_app: { url: `${MINIAPP_URL}/myPendingSwaps?params=${encodeURIComponent(JSON.stringify(docs))}` }
            }]
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
      
    } else if (data.action === 'select_swap') {
      ctx.reply("Action performed, connect app with parameter", {
        reply_markup: {
          keyboard: [
            [{
            text: "Open Web App",
            web_app: { url: `${MINIAPP_URL}/?params=${encodeURIComponent(JSON.stringify({ userId: 123, name: "John Doe" }))}` }
            }]
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
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

