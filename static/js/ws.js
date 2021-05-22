// {"type":"CONNECTED","content":"799523","to":0,"from":0}

var WEBSOCKET_ID;
var SECRET_KEY;
var PUSH_ENDPOINT = {url: 'https://push.kaiostech.com:8443/wpush/v2'}
var CONNECTED_CLIENTS = {};

function dec2hex(dec) {
  return dec.toString(16).padStart(2, "0");
}

function generateId(len) {
  var arr = new Uint8Array((len || 40) / 2);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, dec2hex).join('');
}

function _arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array( buffer );
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode( bytes[ i ] );
  }
  return window.btoa( binary );
}

function _base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

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
          ws.send(JSON.stringify({"type":"SYN-ACK","content":PUBLIC_KEY,"to":parseInt(data.from),"from":WEBSOCKET_ID}))
          break
        case "ACK":
          let dec = new TextDecoder();
          var parts = data.content.split(' ');

          window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, PRIVATE_KEY, _base64ToArrayBuffer(parts[0]))
          .then((decrypted) => {
            SECRET_KEY = dec.decode(new Uint8Array(decrypted));
            var bytes  = CryptoJS.AES.decrypt(parts[1], SECRET_KEY);
            var originalText = bytes.toString(CryptoJS.enc.Utf8);
            console.log(JSON.parse(originalText));
          })
          .catch((err) => {
            console.error(err);
          });

          ws.send(JSON.stringify({"type":"RES","content":"true","to":parseInt(data.from),"from":WEBSOCKET_ID}))
          ws.close()
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

          let enc = new TextEncoder();
          let E_end_point = CryptoJS.AES.encrypt(JSON.stringify(PUSH_ENDPOINT) , SECRET_KEY).toString();
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
