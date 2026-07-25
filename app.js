/* ==========================================================================
   PULSERED - Blood Search & Donor Management Dashboard Logic
   Features: Synthetic Database, ABO Engine, Caching Engine, Google Form Sync, Google OAuth 2.0, User Blood Details, WebSocket Live Chat
   ========================================================================== */

// 1. MEDICAL ABO BLOOD TYPE COMPATIBILITY RULES
const ABO_COMPATIBILITY = {
    'O-': { canReceiveFrom: ['O-'], canDonateTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], isUniversalDonor: true },
    'O+': { canReceiveFrom: ['O+', 'O-'], canDonateTo: ['O+', 'A+', 'B+', 'AB+'] },
    'A-': { canReceiveFrom: ['A-', 'O-'], canDonateTo: ['A-', 'A+', 'AB-', 'AB+'] },
    'A+': { canReceiveFrom: ['A+', 'A-', 'O+', 'O-'], canDonateTo: ['A+', 'AB+'] },
    'B-': { canReceiveFrom: ['B-', 'O-'], canDonateTo: ['B-', 'B+', 'AB-', 'AB+'] },
    'B+': { canReceiveFrom: ['B+', 'B-', 'O+', 'O-'], canDonateTo: ['B+', 'AB+'] },
    'AB-': { canReceiveFrom: ['AB-', 'A-', 'B-', 'O-'], canDonateTo: ['AB-', 'AB+'] },
    'AB+': { canReceiveFrom: ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'], canDonateTo: ['AB+'], isUniversalRecipient: true }
};

// 2. SYNTHETIC DONOR DATABASE WITH UNIQUE USER IDs
const MOCK_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
];

let INITIAL_DONORS_DATA = [
    { id: 1, userId: 'USR-1001', name: 'Elena Rostova', bloodType: 'O-', distanceKm: 1.4, region: 'Central Metro', ready: 'Immediate', verified: true, avatar: MOCK_AVATARS[0], phone: '+1 (555) 234-5678', email: 'elena.rostova@gmail.com', googleId: '109823471092834710928', donationsCount: 14, lastDonated: '4 months ago', rating: '4.9 ★', mapX: 420, mapY: 180 },
    { id: 2, userId: 'USR-1002', name: 'Marcus Sterling', bloodType: 'A+', distanceKm: 2.8, region: 'Central Metro', ready: 'Immediate', verified: true, avatar: MOCK_AVATARS[1], phone: '+1 (555) 876-5432', email: 'marcus.sterling@gmail.com', googleId: '109823471092834710929', donationsCount: 8, lastDonated: '6 months ago', rating: '4.8 ★', mapX: 360, mapY: 230 },
    { id: 3, userId: 'USR-1003', name: 'Sophia Chen', bloodType: 'B+', distanceKm: 3.5, region: 'Central Metro', ready: 'Today', verified: true, avatar: MOCK_AVATARS[2], phone: '+1 (555) 345-6789', email: 'sophia.chen@gmail.com', googleId: '109823471092834710930', donationsCount: 22, lastDonated: '5 months ago', rating: '5.0 ★', mapX: 470, mapY: 140 },
    { id: 4, userId: 'USR-1004', name: 'David Miller', bloodType: 'O+', distanceKm: 4.1, region: 'Central Metro', ready: 'Immediate', verified: false, avatar: MOCK_AVATARS[3], phone: '+1 (555) 987-6543', email: 'david.m@gmail.com', googleId: '109823471092834710931', donationsCount: 5, lastDonated: '3 months ago', rating: '4.7 ★', mapX: 310, mapY: 280 },
    { id: 5, userId: 'USR-1005', name: 'Amara Vance', bloodType: 'AB+', distanceKm: 4.8, region: 'Central Metro', ready: 'Immediate', verified: true, avatar: MOCK_AVATARS[4], phone: '+1 (555) 456-7890', email: 'amara.vance@gmail.com', googleId: '109823471092834710932', donationsCount: 19, lastDonated: '7 months ago', rating: '4.9 ★', mapX: 440, mapY: 260 }
];

let DONORS_DATA = [...INITIAL_DONORS_DATA];

let LOCATION_INVENTORY = {
    'Central Metro': { 'O-': 12, 'O+': 45, 'A+': 38, 'A-': 15, 'B+': 30, 'B-': 8, 'AB+': 22, 'AB-': 4 },
    'North District': { 'O-': 6, 'O+': 28, 'A+': 20, 'A-': 8, 'B+': 18, 'B-': 3, 'AB+': 14, 'AB-': 2 },
    'South Hub': { 'O-': 9, 'O+': 34, 'A+': 29, 'A-': 12, 'B+': 24, 'B-': 7, 'AB+': 16, 'AB-': 5 },
    'East Coast': { 'O-': 14, 'O+': 50, 'A+': 42, 'A-': 18, 'B+': 35, 'B-': 11, 'AB+': 26, 'AB-': 8 },
    'West Suburban': { 'O-': 5, 'O+': 22, 'A+': 19, 'A-': 6, 'B+': 15, 'B-': 4, 'AB+': 10, 'AB-': 1 }
};

let BLOOD_BANKS_STOCK = [
    { type: 'O-', units: 46, minThreshold: 15, status: 'Low', demand: 'High' },
    { type: 'O+', units: 179, minThreshold: 30, status: 'Optimal', demand: 'Normal' },
    { type: 'A+', units: 148, minThreshold: 25, status: 'Optimal', demand: 'Normal' },
    { type: 'A-', units: 59, minThreshold: 15, status: 'Low', demand: 'High' },
    { type: 'B+', units: 122, minThreshold: 20, status: 'Optimal', demand: 'Normal' },
    { type: 'B-', units: 33, minThreshold: 12, status: 'Critical', demand: 'High' },
    { type: 'AB+', units: 88, minThreshold: 15, status: 'Optimal', demand: 'Low' },
    { type: 'AB-', units: 20, minThreshold: 10, status: 'Critical', demand: 'Extreme' }
];

const PARTNER_BANKS = [
    { name: 'Metro Central Blood Bank Repository', region: 'Central Metro', distance: '1.2 km', totalUnits: 214, phone: '+1 (555) 900-1122' },
    { name: 'St. Jude Emergency Blood Reserve', region: 'North District', distance: '6.4 km', totalUnits: 101, phone: '+1 (555) 900-3344' },
    { name: 'Southside Trauma Center Supply Hub', region: 'South Hub', distance: '8.9 km', totalUnits: 147, phone: '+1 (555) 900-5566' }
];

let GOOGLE_SHEET_LEDGER = [
    { timestamp: '14:32:10', category: 'Donor Reg', details: 'Elena Rostova (USR-1001)', bloodType: 'O-', status: 'Synced' },
    { timestamp: '14:15:44', category: 'Stock Update', details: 'Metro Central (+15 Units)', bloodType: 'A+', status: 'Synced' },
    { timestamp: '13:58:02', category: 'Request', details: 'St. Jude Hospital (Surgery)', bloodType: 'B-', status: 'Fulfilled' }
];

let currentUser = {
    userId: 'USR-ADMIN-01',
    googleId: '109823471092834710900',
    name: 'Dr. Sarah Jenkins',
    role: 'Metro Health ER Coordinator',
    bloodType: 'O-',
    region: 'Central Metro',
    phone: '+1 (555) 019-8877',
    email: 'sarah.jenkins@gmail.com',
    ready: 'Immediate',
    donationsCount: 12,
    lastDonated: '1 month ago',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&auto=format&fit=crop&q=80',
    jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3ItYWRtaW4tMDEiLCJlbWFpbCI6InNhcmFoLmplbmtpbnNAZ21haWwuY29tIn0.simulated_jwt'
};

/* ==========================================================================
   3. CLIENT-SIDE CACHING ENGINE (LocalStorage & In-Memory TTL Query Cache)
   ========================================================================== */
