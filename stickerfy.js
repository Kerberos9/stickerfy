const keepAlive = require("./server");
const { Telegraf } = require("telegraf");
const sharp = require("sharp");
const axios = require("axios");
const fs = require("fs");
const testing = true;
// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TOKEN;
// Create a bot that uses 'polling' to fetch new updates
const bot = new Telegraf(token);
bot.on("photo", (ctx) => {
  console.log(ctx.update.message.from["username"]);
  if (testing && ctx.update.message.from["username"] !== "Keruberos") {
    ctx.reply("blokiado que esta en obras");
    return;
  }
  console.log(ctx.update.message.photo);
  pic = ctx.update.message.photo.pop();
  let pngDestination = `./${pic.file_id}.png`;
  ctx.telegram.getFileLink(pic.file_id).then((url) => {
    axios({ url, responseType: "stream" }).then((response) => {
      return new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(`./${pic.file_id}.jpg`))
          .on("finish", () => {
            console.log(fs.statSync(`./${pic.file_id}.jpg`).size / 1024);
            sharp(`./${pic.file_id}.jpg`)
              .resize(512, 512, { fit: "contain" })
              .png()
              .toFile(pngDestination)
              .then(() => {
                if (Math.ceil(fs.statSync(pngDestination).size / 1024) >= 512) {
                  console.log("File too large, changing quality");
                  fs.unlinkSync(`${pic.file_id}.png`);
                  sharp(`./${pic.file_id}.jpg`)
                    .resize(512, 512, { fit: "contain" })
                    .png({ quality: 60 })
                    .toFile(pngDestination)
                    .then(() => {
                      if (
                        Math.ceil(fs.statSync(pngDestination).size / 1024) >=
                        512
                      ) {
                        console.log(
                          "File too large after quality change, resizing"
                        );
                        fs.unlinkSync(pngDestination);
                        sharp(`./${pic.file_id}.jpg`)
                          .resize(512, 480, { fit: "contain" })
                          .png({ quality: 60 })
                          .toFile(pngDestination)
                          .then(() => {
                            if (
                              Math.ceil(
                                fs.statSync(pngDestination).size / 1024
                              ) >= 512
                            ) {
                              console.log(
                                "File too large after resizing, returning error"
                              );
                              fs.unlinkSync(pngDestination);
                              fs.unlinkSync(`${pic.file_id}.jpg`);
                              ctx.reply(
                                "No he encontrado manera de que sea del tamaño correcto, por favor, reduce el tamaño en KB un poco y vuelve a intentarlo, sorry"
                              );
                              return;
                            } else {
                              console.log(pngDestination);
                              ctx
                                .replyWithDocument({
                                  source: pngDestination,
                                })
                                .then(() => {
                                  ctx.reply(
                                    "He tenido que añadir unos pequeños bordes negros para que fuese del tamaño correcto"
                                  );
                                  fs.unlinkSync(`${pic.file_id}.jpg`);
                                  fs.unlinkSync(pngDestination);
                                });
                              return;
                            }
                          });
                      } else {
                        ctx
                          .replyWithDocument({ source: pngDestination })
                          .then(() => {
                            fs.unlinkSync(`${pic.file_id}.jpg`);
                            fs.unlinkSync(pngDestination);
                          });
                        return;
                      }
                    });
                } else {
                  //if(fs.statSync(`./${pic.file_id}.png`))
                  ctx
                    .replyWithDocument({ source: `./${pic.file_id}.png` })
                    .then(() => {
                      fs.unlinkSync(`${pic.file_id}.jpg`);
                      fs.unlinkSync(`${pic.file_id}.png`);
                    });
                  return;
                }
              });
          })
          .on("error", (e) => console.log(e));
      });
    });
  });
});

keepAlive();
bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
});
