console.log(`%cStop! Don't paste any code here`, 'color: red; font-size: 30px; font-weight: bold;');
// {"type":"CONNECTED","content":"799523","to":0,"from":0}

const serverID = document.getElementById('server_id')
const clientID = document.getElementById('client_id')
let WS_SERVER = document.location.origin.replace('https', '').replace('http', '') + "/ws";
if (document.location.origin.indexOf('https') > -1) {
  WS_SERVER = 'wss' + WS_SERVER;
} else {
  WS_SERVER = 'ws' + WS_SERVER;
}

var WEBSOCKET_ID
var SECRET_KEY = generateId(64);

function connectAsHost(cb = () => {}) {

  var PRIVATE_KEY;
  var PUBLIC_KEY;
  var CLIENT_NAME = "KaiOS";

  const ws = new WebSocket(WS_SERVER);

  window.crypto.subtle.generateKey( { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: {name: "SHA-256"} }, true, ["encrypt", "decrypt"])
  .then((key) => {
    PRIVATE_KEY = key.privateKey;
    return crypto.subtle.exportKey('spki', key.publicKey)
  })
  .then((publicKey) => {
    PUBLIC_KEY = _arrayBufferToBase64(publicKey);
  })
  .catch((err) => {
    console.error(err);
  });

  ws.onclose = () => {
    WEBSOCKET_ID = null;
    serverID.textContent = WEBSOCKET_ID
    console.log('An event listener to be called when the connection is closed.');
  }
  ws.onerror = () => {
    console.log('An event listener to be called when an error occurs.');
  }
  ws.onmessage = (event) => {
    try {
      data = JSON.parse(event.data)
      switch (data.type) {
        case "CONNECTED":
          WEBSOCKET_ID = parseInt(data.content);
          serverID.textContent = WEBSOCKET_ID
          break
        case "SYN":
          if (confirm(`${data.from} ?`)) {
            ws.send(JSON.stringify({"type":"SYN-ACK","content":PUBLIC_KEY,"to":parseInt(data.from),"from":WEBSOCKET_ID}))
          } else {
            ws.send(JSON.stringify({"type":"RES","content":"false","to":parseInt(data.from),"from":WEBSOCKET_ID}))
            ws.close();
          }
          break
        case "ACK":
          let dec = new TextDecoder();
          var parts = data.content.split(' ');
          window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, PRIVATE_KEY, _base64ToArrayBuffer(data.content))
          .then((decrypted) => {
            var secret_key = dec.decode(new Uint8Array(decrypted));
            SECRET_KEY = secret_key;
            ws.send(JSON.stringify({"type":"RES","content":"true","to":parseInt(data.from),"from":WEBSOCKET_ID}))
            cb(parseInt(data.from));
          })
          .catch((err) => {
            ws.send(JSON.stringify({"type":"RES","content":"false","to":parseInt(data.from),"from":WEBSOCKET_ID}))
            console.error(err);
            ws.close()
          });
          break
      }
    } catch (e) {
      console.log(e);
    }
  }
  ws.onopen = () => {
    console.log('CONNECTED');
  }

  return ws;
}

function connectAsClient(DESKTOP_ID, cb = () => {}) {
  if (!DESKTOP_ID)
    return

  var CLIENT_NAME = "KaiOS";

  const ws = new WebSocket(WS_SERVER);

  ws.onclose = () => {
    WEBSOCKET_ID = null;
    clientID.textContent = WEBSOCKET_ID
    console.log('An event listener to be called when the connection is closed.');
  }
  ws.onerror = () => {
    console.log('An event listener to be called when an error occurs.');
  }
  ws.onmessage = (event) => {
    try {
      data = JSON.parse(event.data)
      switch (data.type) {
        case "CONNECTED":
          WEBSOCKET_ID = parseInt(data.content);
          clientID.textContent = WEBSOCKET_ID
          ws.send(JSON.stringify({"type":"SYN","content":CLIENT_NAME,"to":DESKTOP_ID,"from":WEBSOCKET_ID}))
          break
        case "SYN-ACK":
          if (data.from && DESKTOP_ID) {
            let enc = new TextEncoder();
            let E_secret_key;
            let pub = _base64ToArrayBuffer(data.content);
            window.crypto.subtle.importKey("spki", pub, { name: "RSA-OAEP", hash: {name: "SHA-256"} }, false, ["encrypt"])
            .then((publicKey) => {
              return window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, enc.encode(SECRET_KEY));
            })
            .then((encrypted) => {
              E_secret_key = _arrayBufferToBase64(encrypted);
              var content = `${E_secret_key}`
              ws.send(JSON.stringify({"type":"ACK","content":content,"to":DESKTOP_ID,"from":WEBSOCKET_ID}))
            })
            .catch((err) => {
              console.error(err);
            });
          } else {
            ws.close();
          }
          break
        case "RES":
          if (data.content == "false") {
            ws.close();
          } else {
            cb(parseInt(data.from));
          }
          break
      }
    } catch (e) {
      console.log(e);
    }
  }
  ws.onopen = () => {
    console.log('CONNECTED');
  }

  return ws;
}
