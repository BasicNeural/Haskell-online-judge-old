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

var server = app.listen(4000, function(){
    console.log("Express server has started on port 4000")
});

var server = http.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});
server.listen(8080, function() { });

// create the server
wsServer = new WebSocketServer({
  httpServer: server
});

// WebSocket server
wsServer.on('request', function(request) {
  let connection = request.accept(null, request.origin);

  //connection event handler
  connection.on('message', function(message) {
    let msg = JSON.parse(message.utf8Data);
    
    let containerName = `vm${(new Date()).getSeconds()}_${(new Date()).getMilliseconds()}`;
    fs.writeFileSync(`~/source/${containerName}.hs`, msg.source);
    //compile source and execute output program
    exec(`docker run -dt --name ${containerName} asdf/compiler:CHs /bin/bash`)
      .then((result) => {
        return exec(`docker cp /home/pi/${containerName}.hs ${containerName}:/root/`);
      })
      .then((result) => {
        return exec(`docker exec ${containerName} ghc /root/${containerName}.hs -o /root/a.out`);
      })
      .then((result) => {
        let stderr = result.stderr;
	      if (stderr != '') {
          var jsonObj = new Object();
          jsonObj.status = false;
          jsonObj.message = 'Compile error';
          connection.sendUTF(JSON.stringify(jsonObj));
        }
        else {
          return exec(`docker exec ${containerName} ./root/a.out`)
            .then((result) => {
              if (result.stderr != '') {
                var jsonObj = new Object();
                jsonObj.status = false;
                jsonObj.message = 'Fail';
                connection.sendUTF(JSON.stringify(jsonObj));
              }
              else {
                var jsonObj = new Object();
                jsonObj.status = true;
                connection.sendUTF(JSON.stringify(jsonObj));
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
