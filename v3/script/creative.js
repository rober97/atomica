let modalGame = document.getElementById("modalJuego");
let span = document.getElementsByClassName("close")[0];
let juegoPelota = document.getElementById("juegoPelota");
let juegoSnake = document.getElementById("juegoSnake");
let intervalo;
let botonReinicio;
let ultimoMovimiento = 0;

let btnPelota = document.getElementById("btnPelota");
let btnSnake = document.getElementById("btnSnake");


span.onclick = function () {
    modalGame.style.display = "none";
    clearInterval(intervalo);
    if (botonReinicio) {
        botonReinicio.style.display = "none";
    }
}

window.onclick = function (event) {
    if (event.target == modalGame) {
        modalGame.style.display = "none";
        clearInterval(intervalo);
        if (botonReinicio) {
            botonReinicio.style.display = "none";
        }
    }
}


btnPelota.onclick = function () {
    juegoPelota.style.display = "block";
    juegoSnake.style.display = "none";
    iniciarJuego();
}

btnSnake.onclick = function () {
    juegoPelota.style.display = "none";
    juegoSnake.style.display = "block";
    iniciarJuegoSnake();
}

function iniciarJuego() {
    modalGame.style.display = "block";
    let pelota = document.getElementById("pelota");
    let barra = document.getElementById("barra");
    let juego = document.querySelector(".juego");
    let puntos = document.getElementById("puntos");
    let puntuacion = 0;
    let x = juego.offsetWidth / 2;
    let y = juego.offsetHeight / 2;
    let dx = 2;
    let dy = -2;
    let incrementoVelocidad = 0.5;

    // Reinicia la posición de la pelota y la barra
    pelota.style.left = x + "px";
    pelota.style.top = y + "px";
    barra.style.left = (juego.offsetWidth / 2 - barra.offsetWidth / 2) + "px";

    puntos.textContent = puntuacion;

    if (botonReinicio) {
        botonReinicio.style.display = "none";
    }

    juego.onmousemove = function (event) {
        let ahora = Date.now();
        if (ahora - ultimoMovimiento > 30) {  // Actualiza la posición cada 50ms
            let juegoRect = juego.getBoundingClientRect();
            let nuevaX = event.clientX - juegoRect.left;
            if (nuevaX > 0 && nuevaX < juego.offsetWidth - barra.offsetWidth) {
                barra.style.left = nuevaX + "px";
            }
            ultimoMovimiento = ahora;
        }
    };

    function moverPelota() {
        if (x + dx > juego.offsetWidth - pelota.offsetWidth || x + dx < 0) {
            dx = -dx;
        }
        if (y + dy < 0) {
            dy = -dy;
        } else if (y + dy > juego.offsetHeight - pelota.offsetHeight) {
            // Comprueba si la pelota está en contacto con la barra
            if (x + pelota.offsetWidth > barra.offsetLeft && x < barra.offsetLeft + barra.offsetWidth && y + pelota.offsetHeight >= juego.offsetHeight - barra.offsetHeight) {
                dy = -dy;
                y = juego.offsetHeight - pelota.offsetHeight - barra.offsetHeight;  // Ajusta la posición de la pelota
                dx = (Math.random() * 4) - 2;  // Cambia la dirección horizontal de forma aleatoria
                puntuacion++;
                puntos.textContent = puntuacion;

                // Aumenta la velocidad de la pelota
                dx += (dx > 0 ? incrementoVelocidad : -incrementoVelocidad);
                dy -= incrementoVelocidad;
            } else {
                clearInterval(intervalo);
                alert("¡Juego terminado! Puntuación: " + puntuacion);
                mostrarBotonReinicio();
            }
        }
        x += dx;
        y += dy;
        pelota.style.left = x + "px";
        pelota.style.top = y + "px";
    }



    intervalo = setInterval(moverPelota, 20);
}

