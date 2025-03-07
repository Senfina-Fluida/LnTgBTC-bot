import 'dotenv/config'; // Load environment variables using import

import { Telegraf } from 'telegraf';
import { decode } from 'light-bolt11-decoder';
import { TONXJsonRpcProvider } from "@tonx/core";

import { queryDocuments, insertDocument, updateDocument,deleteDocument } from './db.js';


console.log('Environment variables loaded.');

const MINIAPP_URL = process.env.MINIAPP_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
if(!MINIAPP_URL){
  console.error('Error: MINIAPP_URL is not defined in the .env file');
  process.exit(1); // Terminate process if MINIAPP_URL is not defined
}

if (!process.env.BOT_TOKEN) {
  console.error('Error: BOT_TOKEN is not defined in the .env file');
  process.exit(1); // Terminate process if BOT_TOKEN is not defined
}
if (!process.env.CONTRACT_ADDRESS) {
  console.error('Error: CONTRACT_ADDRESS is not defined in the .env file');
  process.exit(1); // Terminate process if BOT_TOKEN is not defined
}
if (!process.env.TONXAPI_KEY) {
  console.error('Error: TONXAPI_KEY is not defined in the .env file');
  process.exit(1); // Terminate process if BOT_TOKEN is not defined
}
const bot = new Telegraf(process.env.BOT_TOKEN);
console.log('Telegraf instance created.');
const client = new TONXJsonRpcProvider({
  network: "testnet",
  apiKey: process.env.TONXAPI_KEY,
});
// Helper function to format swap data
const formatSwap = (swap, index) => {
  return `${index + 1}. Source: ${swap.source}, Destination: ${swap.destination}, Amount: ${swap.amount}, SwapID: ${swap._id}\n`;
}

// Helper function to send messages in chunks
const sendChunkedMessage = async (ctx, message) => {
  const chunkSize = 4096;
  for (let i = 0; i < message.length; i += chunkSize) {
    const chunk = message.substring(i, i + chunkSize);
    await ctx.reply(chunk);
  }
}

// Generic swap listing function (reusable)
const listSwaps = async (ctx, query, title) => {
  try {
    const docs = await queryDocuments(query);
    if (docs.length === 0) {
      ctx.reply("No swaps found.");
      return; 
    }

    let message = `${title}\n`;

    message += docs.map(formatSwap).join(''); //More efficient than forEach

    await sendChunkedMessage(ctx, message);
    return(docs);
  } catch (err) {
    console.error("Error listing swaps:", err); // Log the error for debugging
    return ctx.reply("Error listing swaps from the database.");
  }
}

