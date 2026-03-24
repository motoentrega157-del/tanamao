importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// We need to fetch the config from somewhere or hardcode it. 
// Since this is a service worker, it can't easily import from ../firebase-applet-config.json
// But we can initialize it with a placeholder or fetch it.
// Actually, the easiest way is to let the client pass the config, or hardcode it.
// Since we don't know the config, we can't easily hardcode it here.
// Wait, AI Studio provides `firebase-applet-config.json`.
// We can use a script to inject it, or we can just fetch it from the root.

fetch('/firebase-applet-config.json')
  .then(response => response.json())
  .then(config => {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage(function(payload) {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/vite.svg'
      };

      self.registration.showNotification(notificationTitle,
        notificationOptions);
    });
  })
  .catch(err => console.error('Failed to load firebase config in SW', err));
