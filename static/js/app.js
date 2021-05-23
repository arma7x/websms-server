// DATA = ID(10)<white_space>ORDER(1)<white_space>MAX_ORDER(1)<white_space>TYPE(1)<white_space>TXT(N <= 183) === 200

let swRegistration = null;

const secret = '432646294A404E635266556A586E3272357538782F4125442A472D4B61506453';

const publicVapidKey = 'BJ6Rlb2Fa88-cH6awnZO22d4DxvQ-nCLt_-itQcIPHO0mIfSSA921yCtCj7zyNd3OOyeOrp9Pf0Ole6_K2-6wTg'

let subscriptionObj = null;

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

  if (subscriptionObj == null) 
    return
  
  subscriptionDetails.value = 'Please wait'

  var raw_body = document.getElementById('body').value !== "" ? document.getElementById('body').value : 'Push notifications with Service Workers';
  var ciphertext = CryptoJS.AES.encrypt(raw_body, secret).toString();

  const subs = encodeURIComponent(JSON.stringify(subscriptionObj));
  const title = encodeURIComponent(document.getElementById('title').value !== "" ? document.getElementById('title').value : 'Push Notification');
  const body = encodeURIComponent(JSON.stringify(splitSMS(ciphertext, 1)));
  
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

function nav (move) {
  const currentIndex = document.activeElement.tabIndex
  const next = currentIndex + move
  const nav = document.querySelectorAll('.nav')
  var targetElement = nav[next]
  if (targetElement !== undefined) {
    console.log(currentIndex)
    targetElement.focus()
  } else {
    targetElement = nav[0]
    targetElement.focus()
  }
}

function handleKeydown(e) {
  switch(e.key) {
    case '2':
      unsubscribePushNotification()
      break
    case 'ArrowUp':
      nav(-1)
      break
    case 'ArrowDown':
      nav(1)
      break
    case "SoftRight":
      document.activeElement.blur()
      break
    case "SoftLeft":
    case "1":
      subscribePushNotification()
      break
    case "BrowserBack":
    case "Backspace":
      e.preventDefault()
      e.stopPropagation()
      if (document.activeElement.tagName === 'INPUT') {
        if (document.activeElement.value === '') {
          document.activeElement.blur()
        }
      } else if (document.activeElement.tagName === 'TEXTAREA') {
        document.activeElement.blur()
      } else {
        window.close()
      }
      break
    case "Call":
      triggerPushNotification()
      break
    case "Enter":
      subscriptionDetails.value = '';
      dbInstance
      .then((db) => {
        db.getAllKeys(TABLE_DOM)
        .then((keys) => {
          keys.forEach((key) => {
            db.get(TABLE_DOM, key)
            .then((val) => {
              var bytes  = CryptoJS.AES.decrypt(val[2], secret);
              var originalText = bytes.toString(CryptoJS.enc.Utf8);
              console.log(key, val, originalText);
              subscriptionDetails.value += originalText + '\n\n'
            });
          });
        });
      })
      .catch((e) => {
        console.log(e.toString());
      })
      break
  }
}
document.activeElement.addEventListener('keydown', handleKeydown)

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
