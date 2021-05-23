// {"type":"CONNECTED","content":"799523","to":0,"from":0}

const serverID = document.getElementById('server_id')
const clientID = document.getElementById('client_id')
let WS_SERVER = document.location.origin.replace('https', '').replace('http', '') + "/ws";
if (document.location.origin.indexOf('https') > -1) {
  WS_SERVER = 'wss' + WS_SERVER;
} else {
  WS_SERVER = 'ws' + WS_SERVER;
}

console.log(`%cStop! Don't paste any code here`, 'color: red; font-size: 30px; font-weight: bold;');

var WEBSOCKET_ID
var SECRET_KEY
var CONNECTED_CLIENTS = {};

SECRET_KEY = generateId(64);

function connectAsDesktop() {

  var PRIVATE_KEY;
  var PUBLIC_KEY;
  var CLIENT_NAME = "KaiOS";

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

  const ws = new WebSocket(WS_SERVER);
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
            CLIENT_NAME = data.content;
            ws.send(JSON.stringify({"type":"SYN-ACK","content":PUBLIC_KEY,"to":parseInt(data.from),"from":WEBSOCKET_ID}))
          } else {
            ws.send(JSON.stringify({"type":"RES","content":"false","to":parseInt(data.from),"from":WEBSOCKET_ID}))
            ws.close();
          }
          
          break
        case "ACK":
          let dec = new TextDecoder();
          var parts = data.content.split(' ');
          window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, PRIVATE_KEY, _base64ToArrayBuffer(parts[0]))
          .then((decrypted) => {
            var sk = dec.decode(new Uint8Array(decrypted));
            var bytes  = CryptoJS.AES.decrypt(parts[1], sk);
            var originalText = bytes.toString(CryptoJS.enc.Utf8);
            CONNECTED_CLIENTS[data.from] = {
              client_name: CLIENT_NAME,
              push_endpoint: JSON.parse(originalText),
              secret_key: sk
            };
            console.log(sk);
            while(DEVICE_DOM.firstChild) {
              DEVICE_DOM.removeChild(DEVICE_DOM.firstChild);
            }
            var opt = document.createElement('option');
            opt.value = "";
            opt.innerHTML = "Select device";
            DEVICE_DOM.appendChild(opt);
            for (var d in CONNECTED_CLIENTS) {
              var opt = document.createElement('option');
              opt.value = d;
              opt.innerHTML = CONNECTED_CLIENTS[d].client_name;
              DEVICE_DOM.appendChild(opt);
            }

            ws.send(JSON.stringify({"type":"RES","content":"true","to":parseInt(data.from),"from":WEBSOCKET_ID}))
            console.log(CONNECTED_CLIENTS);
          })
          .catch((err) => {
            ws.send(JSON.stringify({"type":"RES","content":"false","to":parseInt(data.from),"from":WEBSOCKET_ID}))
            console.error(err);
          })
          .finally(() => {
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

function connectAsClient(CLIENT_NAME = "KaiOS" ,DESKTOP_ID) {
  if (!DESKTOP_ID)
    return
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
          if (data.from && DESKTOP_ID && swRegistration) {
            let enc = new TextEncoder();
            let E_end_point;
            let E_secret_key;
            let pub = _base64ToArrayBuffer(data.content);
            swRegistration.pushManager.getSubscription()
            .then(function(subscription) {
              if (subscription) {
                E_end_point = CryptoJS.AES.encrypt(JSON.stringify(subscription) , SECRET_KEY).toString();
                return Promise.resolve();
              } else {
                return Promise.reject('No Push Subscription');
              }
            })
            .then(() => {
              return window.crypto.subtle.importKey("spki", pub, { name: "RSA-OAEP", hash: {name: "SHA-256"} }, false, ["encrypt"])
              .then((publicKey) => {
                return window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, enc.encode(SECRET_KEY));
              })
            })
            .then((encrypted) => {
              E_secret_key = _arrayBufferToBase64(encrypted);
              var content = `${E_secret_key} ${E_end_point}`
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
          alert(data.content);
          ws.close();
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
