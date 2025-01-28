const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command("start", (ctx) => {

    ctx.reply('Welcome to the TON Swap Bot!', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Open Mini App', web_app: { url: 'https://d319-177-238-23-120.ngrok-free.app' } }]
            ]
        }
    });
});

bot.on("web_app_data", async (ctx) => {
    console.log(ctx)
});

bot.on("message", async (ctx) => {
    console.log(ctx.message)
    if (ctx.message?.web_app_data?.data) {
        try {
            const data = ctx.message?.web_app_data?.data
            await ctx.telegram.sendMessage(ctx.message.chat.id, 'Got message from MiniApp')
            await ctx.telegram.sendMessage(ctx.message.chat.id, data)
        } catch (e) {
            await ctx.telegram.sendMessage(ctx.message.chat.id, 'Got message from MiniApp but failed to read')
            await ctx.telegram.sendMessage(ctx.message.chat.id, e)
        }
    }
});

bot.launch().then(() => {
    console.log('Bot is running...');
  });