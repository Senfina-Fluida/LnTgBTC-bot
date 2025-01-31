import 'dotenv/config'; // Load environment variables using import

import { Telegraf } from 'telegraf';
import { queryDocuments, insertDocument, updateDocument } from './db.js';


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
  return `${index + 1}. Source: ${swap.source}, Destination: ${swap.destination}, Amount: ${swap.amount}, SwapID: ${swap._id}\n`;
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

async function startSwap(ctx,swapId){
  try {
      let query = {
        _id: swapId,
        status: "pending"
      };
      let docs = await queryDocuments(query);
      if(docs.length === 0){
        return ctx.reply("No swap with that id");
      }
      let swap = docs[0];
      await updateDocument(
        { _id: swapId},
        { $set : {status: "selected" , selectorChatId: ctx.chat.id}} // Use ctx.chat.id for group chats too
      );
      query = {
        _id: swapId,
        status: "selected"
      };
      docs = await queryDocuments(query);

      swap = docs[0];
      if(swap.destination === "Lightning"){
        await bot.telegram.sendMessage(
          swap.chatId,
          `Your swap ${swapId}, has been selected. Time to lock tgBTC`,{
            reply_markup: {
              inline_keyboard: [
                [{
                  text: "Open Web App",
                  web_app: { url: `${MINIAPP_URL}/startSwap?params=${encodeURIComponent(JSON.stringify(swap))}` }
                }]
              ]
            }
          }
        );
        ctx.reply("Swap selected. You will receive a lightning invoice to pay using the miniapp and finish the swap");

      } else {
        await bot.telegram.sendMessage(
          swap.chatId,
          `Your swap ${swapId}, has been selected. You will receive a lightning invoice to pay using the miniapp and finish the swap`
        );
        ctx.reply("Swap selected, time to lock tgBTC",{
          reply_markup: {
            inline_keyboard: [
              [{
                text: "Start Swap",
                web_app: { url: `${MINIAPP_URL}/startSwap?params=${encodeURIComponent(JSON.stringify(swap))}` }
              }]
            ]
          }
        });
      }

  } catch (error) {
    console.error("Error updating swap:", error);
    return ctx.reply("An error occurred during update.");
  }
};


bot.use((ctx, next) => {
  console.log('Received update:', ctx.update);
  return next();
});

