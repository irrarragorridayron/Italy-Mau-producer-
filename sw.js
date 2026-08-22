const CACHE_NAME = "italy-mau-producer-v6";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",

  "./Media/logo.png",

  "./Icons/icon-192.png",
  "./Icons/icon-512.png",
  "./Icons/menu.png",
  "./Icons/User.png",
  "./Icons/upload.png",
  "./Icons/Shuffle.png",
  "./Icons/continuous playback.png",
  "./Icons/Repeat-one.png",
  "./Icons/Repeat-all.png",
  "./Icons/Previous.png",
  "./Icons/Next.png",
  "./Icons/play.png",
  "./Icons/Pause.png",
  "./Icons/share.png",
  "./Icons/Delete.png",
  "./Icons/Volumen.png",
  "./Icons/Mute.png",
  "./Icons/Playlist.png",
  "./Icons/Equalizer.png",
  "./Icons/Favorite.png",
  "./Icons/Info.png",

  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {

      await Promise.allSettled(
        APP_SHELL.map(async url => {
          try {
            const response = await fetch(url, {
              cache: "no-store"
            });

            if (response.ok) {
              await cache.put(url, response.clone());
            }

          } catch (error) {
            console.warn(
              "No se pudo precargar:",
              url,
              error
            );
          }
        })
      );

    }).then(() => self.skipWaiting())
  );
});


self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys().then(keys => {

      return Promise.all(

        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))

      );

    }).then(() => self.clients.claim())

  );

});


self.addEventListener("fetch", event => {

  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);


  /*
   * ================================
   * ABRIR LA APP SIN INTERNET
   * ================================
   */

  if (request.mode === "navigate") {

    event.respondWith(

      fetch(request)

        .then(response => {

          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {

            cache.put(
              "./index.html",
              copy
            );

          });

          return response;

        })

        .catch(() => {

          return caches.match(
            "./index.html"
          );

        })

    );

    return;
  }


  /*
   * ================================
   * ARCHIVOS DE LA APP
   * ================================
   */

  if (url.origin === self.location.origin) {

    event.respondWith(

      caches.match(request).then(cached => {

        const network = fetch(request)

          .then(response => {

            if (response.ok) {

              const copy = response.clone();

              caches.open(CACHE_NAME)
                .then(cache => {

                  cache.put(
                    request,
                    copy
                  );

                });

            }

            return response;

          })

          .catch(() => cached);


        return cached || network;

      })

    );

    return;
  }


  /*
   * ================================
   * SUPABASE JS
   * ================================
   */

  if (
    url.hostname === "cdn.jsdelivr.net" &&
    url.pathname.includes(
      "@supabase/supabase-js"
    )
  ) {

    event.respondWith(

      caches.match(request).then(cached => {

        if (cached) {
          return cached;
        }

        return fetch(request).then(response => {

          if (response.ok) {

            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {

                cache.put(
                  request,
                  copy
                );

              });

          }

          return response;

        });

      })

    );

    return;
  }


  /*
   * ================================
   * SUPABASE / CANCIONES
   * ================================
   *
   * Los MP3 NO se guardan aquí.
   *
   * El HTML guarda las canciones
   * seleccionadas por el usuario
   * mediante IndexedDB.
   *
   */

});
