/**
 * Sistema de Presencia en Tiempo Real
 * Muestra usuarios conectados con burbujas animadas y notificaciones
 */

// ============================================================================
// CONFIGURACIÓN
// ============================================================================
const PRESENCE_CONFIG = {
    api: {
        baseUrl: 'https://lisboa.unabase.com/node/app/presence',
        endpoints: {
            onlineUnique: '/online-unique',
            online: '/online'
        }
    },
    polling: {
        interval: 10000, // 10 segundos
        retryDelay: 5000 // 5 segundos en caso de error
    },
    announcer: {
        interval: 30000, // 10 segundos entre anuncios
        minRepeatDelay: 60000 // No repetir mismo mensaje antes de 60s
    },
    tooltip: {
        gap: 18,
        extraOffset: 60
    },
    toast: {
        duration: 4500, // 4.5 segundos
        closeDelay: 220
    },
    colors: {
        palette: [
            '#7c3aed', '#6366f1', '#2563eb', '#0ea5e9',
            '#14b8a6', '#10b981', '#84cc16', '#f59e0b',
            '#ef4444', '#ec4899', '#a855f7', '#06b6d4'
        ]
    }
};

// ============================================================================
// UTILIDADES
// ============================================================================
class PresenceUtils {
    /**
     * Obtiene las iniciales de un nombre
     */
    static getInitials(name) {
        if (!name) return '?';
        return name
            .split(/[\s._-]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(word => word[0])
            .join('')
            .toUpperCase();
    }

    /**
     * Genera un color consistente basado en una clave
     */
    static getColorForKey(key) {
        if (!key) return PRESENCE_CONFIG.colors.palette[0];
        
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
        }
        
        return PRESENCE_CONFIG.colors.palette[hash % PRESENCE_CONFIG.colors.palette.length];
    }

    /**
     * Formatea una fecha ISO a hora local
     */
    static formatTime(isoString) {
        if (!isoString) return '—';
        try {
            return new Date(isoString).toLocaleTimeString();
        } catch {
            return isoString;
        }
    }

    /**
     * Genera un hash numérico de un string
     */
    static hash32(str) {
        if (!str) return 0;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
        }
        return hash >>> 0;
    }

    /**
     * Normaliza string removiendo acentos y convirtiendo a minúsculas
     */
    static normalizeString(str) {
        if (!str || typeof str !== 'string') return '';
        const normalized = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return normalized.toLowerCase().trim();
    }

    /**
     * Selecciona un elemento de un array basado en una semilla
     */
    static pickFromArray(array, seed) {
        if (!Array.isArray(array) || array.length === 0) return '';
        return array[seed % array.length];
    }

    /**
     * Verifica si un módulo es de tipo "Negocios"
     */
    static isNegociosModule(moduleName) {
        return this.normalizeString(moduleName).includes('negocio');
    }

    /**
     * Sanitiza un valor asegurando que sea string
     */
    static safeString(value, defaultValue = '') {
        return (typeof value === 'string' && value.trim()) ? value.trim() : defaultValue;
    }
}

// ============================================================================
// GESTOR DE DATOS GLOBALES
// ============================================================================
class PresenceData {
    constructor() {
        this.rut = this._getCompanyRut();
        this.host = window.location.hostname;
        this.currentUser = this._getCurrentUser();
    }

    _getCompanyRut() {
        if (typeof companyRut !== 'undefined' && companyRut) {
            return String(companyRut).trim();
        }
        console.warn('[Presence] Falta companyRut');
        return '';
    }

    _getCurrentUser() {
        if (typeof currentUser !== 'undefined' && currentUser) {
            return currentUser;
        }
        return null;
    }

    getRut() {
        return this.rut;
    }

    getHost() {
        return this.host;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isCurrentUser(login) {
        return this.currentUser?.username === login;
    }

    getCurrentUserName(login) {
        if (this.isCurrentUser(login) && this.currentUser?.name) {
            return this.currentUser.name;
        }
        return login;
    }
}

// ============================================================================
// API CLIENT
// ============================================================================
class PresenceAPI {
    constructor(data) {
        this.data = data;
    }

    /**
     * Obtiene usuarios online únicos (endpoint preferido)
     */
    async fetchOnlineUnique() {
        try {
            const url = `${PRESENCE_CONFIG.api.baseUrl}${PRESENCE_CONFIG.api.endpoints.onlineUnique}`;
            const { data } = await axios.get(url, {
                params: {
                    rut_empresa: this.data.getRut(),
                    hostname: this.data.getHost()
                }
            });

            if (data?.success) {
                return data.data.map(row => ({
                    login: row.login,
                    hostname: row.hostname,
                    ultimo_ping: row.ultimo_ping,
                    sesiones: row.sesiones || 1,
                    module: row.module || '',
                    moduleIndex: row.moduleIndex || ''
                }));
            }
        } catch (error) {
            console.warn('[Presence API] Error en online-unique:', error.message);
        }
        return null;
    }

