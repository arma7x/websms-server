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
var CONNECTED_CLIENTS = {};

function connectAsDesktop() {

  var PRIVATE_KEY;
  var PUBLIC_KEY;
  var CLIENT_NAME = "KaiOS";
  var CLIENT_ID;

  function handleReceiveMessage(event) {
    console.log('DECRYPT USING', CONNECTED_CLIENTS[CLIENT_ID].secret_key);
    var parts = event.data.split(' ')
    var bytes  = CryptoJS.AES.decrypt(parts[parts.length - 1], CONNECTED_CLIENTS[CLIENT_ID].secret_key);
    var originalText = bytes.toString(CryptoJS.enc.Utf8);
    subscriptionDetails.value += `\nClient => ${originalText}\n`;
  }

  function handleReceiveChannelStatusChange(event) {
    if (receiveChannel) {
      console.log("ReceiveChannel", receiveChannel.readyState);
    }
  }

  function receiveChannelCallback(event) {
    receiveChannel = event.channel;
    receiveChannel.onmessage = handleReceiveMessage;
    receiveChannel.onopen = handleReceiveChannelStatusChange;
    receiveChannel.onclose = handleReceiveChannelStatusChange;
  }

  function handleDataChannelStatusChange(event) {
    if (dataChannel) {
      console.log("DataChannel", dataChannel.readyState);
      if(dataChannel.readyState === 'open') {
        ws.close();
        alert('CONNECTED');
      } else {
        const name = CONNECTED_CLIENTS[CLIENT_ID].client_name
        delete(CONNECTED_CLIENTS[CLIENT_ID])
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
        alert(`DISCONNECTED ${name}`);
      }
    }
  }

  const ws = new WebSocket(WS_SERVER);

  const peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  peerConnection.ondatachannel = receiveChannelCallback;
  const dataChannel = peerConnection.createDataChannel("dataChannel", {reliable:true});
  dataChannel.onopen = handleDataChannelStatusChange;
  dataChannel.onclose = handleDataChannelStatusChange;

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

  peerConnection.onicecandidate = (iceEvent) => {
    if (iceEvent.candidate) {
      // console.log(iceEvent.candidate);
      ws.send(JSON.stringify({"type":"ONICECANDIDATE","content":encodeURIComponent(JSON.stringify(iceEvent.candidate)),"to":parseInt(CLIENT_ID),"from":WEBSOCKET_ID}))
    }
  };

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
        case "ONICECANDIDATE":
          var candidate = JSON.parse(decodeURIComponent(data.content))
          if (candidate) {
            console.log(candidate);
            try {
              peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              peerConnection.addIceCandidate(candidate);
              console.log(e, candidate);
            }
          }
          break
        case "CONNECTED":
          WEBSOCKET_ID = parseInt(data.content);
          serverID.textContent = WEBSOCKET_ID
          break
        case "SYN":
          if (confirm(`${data.from} ?`)) {
            CLIENT_NAME = data.content;
            CLIENT_ID = parseInt(data.from)
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
            var secret_key = dec.decode(new Uint8Array(decrypted));
            var bytes  = CryptoJS.AES.decrypt(decodeURIComponent(parts[1]), secret_key);
            var originalText = bytes.toString(CryptoJS.enc.Utf8);
            CONNECTED_CLIENTS[data.from] = {
              client_name: CLIENT_NAME,
              secret_key: secret_key,
              dataChannel: dataChannel
            };

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

            let E_end_point;
            peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(originalText)))
            .then(() => {
              return peerConnection.createAnswer();
            })
            .then(function(answerToClient) {
              E_end_point = CryptoJS.AES.encrypt(JSON.stringify(answerToClient) , secret_key).toString();
              return peerConnection.setLocalDescription(answerToClient);
            })
            .then(function() {
              ws.send(JSON.stringify({"type":"RES","content":encodeURIComponent(E_end_point),"to":parseInt(data.from),"from":WEBSOCKET_ID}))
            })
            .catch((err) => {
              ws.send(JSON.stringify({"type":"RES","content":"false","to":parseInt(data.from),"from":WEBSOCKET_ID}))
              console.error(err);
              ws.close()
            })
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

  return {ws, peerConnection, dataChannel};
}

