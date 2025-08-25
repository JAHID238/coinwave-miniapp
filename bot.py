import os
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

# BotFather token
TOKEN = os.getenv("8363127566:AAGFH_9_FM846SJTpYGhbC1fmap-7Odmzlk")  # set environment variable BOT_TOKEN
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://coinwave-miniapp.vercel.app")  # Vercel / Netlify URL

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton(text="Open Mini App 🚀", web_app=WebAppInfo(url=WEBAPP_URL))]
    ])
    await update.message.reply_text(
        "Welcome! নিচের বাটন চাপলে Mini App খুলবে 👇",
        reply_markup=kb
    )

async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("/start দিয়ে Mini App খুলুন।")

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_cmd))
    print("Bot is running…")
    app.run_polling()

if __name__ == "__main__":
    main()
