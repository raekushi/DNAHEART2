window.requestAnimationFrame =
    window.__requestAnimationFrame ||
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    (function () {
        return function (callback, element) {
            var lastTime = element.__lastTime || 0;
            var currTime = Date.now();
            var timeToCall = Math.max(1, 33 - (currTime - lastTime));
            window.setTimeout(callback, timeToCall);
            element.__lastTime = currTime + timeToCall;
        };
    })();

window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    ((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()
));

let loaded = false;

var init = function () {
    if (loaded) return;
    loaded = true;

    const mobile = window.isDevice;
    const koef = mobile ? 0.6 : 1;

    const canvas = document.getElementById("heart");
    const ctx = canvas.getContext("2d");

    let width = canvas.width = koef * innerWidth;
    let height = canvas.height = koef * innerHeight;

    const rand = Math.random;

    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, width, height);

    const heartPosition = function (rad) {
        return [
            Math.pow(Math.sin(rad), 3),
            -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))
        ];
    };

    const scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    window.addEventListener("resize", function () {
        width = canvas.width = koef * innerWidth;
        height = canvas.height = koef * innerHeight;
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fillRect(0, 0, width, height);
    });

    // ----------------------------------------------------------
    // DOUBLE HEART OUTLINES (two heart shapes side by side)
    // ----------------------------------------------------------

    const pointsOrigin = [];
    const dr = mobile ? 0.3 : 0.1;

    // first heart (left)
    for (let i = 0; i < Math.PI * 2; i += dr)
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), 200, 12, -250, 0));

    // second heart (right)
    for (let i = 0; i < Math.PI * 2; i += dr)
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), 200, 12, 250, 0));

    const heartPointsCount = pointsOrigin.length;

    // ----------------------------------------------------------
    // PARTICLES
    // ----------------------------------------------------------
    const traceCount = mobile ? 25 : 70; // longer trails
    const e = [];
    const targetPoints = [];

    const pulse = function (kx, ky) {
        for (let i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [];
            targetPoints[i][0] = kx * pointsOrigin[i][0] + width / 2;
            targetPoints[i][1] = ky * pointsOrigin[i][1] + height / 2;
        }
    };

    for (let i = 0; i < heartPointsCount; i++) {
        let x = rand() * width;
        let y = rand() * height;
        e[i] = {
            vx: 0,
            vy: 0,
            R: 2,
            speed: rand() * 0.5 + 3, // slower movement
            q: ~~(rand() * heartPointsCount),
            D: 2 * (i % 2) - 1,
            force: 0.25 * rand() + 0.70,
            f: "hsla(" + ~~(rand() * 360) + ",70%,60%,.3)",
            trace: []
        };
        for (let k = 0; k < traceCount; k++) e[i].trace[k] = { x, y };
    }

    const config = {
        traceK: 0.45,
        timeDelta: 0.007 // slower pulse → longer animation
    };

    // ----------------------------------------------------------
    // MAIN LOOP (animation)
    // ----------------------------------------------------------

    let time = 0;

    const loop = function () {
        // pulse motion (slower)
        let n = -Math.cos(time);
        pulse((1 + n) * 0.45, (1 + n) * 0.45);
        time += config.timeDelta;

        ctx.fillStyle = "rgba(0,0,0,.08)";
        ctx.fillRect(0, 0, width, height);

        for (let i = e.length; i--;) {
            let u = e[i];
            let q = targetPoints[u.q];

            let dx = u.trace[0].x - q[0];
            let dy = u.trace[0].y - q[1];

            let length = Math.sqrt(dx * dx + dy * dy);

            if (length < 10) {
                if (rand() > 0.95) u.q = ~~(rand() * heartPointsCount);
                else {
                    if (rand() > 0.99) u.D *= -1;
                    u.q = (u.q + u.D + heartPointsCount) % heartPointsCount;
                }
            }

            u.vx += (-dx / length) * u.speed;
            u.vy += (-dy / length) * u.speed;

            u.trace[0].x += u.vx;
            u.trace[0].y += u.vy;

            u.vx *= u.force;
            u.vy *= u.force;

            for (let k = 0; k < u.trace.length - 1; k++) {
                let T = u.trace[k];
                let N = u.trace[k + 1];
                N.x -= config.traceK * (N.x - T.x);
                N.y -= config.traceK * (N.y - T.y);
            }

            ctx.fillStyle = u.f;
            for (let k = 0; k < u.trace.length; k++) {
                ctx.fillRect(u.trace[k].x, u.trace[k].y, 1.2, 1.2);
            }
        }

        window.requestAnimationFrame(loop, canvas);
    };

    loop();
};

var s = document.readyState;
if (s === "complete" || s === "loaded" || s === "interactive") init();
else document.addEventListener("DOMContentLoaded", init, false);