const CacheManager = {
    STORAGE_KEY: 'pulsered_app_cache_v1',
    queryCache: new Map(),

    saveState() {
        try {
            const payload = {
                donors: DONORS_DATA,
                inventory: LOCATION_INVENTORY,
                stock: BLOOD_BANKS_STOCK,
                ledger: GOOGLE_SHEET_LEDGER,
                user: currentUser,
                timestamp: Date.now()
            };
            const jsonStr = JSON.stringify(payload);
            localStorage.setItem(this.STORAGE_KEY, jsonStr);
            this.updateCacheUI(jsonStr.length);
        } catch (e) {
            console.warn('[CacheManager] LocalStorage write failed:', e);
        }
    },

    loadState() {
        try {
            const cachedStr = localStorage.getItem(this.STORAGE_KEY);
            if (!cachedStr) return false;

            const parsed = JSON.parse(cachedStr);
            if (parsed && parsed.donors && parsed.donors.length > 0) {
                DONORS_DATA = parsed.donors;
                if (parsed.inventory) LOCATION_INVENTORY = parsed.inventory;
                if (parsed.stock) BLOOD_BANKS_STOCK = parsed.stock;
                if (parsed.ledger) GOOGLE_SHEET_LEDGER = parsed.ledger;
                if (parsed.user) currentUser = parsed.user;
                this.updateCacheUI(cachedStr.length, true);
                return true;
            }
        } catch (e) {
            console.warn('[CacheManager] Error parsing cache:', e);
        }
        return false;
    },

    clearCache() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.queryCache.clear();
        if ('caches' in window) {
            caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
        }
        showToast('Client cache purged successfully! Resetting app state...', 'success');
        setTimeout(() => location.reload(), 1000);
    },

    updateCacheUI(bytesLength, loadedFromCache = false) {
        const sizeText = document.getElementById('cache-size-text');
        const speedText = document.getElementById('cache-speed-text');

        const sizeKb = (bytesLength / 1024).toFixed(1);
        if (sizeText) sizeText.textContent = `${loadedFromCache ? 'Cached Storage' : 'Saved to Cache'} • ${sizeKb} KB`;
        if (speedText) speedText.textContent = loadedFromCache ? '0.05 ms (Cache)' : '0.1 ms';
    },

    getCachedQuery(key) {
        if (this.queryCache.has(key)) {
            const hit = this.queryCache.get(key);
            if (Date.now() - hit.timestamp < 30000) return hit.data;
        }
        return null;
    },

    setCachedQuery(key, data) {
        this.queryCache.set(key, { data, timestamp: Date.now() });
    }
};

/* ==========================================================================
   4. WEBSOCKET REAL-TIME LIVE DONOR CHAT ENGINE
   ========================================================================== */
const WebSocketDonorChatEngine = {
    activeDonor: null,
    messages: [],

    init() {
        const closeBtn = document.getElementById('close-chat-modal-btn');
        const sendForm = document.getElementById('chat-send-form');
        const quickLocBtn = document.getElementById('chat-quick-loc-btn');
        const quickUrgBtn = document.getElementById('chat-quick-urg-btn');

        if (closeBtn) closeBtn.addEventListener('click', () => this.closeChat());
        if (sendForm) {
            sendForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('chat-message-input');
                const text = input.value.trim();
                if (text) {
                    this.sendMessage(text);
                    input.value = '';
                }
            });
        }

        if (quickLocBtn) {
            quickLocBtn.addEventListener('click', () => {
                this.sendMessage(`📍 Urgent Emergency Location: Central Metro Emergency Trauma Center, Room 402 (Patient needing ${this.activeDonor ? this.activeDonor.bloodType : 'blood'})`);
            });
        }

        if (quickUrgBtn) {
            quickUrgBtn.addEventListener('click', () => {
                this.sendMessage(`🚨 URGENT: Can you confirm if you are on your way to donate right now?`);
            });
        }
    },

    openChat(donorId) {
        const donor = DONORS_DATA.find(d => d.id === donorId);
        if (!donor) return;

        this.activeDonor = donor;
        this.messages = [
            { sender: 'system', text: `WebSocket Connection Established with ${donor.name} (${donor.userId}) on ws://localhost:8080/ws/chat`, time: this.getTimeStr() },
            { sender: 'donor', text: `Hi! I am ${donor.name} (${donor.bloodType} blood donor in ${donor.region}). How can I assist with your emergency request?`, time: this.getTimeStr() }
        ];

        document.getElementById('chat-donor-avatar').src = donor.avatar;
        document.getElementById('chat-donor-name').childNodes[0].nodeValue = donor.name + ' ';
        document.getElementById('chat-donor-blood').textContent = donor.bloodType;
        document.getElementById('chat-donor-meta').textContent = `${donor.userId} • ${donor.region} (${donor.distanceKm} km away)`;

        const modal = document.getElementById('donor-chat-modal');
        modal.classList.add('active');

        this.renderMessages();
    },

    closeChat() {
        const modal = document.getElementById('donor-chat-modal');
        modal.classList.remove('active');
        this.activeDonor = null;
    },

    sendMessage(text) {
        if (!this.activeDonor) return;

        const time = this.getTimeStr();
        this.messages.push({ sender: 'user', text, time });
        this.renderMessages();

        // Show typing indicator
        const typingBox = document.getElementById('chat-typing-indicator');
        const typingText = document.getElementById('chat-typing-text');
        if (typingBox) {
            typingText.textContent = `${this.activeDonor.name} is typing...`;
            typingBox.style.display = 'flex';
        }

        // Simulate WebSocket Server response from donor
        setTimeout(() => {
            if (typingBox) typingBox.style.display = 'none';

            let replyText = `I have received your message regarding ${this.activeDonor.bloodType} blood. I am in ${this.activeDonor.region} and preparing to head over!`;
            if (text.includes('Location')) {
                replyText = `Got the hospital location! I am driving to Central Metro Trauma Center now. Estimated arrival in 15 minutes.`;
            } else if (text.includes('URGENT')) {
                replyText = `YES! Confirmed 100%. I am cleared for donation and bringing my medical ID card. See you shortly!`;
            }

            this.messages.push({ sender: 'donor', text: replyText, time: this.getTimeStr() });
            this.renderMessages();
        }, 1400);
    },

    renderMessages() {
        const body = document.getElementById('chat-messages-body');
        if (!body) return;

        body.innerHTML = this.messages.map(msg => {
            if (msg.sender === 'system') {
                return `<div style="text-align: center; font-size: 0.72rem; color: var(--color-success); margin: 0.3rem 0;"><i class="ri-shield-check-line"></i> ${msg.text}</div>`;
            }
            return `
                <div class="chat-msg-row ${msg.sender === 'user' ? 'sent' : 'received'}">
                    <div class="chat-bubble">${msg.text}</div>
                    <span class="chat-msg-time">${msg.time}</span>
                </div>
            `;
        }).join('');

        body.scrollTop = body.scrollHeight;
    },

    getTimeStr() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    }
};

window.openLiveDonorChat = function(donorId) {
    WebSocketDonorChatEngine.openChat(donorId);
};

const state = {
    selectedBloodType: 'ALL',
    searchQuery: '',
    availability: 'all',
    maxDistance: 100,
    region: 'Central Metro',
    currentTab: 'dashboard',
    activeView: 'grid',
    patientGroupForABO: 'O-',
    sortDonorsBy: 'distance',
    locationTabRegion: 'Central Metro',
    locationTabSortMode: 'units-desc',
    activeSortedUserId: 'USR-1001',
    gformAction: 'donor'
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    const loadedCache = CacheManager.loadState();

    setupNavigation();
    setupFilters();
    setupABOWidget();
    setupModalEvents();
    setupLocationFinderTab();
    setupUserIdSortTab();
    setupGoogleOAuthSystem();
    setupUserBloodDetailsForm();
    setupGoogleFormSync();
    setupCacheControls();
    WebSocketDonorChatEngine.init();

    renderDonorsGrid();
    renderMapNodes();
    renderABOBadges();
    renderInventoryMeters();
    renderActivityFeed();
    renderPartnerBanks();
    renderLocationBloodStock();
    lookupAndSortByUser('USR-1001');

    document.getElementById('nav-donor-count').textContent = DONORS_DATA.length;

    if (loadedCache) {
        showToast('App loaded instantly from Client CacheStorage (0.05ms)', 'success');
    }
}

function setupCacheControls() {
    const clearBtn = document.getElementById('clear-cache-btn');
    const pill = document.getElementById('cache-status-pill');

    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            CacheManager.clearCache();
        });
    }

    if (pill) {
        pill.addEventListener('click', () => {
            showToast(`Cache Active: ${DONORS_DATA.length} donors & location stocks cached in memory.`, 'success');
        });
    }
}