const startSwap = async (ctx,swapId) => {
  try {
      let query = {
        _id: swapId,
        //status: "pending"
      };
      let docs = await queryDocuments(query);
      if(docs.length === 0){
        return ctx.reply("No swap with that id");
      }
      let swap = docs[0];
      await updateDocument(
        { _id: swapId},
        {
           $set : {
            status: "selected" ,
            selectorChatId: ctx.message?.chat.id ? 
              ctx.message.chat.id :
              ctx.update.callback_query.message.chat.id
          }
        } // Use ctx.chat.id for group chats too
      );
      query = {
        _id: swapId,
        status: "selected"
      };
      docs = await queryDocuments(query);

      swap = docs[0];
      console.log(swap)
      if(swap.destination === "Lightning"){
        console.log(`${MINIAPP_URL}/startSwap?params=${encodeURIComponent(JSON.stringify({...swap,fromTON: true}))}`)
        await bot.telegram.sendMessage(
          swap.chatId,
          `Your swap ${swapId}, has been selected. Time to lock tgBTC`,{
            reply_markup: {
              keyboard: [
                [{
                  text: "Start Swap",
                  web_app: { url: `${MINIAPP_URL}/startSwap?params=${encodeURIComponent(JSON.stringify({...swap,fromTON: true}))}` }
                }]
              ],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          }
        );
        ctx.reply("Swap selected. You will receive a lightning invoice to pay using the miniapp and finish the swap");

      } else {
        await bot.telegram.sendMessage(
          swap.chatId,
          `Your swap ${swapId}, has been selected. You will receive a lightning invoice to pay using the miniapp and finish the swap`
        );
        console.log(`${MINIAPP_URL}/startSwap?params=${encodeURIComponent(JSON.stringify({...swap,fromTON: true}))}`)

        ctx.reply(
          `Swap selected, time to lock tgBTC`,{
            reply_markup: {
              keyboard: [
                [{
                  text: "Start swap",
                  web_app: { url: `${MINIAPP_URL}/startSwap?params=${encodeURIComponent(JSON.stringify({...swap,fromTON: true}))}` }
                }]
              ],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          }
        );
      }

  } catch (error) {
    console.error("Error updating swap:", error);
    return ctx.reply("An error occurred during update.");
  }
};
const finishSelectedSwap = async (ctx,swapId) => {
  try {
      let query = {
        _id: swapId,
        status: "selected"
      };
      let docs = await queryDocuments(query);
      if(docs.length === 0){
        return ctx.reply("No swap with that id");
      }
      let swap = docs[0];
      console.log(swap)
      if(swap.destination === "Lightning"){
        console.log(`${MINIAPP_URL}/startSwap?params=${encodeURIComponent(JSON.stringify({...swap,fromTON: true}))}`)
        await bot.telegram.sendMessage(
          swap.chatId,
          `Your swap ${swapId}, has been selected. Time to lock tgBTC`,{
            reply_markup: {
              keyboard: [
                [{
                  text: "Start Swap",
                  web_app: { url: `${MINIAPP_URL}/startSwap?params=${encodeURIComponent(JSON.stringify({...swap,fromTON: true}))}` }
                }]
              ],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          }
        );
        ctx.reply("Swap selected. You will receive a lightning invoice to pay using the miniapp and finish the swap");

      } else {
        await bot.telegram.sendMessage(
          swap.chatId,
          `Your swap ${swapId}, has been selected. You will receive a lightning invoice to pay using the miniapp and finish the swap`
        );
        console.log(`${MINIAPP_URL}/startSwap?params=${encodeURIComponent(JSON.stringify({...swap,fromTON: true}))}`)

        ctx.reply(
          `Swap selected, time to lock tgBTC`,{
            reply_markup: {
              keyboard: [
                [{
                  text: "Start swap",
                  web_app: { url: `${MINIAPP_URL}/startSwap?params=${encodeURIComponent(JSON.stringify({...swap,fromTON: true}))}` }
                }]
              ],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          }
        );
      }

  } catch (error) {
    console.error("Error updating swap:", error);
    return ctx.reply("An error occurred during update.");
  }
};
const refundSelectedSwap = async (ctx,swapId) => {
  try {
      let query = {
        _id: swapId,
        status: "locked"
      };
      let docs = await queryDocuments(query);
      if(docs.length === 0){
        return ctx.reply("No swap with that id");
      }
      let swap = docs[0];
      if(!swap) return;
      console.log(`${MINIAPP_URL}/refundSwap?params=${encodeURIComponent(JSON.stringify(swap))}`)
      ctx.reply(
        `Continue in the MiniApp to proceed with refund`,{
          reply_markup: {
            keyboard: [
              [{
                text: "Refund Swap",
                web_app: { url: `${MINIAPP_URL}/refundSwap?params=${encodeURIComponent(JSON.stringify(swap))}` }
              }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }
      );

  } catch (error) {
    console.error("Error updating swap:", error);
    return ctx.reply("An error occurred during update.");
  }
};
const isInvoiceAmountValid = async (invoice,amt) => {
  try{
    const decoded = decode(invoice);
    const amount = Number(decoded.sections[2].value)/1000;
    if(amount === Number(amt)) return(true);
  } catch(err){
    console.error(err);
  }
  return(false);
};
const isInvoiceHashLockValid = async (invoice,contractHashLock) => {
  try{
    const decoded = decode(invoice);
    const hashLock = "0x" + decoded.payment_hash
    if(hashLock === contractHashLock) return(true);
  } catch(err){
    console.error(err);
  }
  return(false);
};

const getContractSwap = (invoice) => {
  let i = 0;
  return new Promise((resolve) => {
    // Set up the interval
    const interval = setInterval(async () => {
      try {
        const decoded = decode(invoice);
        const hashLockBigInt = BigInt('0x'+decoded.payment_hash);
        client.runGetMethod({
          address: CONTRACT_ADDRESS,
          method: 'get_swap_by_hashlock',
          stack: [{ type: "num", value: hashLockBigInt.toString() }]
        }).then(result => {
          console.log(result)
          if(result.stack.length <= 1){
            i++
            return;
          }
          const contractSwap = {
            swapId: result.stack[0][1],
            amount: result.stack[3][1],
            hashLock: result.stack[4][1],
            timeLock: result.stack[5][1],
            isCompleted: result.stack[6][1]
          };
          console.log(contractSwap)
          resolve(contractSwap);
        });
      } catch (error) {
        console.error(`Error fetching transactions, tries: ${i}`);
      }
      // If the maximum number of attempts is reached, resolve with `false` and clear the interval
      if (i >= 5) {
        clearInterval(interval); // Stop the interval
        resolve(null);
        return; // Exit the function early
      }
      i++; // Increment the attempt counter
    }, 10000); // Check every 10 seconds
  });
};
/*
const isTransactionConfirmed = (transactionHash) => {
  let i = 0;
  return new Promise((resolve) => {
    // Set up the interval
    const interval = setInterval(async () => {
      try {
        console.log(client)
        const txResponse = await client.getTransactions({
          hash: transactionHash,
        });
        console.log(txResponse);

        // If the transaction is found, resolve with `true` and clear the interval
        if (txResponse?.length > 0) {
          clearInterval(interval); // Stop the interval
          resolve(true);
          return; // Exit the function early
        }

      } catch (error) {
        console.error(`Error fetching transactions, tries: ${i}`);
      }
      // If the maximum number of attempts is reached, resolve with `false` and clear the interval
      if (i >= 5) {
        clearInterval(interval); // Stop the interval
        resolve(false);
        return; // Exit the function early
      }
      i++; // Increment the attempt counter
    }, 10000); // Check every 10 seconds
  });
};
*/
const isTransactionValid = (transactionHash) => {
  let i = 0;
  const baseUrl = 'https://testnet.toncenter.com/api/v2/getTransactions';

  // Build query parameters exactly as in the curl example.
  const params = new URLSearchParams({
    address: CONTRACT_ADDRESS,
    limit: '1',
    hash: transactionHash,
    to_lt: '0',
    archival: 'false'
  });
  const url = `${baseUrl}?${params.toString()}`;

  return new Promise((resolve) => {
    // Set up the interval
    const interval = setInterval(async () => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'accept': 'application/json'
          }
        });
    
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error from API:", errorText);
          return;
        }
        const result = await response.json();
        console.log("Received transaction data:",JSON.stringify(result, null, 2));
        clearInterval(interval); // Stop the interval
        resolve(true);
        return; // Exit the function early

      } catch (error) {
        console.error(`Error fetching transactions, tries: ${i}`);
      }
      // If the maximum number of attempts is reached, resolve with `false` and clear the interval
      if (i >= 5) {
        clearInterval(interval); // Stop the interval
        resolve(false);
        return; // Exit the function early
      }
      i++; // Increment the attempt counter
    }, 10000); // Check every 10 seconds
  });
};

bot.use((ctx, next) => {
  console.log('Received update:', ctx.update);
  return next();
});

bot.start(async (ctx) => {
  console.log('/start command received.');
  const query = {
    status: "pending",
    chatId: { $ne: ctx.message.chat.id }
  }; 
  const docs = await queryDocuments(query);
  const webAppUrl = `${MINIAPP_URL}/?params=${encodeURIComponent(JSON.stringify(docs))}`;
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
  const query = {status: "pending"}; // To test
  /*
  const query = {
    status: "pending",
    chatId: { $ne: ctx.message.chat.id }
  } 
  */
  let docs = await listSwaps(ctx, query, "Here are all the swaps:");
  if(!docs) return;
  docs = docs.map(doc => {
    return({
      ...doc,
      isOwner: ctx.message.chat.id === doc.chatId 
    });
  });
  ctx.reply(`Open miniapp to view the list.`, {
    reply_markup: {
      keyboard: [
        [
          {
            text: "Pending Swaps List",
            web_app: { url: `${MINIAPP_URL}/swaps?params=${encodeURIComponent(JSON.stringify(docs))}` }
          }
        ]
      ],

      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

bot.command('mypending', async (ctx) => {
  const query = { status: "pending", chatId: ctx.message.chat.id };
  let docs = await listSwaps(ctx, query, "Here are your pending swaps:");
  if(!docs) return;
  docs = docs.map(doc => {
    return({
      ...doc,
      isOwner: ctx.message.chat.id === doc.chatId 
    });
  })
  ctx.reply(`Open miniapp to view the list.`, {
    reply_markup: {
      keyboard: [
        [{
          text: "Your Pending Swaps",
          web_app: { url: `${MINIAPP_URL}/swaps?params=${encodeURIComponent(JSON.stringify(docs))}` }
        }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

bot.command('myselected', async (ctx) => {
  const query = { status: "selected", chatId: ctx.message.chat.id };
  let docs = await listSwaps(ctx, query, "Here are your selected swaps:");
  if(!docs) return;
  docs = docs.map(doc => {
    return({
      ...doc,
      isOwner: ctx.message.chat.id === doc.chatId 
    });
  })
  console.log(`${MINIAPP_URL}/swaps?params=${encodeURIComponent(JSON.stringify(docs))}`)
  ctx.reply(`Open miniapp to view the list.`, {
    reply_markup: {
      keyboard: [
        [{
          text: "Selected Swaps",
          web_app: { url: `${MINIAPP_URL}/swaps?params=${encodeURIComponent(JSON.stringify(docs))}` }
        }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});
bot.command('locked', async (ctx) => {
  const query = { status: "locked", chatId: ctx.message.chat.id };
  let docs = await listSwaps(ctx, query, "Here are your locked swaps:");
  if(!docs) return;
  docs = docs.map(doc => {
    return({
      ...doc,
      isOwner: ctx.message.chat.id === doc.chatId 
    });
  })
  ctx.reply(`Open miniapp to view the list.`, {
    reply_markup: {
      keyboard: [
        [{
          text: "Locked Swaps",
          web_app: { url: `${MINIAPP_URL}/swaps?params=${encodeURIComponent(JSON.stringify(docs))}` }
        }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});
// Command to create a swap
bot.command('create', async (ctx) => {
  const params = ctx.message.text.split(' ').slice(1).join(' '); // Get parameters after command
  const [ destination, amount] = params.split(' ');  // Split parameters
  
  if ((destination !== "TON" && destination !== "Lightning") || !destination || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return ctx.reply("Please provide destination, and a valid amount. Example: /create Lightning 10");
  }

  const doc = {
    status: "pending",
    source: destination !== "TON" ? "TON" : "Lightning",
    destination: destination,
    amount: parseFloat(amount),
    chatId: ctx.message.chat.id,
  };

  try {
    const newSwap = await insertDocument(doc);
    const query = {chatId: ctx.message.chat.id, status: "pending"}
    let docs = await queryDocuments(query);
    docs = docs.map(doc => {
      return({
        ...doc,
        isOwner: ctx.message.chat.id === doc.chatId 
      });
    });
    ctx.reply(`Swap created with ID: ${newSwap._id}. Open miniapp to view all pending.`, {
      reply_markup: {
        keyboard: [
          [{
          text: "Pending Swaps",
          web_app: { url: `${MINIAPP_URL}/swaps?params=${encodeURIComponent(JSON.stringify(docs))}` }
          }],
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
  await finishSelectedSwap(ctx,swapId)
});
bot.command('refund', async (ctx) => {
  const swapId = ctx.message.text.split(' ')[1]; // Extract swapId from command
  await refundSelectedSwap(ctx,swapId)
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
    `- /finish [swapId]: Finish a specific swap. \n`,
    `- /refund [swapId]: Refund a specific swap. \n`,
    `- /finish [swapId]: Finalize a specific swap.\n`,
    { parse_mode: 'Markdown' } // Use Markdown for formatting
  );
});
bot.on('message', async (ctx) => {
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

    if (data.action === 'post_swap'){
      const doc = {
        status: "pending",
        source: data.source,
        destination: data.destination,
        amount: data.amount,
        chatId: ctx.message.chat.id
      }
      const docId = await insertDocument(doc);
      const query = {
        chatId: ctx.message.chat.id,
        status: "pending"
      }
      let docs = await queryDocuments(query);
      docs = docs.map(doc => {
        return({
          ...doc,
          isOwner: ctx.message.chat.id === doc.chatId 
        });
      });
      console.log(`${MINIAPP_URL}/swaps?params=${encodeURIComponent(JSON.stringify(docs))}`)
      ctx.reply("Action performed, connect app to see your pending swaps", {
        reply_markup: {
          keyboard: [
            [{
            text: "Open Web App",
            web_app: { url: `${MINIAPP_URL}/swaps?params=${encodeURIComponent(JSON.stringify(docs))}` }
            }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
      
    } 
    else if (data.action === 'delete_pending_swap') {
      const query = {
        _id: data.swapId,
        status: "pending",
        chatId: ctx.message.chat.id
      }
      const docs = await queryDocuments(query);
      const swap = docs[0];
      if(!swap){
        ctx.reply("No swap pending with that id");
        return
      }
      await deleteDocument(query);
      ctx.reply("Swap deleted");

    } 
    else if (data.action === 'select_swap') {
      console.log(data)
      await startSwap(ctx,data.swapId);
    } 
    else if (data.action === 'swap_locked') {

      let query = {
        _id: data.swapId,
      }
      let docs = await queryDocuments(query);
      let swap = docs[0];
      if(!swap) return ctx.reply("No swap found");
      await bot.telegram.sendMessage(
        swap.chatId,
        `Swap ${swap._id} is being verified if transaction ${data.transaction} is valid.`
      );
      const isTxValid = await isTransactionValid(data.transaction);
      if(!isTxValid) return ctx.reply("Transaction not valid");
      await bot.telegram.sendMessage(
        swap.chatId,
        `Transaction ${data.transaction} is valid. Checking if parameters in contract are correct. It may take some minutes ...`
      );
      const contractSwap = await getContractSwap(data.invoice);
      if(!contractSwap) return ctx.reply("Swap has not been inserted in contract");
      const isAmountValid = isInvoiceAmountValid(data.invoice,swap.amount);
      const isHashLockValid = isInvoiceHashLockValid(data.invoice,contractSwap.hashLock);
      if(!isAmountValid) return ctx.reply("Wrong amount in the invoice");
      if(!isHashLockValid) return ctx.reply("Invalid Invoice");
      await bot.telegram.sendMessage(
        swap.chatId,
        `Parameters in contract are correct.`
      );
      await updateDocument(
        { _id: data.swapId},
        {
          $set : {
            status: "locked",
            invoice: data.invoice
          }
        } 
      );
      docs = await queryDocuments(query);
      swap = docs[0];
      if(!swap) return;
      await bot.telegram.sendMessage(
        swap.destination === "TON" ? swap.chatId : swap.selectorChatId,
        `Swap ${swap._id} is ready to be finished, start process in the miniapp to pay invoice and claim tgBTC `,
        {
          reply_markup: {
            keyboard: [
              [
                {
                  text: "Open Web App",
                  web_app: { url: `${MINIAPP_URL}/startSwap?params=${encodeURIComponent(JSON.stringify({fromTON: false, invoice: swap.invoice, _id: swap._id}))}` }
                }
              ]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }
      );
      ctx.reply("Your swap should be finished soon");
    } 
    else if (data.action === 'refund_swap') {
      const query = {
        _id: data.swapId,
        // status: "locked"
      }
      const docs = await queryDocuments(query);
      const swap = docs[0];
      if(!swap) return;
      ctx.reply("Swap selected for refund, continue in the MiniApp", {
        reply_markup: {
          keyboard: [
            [{
            text: "Open Web App",
            web_app: { url: `${MINIAPP_URL}/refundSwap?params=${encodeURIComponent(JSON.stringify(swap))}` }
            }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
    } 
    else if (data.action === 'refund_initiated') {
      const query = {
        _id: data.swapId,
        status: "locked"
      }
      const docs = await queryDocuments(query);
      const swap = docs[0];
      if(!swap) return;
      await updateDocument(
        { _id: swap._id},
        {
          $set : {
            status: "refunded"
          }
        } 
      );
      ctx.reply("Refund done");
    } 
    else if (data.action === 'swap_finished') {

      const query = {
        _id: data.swapId,
      }
      const docs = await queryDocuments(query);
      const swap = docs[0];
      if(!swap) return;
      await updateDocument(
        { _id: swap._id},
        {
          $set : {
            status: "finished"
          }
        } 
      );
      await bot.telegram.sendMessage(
        swap.chatId,
        `Your swap ${swap._id}, has been completed`
      );
      await bot.telegram.sendMessage(
        swap.selectorChatId,
        `Your selected swap ${swap._id}, has been completed`
      );
      return
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
  { command: 'locked', description: 'List locked swaps' },
  { command: 'create', description: 'Create a new swap (e.g., /create Lightning 10)' },
  { command: 'select', description: 'Select a specific swap (e.g., /select 12345)' },
  { command: 'finish', description: 'Finalize a specific swap (e.g., /finish 12345)' },
  { command: 'refund', description: 'Refund a specific swap (e.g., /refund 12345)' },
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

