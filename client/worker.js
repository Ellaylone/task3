var CACHE_NAME = 'shri-2016-task3-1';

//NOTE пути изменились при изменении scope
var urlsToCache = [
  '/',
  '/css/index.css',
  '/js/index.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function(event) {
    const requestURL = new URL(event.request.url);

    if (/^\/api\/v1/.test(requestURL.pathname)
        && (event.request.method !== 'GET' && event.request.method !== 'HEAD')) {
        //NOTE после сохранения изменений - нужно обновить страницу прежде чем изменения закэшируются
        return event.respondWith(fetch(event.request));
    }

    if (/^\/api\/v1/.test(requestURL.pathname)) {
        return event.respondWith(
            //NOTE гонка между fetchAndPutToCache и getFromCache возвращает непредсказуемый результат
            //fetchAndPutToCache всегда пытается обновить данные и в случае провала вызывает getFromCache
            //такое решение в оффлайн версии добавит задержку перед выводом данных из кэша, зато в онлайн версии данные всегда будут свежими
            fetchAndPutToCache(event.request)
        );
    }

    //NOTE синтаксическая ошибка, лишняя точка с запятой
    //NOTE передае в fetchAndPutToCache request через Promise.reject
    return event.respondWith(
        getFromCache(event.request).catch(fetchAndPutToCache)
    );
});

function fetchAndPutToCache(request) {
    return fetch(request).then((response) => {
        const responseToCache = response.clone();
        return caches.open(CACHE_NAME)
            .then((cache) => {
                cache.put(request, responseToCache);
            })
            .then(() => response);
    })
    .catch(() => getFromCache(request)); //NOTE в случае провала вызываем getFromCache
}

function getFromCache(request) {
    return caches.match(request)
        .then((response) => {
            if (response) {
                return response;
            }

            return Promise.reject(request);
        });
}
