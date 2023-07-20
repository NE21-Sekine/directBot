// Description:
//   Utility commands surrounding Hubot uptime.
//
// Commands:
//   ping - Reply with pong
//   echo <text> - Reply back with <text>
//   time - Reply with current time
'use strict';
const Jimp = require('jimp');
const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const fs = require("fs");

const stub = ClarifaiStub.grpc();

const metadata = new grpc.Metadata();
const api_key = "41e2dff383b848d395e5e11468ac9ac6";
metadata.set("authorization", "Key " + api_key);

const onfile = (res, file) => {
  res.download(file, (path) => {
    let ext = file.name.slice(-4);
    Jimp.read(path).then((image) => {
      image.write('images/' + file.name, (image => {
        let imageBytes = fs.readFileSync('images/'+file.name, { encoding: "base64" });
        stub.PostModelOutputs(
          {
            model_id: "mammals-model",
            inputs: [{ data: { image: { base64: imageBytes } } }]
          },
          metadata,
          (err, response) => {
            if (err) {
              console.log("Error: " + err);
              return;
            }
            else {
              if (response.status.code !== 10000) {
                console.log("Received failed status: " + response.status.description + "\n" + response.status.details + "\n" + response.status.code);
                return;
              }
              else {
                let namedata = [];
                let valuedata = [];
                let max_index = 0;
                for (const c of response.outputs[0].data.concepts) {
                  namedata.push(c.name);
                  valuedata.push(c.value);
                }
                max_index = valuedata.indexOf(Math.max(...valuedata));
                res.send(namedata[max_index]);
              }
            }
          }
        );
      }));
      // image.grayscale((err, image) => {
      //   let newFileName = Math.random().toString(32).substring(2) + ext;
      //   image.write('images/' + newFileName, (err, image) => {
      //     res.send({
      //       path: 'images/' + newFileName
      //     });
      //   });
    });
  });
};

module.exports = (robot) => {
  //動作確認用
  robot.respond(/PING$/i, (res) => {
    res.send('PONG');
  });

  robot.respond('file', (res) => {
    onfile(res, res.json);
  })
};