    /**
     * Obtiene usuarios online (endpoint fallback)
     */
    async fetchOnline() {
        try {
            const url = `${PRESENCE_CONFIG.api.baseUrl}${PRESENCE_CONFIG.api.endpoints.online}`;
            const { data } = await axios.get(url, {
                params: {
                    rut_empresa: this.data.getRut(),
                    hostname: this.data.getHost()
                }
            });

            if (!data?.success) return [];

            // Deduplicar por login
            const byLogin = new Map();
            for (const session of data.online) {
                const key = session.login;
                const existing = byLogin.get(key);

                if (!existing || new Date(session.ultimo_ping) > new Date(existing.ultimo_ping)) {
                    byLogin.set(key, {
                        login: session.login,
                        hostname: session.hostname,
                        ultimo_ping: session.ultimo_ping,
                        sesiones: existing ? existing.sesiones + 1 : 1,
                        module: '',
                        moduleIndex: ''
                    });
                } else {
                    existing.sesiones += 1;
                }
            }

            return Array.from(byLogin.values());
        } catch (error) {
            console.error('[Presence API] Error en online:', error.message);
            return [];
        }
    }

    /**
     * Obtiene usuarios online con estrategia de fallback
     */
    async getOnlineUsers() {
        // Intenta primero con el endpoint único
        const uniqueUsers = await this.fetchOnlineUnique();
        if (uniqueUsers) return uniqueUsers;

        // Fallback al endpoint tradicional
        return await this.fetchOnline();
    }
}

// ============================================================================
// TOOLTIP MANAGER
// ============================================================================
class TooltipManager {
    constructor() {
        this.tooltip = null;
        this._initTooltip();
        this._bindEvents();
    }

    _initTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'presence-tooltip';
        document.body.appendChild(this.tooltip);
    }

    _bindEvents() {
        window.addEventListener('scroll', () => this.hide(), { passive: true });
    }

    show(element) {
        const html = element.getAttribute('data-tooltip');
        if (!html) return;

        this.tooltip.innerHTML = html.replace(/\n/g, '<br/>');

        const rect = element.getBoundingClientRect();
        const gap = PRESENCE_CONFIG.tooltip.gap;

        // Posición X centrada y limitada al viewport
        const x = Math.min(
            Math.max(rect.left + rect.width / 2, 10),
            window.innerWidth - 10
        );
        this.tooltip.style.left = `${x}px`;

        // Posición Y arriba del elemento
        this.tooltip.classList.remove('presence-tooltip--below');
        this.tooltip.classList.add('presence-tooltip--above');

        // Medir altura del tooltip
        this.tooltip.style.top = '-9999px';
        this.tooltip.classList.add('show');
        const tooltipRect = this.tooltip.getBoundingClientRect();
        this.tooltip.classList.remove('show');

        // Calcular posición final
        const extra = PRESENCE_CONFIG.tooltip.extraOffset;
        const topTarget = rect.top - gap - extra;
        const minTop = 10 + tooltipRect.height;
        const finalTop = Math.max(topTarget, minTop);

        this.tooltip.style.top = `${finalTop}px`;
        this.tooltip.classList.add('show');
    }

    hide() {
        if (this.tooltip) {
            this.tooltip.classList.remove('show');
        }
    }
}

// ============================================================================
// TOAST MANAGER
// ============================================================================
class ToastManager {
    constructor() {
        this.container = null;
        this._initContainer();
    }

    _initContainer() {
        this.container = document.createElement('div');
        this.container.className = 'presence-toasts';
        this.container.setAttribute('aria-live', 'polite');
        document.body.appendChild(this.container);
    }

    show({ color, html }) {
        const toast = document.createElement('div');
        toast.className = 'presence-toast';
        toast.style.setProperty('--pt-aura', color || PRESENCE_CONFIG.colors.palette[0]);
        toast.innerHTML = html;

        this.container.appendChild(toast);

        // Auto-destruir después del tiempo configurado
        const timeout = setTimeout(() => {
            this._closeToast(toast);
        }, PRESENCE_CONFIG.toast.duration);

        // Permitir cerrar con click
        toast.addEventListener('click', () => {
            clearTimeout(timeout);
            this._closeToast(toast);
        });
    }

    _closeToast(toast) {
        toast.classList.add('presence-toast--closing');
        setTimeout(() => toast.remove(), PRESENCE_CONFIG.toast.closeDelay);
    }
}

// ============================================================================
// ANNOUNCER (Anunciador de Actividad)
// ============================================================================
class PresenceAnnouncer {
    constructor(data, toastManager) {
        this.data = data;
        this.toastManager = toastManager;
        this.timer = null;
        this.index = 0;
        this.usersCache = [];
        this.lastAnnouncements = new Map(); // login -> { text, timestamp }
    }

