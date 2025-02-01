// ввідні дані про карту
mapboxgl.accessToken =
    "pk.eyJ1IjoidmFkZW52bWFwa3lpdiIsImEiOiJja2RwczBzcXYwMjgzMnprdWVxMTB2aWU0In0.OBDKIqeo6YDnxaEZR4bdIA";
const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/vadenvmapkyiv/clrcdpfvr00aw01p4hk2yewzs",
    center: [30.71, 50.46], //карта світу на початку, з вкладкою інтро
    zoom: 4,
    pitch: 40,
});

// пульсуюча іконка на карті.
const size = 100;
const pulsingDot = {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),
    onAdd: function () {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext('2d');
    },
    render: function () {
        const duration = 2000;
        const t = (performance.now() % duration) / duration;
        const radius = (size / 2) * 0.3;
        const outerRadius = (size / 2) * 0.7 * t + radius;
        const context = this.context;
        context.clearRect(0, 0, this.width, this.height);
        context.beginPath();
        context.arc(
            this.width / 2,
            this.height / 2,
            outerRadius,
            0,
            Math.PI * 2
        );
        context.fillStyle = `rgba(255, 200, 200, ${1 - t})`;
        context.fill();
        context.beginPath();
        context.arc(
            this.width / 2,
            this.height / 2,
            radius,
            0,
            Math.PI * 2
        );
        context.fillStyle = '#DE4F12';
        context.strokeStyle = '#DE4F12';
        context.lineWidth = 2 + 4 * (1 - t);
        context.fill();
        context.stroke();
        this.data = context.getImageData(
            0,
            0,
            this.width,
            this.height
        ).data;
        map.triggerRepaint();
        return true;
    }
};

const cardContainer = document.getElementById("cardContainer");
const cardTitle = document.querySelector("cardTitle");
const cardDescription = document.querySelector("cardDescription");

// Запуск карти після ознайомлення з прев'ю
function startMap() {
    map.flyTo({
        center: [30, 50],
        zoom: 6,
        duration: 5000,
        pitch: 0,
    });

    // Зміна стилів при старті (прибирається інтро зображення + затемнення зони карти + кнопка "Почати огляд карти")
    const shadowContainer = document.getElementById("shadowContainer");
    const startButton = shadowContainer.querySelector(".start-button");
    const introElement = document.querySelector(".intro");

    shadowContainer.style.display = "none";
    startButton.style.display = "none";
    introElement.style.display = "none";

    // Зміна стилів при старті (починається відображатися контейнер карток в нижній панелі);
    const listContainer = document.getElementById("listContainer");
    listContainer.style.display = "flex";
}