/* ==========================================================================
   USER BLOOD DETAILS SUBMISSION FORM SYSTEM
   ========================================================================== */
function setupUserBloodDetailsForm() {
    const modal = document.getElementById('my-blood-details-modal');
    const openBtn = document.getElementById('open-my-blood-modal-btn');
    const navLink = document.getElementById('nav-my-blood-link');
    const closeBtn = document.getElementById('close-my-blood-modal-btn');
    const cancelBtn = document.getElementById('cancel-my-blood-btn');
    const form = document.getElementById('user-blood-details-form');

    const openModal = () => {
        document.getElementById('mb-full-name').value = currentUser.name;
        document.getElementById('mb-user-id').value = currentUser.userId;
        document.getElementById('mb-blood-group').value = currentUser.bloodType || 'O-';
        document.getElementById('mb-region').value = currentUser.region || 'Central Metro';
        document.getElementById('mb-phone').value = currentUser.phone || '+1 (555) 019-8877';
        document.getElementById('mb-email').value = currentUser.email || `${currentUser.name.toLowerCase().replace(/\s+/g,'')}@gmail.com`;
        document.getElementById('mb-readiness').value = currentUser.ready || 'Immediate';
        document.getElementById('mb-donations-count').value = currentUser.donationsCount || 12;

        modal.classList.add('active');
    };

    window.openMyBloodDetailsModal = openModal;

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (navLink) navLink.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.remove('active'));

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const fullName = document.getElementById('mb-full-name').value;
        const bloodType = document.getElementById('mb-blood-group').value;
        const region = document.getElementById('mb-region').value;
        const phone = document.getElementById('mb-phone').value;
        const email = document.getElementById('mb-email').value;
        const ready = document.getElementById('mb-readiness').value;
        const donationsCount = parseInt(document.getElementById('mb-donations-count').value) || 0;

        currentUser.name = fullName;
        currentUser.bloodType = bloodType;
        currentUser.region = region;
        currentUser.phone = phone;
        currentUser.email = email;
        currentUser.ready = ready;
        currentUser.donationsCount = donationsCount;

        let donor = DONORS_DATA.find(d => d.userId === currentUser.userId || d.email === currentUser.email);
        if (donor) {
            donor.name = fullName;
            donor.bloodType = bloodType;
            donor.region = region;
            donor.phone = phone;
            donor.email = email;
            donor.ready = ready;
            donor.donationsCount = donationsCount;
            donor.verified = true;
        } else {
            donor = {
                id: Date.now(),
                userId: currentUser.userId,
                name: fullName,
                bloodType: bloodType,
                distanceKm: 1.2,
                region: region,
                ready: ready,
                verified: true,
                avatar: currentUser.avatar || MOCK_AVATARS[0],
                phone: phone,
                email: email,
                donationsCount: donationsCount,
                lastDonated: 'Verified Registered Donor',
                rating: '5.0 ★',
                mapX: 400,
                mapY: 200
            };
            DONORS_DATA.unshift(donor);
        }

        modal.classList.remove('active');
        updateActiveUserUI();
        filterAndRenderDonors();
        renderLocationBloodStock();
        lookupAndSortByUser(currentUser.userId);
        CacheManager.saveState();

        showToast(`Blood details updated successfully for User ID ${currentUser.userId}!`, 'success');
    });
}

/* ==========================================================================
   5. GOOGLE OAUTH 2.0 AUTHENTICATION & LOGIN MANAGER
   ========================================================================== */
function setupGoogleOAuthSystem() {
    const headerGoogleBtn = document.getElementById('google-oauth-header-btn');
    const sidebarPill = document.getElementById('sidebar-user-pill');
    const loginModal = document.getElementById('login-modal');
    const closeBtn = document.getElementById('close-login-modal-btn');
    const cancelBtn = document.getElementById('cancel-login-btn');
    const presetSelect = document.getElementById('login-preset-select');

    if (headerGoogleBtn) headerGoogleBtn.addEventListener('click', () => loginModal.classList.add('active'));
    if (sidebarPill) sidebarPill.addEventListener('click', () => loginModal.classList.add('active'));
    if (closeBtn) closeBtn.addEventListener('click', () => loginModal.classList.remove('active'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => loginModal.classList.remove('active'));

    if (presetSelect) {
        presetSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                const user = DONORS_DATA.find(d => d.userId === e.target.value);
                if (user) authenticateGoogleSession(user);
            }
        });
    }

    updateActiveUserUI();
}

window.triggerGoogleOAuthLogin = function() {
    const presetSelect = document.getElementById('login-preset-select');
    const selectedUserId = presetSelect.value || 'USR-ADMIN-01';

    let user = DONORS_DATA.find(d => d.userId === selectedUserId);
    if (!user && selectedUserId === 'USR-ADMIN-01') {
        user = {
            userId: 'USR-ADMIN-01',
            googleId: '109823471092834710900',
            name: 'Dr. Sarah Jenkins',
            role: 'Metro Health ER Coordinator',
            bloodType: 'O-',
            region: 'Central Metro',
            phone: '+1 (555) 019-8877',
            email: 'sarah.jenkins@gmail.com',
            ready: 'Immediate',
            donationsCount: 12,
            avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&auto=format&fit=crop&q=80'
        };
    }

    authenticateGoogleSession(user);
};

