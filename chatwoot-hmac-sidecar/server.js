/*
 * Sidecar HTTP minimo para calcular el identifier_hash de Chatwoot
 * (Identity Validation) sin reimplementar HMAC-SHA256 en 4D.
 *
 * Se llama SOLO server-to-server, desde el metodo 4D que arma bienvenida.shtml
 * (con el comando HTTP Request de 4D), nunca desde el navegador. El Secret Key
 * de Chatwoot y la clave de autenticacion propia viven unicamente aca.
 *
 * Uso:
 *   CHATWOOT_HMAC_SECRET="<Secret Key del inbox V4>" \
 *   SIDECAR_AUTH_KEY="<clave compartida con el metodo 4D>" \
 *   node server.js
 *
 * Request (desde 4D, server-to-server):
 *   POST /identifier-hash
 *   Header: X-Sidecar-Key: <SIDECAR_AUTH_KEY>
 *   Body:   {"identifier":"<vLogin del usuario>"}
 *
 * Response:
 *   200 {"hash":"<hex hmac-sha256>"}
 *   401 si falta o no coincide X-Sidecar-Key
 *   400 si falta identifier
 */

const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 4790;
const CHATWOOT_HMAC_SECRET = process.env.CHATWOOT_HMAC_SECRET;
const SIDECAR_AUTH_KEY = process.env.SIDECAR_AUTH_KEY;

if (!CHATWOOT_HMAC_SECRET) {
    console.error("Falta CHATWOOT_HMAC_SECRET (Secret Key de Identity Validation del inbox Chatwoot).");
    process.exit(1);
}
if (!SIDECAR_AUTH_KEY) {
    console.error("Falta SIDECAR_AUTH_KEY (clave que solo debe conocer el metodo 4D que llama a este sidecar).");
    process.exit(1);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => {
            data += chunk;
            if (data.length > 10_000) req.destroy();
        });
        req.on("end", () => resolve(data));
        req.on("error", reject);
    });
}

const server = http.createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/identifier-hash") {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "not found" }));
        return;
    }

    if (req.headers["x-sidecar-key"] !== SIDECAR_AUTH_KEY) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "unauthorized" }));
        return;
    }

    let identifier;
    try {
        const raw = await readBody(req);
        identifier = JSON.parse(raw || "{}").identifier;
    } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid json body" }));
        return;
    }

    if (!identifier || typeof identifier !== "string") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "missing identifier" }));
        return;
    }

    const hash = crypto
        .createHmac("sha256", CHATWOOT_HMAC_SECRET)
        .update(identifier)
        .digest("hex");

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ hash }));
});

server.listen(PORT, () => {
    console.log(`chatwoot-hmac-sidecar escuchando en el puerto ${PORT}`);
});