    /**
     * Construye el texto del toast para un usuario
     */
    _buildToastText(user) {
        const login = PresenceUtils.safeString(user.login, 'usuario');
        const name = this.data.getCurrentUserName(login);
        const moduleRaw = PresenceUtils.safeString(user.module);

        // Solo anunciar módulos de Negocios
        if (!PresenceUtils.isNegociosModule(moduleRaw)) {
            return '';
        }

        const moduleIndex = PresenceUtils.safeString(user.moduleIndex);
        const sesiones = Number.isFinite(user.sesiones) ? user.sesiones : 1;
        const ultimoPing = PresenceUtils.formatTime(user.ultimo_ping);

        // Variaciones de frases
        const variantsIntro = ['Ahora mismo', 'En este momento', 'Actualmente', 'Por aquí', 'Aviso'];
        const variantsVerb = ['trabajando en', 'revisando', 'gestionando', 'avanzando en', 'navegando por'];

        const seed = PresenceUtils.hash32(`${login}|${PresenceUtils.normalizeString(moduleRaw)}`);
        const intro = PresenceUtils.pickFromArray(variantsIntro, seed) || 'Actualmente';
        const verb = PresenceUtils.pickFromArray(variantsVerb, seed >>> 2) || 'revisando';

        const icon = '💼';
        const modHTML = `<span class="mod">${moduleRaw}</span>`;
        const idxHTML = moduleIndex ? ` — <span class="idx">${moduleIndex}</span>` : '';

        const meta = [`Hora: ${ultimoPing}`];
        if (sesiones > 1) {
            meta.push(`Pestañas: ${sesiones}`);
        }

        return `
            ${icon} ${intro}, <span class="who">${name}</span> está ${verb} ${modHTML}${idxHTML}.
            <span class="meta">${meta.join(' • ')}</span>
        `;
    }

    /**
     * Anuncia el siguiente usuario en la cola
     */
    _announceNext() {
        if (!this.usersCache.length) return;

        // Rotación circular
        this.index = (this.index + 1) % this.usersCache.length;
        const user = this.usersCache[this.index];

        const text = this._buildToastText(user);
        if (!text) return;

        // Evitar spam del mismo mensaje
        const key = user.login;
        const last = this.lastAnnouncements.get(key);
        const now = Date.now();

        if (last && last.text === text && (now - last.timestamp) < PRESENCE_CONFIG.announcer.minRepeatDelay) {
            return; // Saltar este anuncio
        }

        // Mostrar toast
        const color = PresenceUtils.getColorForKey(user.login);
        this.toastManager.show({ color, html: text });

        // Registrar anuncio
        this.lastAnnouncements.set(key, { text, timestamp: now });
    }

    /**
     * Actualiza el cache de usuarios
     */
    updateUsers(users) {
        this.usersCache = users;
    }

    /**
     * Inicia el loop de anuncios
     */
    start() {
        if (this.timer) return;
        this.timer = setInterval(
            () => this._announceNext(),
            PRESENCE_CONFIG.announcer.interval
        );
    }