function iniciarJuegoSnake() {
    let canvas = document.getElementById("canvasSnake");
    canvas.width = 300; // Establece el ancho del lienzo
    canvas.height = 300; // Establece el alto del lienzo
    let ctx = canvas.getContext("2d");
    let snake = [{ x: 150, y: 150 }, { x: 140, y: 150 }, { x: 130, y: 150 }, { x: 120, y: 150 }, { x: 110, y: 150 }];
    let dx = 10;
    let dy = 0;
    let comida = { x: 0, y: 0 };
    let puntuacion = 0;
    clearInterval(intervalo);
    crearComida();
    document.addEventListener("keydown", cambiarDireccion);
    intervalo = setInterval(moverSnake, 100);

    function dibujarParte(part) {
        ctx.fillStyle = "#20A789";  // Cambia el color de la serpiente aquí
        ctx.fillRect(part.x, part.y, 10, 10);
        ctx.strokeRect(part.x, part.y, 10, 10);
    }


    function dibujarSnake() {
        snake.forEach(dibujarParte);
    }

    function moverSnake() {
        let cabeza = { x: snake[0].x + dx, y: snake[0].y + dy };
        snake.unshift(cabeza);
        if (cabeza.x === comida.x && cabeza.y === comida.y) {
            puntuacion += 10;
            document.getElementById("puntos").textContent = puntuacion;
            crearComida();
        } else {
            snake.pop();
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dibujarSnake();
        dibujarComida();
        verificarColision();
    }

    function cambiarDireccion(event) {
        const LEFT_KEY = 37;
        const RIGHT_KEY = 39;
        const UP_KEY = 38;
        const DOWN_KEY = 40;
        const keyPressed = event.keyCode;
        const irArriba = dy === -10;
        const irAbajo = dy === 10;
        const irDerecha = dx === 10;
        const irIzquierda = dx === -10;
        if (keyPressed === LEFT_KEY && !irDerecha) {
            dx = -10;
            dy = 0;
        }
        if (keyPressed === UP_KEY && !irAbajo) {
            dx = 0;
            dy = -10;
        }
        if (keyPressed === RIGHT_KEY && !irIzquierda) {
            dx = 10;
            dy = 0;
        }
        if (keyPressed === DOWN_KEY && !irArriba) {
            dx = 0;
            dy = 10;
        }
    }

    function randomTen(min, max) {
        return Math.round((Math.random() * (max - min) + min) / 10) * 10;
    }

    function crearComida() {
        comida.x = randomTen(0, canvas.width - 10);
        comida.y = randomTen(0, canvas.height - 10);
        snake.forEach(function (part) {
            if (part.x === comida.x && part.y === comida.y) crearComida();
        });
    }

    function dibujarComida() {
        ctx.fillStyle = "red";
        ctx.fillRect(comida.x, comida.y, 10, 10);
    }

    function verificarColision() {
        for (let i = 4; i < snake.length; i++) {
            if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) finJuego();
        }
        if (snake[0].x < 0 || snake[0].x >= canvas.width || snake[0].y < 0 || snake[0].y >= canvas.height) finJuego();
    }

    function finJuego() {
        clearInterval(intervalo);
        alert("¡Juego terminado! Puntuación: " + puntuacion);
        mostrarBotonReinicio();
    }
}


function mostrarBotonReinicio() {
    if (!botonReinicio) {
        botonReinicio = document.createElement("button");
        botonReinicio.classList.add('btn-game')
        botonReinicio.textContent = "Volver a jugar";
        document.querySelector(".modal-content-game").appendChild(botonReinicio);
    }
    botonReinicio.style.display = "block";
    botonReinicio.onclick = function () {
        if (juegoPelota.style.display === "block") {
            iniciarJuegoPelota();
        } else if (juegoSnake.style.display === "block") {
            iniciarJuegoSnake();
        }
    };
}

function toggleUniqueAlert(message = null) {
    const alert = document.getElementById("unique-alert");
    const alertText = document.getElementById("unique-alert-text");

    if (message) {
        alertText.innerHTML = message;
    }

    if (alert.classList.contains("unique-show")) {
        alert.classList.remove("unique-show");
    } else {
        alert.classList.add("unique-show");
    }
}

