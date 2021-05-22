// {"type":"CONNECTED","content":"799523","to":0,"from":0}

var WEBSOCKET_ID;
var SECRET_KEY;
var SECRET_KEY_RAW;
var PUSH_ENDPOINT = {url: 'https://push.kaiostech.com:8443/wpush/v2'}

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

window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
.then(function(key){
  SECRET_KEY_RAW = key;
  return crypto.subtle.exportKey('raw', key);
})
.then(function(key){
  SECRET_KEY = _arrayBufferToBase64(key);
  //console.log('SECRET_KEY', SECRET_KEY);
})
.catch(function(err){
    console.error(err);
});


function connectAsDesktop() {

  var PRIVATE_KEY;
  var PUBLIC_KEY;

  window.crypto.subtle.generateKey( { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: {name: "SHA-256"} }, true, ["encrypt", "decrypt"])
  .then(function(key){
    PRIVATE_KEY = key.privateKey;
    return crypto.subtle.exportKey('spki', key.publicKey)
  })
  .then(function(publicKey){
    PUBLIC_KEY = _arrayBufferToBase64(publicKey);
    //console.log('PUBLIC_KEY', PUBLIC_KEY);
  })
  .catch(function(err){
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
          var D_secret_key;
          let dec = new TextDecoder();
          var parts = data.content.split(' ');
          var parts_0 = _base64ToArrayBuffer(parts[0]);
          window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, PRIVATE_KEY, parts_0)
          .then(function(decrypted){
            D_secret_key = dec.decode(new Uint8Array(decrypted));
          })
          .catch(function(err){
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
          var E_end_point;
          var E_secret_key;
          window.crypto.subtle.encrypt({ name: "AES-GCM", iv: window.crypto.getRandomValues(new Uint8Array(12)), tagLength: 128 }, SECRET_KEY_RAW, enc.encode(JSON.stringify(PUSH_ENDPOINT)))
          .then((encrypted) => {
            E_end_point = _arrayBufferToBase64(encrypted);
            let pub = _base64ToArrayBuffer(data.content);
            return window.crypto.subtle.importKey("spki", pub, { name: "RSA-OAEP", hash: {name: "SHA-256"} }, false, ["encrypt"]);
          })
          .then((publicKey) => {
            return window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, enc.encode(SECRET_KEY));
          })
          .then((encrypted) => {
            E_secret_key = _arrayBufferToBase64(encrypted);
            // console.log(E_secret_key);
            // console.log(E_end_point);
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
}