// Робота з набором даних
fetch("https://raw.githubusercontent.com/vadymnes/SwampMapUkraine/main/swamp_polygon.geojson")
    .then((response) => response.json())
    .then((data) => {
        const listContainer = document.querySelector(".list-container");

        data.features.forEach((feature) => {
            // Витягування назви для списку знизу
            const name = feature.properties.name;
            // Вивід списку знизу включно з підтягуванням зображення
            const listItem = document.createElement("div");
            listItem.className = "objectbox";
            const img = document.createElement("img");
            img.src = feature.properties.picture;

            const caption = document.createElement("div");
            caption.className = "objectbox-name";
            caption.textContent = name;

            listItem.appendChild(img);
            listItem.appendChild(caption);
            listContainer.appendChild(listItem);

            // Клік при натисненні в списку знизу відкриває картку об'єкта - ОК
            listItem.addEventListener("click", function () {
                // Відображення картки об'єкта
                const cardContainer = document.getElementById("cardContainer");
                cardContainer.style.display = "block";

                listContainer.style.display = "none";

                // Наближення карти до об'єкта + виділення рамкою - ОК
                const bbox = turf.bbox(feature);
                map.setFilter('polygons-border', ['in', 'name', feature.properties.name]);
                map.fitBounds(bbox, {
                    maxZoom: 11,
                    padding: { top: 150, bottom: 150, left: 400, right: 50 },
                    duration: 4000,
                });

                // Заповнення інформації в картці - ОК
                document.getElementById("cardTitle").innerText = feature.properties.name; // Назва об'єкта
                document.getElementById("cardImage").src = feature.properties.image; // Додайте правильне поле з URL зображення
                document.getElementById("card-description").innerText = feature.properties.description.replace(/<\/?br>/g, '\n'); // Опис об'єкта

                const settlInfoContent = feature.properties.nearest_settl;
                const linksInfoContent = feature.properties.links;
                // Створюємо пусту змінну для зберігання HTML-контенту
                let content = '';

                // Перебираємо масив links
                linksInfoContent.forEach(link => {
                    // Для кожного об'єкта додаємо назву та посилання в HTML-форматі
                    content += `
                        <p>
                            <a style="display: inline-flex;  align-items: center;  gap: 8px;" href="${link.link}" target="_blank"><svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="white"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>${link.name}</a>
                        </p>
                    `;
                });

                // Виводимо інформацію в перше поле accordion-content
                document.querySelectorAll('.accordion-content')[0].innerHTML = settlInfoContent;

                // Виводимо інформацію в другий розділ "Посилання" акордеону
                document.querySelectorAll('.accordion-content')[1].innerHTML = content;
            });

            // Додаємо елемент до списку
            listContainer.appendChild(listItem);
        });

        // Генерація центроїдів (точок) з полігонів через turf.centroid - OK
        var centroids = data.features.map(function (feature) {
            return turf.centroid(feature);
        });
        var centroidsGeoJSON = {
            type: "FeatureCollection",
            features: centroids,
        };

        // Додавання на карту шарів полігонів та точок
        map.on("load", () => {
            map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });
            // Додавання джерел геоданих (полігони + центроїди) - OK
            map.addSource("polygons", {
                type: "geojson",
                data: data,
            });
            map.addSource("centroids", {
                type: "geojson",
                data: centroidsGeoJSON,
            });

            // Стилізація шарів полігонів та точок - OK
            map.addLayer({
                id: "polygons-fill",
                type: "fill",
                source: "polygons",
                layout: {},
                paint: {
                    "fill-color": "#DE4F12",
                },
            });
            map.addLayer({
                id: "centroids",
                type: "symbol",
                source: "centroids",
                layout: {
                    "icon-image": "pulsing-dot",
                    "icon-allow-overlap": true
                }
            });
            map.addLayer({
                id: "polygons-border",
                type: "line",
                source: "polygons",
                paint: {
                    "line-color": "white",
                    "line-width": 2,
                },
                'filter': ['in', 'name', '']
            });

            // Діапазон зумів для шарів полігонів і точок (коли що відображається) - OK
            map.setLayerZoomRange("polygons-fill", 8.5, 20);
            map.setLayerZoomRange("centroids", 3, 8.5);

            // Клік на точку наближає карту ближче до рамок полігону - OK
            map.on("click", "centroids", (e) => {
                map.flyTo({
                    center: e.features[0].geometry.coordinates,
                    zoom: 10,
                    speed: 0.6,
                });
            });

            // Клік на полігон викликає картку - ОК
            map.on("click", "polygons-fill", (e) => {

                const cardContainer = document.getElementById("cardContainer");
                cardContainer.style.display = "block";

                listContainer.style.display = "none";

                const features = map.queryRenderedFeatures(e.point, {
                    layers: ['polygons-fill'] // Задаємо шар, з якого потрібно отримати атрибути
                });

                const feature = features[0];
                const name = feature.properties.name;
                const img = document.createElement("img");
                img.src = feature.properties.picture;

                // Заповнення інформації в картці - ОК
                document.getElementById("cardTitle").innerText = feature.properties.name; // Назва об'єкта
                document.getElementById("cardImage").src = feature.properties.image; // Додайте правильне поле з URL зображення
                document.getElementById("card-description").innerText = feature.properties.description; // Опис об'єкта


                // Вивід списку знизу включно з підтягуванням зображення
                const listItem = document.createElement("div");
                listItem.className = "objectbox";

                const caption = document.createElement("div");
                caption.className = "objectbox-name";
                caption.textContent = name;


                map.setFilter('polygons-border', ['in', 'name', name]);

                // Центрування карти на вибраному об'єкті - ОК
                const clickedPolygon = e.features[0];
                const bbox = turf.bbox(clickedPolygon);
                map.fitBounds(bbox, {
                    maxZoom: 11,
                    padding: { top: 150, bottom: 150, left: 400, right: 50 },
                    duration: 4000,
                });
            });

            // Інтерактивна взаємодія = зміна мишки при наведенні
            map.on("mouseenter", "polygons-fill", () => {
                map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", "polygons-fill", () => {
                map.getCanvas().style.cursor = "";
            });
        });
    });


// Закриття детальної картки та повернення карти до огляду України
function closeCard() {
    cardContainer.style.display = "none";
    listContainer.style.display = "flex";
    document.getElementById("bigname-below").style.display = "none";
    map.setFilter('polygons-border', ['in', 'name', '']);
    map.flyTo({
        center: [30, 50],
        zoom: 6,
    });
};


// Додаємо обробку подій для кнопок
document.querySelectorAll('.info-button').forEach((button, index) => {
    button.addEventListener('click', () => {
        const content = document.querySelectorAll('.accordion-content')[index];
        content.classList.toggle('open'); // Перемикаємо клас "open"
    });
});
