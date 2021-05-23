// {"type":"CONNECTED","content":"799523","to":0,"from":0}

console.log(`%cStop! Don't paste any code here`, 'color: red; font-size: 30px; font-weight: bold;');

var WEBSOCKET_ID
var SECRET_KEY
var CONNECTED_CLIENTS = {};

SECRET_KEY = generateId(64);

function connectAsDesktop() {

  var PRIVATE_KEY;
  var PUBLIC_KEY;

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

  const ws = new WebSocket('ws://127.0.0.1:8080/ws');
  ws.onclose = () => {
    WEBSOCKET_ID = null;
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
          break
        case "SYN":
          if (confirm(`${data.from} ?`)) {
            ws.send(JSON.stringify({"type":"SYN-ACK","content":PUBLIC_KEY,"to":parseInt(data.from),"from":WEBSOCKET_ID}))
          } else {
            ws.send(JSON.stringify({"type":"RES","content":"false","to":parseInt(data.from),"from":WEBSOCKET_ID}))
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
              push_endpoint: JSON.parse(originalText),
              secret_key: sk
            };
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

function connectAsClient(DESKTOP_ID) {
  if (!DESKTOP_ID)
    return
  const ws = new WebSocket('ws://127.0.0.1:8080/ws');
  ws.onclose = () => {
    WEBSOCKET_ID = null;
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
          ws.send(JSON.stringify({"type":"SYN","content":"","to":DESKTOP_ID,"from":WEBSOCKET_ID}))
          break
        case "SYN-ACK":
          if (data.from, DESKTOP_ID) {
            let enc = new TextEncoder();
            let E_end_point = CryptoJS.AES.encrypt(JSON.stringify({url: 'https://push.kaiostech.com:8443/wpush/v2'}) , SECRET_KEY).toString();
            let E_secret_key;
            let pub = _base64ToArrayBuffer(data.content);
            window.crypto.subtle.importKey("spki", pub, { name: "RSA-OAEP", hash: {name: "SHA-256"} }, false, ["encrypt"])
            .then((publicKey) => {
              return window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, enc.encode(SECRET_KEY));
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
          console.log(data.content);
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
