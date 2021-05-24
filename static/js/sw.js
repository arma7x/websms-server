self.importScripts('/static/js/regenerator-runtime.js')
self.importScripts('/static/js/idb.js')

console.log('[SW] Push worker started')

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

self.addEventListener('push', function(event) {
  console.log('[SW] push')
  const data = event.data.json()
  console.log(data);
  parseData(data.title, data.body)
});

self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[SW] pushsubscriptionchange')
});

self.addEventListener('install', function(event) {
  console.log('[SW] install')
  self.skipWaiting()
});


self.addEventListener('activate', function(event) {
  self.skipWaiting()
  console.log('[SW] activate')
});

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] notificationclick');
  event.notification.close();
  if (event.action === 'open') {
    event.waitUntil(clients.matchAll({
      type: "window"
    }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url == '/' && 'focus' in client)
          return client.focus();
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
      if (clients.openApp) {
        return clients.openApp();
      }
    }));
  }
});

function parseData(title, data) {
  var parts = data.split(' ');
  if (parts.length !== 5)
    return;
  if (parseInt(parts[1]) > 0 && parseInt(parts[2]) > 0) {
    if (parseInt(parts[2]) === 1) {
      processData(title, [data]);
    } else {
      dbInstance
      .then((db) => {
        const tx = db.transaction(TABLE_SW, 'readwrite');
        tx.store.get(parts[0])
        .then((fragments) => {
          if (fragments) {
            fragments.push(data);
            if (fragments.length < parseInt(parts[2])) {
              tx.store.delete(parts[0])
              .then(() => {
                return tx.store.put(fragments, parts[0]);
              });
            } else {
              tx.store.delete(parts[0])
              .then(() => {
                processData(title, fragments);
              });
            }
          } else {
            tx.store.put([data], parts[0]);
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });
    }
  }
}

function processData(title, d) {
  var txt = '';
  var stack = [];

  for (x in d) {
    var i = d[x].split(' ');
    if (i.length === 5)
      stack.push({ id: i[0], order: parseInt(i[1]), max_order: parseInt(i[2]), type: parseInt(i[3]), txt: i[4] });
  }

  stack.sort((a, b) => {
    return a.order - b.order;
  });

  for (s in stack) {
    txt += stack[s].txt;
  }

  dbInstance
  .then((db) => {
    return db.put(TABLE_DOM, [title, stack[0].type, txt], stack[0].id)
    .then((id) => {
      console.log(title, txt, stack[0].type); // notify user
      self.registration.showNotification(title, {
        body: 'New pending SMS',
        requireInteraction: true,
        actions: [{
          action: "open",
          title: "Open"
        },{
          action: "ignore",
          title: "Ignore"
        }]
      });
    });
  })
  .catch((err) => {
    console.log(err);
  });
}