function authenticateGoogleSession(googleUser) {
    currentUser = {
        userId: googleUser.userId || `USR-GGL-${Math.floor(1000 + Math.random() * 9000)}`,
        googleId: googleUser.googleId || `10982347${Math.floor(100000000 + Math.random() * 900000000)}`,
        name: googleUser.name,
        role: googleUser.role || 'Google Verified Member',
        bloodType: googleUser.bloodType || 'O-',
        region: googleUser.region || 'Central Metro',
        phone: googleUser.phone || '+1 (555) 019-8877',
        email: googleUser.email || `${googleUser.name.toLowerCase().replace(/\s+/g,'')}@gmail.com`,
        ready: googleUser.ready || 'Immediate',
        donationsCount: googleUser.donationsCount || 5,
        avatar: googleUser.avatar || MOCK_AVATARS[0],
        jwtToken: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI${googleUser.userId}IiwiaWF0IjoxNjkwMDAwMDB9.simulated_google_oauth_jwt`
    };

    updateActiveUserUI();
    document.getElementById('login-modal').classList.remove('active');

    CacheManager.saveState();
    showToast(`Google OAuth 2.0 Success: Authenticated as ${currentUser.name}`, 'success');
    lookupAndSortByUser(currentUser.userId);
}

function updateActiveUserUI() {
    const avatarImg = document.getElementById('active-user-avatar');
    const nameSpan = document.getElementById('active-user-name');
    const badgeSpan = document.getElementById('active-user-id-badge');
    const activeUserDisplay = document.getElementById('active-user-id-display');
    const btnText = document.getElementById('google-btn-text');

    const dashAvatar = document.getElementById('dash-banner-avatar');
    const dashName = document.getElementById('dash-banner-user-name');
    const dashUserId = document.getElementById('dash-banner-user-id');
    const dashBlood = document.getElementById('dash-banner-blood-type');
    const dashStatus = document.getElementById('dash-banner-status');

    if (avatarImg) avatarImg.src = currentUser.avatar;
    if (nameSpan) nameSpan.textContent = currentUser.name;
    if (badgeSpan) badgeSpan.textContent = `ID: ${currentUser.userId}`;
    if (activeUserDisplay) activeUserDisplay.textContent = `${currentUser.userId} (${currentUser.name})`;
    if (btnText) btnText.textContent = currentUser.name.split(' ')[0];

    if (dashAvatar) dashAvatar.src = currentUser.avatar;
    if (dashName) dashName.textContent = currentUser.name;
    if (dashUserId) dashUserId.textContent = currentUser.userId;
    if (dashBlood) dashBlood.textContent = currentUser.bloodType || 'O-';
    if (dashStatus) dashStatus.textContent = currentUser.ready === 'Immediate' ? 'Verified On-Call Donor' : 'Registered Donor';
}

window.openGoogleOAuthModal = function() {
    const contactModal = document.getElementById('contact-donor-modal');
    const content = document.getElementById('contact-modal-content');

    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.25rem;">
            <img src="${currentUser.avatar}" style="width: 75px; height: 75px; border-radius: 50%; border: 3px solid #4285F4; margin-bottom: 0.5rem;">
            <h3 style="font-family: var(--font-heading);">${currentUser.name}</h3>
            <span class="tag tag-info" style="font-size: 0.85rem; margin-top: 0.2rem;"><i class="ri-google-fill"></i> Google OAuth 2.0 Authenticated</span>
        </div>

        <div style="background: rgba(255,255,255,0.04); padding: 1.1rem; border-radius: var(--radius-md); font-size: 0.82rem; display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.25rem;">
            <div><i class="ri-google-fill text-amber"></i> Google ID Token: <strong>${currentUser.googleId}</strong></div>
            <div><i class="ri-mail-line text-crimson"></i> Google Email: <strong>${currentUser.email} (Verified)</strong></div>
            <div><i class="ri-fingerprint-line text-crimson"></i> App User ID: <strong>${currentUser.userId}</strong></div>
            <div><i class="ri-drop-line text-crimson"></i> Registered Blood Group: <strong>${currentUser.bloodType || 'O-'}</strong></div>
            <div><i class="ri-shield-keyhole-line text-green"></i> Session JWT: <code style="font-size: 0.72rem; word-break: break-all; color: var(--color-success);">${currentUser.jwtToken}</code></div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            <button class="btn btn-danger btn-block" onclick="openMyBloodDetailsModal(); document.getElementById('contact-donor-modal').classList.remove('active');">
                <i class="ri-heart-add-fill"></i> Edit My Blood Details
            </button>
            <button class="btn btn-secondary btn-block" onclick="logoutUserSession()">
                <i class="ri-logout-box-line"></i> Revoke Token & Logout
            </button>
        </div>
    `;

    contactModal.classList.add('active');
};

window.logoutUserSession = function() {
    currentUser = {
        userId: 'USR-GUEST',
        name: 'Guest User',
        role: 'Not Authenticated',
        bloodType: 'O-',
        region: 'Central Metro',
        email: 'guest@healthnet.org',
        avatar: MOCK_AVATARS[0],
        jwtToken: null
    };

    updateActiveUserUI();
    document.getElementById('contact-donor-modal').classList.remove('active');
    CacheManager.saveState();
    showToast('Google OAuth 2.0 Session Revoked & Logged out', 'success');
};

/* ==========================================================================
   GOOGLE FORMS PLATFORM REAL-TIME UPDATE SYNC ENGINE
   ========================================================================== */
function setupGoogleFormSync() {
    const radioButtons = document.querySelectorAll('input[name="gform-action"]');
    const dynamicFieldsWrap = document.getElementById('gform-dynamic-fields');
    const form = document.getElementById('google-platform-form');

    if (!radioButtons.length || !dynamicFieldsWrap || !form) return;

    const renderDynamicFields = (actionType) => {
        state.gformAction = actionType;

        if (actionType === 'donor') {
            dynamicFieldsWrap.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>Donor Full Name <span style="color: #EA4335;">*</span></label>
                        <input type="text" id="g-donor-name" required placeholder="e.g. Alexander Wright">
                    </div>
                    <div class="form-group">
                        <label>Blood Group <span style="color: #EA4335;">*</span></label>
                        <select id="g-donor-group" required class="custom-select">
                            <option value="O-">O- Negative (Universal Donor)</option>
                            <option value="O+">O+ Positive</option>
                            <option value="A+">A+ Positive</option>
                            <option value="A-">A- Negative</option>
                            <option value="B+">B+ Positive</option>
                            <option value="B-">B- Negative</option>
                            <option value="AB+">AB+ Positive</option>
                            <option value="AB-">AB- Negative</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Phone Number <span style="color: #EA4335;">*</span></label>
                        <input type="tel" id="g-donor-phone" required placeholder="+1 (555) 789-9900">
                    </div>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" id="g-donor-email" placeholder="alex.w@gmail.com">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Location Region Zone</label>
                        <select id="g-donor-region" class="custom-select">
                            <option value="Central Metro">Central Metro Zone</option>
                            <option value="North District">North District Zone</option>
                            <option value="South Hub">South Hub Zone</option>
                            <option value="East Coast">East Coast Zone</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Readiness</label>
                        <select id="g-donor-ready" class="custom-select">
                            <option value="Immediate">Ready Immediately</option>
                            <option value="Today">Available Today</option>
                        </select>
                    </div>
                </div>
            `;
        } else if (actionType === 'stock') {
            dynamicFieldsWrap.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>Target Blood Bank Center</label>
                        <input type="text" id="g-stock-center" required value="Metro Central Blood Repository">
                    </div>
                    <div class="form-group">
                        <label>Blood Group <span style="color: #EA4335;">*</span></label>
                        <select id="g-stock-group" required class="custom-select">
                            <option value="O-">O- Negative</option>
                            <option value="O+">O+ Positive</option>
                            <option value="A+">A+ Positive</option>
                            <option value="A-">A- Negative</option>
                            <option value="B+">B+ Positive</option>
                            <option value="B-">B- Negative</option>
                            <option value="AB+">AB+ Positive</option>
                            <option value="AB-">AB- Negative</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Additional Units (Pints) Received</label>
                        <input type="number" id="g-stock-units" min="1" max="100" value="15" required>
                    </div>
                    <div class="form-group">
                        <label>Location Zone</label>
                        <select id="g-stock-region" class="custom-select">
                            <option value="Central Metro">Central Metro Zone</option>
                            <option value="North District">North District Zone</option>
                            <option value="South Hub">South Hub Zone</option>
                        </select>
                    </div>
                </div>
            `;
        } else if (actionType === 'request') {
            dynamicFieldsWrap.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>Patient Full Name</label>
                        <input type="text" id="g-req-patient" required placeholder="e.g. Evelyn Vance">
                    </div>
                    <div class="form-group">
                        <label>Required Blood Group</label>
                        <select id="g-req-group" required class="custom-select">
                            <option value="O-">O- Negative (Universal)</option>
                            <option value="O+">O+ Positive</option>
                            <option value="A+">A+ Positive</option>
                            <option value="A-">A- Negative</option>
                            <option value="B+">B+ Positive</option>
                            <option value="B-">B- Negative</option>
                            <option value="AB+">AB+ Positive</option>
                            <option value="AB-">AB- Negative</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Pints Required</label>
                        <input type="number" id="g-req-units" min="1" max="10" value="3" required>
                    </div>
                    <div class="form-group">
                        <label>Hospital Location</label>
                        <input type="text" id="g-req-hospital" required placeholder="e.g. City Trauma ICU Center">
                    </div>
                </div>
            `;
        }
    };

    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => renderDynamicFields(e.target.value));
    });

    renderDynamicFields('donor');
    renderGoogleSheetLedger();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const action = state.gformAction;
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;

        if (action === 'donor') {
            const name = document.getElementById('g-donor-name').value;
            const bloodType = document.getElementById('g-donor-group').value;
            const phone = document.getElementById('g-donor-phone').value;
            const email = document.getElementById('g-donor-email').value || `${name.toLowerCase().replace(/\s+/g,'')}@gmail.com`;
            const region = document.getElementById('g-donor-region').value;
            const ready = document.getElementById('g-donor-ready').value;

            const nextIdNum = DONORS_DATA.length + 1;
            const newUserId = `USR-10${nextIdNum < 10 ? '0' + nextIdNum : nextIdNum}`;

            const newDonor = {
                id: Date.now(),
                userId: newUserId,
                name: name,
                bloodType: bloodType,
                distanceKm: Math.floor(Math.random() * 8 + 1.2 * 10) / 10,
                region: region,
                ready: ready,
                verified: true,
                avatar: MOCK_AVATARS[nextIdNum % MOCK_AVATARS.length],
                phone: phone,
                email: email,
                donationsCount: 1,
                lastDonated: 'Just Registered via Google Form',
                rating: '5.0 ★',
                mapX: Math.floor(Math.random() * 500 + 150),
                mapY: Math.floor(Math.random() * 250 + 80)
            };

            DONORS_DATA.unshift(newDonor);

            GOOGLE_SHEET_LEDGER.unshift({
                timestamp: timeStr,
                category: 'Google Form Donor',
                details: `${name} (${newUserId})`,
                bloodType: bloodType,
                status: 'Live Synced'
            });

            document.getElementById('nav-donor-count').textContent = DONORS_DATA.length;
            filterAndRenderDonors();
            renderLocationBloodStock();
            showToast(`Google Form Sync: New Donor ${name} (${newUserId}) registered!`, 'success');

        } else if (action === 'stock') {
            const center = document.getElementById('g-stock-center').value;
            const group = document.getElementById('g-stock-group').value;
            const unitsToAdd = parseInt(document.getElementById('g-stock-units').value);
            const region = document.getElementById('g-stock-region').value;

            if (LOCATION_INVENTORY[region] && LOCATION_INVENTORY[region][group] !== undefined) {
                LOCATION_INVENTORY[region][group] += unitsToAdd;
            }

            const stockItem = BLOOD_BANKS_STOCK.find(b => b.type === group);
            if (stockItem) {
                stockItem.units += unitsToAdd;
                if (stockItem.units >= stockItem.minThreshold) stockItem.status = 'Optimal';
            }

            GOOGLE_SHEET_LEDGER.unshift({
                timestamp: timeStr,
                category: 'Stock Update',
                details: `${center} (+${unitsToAdd} Pints)`,
                bloodType: group,
                status: 'Live Synced'
            });

            renderInventoryMeters();
            renderLocationBloodStock();
            showToast(`Google Form Sync: Added +${unitsToAdd} units of ${group} to ${center}!`, 'success');

        } else if (action === 'request') {
            const patient = document.getElementById('g-req-patient').value;
            const group = document.getElementById('g-req-group').value;
            const hospital = document.getElementById('g-req-hospital').value;

            GOOGLE_SHEET_LEDGER.unshift({
                timestamp: timeStr,
                category: 'Emergency Request',
                details: `${patient} at ${hospital}`,
                bloodType: group,
                status: 'Alert Sent'
            });

            const urgentStat = document.getElementById('stat-urgent-requests');
            if (urgentStat) urgentStat.textContent = parseInt(urgentStat.textContent) + 1;

            showToast(`Google Form Sync: Emergency Request broadcasted for ${patient} (${group})!`, 'success');
        }

        CacheManager.saveState();
        renderGoogleSheetLedger();
        form.reset();
        renderDynamicFields(action);
    });
}

function renderGoogleSheetLedger() {
    const body = document.getElementById('gsheet-ledger-body');
    if (!body) return;

    body.innerHTML = GOOGLE_SHEET_LEDGER.map(row => `
        <tr>
            <td style="font-size: 0.78rem; color: var(--text-muted);">${row.timestamp}</td>
            <td><span class="tag ${row.category.includes('Donor') ? 'tag-info' : row.category.includes('Stock') ? 'tag-success' : 'tag-danger'}">${row.category}</span></td>
            <td style="font-weight: 600;">${row.details}</td>
            <td><span class="tag-blood highlight" style="font-size: 0.78rem; padding: 0.2rem 0.5rem;">${row.bloodType}</span></td>
            <td><span class="tag tag-success" style="font-size: 0.7rem;"><i class="ri-checkbox-circle-line"></i> ${row.status}</span></td>
        </tr>
    `).join('');
}

/* ==========================================================================
   NAVIGATION & TABS
   ========================================================================== */
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const pageTitle = document.getElementById('page-title');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.id === 'nav-my-blood-link') return;

            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            if (!tabId) return;

            navLinks.forEach(l => l.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            link.classList.add('active');
            const targetPane = document.getElementById(`tab-${tabId}`);
            if (targetPane) targetPane.classList.add('active');

            state.currentTab = tabId;

            if (tabId === 'dashboard') pageTitle.textContent = 'Blood Emergency Dashboard';
            if (tabId === 'google-form-sync') pageTitle.textContent = 'Google Forms & Sheet Live Update Sync';
            if (tabId === 'user-id-sort') pageTitle.textContent = 'User ID Blood Group Sorting Engine';
            if (tabId === 'location-finder') pageTitle.textContent = 'Location Blood Stock & Donor Sort';
            if (tabId === 'donors') pageTitle.textContent = 'Active Donor Directory';
            if (tabId === 'banks') pageTitle.textContent = 'Blood Banks & Repositories';
            if (tabId === 'compatibility') pageTitle.textContent = 'ABO Transfusion Compatibility Matrix';
            if (tabId === 'analytics') pageTitle.textContent = 'Metro Blood Reserve Radar';
        });
    });

    const gridBtn = document.getElementById('view-grid-btn');
    const mapBtn = document.getElementById('view-map-btn');
    const gridView = document.getElementById('donors-grid');
    const mapView = document.getElementById('map-view-panel');

    gridBtn.addEventListener('click', () => {
        gridBtn.classList.add('active');
        mapBtn.classList.remove('active');
        gridView.classList.add('active');
        mapView.classList.remove('active');
        state.activeView = 'grid';
    });

    mapBtn.addEventListener('click', () => {
        mapBtn.classList.add('active');
        gridBtn.classList.remove('active');
        mapView.classList.add('active');
        gridView.classList.remove('active');
        state.activeView = 'map';
    });
}

/* ==========================================================================
   DONOR SEARCH & FILTER SYSTEM WITH QUERY CACHING
   ========================================================================== */
function setupFilters() {
    const bloodPills = document.querySelectorAll('.blood-pill');
    const searchInput = document.getElementById('donor-search-input');
    const sortSelect = document.getElementById('sort-donors-by');
    const availSelect = document.getElementById('availability-filter');
    const distSelect = document.getElementById('max-distance-filter');
    const citySelect = document.getElementById('city-selector');
    const clearBtn = document.getElementById('clear-filters');

    bloodPills.forEach(pill => {
        pill.addEventListener('click', () => {
            bloodPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.selectedBloodType = pill.getAttribute('data-type');
            filterAndRenderDonors();
        });
    });

    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        filterAndRenderDonors();
    });

    sortSelect.addEventListener('change', (e) => {
        state.sortDonorsBy = e.target.value;
        filterAndRenderDonors();
    });

    availSelect.addEventListener('change', (e) => {
        state.availability = e.target.value;
        filterAndRenderDonors();
    });

    distSelect.addEventListener('change', (e) => {
        state.maxDistance = parseFloat(e.target.value);
        filterAndRenderDonors();
    });

    citySelect.addEventListener('change', (e) => {
        state.region = e.target.value;
        filterAndRenderDonors();
    });

    clearBtn.addEventListener('click', () => {
        bloodPills.forEach(p => p.classList.remove('active'));
        bloodPills[0].classList.add('active');
        state.selectedBloodType = 'ALL';
        state.searchQuery = '';
        state.availability = 'all';
        state.maxDistance = 100;
        state.sortDonorsBy = 'distance';
        searchInput.value = '';
        sortSelect.value = 'distance';
        availSelect.value = 'all';
        distSelect.value = '100';
        filterAndRenderDonors();
    });
}

function getFilteredDonors() {
    const cacheKey = `donors_${state.selectedBloodType}_${state.region}_${state.availability}_${state.maxDistance}_${state.sortDonorsBy}_${state.searchQuery}`;
    const cachedHit = CacheManager.getCachedQuery(cacheKey);
    if (cachedHit) return cachedHit;

    let filtered = DONORS_DATA.filter(donor => {
        if (state.selectedBloodType !== 'ALL' && donor.bloodType !== state.selectedBloodType) {
            return false;
        }

        if (state.region !== 'all' && donor.region !== state.region) {
            return false;
        }

        if (state.availability !== 'all' && donor.ready !== state.availability) {
            return false;
        }

        if (donor.distanceKm > state.maxDistance) {
            return false;
        }

        if (state.searchQuery) {
            const matchName = donor.name.toLowerCase().includes(state.searchQuery);
            const matchUserId = donor.userId.toLowerCase().includes(state.searchQuery);
            const matchBlood = donor.bloodType.toLowerCase().includes(state.searchQuery);
            const matchRegion = donor.region.toLowerCase().includes(state.searchQuery);
            const matchPhone = donor.phone.toLowerCase().includes(state.searchQuery);
            if (!matchName && !matchUserId && !matchBlood && !matchRegion && !matchPhone) return false;
        }

        return true;
    });

    if (state.sortDonorsBy === 'distance') {
        filtered.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (state.sortDonorsBy === 'donations') {
        filtered.sort((a, b) => b.donationsCount - a.donationsCount);
    } else if (state.sortDonorsBy === 'readiness') {
        filtered.sort((a, b) => (a.ready === 'Immediate' ? -1 : 1));
    } else if (state.sortDonorsBy === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    CacheManager.setCachedQuery(cacheKey, filtered);
    return filtered;
}

function filterAndRenderDonors() {
    const filtered = getFilteredDonors();
    document.getElementById('filtered-count').textContent = filtered.length;
    renderDonorsCards(filtered, 'donors-grid');
    renderDonorsCards(filtered, 'full-donors-directory');
    renderMapNodes(filtered);
}

function renderDonorsGrid() {
    filterAndRenderDonors();
}

function renderDonorsCards(donorsList, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (donorsList.length === 0) {
        container.innerHTML = `
            <div class="glass-panel text-center" style="grid-column: 1 / -1; padding: 3rem;">
                <i class="ri-user-unfollow-line" style="font-size: 2.5rem; color: var(--text-muted);"></i>
                <h3 style="margin-top: 1rem; font-family: var(--font-heading);">No Donors Found</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.3rem;">Try broadening your location, User ID, or distance filters.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = donorsList.map(donor => `
        <div class="donor-card" data-id="${donor.id}">
            <div class="donor-card-header">
                <div class="donor-profile">
                    <img src="${donor.avatar}" alt="${donor.name}" class="donor-avatar">
                    <div class="donor-info">
                        <h4>${donor.name} ${donor.verified ? '<i class="ri-checkbox-circle-fill verified-icon" title="Verified Medical Clearance"></i>' : ''}</h4>
                        <span class="donor-meta"><strong style="color: var(--primary-crimson);">${donor.userId}</strong> • ${donor.region}</span>
                    </div>
                </div>
                <div class="blood-type-badge">${donor.bloodType}</div>
            </div>

            <div class="donor-card-body">
                <div class="detail-row">
                    <i class="ri-map-pin-line"></i>
                    <span>Distance: <strong>${donor.distanceKm} km away</strong></span>
                </div>
                <div class="detail-row">
                    <i class="ri-history-line"></i>
                    <span>Total Donations: <strong>${donor.donationsCount} Pints</strong> (${donor.rating})</span>
                </div>
                <div class="detail-row" style="margin-top: 0.2rem;">
                    <span class="availability-tag ${donor.ready === 'Immediate' ? 'status-ready' : 'status-today'}">
                        <i class="ri-time-line"></i> ${donor.ready === 'Immediate' ? 'Ready Now' : 'On-Call Today'}
                    </span>
                </div>
            </div>

            <div class="donor-card-footer">
                <button class="btn btn-danger" style="flex: 1; padding: 0.55rem;" onclick="openLiveDonorChat(${donor.id})">
                    <i class="ri-chat-3-line"></i> WebSocket Live Chat
                </button>
                <button class="btn btn-secondary" style="padding: 0.55rem;" onclick="openContactModal(${donor.id})" title="View Profile Details">
                    <i class="ri-user-shared-line"></i> Profile
                </button>
            </div>
        </div>
    `).join('');
}

/* ==========================================================================
   USER ID BLOOD SORTING LOGIC
   ========================================================================== */
function setupUserIdSortTab() {
    const lookupBtn = document.getElementById('lookup-user-id-btn');
    const quickSelect = document.getElementById('user-id-quick-select');
    const inputId = document.getElementById('user-id-input');

    if (lookupBtn) {
        lookupBtn.addEventListener('click', () => {
            lookupAndSortByUser(inputId.value.trim());
        });
    }

    if (quickSelect) {
        quickSelect.addEventListener('change', (e) => {
            inputId.value = e.target.value;
            lookupAndSortByUser(e.target.value);
        });
    }
}

function lookupAndSortByUser(userIdQuery) {
    if (!userIdQuery) return;
    state.activeSortedUserId = userIdQuery;

    let user = DONORS_DATA.find(d => d.userId.toLowerCase() === userIdQuery.toLowerCase() || d.email.toLowerCase() === userIdQuery.toLowerCase());
    
    if (!user) {
        user = {
            userId: userIdQuery.toUpperCase(),
            name: `Registered Patient (${userIdQuery.toUpperCase()})`,
            bloodType: 'O-',
            region: 'Central Metro',
            phone: '+1 (555) 019-9988',
            email: `${userIdQuery.toLowerCase()}@gmail.com`,
            avatar: MOCK_AVATARS[0],
            donationsCount: 2,
            lastDonated: '2 months ago',
            rating: '4.9 ★'
        };
    }

    const banner = document.getElementById('user-profile-banner');
    if (banner) {
        banner.style.display = 'flex';
        banner.innerHTML = `
            <img src="${user.avatar}" style="width: 70px; height: 70px; border-radius: 50%; border: 3px solid var(--primary-crimson);">
            <div>
                <h3 style="font-family: var(--font-heading); font-size: 1.25rem;">
                    ${user.name} <span class="tag tag-danger">${user.userId}</span>
                </h3>
                <div style="font-size: 0.84rem; color: var(--text-secondary); margin-top: 0.25rem; display: flex; gap: 1rem; flex-wrap: wrap;">
                    <span>Blood Group: <strong style="color: var(--primary-crimson); font-size: 1rem;">${user.bloodType}</strong></span>
                    <span>Region: <strong>${user.region}</strong></span>
                    <span>Email: <strong>${user.email}</strong></span>
                    <span>Phone: <strong>${user.phone}</strong></span>
                </div>
            </div>
            <button class="btn btn-danger" style="margin-left: auto;" onclick="openEmergencyRequestForUser('${user.userId}', '${user.bloodType}', '${user.name}')">
                <i class="ri-alarm-warning-fill"></i> Request Blood for this User ID
            </button>
        `;
    }

    document.getElementById('user-id-sorted-title').textContent = `User ID ${user.userId} (${user.bloodType})`;
    document.getElementById('user-id-donor-title').textContent = `User ID ${user.userId} (${user.bloodType})`;

    const patientGroup = user.bloodType;
    const compatibleRecipientGroups = ABO_COMPATIBILITY[patientGroup].canReceiveFrom;

    const rankedGroups = Object.keys(ABO_COMPATIBILITY).map(group => {
        const isExactMatch = (group === patientGroup);
        const isCompatible = compatibleRecipientGroups.includes(group);
        const isUniversal = (group === 'O-');
        
        let compatibilityScore = 0;
        let matchLabel = 'Not Compatible';
        let badgeClass = 'tag-danger';

        if (isExactMatch) {
            compatibilityScore = 100;
            matchLabel = '100% Exact Match';
            badgeClass = 'tag-success';
        } else if (isUniversal) {
            compatibilityScore = 90;
            matchLabel = 'Universal Donor Match';
            badgeClass = 'tag-info';
        } else if (isCompatible) {
            compatibilityScore = 80;
            matchLabel = 'Compatible Transfusion';
            badgeClass = 'tag-info';
        }

        const stockInRegion = LOCATION_INVENTORY[user.region] ? (LOCATION_INVENTORY[user.region][group] || 0) : 15;
        const totalReadyDonors = DONORS_DATA.filter(d => d.bloodType === group && d.ready === 'Immediate').length;

        return { group, compatibilityScore, matchLabel, badgeClass, units: stockInRegion, donorsCount: totalReadyDonors, isCompatible };
    });

    rankedGroups.sort((a, b) => b.compatibilityScore - a.compatibilityScore || b.units - a.units);

    const groupsGrid = document.getElementById('user-id-sorted-groups-grid');
    if (groupsGrid) {
        groupsGrid.innerHTML = rankedGroups.map(item => `
            <div class="location-group-card" style="${item.compatibilityScore > 0 ? 'border-color: rgba(255, 46, 76, 0.4); background: rgba(255, 46, 76, 0.04);' : 'opacity: 0.65;'}">
                <div class="location-card-top">
                    <span class="blood-type-badge">${item.group}</span>
                    <span class="tag ${item.badgeClass}">${item.matchLabel}</span>
                </div>
                <div>
                    <div class="location-card-units">${item.units} Pints</div>
                    <span style="font-size: 0.78rem; color: var(--text-muted);">Stock in ${user.region}</span>
                </div>
                <div style="font-size: 0.82rem; color: var(--text-secondary); border-top: 1px solid var(--border-glass); padding-top: 0.5rem;">
                    <i class="ri-user-heart-line text-crimson"></i> <strong>${item.donorsCount}</strong> Ready Donors
                </div>
                <button class="btn ${item.isCompatible ? 'btn-danger' : 'btn-secondary'} btn-block" style="margin-top: 0.4rem;" onclick="filterDashboardByGroupAndLocation('${item.group}', '${user.region}')">
                    <i class="ri-drop-line"></i> ${item.isCompatible ? 'Access Match Donors' : 'View Group'}
                </button>
            </div>
        `).join('');
    }

    const compatibleDonors = DONORS_DATA.filter(d => compatibleRecipientGroups.includes(d.bloodType));
    compatibleDonors.sort((a, b) => (a.bloodType === patientGroup ? -1 : 1) || a.distanceKm - b.distanceKm);

    document.getElementById('user-id-donor-count').textContent = compatibleDonors.length;
    renderDonorsCards(compatibleDonors, 'user-id-compatible-donors-grid');
}

window.openEmergencyRequestForUser = function(userId, bloodGroup, userName) {
    document.getElementById('open-request-modal-header').click();
    document.getElementById('req-patient-name').value = `${userName} (${userId})`;
    document.getElementById('req-blood-group').value = bloodGroup;
};

/* ==========================================================================
   LOCATION-BASED BLOOD GROUP SORTING FEATURE
   ========================================================================== */
function setupLocationFinderTab() {
    const locationSelect = document.getElementById('location-tab-select');
    const sortModeSelect = document.getElementById('location-sort-mode');

    if (locationSelect) {
        locationSelect.addEventListener('change', (e) => {
            state.locationTabRegion = e.target.value;
            renderLocationBloodStock();
        });
    }

    if (sortModeSelect) {
        sortModeSelect.addEventListener('change', (e) => {
            state.locationTabSortMode = e.target.value;
            renderLocationBloodStock();
        });
    }
}

function renderLocationBloodStock() {
    const container = document.getElementById('location-groups-container');
    const activeSummary = document.getElementById('location-active-summary');
    const donorTitleRegion = document.getElementById('location-donor-title-region');
    const donorCountSpan = document.getElementById('location-donor-count');

    if (!container) return;

    const region = state.locationTabRegion;
    const inventory = LOCATION_INVENTORY[region] || {};

    if (activeSummary) activeSummary.textContent = `Active Zone: ${region}`;
    if (donorTitleRegion) donorTitleRegion.textContent = region;

    const regionDonors = DONORS_DATA.filter(d => d.region === region);
    if (donorCountSpan) donorCountSpan.textContent = regionDonors.length;

    const bloodGroupList = Object.keys(ABO_COMPATIBILITY).map(group => {
        const units = inventory[group] || 0;
        const countReadyDonors = regionDonors.filter(d => d.bloodType === group).length;
        let status = 'Optimal';
        if (units < 15) status = 'Low';
        if (units < 8) status = 'Critical';

        return { group, units, donorsCount: countReadyDonors, status };
    });

    if (state.locationTabSortMode === 'units-desc') {
        bloodGroupList.sort((a, b) => b.units - a.units);
    } else if (state.locationTabSortMode === 'units-asc') {
        bloodGroupList.sort((a, b) => a.units - b.units);
    } else if (state.locationTabSortMode === 'donors-count') {
        bloodGroupList.sort((a, b) => b.donorsCount - a.donorsCount);
    } else if (state.locationTabSortMode === 'type-name') {
        bloodGroupList.sort((a, b) => a.group.localeCompare(b.group));
    }

    container.innerHTML = bloodGroupList.map(item => `
        <div class="location-group-card">
            <div class="location-card-top">
                <span class="blood-type-badge">${item.group}</span>
                <span class="tag ${item.status === 'Critical' ? 'tag-danger' : item.status === 'Low' ? 'tag-warning' : 'tag-success'}">
                    ${item.status}
                </span>
            </div>
            <div>
                <div class="location-card-units">${item.units} Pints</div>
                <span style="font-size: 0.78rem; color: var(--text-muted);">Available in ${region} Reserve</span>
            </div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); border-top: 1px solid var(--border-glass); padding-top: 0.5rem;">
                <i class="ri-user-heart-line text-crimson"></i> <strong>${item.donorsCount}</strong> On-Call Donors Nearby
            </div>
            <button class="btn btn-secondary btn-block" style="margin-top: 0.4rem;" onclick="filterDashboardByGroupAndLocation('${item.group}', '${region}')">
                <i class="ri-filter-line"></i> View Donors
            </button>
        </div>
    `).join('');

    renderDonorsCards(regionDonors, 'location-donors-list');
}

window.filterDashboardByGroupAndLocation = function(group, region) {
    state.selectedBloodType = group;
    state.region = region;

    document.getElementById('city-selector').value = region;
    const pills = document.querySelectorAll('.blood-pill');
    pills.forEach(p => {
        p.classList.remove('active');
        if (p.getAttribute('data-type') === group) p.classList.add('active');
    });

    document.querySelector('[data-tab="dashboard"]').click();
    filterAndRenderDonors();
    showToast(`Filtered donors for ${group} in ${region}`, 'success');
};

/* ==========================================================================
   INTERACTIVE RADAR MAP CANVAS (SVG)
   ========================================================================== */
function renderMapNodes(donorsList = DONORS_DATA) {
    const layer = document.getElementById('map-nodes-layer');
    if (!layer) return;

    let svgHtml = '';

    PARTNER_BANKS.forEach((bank, idx) => {
        const x = 200 + idx * 240;
        const y = 200 + (idx % 2 === 0 ? -60 : 70);
        svgHtml += `
            <g class="map-node bank-node" transform="translate(${x}, ${y})" data-info="${bank.name} (${bank.totalUnits} Units)">
                <circle r="14" fill="rgba(0, 229, 255, 0.2)" stroke="#00E5FF" stroke-width="2"/>
                <circle r="6" fill="#00E5FF"/>
                <text y="-20" text-anchor="middle" fill="#00E5FF" font-size="10" font-weight="bold">${bank.name.split(' ')[0]}</text>
            </g>
        `;
    });

    donorsList.forEach(donor => {
        svgHtml += `
            <g class="map-node donor-node" transform="translate(${donor.mapX}, ${donor.mapY})" onclick="openLiveDonorChat(${donor.id})" data-info="Click to Live Chat with ${donor.name} (${donor.userId} - ${donor.bloodType})">
                <circle r="10" fill="rgba(0, 230, 118, 0.25)" stroke="#00E676" stroke-width="1.5"/>
                <circle r="4" fill="#00E676"/>
                <text y="18" text-anchor="middle" fill="#F1F5F9" font-size="9" font-weight="600">${donor.bloodType}</text>
            </g>
        `;
    });

    layer.innerHTML = svgHtml;
    setupMapTooltips();
}

function setupMapTooltips() {
    const tooltip = document.getElementById('map-tooltip');
    const nodes = document.querySelectorAll('.map-node');

    nodes.forEach(node => {
        node.addEventListener('mousemove', (e) => {
            const info = node.getAttribute('data-info');
            tooltip.textContent = info;
            tooltip.style.opacity = '1';
            tooltip.style.left = `${e.offsetX + 15}px`;
            tooltip.style.top = `${e.offsetY - 10}px`;
        });
        node.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });
    });
}

/* ==========================================================================
   ABO COMPATIBILITY MATRIX LOGIC
   ========================================================================== */
function setupABOWidget() {
    const aboSelect = document.getElementById('abo-select');
    aboSelect.addEventListener('change', (e) => {
        state.patientGroupForABO = e.target.value;
        renderABOBadges();
    });
}

function renderABOBadges() {
    const group = state.patientGroupForABO;
    const rules = ABO_COMPATIBILITY[group];

    const receiveContainer = document.getElementById('can-receive-badges');
    const donateContainer = document.getElementById('can-donate-badges');

    if (!rules || !receiveContainer || !donateContainer) return;

    receiveContainer.innerHTML = rules.canReceiveFrom.map(bt => `
        <span class="tag-blood highlight">${bt}</span>
    `).join('');

    donateContainer.innerHTML = rules.canDonateTo.map(bt => `
        <span class="tag-blood">${bt}</span>
    `).join('');
}

/* ==========================================================================
   INVENTORY RADAR METERS & BANKS
   ========================================================================== */
function renderInventoryMeters() {
    const container = document.getElementById('inventory-meters-list');
    const analyticsContainer = document.getElementById('full-analytics-meters');
    if (!container) return;

    const metersHTML = BLOOD_BANKS_STOCK.map(item => {
        let fillClass = 'fill-optimal';
        if (item.units < item.minThreshold) fillClass = 'fill-low';
        if (item.units < 35) fillClass = 'fill-critical';

        const percentage = Math.min(100, Math.round((item.units / 200) * 100));

        return `
            <div class="meter-item">
                <div class="meter-info">
                    <span class="meter-blood">${item.type} <span class="tag tag-sm ${item.status === 'Critical' ? 'tag-danger' : 'tag-info'}">${item.status}</span></span>
                    <span class="meter-units"><strong>${item.units}</strong> Pints Total</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-fill ${fillClass}" style="width: ${percentage}%;"></div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = metersHTML;

    if (analyticsContainer) {
        analyticsContainer.innerHTML = metersHTML;
    }
}

function renderActivityFeed() {
    const feedContainer = document.getElementById('activity-feed-list');
    if (!feedContainer) return;

    const initialActivities = [
        { icon: 'ri-chat-signal-line', text: '<strong>WebSocket Chat Room</strong> initiated with Elena Rostova (USR-1001)', time: 'Just now' },
        { icon: 'ri-drop-line', text: '<strong>Dr. Sarah Jenkins</strong> updated blood profile to <strong>O-</strong> in Central Metro', time: 'Just now' },
        { icon: 'ri-google-fill', text: '<strong>Dr. Sarah Jenkins</strong> authenticated via Google OAuth 2.0', time: '1 min ago' }
    ];

    feedContainer.innerHTML = initialActivities.map(act => `
        <div class="feed-item">
            <div class="feed-icon"><i class="${act.icon}"></i></div>
            <div class="feed-text">
                <div>${act.text}</div>
                <span class="feed-time">${act.time}</span>
            </div>
        </div>
    `).join('');
}

function renderPartnerBanks() {
    const container = document.getElementById('banks-grid-container');
    if (!container) return;

    container.innerHTML = PARTNER_BANKS.map(bank => `
        <div class="glass-panel" style="margin-bottom: 0;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                    <h3 style="font-family: var(--font-heading); font-size: 1.1rem;">${bank.name}</h3>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${bank.region} • ${bank.distance}</span>
                </div>
                <span class="tag tag-success">Active 24/7</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
                Total Reserve: <strong style="color: var(--primary-crimson); font-size: 1.1rem;">${bank.totalUnits} Units</strong> available across 8 blood groups.
            </p>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary btn-block" onclick="showToast('Dispatching reserve check to ${bank.name}...', 'success')">
                    <i class="ri-phone-line text-crimson"></i> Dispatch Reserve
                </button>
            </div>
        </div>
    `).join('');
}

/* ==========================================================================
   MODALS & USER DETAILS ACCESS WORKFLOW
   ========================================================================== */
function setupModalEvents() {
    const requestModal = document.getElementById('request-modal');
    const openBtn1 = document.getElementById('open-request-modal-header');
    const openBtn2 = document.getElementById('open-request-modal-sidebar');
    const closeBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-modal-btn');
    const reqBloodGroup = document.getElementById('req-blood-group');
    const form = document.getElementById('emergency-request-form');

    const openModal = () => {
        requestModal.classList.add('active');
        updateModalMatches();
    };

    const closeModal = () => {
        requestModal.classList.remove('active');
    };

    if (openBtn1) openBtn1.addEventListener('click', openModal);
    if (openBtn2) openBtn2.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    reqBloodGroup.addEventListener('change', updateModalMatches);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const patientName = document.getElementById('req-patient-name').value;
        const group = reqBloodGroup.value;
        const hospital = document.getElementById('req-hospital').value;

        closeModal();

        showToast(`Emergency broadcast sent for ${patientName} (${group}) to nearby donors!`, 'success');

        const feedContainer = document.getElementById('activity-feed-list');
        const newItem = document.createElement('div');
        newItem.className = 'feed-item';
        newItem.innerHTML = `
            <div class="feed-icon"><i class="ri-alarm-warning-fill"></i></div>
            <div class="feed-text">
                <div>Broadcasting <strong>${group}</strong> emergency for ${patientName} at <strong>${hospital}</strong></div>
                <span class="feed-time">Just now</span>
            </div>
        `;
        feedContainer.prepend(newItem);

        const urgentStat = document.getElementById('stat-urgent-requests');
        if (urgentStat) {
            urgentStat.textContent = parseInt(urgentStat.textContent) + 1;
        }

        form.reset();
    });

    const contactModal = document.getElementById('contact-donor-modal');
    document.getElementById('close-contact-modal-btn').addEventListener('click', () => contactModal.classList.remove('active'));
    document.getElementById('cancel-contact-btn').addEventListener('click', () => contactModal.classList.remove('active'));
}