function connectAsClient(CLIENT_NAME = "KaiOS" ,DESKTOP_ID) {
  if (!DESKTOP_ID)
    return

  function handleReceiveMessage(event) {
    console.log('DECRYPT USING', SECRET_KEY);
    var parts = event.data.split(' ')
    var bytes  = CryptoJS.AES.decrypt(parts[parts.length - 1], SECRET_KEY);
    var originalText = bytes.toString(CryptoJS.enc.Utf8);
    subscriptionDetails.value += `\nDesktop => ${originalText}\n`;
  }

  function handleReceiveChannelStatusChange(event) {
    if (receiveChannel) {
      console.log("ReceiveChannel", receiveChannel.readyState);
    }
  }

  function receiveChannelCallback(event) {
    receiveChannel = event.channel;
    receiveChannel.onmessage = handleReceiveMessage;
    receiveChannel.onopen = handleReceiveChannelStatusChange;
    receiveChannel.onclose = handleReceiveChannelStatusChange;
  }

  function handleDataChannelStatusChange(event) {
    if (dataChannel) {
      console.log("DataChannel", dataChannel.readyState);
      if(dataChannel.readyState === 'open') {
        ws.close();
        alert('CONNECTED');
      } else {
        alert('DISCONNECTED');
      }
    }
  }

  const ws = new WebSocket(WS_SERVER);

  const peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  peerConnection.ondatachannel = receiveChannelCallback;
  const dataChannel = peerConnection.createDataChannel("dataChannel", {reliable:true});
  dataChannel.onopen = handleDataChannelStatusChange;
  dataChannel.onclose = handleDataChannelStatusChange;

  peerConnection.onicecandidate = (iceEvent) => {
    if (iceEvent.candidate) {
      // console.log(iceEvent.candidate);
      ws.send(JSON.stringify({"type":"ONICECANDIDATE","content":encodeURIComponent(JSON.stringify(iceEvent.candidate)),"to":parseInt(DESKTOP_ID),"from":WEBSOCKET_ID}))
    }
  };

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
        case "ONICECANDIDATE":
          var candidate = JSON.parse(decodeURIComponent(data.content))
          if (candidate) {
            console.log(candidate);
            try {
              peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              peerConnection.addIceCandidate(candidate);
              console.log(e, candidate);
            }
          }
          break
        case "CONNECTED":
          WEBSOCKET_ID = parseInt(data.content);
          clientID.textContent = WEBSOCKET_ID
          ws.send(JSON.stringify({"type":"SYN","content":CLIENT_NAME,"to":DESKTOP_ID,"from":WEBSOCKET_ID}))
          break
        case "SYN-ACK":
          if (data.from && DESKTOP_ID) {
            let enc = new TextEncoder();
            let E_end_point;
            let E_secret_key;
            let pub = _base64ToArrayBuffer(data.content);
            peerConnection.createOffer()
            .then(function(offerToDesktop) {
              E_end_point = CryptoJS.AES.encrypt(JSON.stringify(offerToDesktop) , SECRET_KEY).toString();
              return peerConnection.setLocalDescription(offerToDesktop);
            })
            .then(() => {
              return window.crypto.subtle.importKey("spki", pub, { name: "RSA-OAEP", hash: {name: "SHA-256"} }, false, ["encrypt"])
              .then((publicKey) => {
                return window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, enc.encode(SECRET_KEY));
              })
            })
            .then((encrypted) => {
              E_secret_key = _arrayBufferToBase64(encrypted);
              var content = `${E_secret_key} ${encodeURIComponent(E_end_point)}`
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
            var bytes  = CryptoJS.AES.decrypt(decodeURIComponent(data.content), SECRET_KEY);
            var originalText = bytes.toString(CryptoJS.enc.Utf8);
            peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(originalText)));
            // console.log(JSON.parse(originalText));
            // ws.close();
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

  return {ws, peerConnection, dataChannel};
}
