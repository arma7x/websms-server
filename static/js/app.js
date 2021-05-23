// DATA = ID(10)<white_space>ORDER(1)<white_space>MAX_ORDER(1)<white_space>TYPE(1)<white_space>TXT(N <= 183) === 200

let swRegistration = null;

const publicVapidKey = 'BJ6Rlb2Fa88-cH6awnZO22d4DxvQ-nCLt_-itQcIPHO0mIfSSA921yCtCj7zyNd3OOyeOrp9Pf0Ole6_K2-6wTg'

let subscriptionObj = null;

const DEVICE_DOM = document.getElementById('device')
const TYPE_DOM = document.getElementById('type')
const subscriptionDetails = document.getElementById('js-subscription-details')
subscriptionDetails.value = 'Hello'

const DATABASE = 'PUSH_SMS';
const TABLE_SW = 'RAW_SMS_DATABASE';
const TABLE_DOM = 'SMS_DATABASE';

var dbInstance = idb.openDB(DATABASE, 1, {
  upgrade: (db, oldVersion, newVersion, transaction) => {
    db.createObjectStore(TABLE_SW);
    db.createObjectStore(TABLE_DOM);
  },
  blocked: () => {},
  blocking: () => {},
  terminated: () => {},
});

function subscribePushNotification() {
  subscriptionDetails.value = 'Subscribing'
  swRegistration.pushManager.getSubscription()
  .then(function(subscription) {
    if (!subscription) {
      return swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
    } else {
      return Promise.resolve(subscription);
    }
  })
  .then(function(subscription) {
    subscriptionObj = subscription;
    console.log(JSON.stringify(subscriptionObj));
    subscriptionDetails.value = 'Subscribed'
  })
  .catch(function(error) {
    subscriptionDetails.value =  error.toString();
    console.log(error)
  })
}

function unsubscribePushNotification() {
  subscriptionDetails.value = 'Unsubscribing'
  swRegistration.pushManager.getSubscription()
  .then(function(subscription) {
    if (subscription) {
      subscription.unsubscribe()
      .then(function(successful) {
        subscriptionObj = null;
        subscriptionDetails.value = 'Unsubscribed'
      }).catch(function(error) {
        subscriptionDetails.value =  error.toString();
        console.log(error)
      })
    } else {
      subscriptionDetails.value = 'Not Subscribe'
      console.log('Not Subscribe');
    }
  }).catch(function(error) {
    subscriptionDetails.value =  error.toString();
    console.log(error)
  })
}

function triggerPushNotification() {

  //if (subscriptionObj == null) 
  //  return

  var _type;
  var _subscriptionObj;
  var _secret;

  if (TYPE_DOM.value == "") {
    alert('Please select type');
    return
  } else {
    _type = parseInt(TYPE_DOM.value)
  }

  if (!CONNECTED_CLIENTS[DEVICE_DOM.value] || DEVICE_DOM.value == "") {
    alert('No Recipeint');
    return
  } else {
    _subscriptionObj = CONNECTED_CLIENTS[DEVICE_DOM.value].push_endpoint;
    _secret = CONNECTED_CLIENTS[DEVICE_DOM.value].secret_key;
  }
  console.log('ENCRYPT USING', _secret);
  subscriptionDetails.value = 'Please wait'

  var raw_body = document.getElementById('body').value !== "" ? document.getElementById('body').value : 'Push notifications with Service Workers';
  var ciphertext = CryptoJS.AES.encrypt(raw_body, _secret).toString();

  const subs = encodeURIComponent(JSON.stringify(_subscriptionObj));
  const title = encodeURIComponent(document.getElementById('title').value !== "" ? document.getElementById('title').value : 'Push Notification');
  const body = encodeURIComponent(JSON.stringify(splitSMS(ciphertext, _type)));
  
  fetch(`/push?title=${title}&body=${body}&subscription=${subs}`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
    }
  })
  .then(function(response) {
    return response.json()
  })
  .then(function(body) {
    subscriptionDetails.value =  JSON.stringify(body)
  })
  .catch(function(error) {
    subscriptionDetails.value =  error.toString();
    console.log(error)
  });
}

function isBlank(str) {
  return (!str || /^\s*$/.test(str));
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
    connectAsClient(name, _id);
  } catch(e) {
    alert('Desktop ID must be a number');
  }
}

function getFromDB() {
  subscriptionDetails.value = null;
  dbInstance
  .then((db) => {
    db.getAllKeys(TABLE_DOM)
    .then((keys) => {
      keys.forEach((key) => {
        db.get(TABLE_DOM, key)
        .then((val) => {
          console.log('DECRYPT USING', SECRET_KEY);
          var bytes  = CryptoJS.AES.decrypt(val[2], SECRET_KEY);
          var originalText = bytes.toString(CryptoJS.enc.Utf8);
          subscriptionDetails.value += `-> ${val[0]} ${val[1]} ${originalText} \n`
        });
      });
    });
  })
  .catch((e) => {
    console.log(e.toString());
  })
}

function removeFromDB(key) {
  dbInstance
  .then((db) => {
    return db.delete(TABLE_DOM, key);
  })
  .then(() => {
    console.log("REMOVED", key);
  })
  .catch((e) => {
    console.log(e.toString());
  })
}

function flushDB() {
  dbInstance
  .then((db) => {
    return Promise.all([db.clear(TABLE_SW), db.clear(TABLE_DOM)])
  })
  .then(() => {
    console.log("FLUSH DB");
  })
  .catch((e) => {
    console.log(e.toString());
  })
}


if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('Service Worker and Push is supported');

  navigator.serviceWorker.register('/static/js/sw.js')
  .then(function(swReg) {
    swRegistration = swReg;
  })
  .catch(function(error) {
    console.error('Service Worker Error', error);
  });
} else {
  console.warn('Push messaging is not supported');
  pushButton.text = 'Push Not Supported';
}

if (navigator.mozSetMessageHandler) {
  navigator.mozSetMessageHandler('serviceworker-notification', function(activityRequest) {
    console.log('serviceworker-notification', activityRequest);
    if (window.navigator.mozApps) {
      var request = window.navigator.mozApps.getSelf();
      request.onsuccess = function() {
        if (request.result) {
          request.result.launch();
        }
      };
    } else {
      window.open(document.location.origin, '_blank');
    }
  });
}
