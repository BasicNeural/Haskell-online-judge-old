let WebSocketServer = require('websocket').server;

let exec = require('child-process-promise').exec;

let fs = require('fs');

let http = require('http');

let express = require('express');
let app = express();
let router = require('./router/main')(app);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

let ExpressServer = app.listen(4000, function(){
    console.log('Express server has started on port 4000')
});

let SocketServer = http.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});
SocketServer.listen(8080, function() { });

// create the server
wsServer = new WebSocketServer({
  httpServer: SocketServer
});

// WebSocket server
wsServer.on('request', function(request) {
  let connection = request.accept(null, request.origin);
  console.log('WebScoket server started');

  //connection event handler
  connection.on('message', function(message) {
    let msg = JSON.parse(message.utf8Data);
    console.log('published Data' + msg);
    
    let containerName = `vm${(new Date()).getSeconds()}_${(new Date()).getMilliseconds()}`;
    fs.writeFileSync(`~/source/${containerName}.hs`, msg.source);
    //compile source and execute output program
    exec(`docker run -dt --name ${containerName} asdf/compiler:CHs /bin/bash`)
      .then((result) => {
        return exec(`docker cp ~/source/${containerName}.hs ${containerName}:/root/`);
      })
      .then((result) => {
        return exec(`docker exec ${containerName} ghc /root/${containerName}.hs -o /root/a.out`);
      })
      .then((result) => {
        let stderr = result.stderr;
	      if (stderr != '') {
          let responseMsg = {
            status: false,
            message: 'Compile error'
          };
          connection.sendUTF(JSON.stringify(responseMsg));
        }
        else {
          return exec(`docker exec ${containerName} ./root/a.out`)
            .then((result) => {
              if (result.stderr != '') {
                let responseMsg = {
                  status: false,
                  message: 'Compile error'
                };
                connection.sendUTF(JSON.stringify(responseMsg));
              }
              else {
                let responseMsg = {
                  status: true
                };
                connection.sendUTF(JSON.stringify(responseMsg));
              }
            });
        }
      })
      .then((result) => {
        exec(`docker stop ${containerName}; docker rm ${containerName}; rm /home/pi/${containerName}.*`);
      });
  });

  connection.on('close', function(connection) {
    // close user connection
  });
});