(() => {
    const $root = document.getElementById('ubx-alert-root');
    const qs = (sel) => $root.querySelector(sel);

    const els = {
        box: qs('.ubx-alert'),
        spinner: qs('.ubx-spinner'),
        okIcon: qs('.ubx-status-icon'),
        errIcon: qs('.ubx-error-icon'),
        title: qs('.ubx-title'),
        message: qs('.ubx-message'),
        bar: qs('.ubx-progressbar'),
        barFill: qs('.ubx-progressbar-fill'),
        tips: qs('.ubx-tips'),
        btnCancel: qs('.ubx-cancel-btn'),
    };

    let rotateTimer = null;
    let tipsQueue = [];
    let onCancel = null;

    function open(config = {}) {
        clearInterval(rotateTimer);
        rotateTimer = null;
        tipsQueue = [];

        setTitle(config.title || 'Trabajando…');
        setMessage(config.message || 'Preparando todo para tu reporte');
        setProgress(config.progress ?? 6);
        showSpinner();
        clearTips();

        // Mensajes rotativos (opcional)
        if (Array.isArray(config.rotateMessages) && config.rotateMessages.length) {
            let i = 0;
            setMessage(config.rotateMessages[0]);
            rotateTimer = setInterval(() => {
                i = (i + 1) % config.rotateMessages.length;
                setMessage(config.rotateMessages[i]);
            }, config.rotateIntervalMs || 1800);
        }

        // Tips (opcionales)
        if (Array.isArray(config.tips)) {
            config.tips.forEach(addTip);
        }

        // Cancel
        onCancel = typeof config.onCancel === 'function' ? config.onCancel : null;
        els.btnCancel.onclick = () => {
            if (onCancel) onCancel();
        };

        $root.hidden = false;
        els.box.classList.remove('ubx-appear'); // reinicia anim
        void els.box.offsetWidth;               // reflow
        els.box.classList.add('ubx-appear');
    }

    function close() {
        clearInterval(rotateTimer);
        rotateTimer = null;
        $root.hidden = true;
    }

    function setTitle(txt) {
        els.title.textContent = txt || '';
    }
    function setMessage(txt) {
        els.message.textContent = txt || '';
    }

    function setProgress(percent) {
        const p = Math.max(0, Math.min(100, Number(percent) || 0));
        els.barFill.style.width = p + '%';
        els.bar.setAttribute('aria-valuenow', String(p));
    }

    function addTip(t) {
        if (!t) return;
        tipsQueue.push(t);
        // mantiene 4 tips máx
        while (tipsQueue.length > 4) tipsQueue.shift();
        renderTips();
    }

    function clearTips() {
        tipsQueue = [];
        renderTips();
    }

    function renderTips() {
        els.tips.innerHTML = '';
        tipsQueue.forEach(t => {
            const li = document.createElement('li');
            li.textContent = t;
            els.tips.appendChild(li);
        });
    }

    function showSpinner() {
        els.spinner.classList.remove('ubx-hidden');
        els.okIcon.classList.add('ubx-hidden');
        els.errIcon.classList.add('ubx-hidden');
    }
    function showOk() {
        els.spinner.classList.add('ubx-hidden');
        els.okIcon.classList.remove('ubx-hidden');
        els.errIcon.classList.add('ubx-hidden');
    }
    function showError() {
        els.spinner.classList.add('ubx-hidden');
        els.okIcon.classList.add('ubx-hidden');
        els.errIcon.classList.remove('ubx-hidden');
    }

    function success(msg = '¡Listo!') {
        clearInterval(rotateTimer);
        rotateTimer = null;
        setMessage(msg);
        setProgress(100);
        showOk();
    }

    function error(msg = 'Ocurrió un error') {
        clearInterval(rotateTimer);
        rotateTimer = null;
        setMessage(msg);
        showError();
    }

    // Exponer API global
    window.UBAlert = {
        open, close,
        setTitle, setMessage, setProgress,
        addTip, clearTips,
        success, error,
        showSpinner,
    };
    
})();