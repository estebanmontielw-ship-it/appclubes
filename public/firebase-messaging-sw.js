importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js")

firebase.initializeApp({
  apiKey: "AIzaSyDCMRJwv4TRT66c1x8y8qBafakTjGIu17Q",
  authDomain: "cpbpy-c79c5.firebaseapp.com",
  projectId: "cpbpy-c79c5",
  messagingSenderId: "607718838860",
  appId: "1:607718838860:web:3ec1e4724cc05de7415ae9",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "CPB"
  const options = {
    body: payload.notification?.body || "",
    icon: "/favicon-cpb.png",
    badge: "/favicon-cpb.png",
    data: payload.data,
  }
  self.registration.showNotification(title, options)
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "https://cpb.com.py"
  event.waitUntil(clients.openWindow(url))
})
