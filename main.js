// ввідні дані про карту
mapboxgl.accessToken =
    "pk.eyJ1IjoidmFkZW52bWFwa3lpdiIsImEiOiJja2RwczBzcXYwMjgzMnprdWVxMTB2aWU0In0.OBDKIqeo6YDnxaEZR4bdIA";
const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/vadenvmapkyiv/clrcdpfvr00aw01p4hk2yewzs",
    center: [30.71, 30.46], //карта світу на початку, з вкладкою інтро
    zoom: 3.5,
    pitch: 15,
});

// pulsing dot icon on the map.
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

const cardContainer = document.getElementById("card-container");
const cardTitle = document.querySelector(".card-title");
const cardDescription = document.querySelector(".card-description");
const bigNameBelow = document.getElementById("text-below");

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

        data.features.forEach((feature, index) => {
            // Витягування назви та опису об'єкта
            const name = feature.properties.name;


            // Початок карточки знизу
            const objectbox = document.createElement("div");
            objectbox.className = "objectbox";

            const img = document.createElement("img");
            img.src = feature.properties.picture;



            const caption = document.createElement("div");
            caption.className = "objectbox-name";
            caption.textContent = name;

            objectbox.appendChild(img);
            objectbox.appendChild(caption);
            listContainer.appendChild(objectbox);

            // Клік в списку знизу по об'єкту - OK
            objectbox.addEventListener("click", function () {
                // Починає відображатися картка об'єкта - OK
                cardContainer.style.display = "block";
                // Отримати посилання на зображення з feature.properties.image

                // Отримуємо посилання на елемент card-description
                const cardDescription = document.getElementById("card-description");

                // Динамічне підставлення опису до болота
                const description = feature.properties.description;
                console.log(feature.properties);
                cardDescription.textContent = description;

                // Отримуємо посилання на елемент info-item-accordion-settl
                const infoSettl = document.getElementById("info-item-accordion-settl");

                // Динамічне підставлення опису до болота
                const infosettl = feature.properties.nearest_settl;
                infoSettl.textContent = infosettl;

                const imageUrl = feature.properties.image;
                // Змінити src для зображення
                document.getElementById("card-photo").src = imageUrl;

                // Відображення назви об'єкту внизу сторінки + приховується нижній список об'єктів - OK
                bigNameBelow.innerHTML = name;
                document.getElementById("bigname-below").style.display = "block";
                listContainer.style.display = "none";

                // Наближення карти до об'єкта з списку знизу - OK
                const clickedPolygon = feature;
                const bbox = turf.bbox(clickedPolygon);
                map.fitBounds(bbox, {
                    maxZoom: 10.7,
                    padding: { top: 50, bottom: 200, left: 100, right: 700 },
                    duration: 5000,
                });

            });
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
                    "icon-image": "pulsing-dot"
                }
            });

            // Діапазон зумів для шарів полігонів і точок (коли що відображається) - OK
            map.setLayerZoomRange("polygons-fill", 9.5, 20);
            map.setLayerZoomRange("centroids", 3, 9.5);

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
                // Перевірка, чи вже відображена власна картка
                if (cardContainer.style.display === "block") {
                    return;
                }
                const { description } = e.features[0].properties;
                const { name } = e.features[0].properties;

                // Показує вміст картки з інформацією про об'єкт після кліку на полігон - OK
                cardContainer.style.display = "block";

                // Підпис об'єкта внизу - OK
                bigNameBelow.innerHTML = name;
                document.getElementById("bigname-below").style.display = "block";
                listContainer.style.display = "none";

                // Центрування карти на вибраному об'єкті - ОК
                const clickedPolygon = e.features[0];
                const bbox = turf.bbox(clickedPolygon);
                map.fitBounds(bbox, {
                    maxZoom: 10.7,
                    padding: { top: 50, bottom: 200, left: 100, right: 700 },
                    duration: 5000,
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
    map.flyTo({
        center: [30, 50],
        zoom: 7,
    });
};

const accordionItems = document.querySelectorAll(".accordion-item");

accordionItems.forEach((item) => {
    const header = item.querySelector(".accordion-item-header");
    const body = item.querySelector(".accordion-item-body");

    header.addEventListener("click", () => {
        accordionItems.forEach((accItem) => {
            const accBody = accItem.querySelector(".accordion-item-body");
            if (accItem !== item && !accBody.classList.contains("collapsed")) {
                accBody.classList.add("collapsed");
                accBody.style.height = "0";
            }
        });

        body.classList.toggle("collapsed");
        if (body.classList.contains("collapsed")) {
            body.style.height = "0";
        } else {
            body.style.height = body.scrollHeight + "px";
        }
    });
});