function updateModalMatches() {
    const requiredGroup = document.getElementById('req-blood-group').value;
    const compatibleDonors = DONORS_DATA.filter(d => ABO_COMPATIBILITY[requiredGroup].canReceiveFrom.includes(d.bloodType));

    const countBadge = document.getElementById('modal-match-count');
    const matchesList = document.getElementById('modal-matches-list');

    countBadge.textContent = `${compatibleDonors.length} Donors Compatible`;

    matchesList.innerHTML = compatibleDonors.slice(0, 3).map(donor => `
        <div class="match-item-mini">
            <span><strong>${donor.name}</strong> (${donor.userId} - ${donor.bloodType}) • ${donor.distanceKm} km away</span>
            <button class="btn btn-danger" style="padding: 0.2rem 0.6rem; font-size: 0.72rem;" onclick="openLiveDonorChat(${donor.id})">
                <i class="ri-chat-3-line"></i> Chat Live
            </button>
        </div>
    `).join('');
}

window.openContactModal = function(donorId) {
    const donor = DONORS_DATA.find(d => d.id === donorId);
    if (!donor) return;

    const contactModal = document.getElementById('contact-donor-modal');
    const content = document.getElementById('contact-modal-content');

    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.25rem;">
            <img src="${donor.avatar}" style="width: 75px; height: 75px; border-radius: 50%; border: 3px solid var(--primary-crimson); margin-bottom: 0.5rem;">
            <h3 style="font-family: var(--font-heading);">${donor.name} ${donor.verified ? '<i class="ri-checkbox-circle-fill verified-icon"></i>' : ''}</h3>
            <span class="tag tag-danger" style="font-size: 0.85rem; margin-top: 0.2rem;">User ID: ${donor.userId} • Group: ${donor.bloodType}</span>
        </div>

        <div style="background: rgba(255,255,255,0.04); padding: 1.1rem; border-radius: var(--radius-md); font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.25rem;">
            <div><i class="ri-fingerprint-line text-crimson"></i> System User ID: <strong>${donor.userId}</strong></div>
            <div><i class="ri-mail-line text-crimson"></i> Email Address: <strong>${donor.email}</strong></div>
            <div><i class="ri-phone-line text-crimson"></i> Direct Phone: <strong>${donor.phone}</strong></div>
            <div><i class="ri-map-pin-line text-crimson"></i> Location Region: <strong>${donor.region} (${donor.distanceKm} km away)</strong></div>
            <div><i class="ri-medal-line text-amber"></i> Lifetime Donations: <strong>${donor.donationsCount} Pints (${donor.rating})</strong></div>
            <div><i class="ri-calendar-line text-crimson"></i> Last Donation Date: <strong>${donor.lastDonated}</strong></div>
            <div><i class="ri-shield-check-line text-green"></i> Medical Eligibility: <strong style="color: var(--color-success);">Cleared to Donate Immediately</strong></div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            <button class="btn btn-danger btn-block" onclick="openLiveDonorChat(${donor.id}); document.getElementById('contact-donor-modal').classList.remove('active');">
                <i class="ri-chat-3-line"></i> Initiate WebSocket Live Chat
            </button>
            <button class="btn btn-secondary btn-block" onclick="showToast('Connecting direct call to ${donor.phone}...', 'success')">
                <i class="ri-phone-fill"></i> Direct Phone Call
            </button>
        </div>
    `;

    contactModal.classList.add('active');
};

/* ==========================================================================
   TOAST ALERTS SYSTEM
   ========================================================================== */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="${type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
