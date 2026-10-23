// Clock / Dost Chat service worker
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ self.clients.claim(); });

self.addEventListener('push', function(event){
  var title = 'Clock';
  var body = 'Naya message aaya';
  try{
    if(event.data){
      var d = event.data.json();
      if(d.title) title = d.title;
      if(d.body) body = d.body;
    }
  }catch(e){}
  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: 'dc-msg',
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  event.waitUntil(
    clients.matchAll({type:'window', includeUncontrolled:true}).then(function(list){
      for(var i=0;i<list.length;i++){
        if('focus' in list[i]) return list[i].focus();
      }
      if(clients.openWindow) return clients.openWindow('./index.html');
    })
  );
});