bot.start(async (ctx) => {
  console.log('/start command received.');
  const query = { status: "pending" };
  const chatId = ctx.chat.id;
  const docs = await queryDocuments(query);
  const webAppUrl = `${MINIAPP_URL}/?params=${encodeURIComponent(JSON.stringify(docs))}}`;
  console.log(webAppUrl)
  ctx.reply('Hello! Press the button to open the miniapp:', {
    reply_markup: {
      keyboard: [
        [
          {
            text: 'Open miniapp',
            web_app: {
              url: webAppUrl
            }
          }
        ]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});
bot.command('list', async (ctx) => {
  const query = {status: "pending"};
  await listSwaps(ctx, query, "Here are all the swaps:");
});

bot.command('mypending', async (ctx) => {
  const query = { status: "pending", chatId: ctx.message.chat.id };
  await listSwaps(ctx, query, "Here are your pending swaps:");
});

bot.command('myselected', async (ctx) => {
  const query = { status: "selected", chatId: ctx.message.chat.id };
  await listSwaps(ctx, query, "Here are your selected swaps:");
});

// Command to create a swap
bot.command('create', async (ctx) => {
  const params = ctx.message.text.split(' ').slice(1).join(' '); // Get parameters after command
  const [ destination, amount] = params.split(' ');  // Split parameters

  if (!destination || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return ctx.reply("Please provide destination, and a valid amount. Example: /create Lightning 10");
  }

  const doc = {
    status: "pending",
    source: destination !== "TON" ? "TON" : "Lightning",
    destination: destination,
    amount: parseFloat(amount),
    chatId: ctx.chat.id,
  };

  try {
    const newSwap = await insertDocument(doc);
    const query = {chatId: ctx.message.chat.id, status: "pending"}
    const docs = await queryDocuments(query);

    ctx.reply(`Swap created with ID: ${newSwap._id}. Open miniapp to view all pending.`, {
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
  } catch (error) {
    console.error("Error creating swap:", error);
    ctx.reply("An error occurred while creating the swap.");
  }
});

bot.command('select', async (ctx) => {
  const swapId = ctx.message.text.split(' ')[1]; // Extract swapId from command

  if (!swapId) {
    return ctx.reply("Please provide a swap ID.  Example: /select 12345");
  }

  const query = {
    _id: swapId,
    status: "pending"
  };

  try {
    const docs = await queryDocuments(query);

    if (docs.length === 0) {
      return ctx.reply("No swap with that ID found.");
    }

    const swap = docs[0];

    // Inline Keyboard for Confirmation
    await ctx.reply(`Are you sure you want to select swap ${swapId}?`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Yes', callback_data: `confirm_swap_${swapId}` }],
          [{ text: 'No', callback_data: 'cancel_swap' }],
        ],
      },
    });
  } catch (error) {
    console.error("Error finding swap:", error);
    return ctx.reply("An error occurred. Please try again later.");
  }
});


bot.command('finish', async (ctx) => {
  const swapId = ctx.message.text.split(' ')[1]; // Extract swapId from command

  if (!swapId) {
    return ctx.reply("Please provide a swap ID.  Example: /finish 12345");
  }

  const query = {
    _id: swapId,
    status: "selected",
    selectorChatId: ctx.chat.id,
  };

  try {
    const docs = await queryDocuments(query);

    if (docs.length === 0) {
      return ctx.reply("No swap with that ID that you have selected before.");
    }

    const swap = docs[0];

    // Inline Keyboard for Confirmation
    if(swap.destination === "Lightning"){
      await bot.telegram.sendMessage(
        swap.chatId,
        `Your swap ${swapId}, has been selected. Time to lock tgBTC`,{
          reply_markup: {
            inline_keyboard: [
              [{
                text: "Open Web App",
                web_app: { url: `${MINIAPP_URL}/startSwap?params=${encodeURIComponent(JSON.stringify({...swap,fromTON: false}))}` }
              }]
            ]
          }
        }
      );
      ctx.reply("Swap selected. You will receive a lightning invoice to pay using the miniapp and finish the swap");

    } else {
      await bot.telegram.sendMessage(
        swap.chatId,
        `Your swap ${swapId}, has been selected. You will receive a lightning invoice to pay using the miniapp and finish the swap`
      );
      console.log(`${MINIAPP_URL}/startSwap?params=${encodeURIComponent(JSON.stringify({...swap,fromTON:true}))}`)
      ctx.reply("Swap selected, time to lock tgBTC",{
        reply_markup: {
          inline_keyboard: [
            [{
              text: "Start Swap",
              web_app: { url: `${MINIAPP_URL}/startSwap?params=${encodeURIComponent(JSON.stringify({...swap,fromTON:true}))}` }
            }]
          ]
        }
      });
    }
  } catch (error) {
    console.error("Error finding swap:", error);
    return ctx.reply("An error occurred. Please try again later.");
  }
});

bot.action(/confirm_swap_(.+)/, async (ctx) => {
  const swapId = ctx.match[1];
  await startSwap(ctx,swapId);
});

bot.action('cancel_swap', (ctx) => {
  ctx.reply("Swap selection cancelled.");
});
bot.command('help', (ctx) => {
  ctx.reply(
    `Available Commands:\n` +
    `- /start: Open the miniapp.\n` +
    `- /list: List all swaps.\n` +
    `- /mypending: List your pending swaps.\n` +
    `- /myselected: List your selected swaps.\n` +
    `- /create [destination] [amount]: Create a new swap.\n` +
    `- /select [swapId]: Select a specific swap. \n`,
    `- /finish [swapId]: Finalize a specific swap.\n`,
    { parse_mode: 'Markdown' } // Use Markdown for formatting
  );
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
        destination: data.destination,
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
      await startSwap(ctx,data.swapId);
    } 

  } else {
    ctx.reply('Hello, you can type /start to see the WebApp button or /help to see all commands.');
  }
});



bot.telegram.setMyCommands([
  { command: 'start', description: 'Open the miniapp' },
  { command: 'list', description: 'List all swaps' },
  { command: 'mypending', description: 'List your pending swaps' },
  { command: 'myselected', description: 'List your selected swaps' },
  { command: 'create', description: 'Create a new swap (e.g., /create Lightning 10)' },
  { command: 'select', description: 'Select a specific swap (e.g., /select 12345)' },
  { command: 'finish', description: 'Finalize a specific swap (e.g., /finish 12345)' },
  { command: 'help', description: 'Show available commands' },
])
  .then(() => {
    console.log('Bot commands set successfully.');
  })
  .catch((err) => {
    console.error('Error setting bot commands:', err);
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

