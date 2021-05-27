var CONN;

const DEVICE_DOM = document.getElementById('device')
const TYPE_DOM = document.getElementById('type')
const subscriptionDetails = document.getElementById('js-subscription-details')
subscriptionDetails.value = 'Hello'

function isBlank(str) {
  return (!str || /^\s*$/.test(str));
}

function sendMessage(isDesktop = false) {

  var _type;
  var _dataChannel;
  var _secret;

  if (TYPE_DOM.value == "") {
    alert('Please select type');
    return
  } else {
    _type = parseInt(TYPE_DOM.value)
  }

  if (isDesktop) {
    if (!CONNECTED_CLIENTS[DEVICE_DOM.value] || DEVICE_DOM.value == "") {
      alert('No Recipeint');
      return
    } else {
      _dataChannel = CONNECTED_CLIENTS[DEVICE_DOM.value].dataChannel;
      _secret = CONNECTED_CLIENTS[DEVICE_DOM.value].secret_key;
    }
  } else {
    if (!CONN) {
      alert('No Recipeint');
      return
    } else {
      _dataChannel = CONN.dataChannel;
      _secret = SECRET_KEY;
    }
  }
  console.log('ENCRYPT USING', _secret);
  const title = encodeURIComponent(document.getElementById('title').value !== "" ? document.getElementById('title').value : 'Push Notification');
  const raw_body = document.getElementById('body').value !== "" ? document.getElementById('body').value : 'Push notifications with Service Workers';
  var ciphertext = CryptoJS.AES.encrypt(raw_body, _secret).toString();
  _dataChannel.send(`${title} ${_type} ${ciphertext}`)
}

function connectToDesktop() {
  const name = prompt('Name ?');
  if (isBlank(name)) {
    alert('Name is required');
    return
  }
  const desktop_id = prompt('Desktop ID ?');
  if (isBlank(desktop_id)) {
    alert('Desktop ID is required');
    return
  }
  try {
    const _id = JSON.parse(desktop_id);
    CONN = connectAsClient(name, _id);
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
