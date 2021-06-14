var CONN;

const DEVICE_DOM = document.getElementById('device')
const TYPE_DOM = document.getElementById('type')
const subscriptionDetails = document.getElementById('js-subscription-details')
subscriptionDetails.value = 'Hello'

function isBlank(str) {
  return (!str || /^\s*$/.test(str));
}

function sendMessage() {
  if (window['peer'] == null) {
    return
  }
  console.log('ENCRYPT USING', SECRET_KEY);
  const raw_body = document.getElementById('body').value !== "" ? document.getElementById('body').value : 'Push notifications with Service Workers';
  var ciphertext = CryptoJS.AES.encrypt(raw_body, SECRET_KEY).toString();
  window['peer'].send(`${ciphertext}`)
}

function _connectAsHost() {
  CONN = connectAsHost((id) => {
    console.log('READY', id);
    CONN.onmessage = (event) => {
      try {
        data = JSON.parse(event.data)
        peer.signal(JSON.parse(data.content));
      } catch (e) {
        console.log(e);
      }
    }
    const peer = new SimplePeer({
      initiator: false,
      config: {
        iceServers: [{
          urls: 'stun:stun.l.google.com:19302' 
        }]
      }
    });
    peer.on('signal', data => {
      CONN.send(JSON.stringify({"type":"SIGNALING","content":JSON.stringify(data),"to":id,"from":0}))
    });
    peer.on('connect', () => {
      peer.send('hey peer1, im fine')
    });
    peer.on('data', data => {
      console.log('data: ' + data)
    });
    peer.on('error', err => console.log('error', err));
    window['peer'] = peer;
  });
}

function connectToDesktop() {
  const desktop_id = prompt('Desktop ID ?');
  if (isBlank(desktop_id)) {
    alert('Desktop ID is required');
    return
  }
  try {
    const _id = JSON.parse(desktop_id);
    CONN = connectAsClient(_id, (id) => {
      console.log('READY', id);
      CONN.onmessage = (event) => {
        try {
          data = JSON.parse(event.data)
          peer.signal(JSON.parse(data.content));
        } catch (e) {
          console.log(e);
        }
      }
      const peer = new SimplePeer({
        initiator: true,
        config: {
          iceServers: [{
            urls: 'stun:stun.l.google.com:19302' 
          }]
        }
      });
      peer.on('signal', data => {
        CONN.send(JSON.stringify({"type":"SIGNALING","content":JSON.stringify(data),"to":id,"from":0}))
      });
      peer.on('connect', () => {
        peer.send('hey peer2, how is it going?')
      });
      peer.on('data', data => {
        console.log('data: ' + data)
      });
      peer.on('error', err => console.log('error', err));
      window['peer'] = peer;
    });
  } catch(e) {
    alert('Desktop ID must be a number');
  }
}

window.addEventListener("load", () => {
  const SERVER = document.getElementsByClassName('__server__');
  const CLIENT = document.getElementsByClassName('__client__');
  if (ISCLIENT) {
    for (var x in SERVER) {
      if (SERVER[x].style)
        SERVER[x].style.display = 'none';
    }
  } else {
    for (var x in CLIENT) {
      if (CLIENT[x].style)
        CLIENT[x].style.display = 'none';
    }
  }
});
