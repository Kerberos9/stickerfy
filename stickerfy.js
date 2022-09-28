const keepAlive = require('./server');
const { Telegraf } = require('telegraf')
const sharp = require('sharp');
const axios = require('axios')
const fs = require('fs');

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new Telegraf(token);

bot.on('photo', ctx => {
  ctx.update.message.photo.filter(pic => pic.file_id.at(-7) === 't').forEach(pic => {
    initialHeight = pic.height;
    initialWidth = pic.width;
    let sizes = calculateAspectRatioFit(initialWidth, initialHeight, 512, 512);
    ctx.telegram.getFileLink(pic.file_id).then(url => {
      axios({ url, responseType: 'stream' }).then(response => {
        return new Promise((resolve, reject) => {
          response.data.pipe(fs.createWriteStream(`./${pic.file_id}.jpg`))
            .on('finish', () => {
              sharp(`./${pic.file_id}.jpg`).resize(sizes.width, sizes.height).png().toFile(`./${pic.file_id}.png`).then(() => {
                ctx.replyWithPhoto({ source: `./${pic.file_id}.png` }).then(() => {
                  fs.unlinkSync(`${pic.file_id}.jpg`);
                  fs.unlinkSync(`${pic.file_id}.png`);
                });

              });
            })
            .on('error', e => console.error(e))
        });
      })
    })
  })

})


function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {

  var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

  return { width: Math.floor(srcWidth * ratio), height: Math.floor(srcHeight * ratio) };
}

keepAlive();
bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
});