    /**
     * Detiene el loop de anuncios
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}

// ============================================================================
// BUBBLE RENDERER
// ============================================================================
class BubbleRenderer {
    constructor(data, tooltipManager) {
        this.data = data;
        this.tooltipManager = tooltipManager;
        this._ensureContainer();
    }

    _ensureContainer() {
        let anchor = document.getElementById('presence-anchor');
        
        if (!anchor) {
            const nav = document.querySelector('nav');
            anchor = document.createElement('span');
            anchor.id = 'presence-anchor';
            anchor.style.verticalAlign = 'middle';
            nav?.appendChild(anchor);
        }

        if (!anchor.querySelector('.presence-wrap')) {
            anchor.insertAdjacentHTML('beforeend', `
                <span class="presence-wrap">
                    <span class="presence-count" title="Usuarios conectados" id="presence-count">0</span>
                    <span class="presence-bubbles stack" id="presence-bubbles"></span>
                </span>
            `);
        }
    }

    _createTooltipContent(user) {
        const displayName = this.data.getCurrentUserName(user.login);
        const parts = [
            `<b>${displayName}</b> <small>@ ${user.hostname}</small>`,
            `Módulo: <small>${user.module || '—'}</small>`
        ];

        if (user.moduleIndex) {
            parts.push(`Número: <small>${user.moduleIndex}</small>`);
        }

        parts.push(`Hora: <small>${PresenceUtils.formatTime(user.ultimo_ping)}</small>`);

        if (user.sesiones > 1) {
            parts.push(`Pestañas: <small>${user.sesiones}</small>`);
        }

        return parts.join('<br/>');
    }

    _bindBubbleEvents(element) {
        // Limpiar eventos previos
        element.onmouseenter = null;
        element.onmouseleave = null;
        element.onfocus = null;
        element.onblur = null;

        // Asignar nuevos eventos
        element.addEventListener('mouseenter', () => this.tooltipManager.show(element));
        element.addEventListener('mouseleave', () => this.tooltipManager.hide());
        element.addEventListener('focus', () => this.tooltipManager.show(element));
        element.addEventListener('blur', () => this.tooltipManager.hide());
    }

    _updateBubble(element, user) {
        const color = PresenceUtils.getColorForKey(user.login);
        const tooltip = this._createTooltipContent(user);

        element.dataset.tooltip = tooltip;
        element.style.background = color;
        element.style.setProperty('--pr-aura', color);
        element.classList.add('show');

        // Marcar burbuja del usuario actual
        if (this.data.isCurrentUser(user.login)) {
            element.style.outlineColor = 'rgba(255,255,255,.9)';
        }

        this._bindBubbleEvents(element);
    }

    _createBubble(user) {
        const displayName = this.data.getCurrentUserName(user.login);
        const color = PresenceUtils.getColorForKey(user.login);
        const tooltip = this._createTooltipContent(user);

        const bubble = document.createElement('span');
        bubble.className = 'presence-bubble';
        bubble.textContent = PresenceUtils.getInitials(displayName);
        bubble.style.background = color;
        bubble.style.setProperty('--pr-aura', color);
        bubble.dataset.login = user.login;
        bubble.dataset.tooltip = tooltip;

        if (this.data.isCurrentUser(user.login)) {
            bubble.style.outlineColor = 'rgba(255,255,255,.9)';
        }

        this._bindBubbleEvents(bubble);

        return bubble;
    }

    render(users) {
        const container = document.getElementById('presence-bubbles');
        const countElement = document.getElementById('presence-count');

        if (!container || !countElement) return;

        // Mapear burbujas existentes
        const existingBubbles = new Map();
        container.querySelectorAll('.presence-bubble').forEach(bubble => {
            existingBubbles.set(bubble.dataset.login, bubble);
        });

        // Usuarios procesados
        const processedLogins = new Set();

        // Actualizar o crear burbujas
        users.forEach(user => {
            const login = user.login;
            processedLogins.add(login);

            if (existingBubbles.has(login)) {
                // Actualizar burbuja existente
                this._updateBubble(existingBubbles.get(login), user);
            } else {
                // Crear nueva burbuja
                const bubble = this._createBubble(user);
                container.appendChild(bubble);
                requestAnimationFrame(() => bubble.classList.add('show'));
            }
        });

        // Eliminar burbujas de usuarios que ya no están online
        existingBubbles.forEach((bubble, login) => {
            if (!processedLogins.has(login)) {
                bubble.classList.add('leave');
                setTimeout(() => bubble.remove(), 180);
            }
        });

        // Actualizar contador
        countElement.textContent = String(users.length);
    }
}

// ============================================================================
// PRESENCE SYSTEM (Coordinador Principal)
// ============================================================================
class PresenceSystem {
    constructor() {
        this.data = new PresenceData();
        this.api = new PresenceAPI(this.data);
        this.tooltipManager = new TooltipManager();
        this.toastManager = new ToastManager();
        this.bubbleRenderer = new BubbleRenderer(this.data, this.tooltipManager);
        this.announcer = new PresenceAnnouncer(this.data, this.toastManager);
        this.pollTimer = null;
        this.isRunning = false;
    }

    /**
     * Ejecuta un ciclo de actualización
     */
    async tick() {
        try {
            const users = await this.api.getOnlineUsers();
            this.bubbleRenderer.render(users);
            this.announcer.updateUsers(users);
        } catch (error) {
            console.error('[Presence] Error en tick:', error.message);
        }
    }

    /**
     * Inicia el sistema de presencia
     */
    async start() {
        if (this.isRunning) return;

        this.isRunning = true;

        // Primera actualización inmediata
        await this.tick();

        // Iniciar polling
        this.pollTimer = setInterval(
            () => this.tick(),
            PRESENCE_CONFIG.polling.interval
        );

        // Iniciar anunciador
        this.announcer.start();

        // Event listeners
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.tick();
            }
        });

        window.addEventListener('online', () => this.tick());

        console.log('[Presence] Sistema iniciado');
    }

    /**
     * Detiene el sistema de presencia
     */
    stop() {
        if (!this.isRunning) return;

        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }

        this.announcer.stop();
        this.isRunning = false;

        console.log('[Presence] Sistema detenido');
    }
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================
(function init() {
    const presenceSystem = new PresenceSystem();
    presenceSystem.start();

    // Exponer para debugging (opcional)
    window.presenceSystem = presenceSystem;
})();