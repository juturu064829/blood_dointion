/* ==========================================================================
   PULSERED - Production Database Layer (PostgreSQL Pool + Persistent File DB)
   Supports full CRUD for Users, Donors, Inventory, Requests, & Ledger
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DB_FILE_PATH = path.join(__dirname, 'database.json');

// Initialize PostgreSQL Pool if DATABASE_URL or PG host is provided in env
const usePostgres = Boolean(process.env.DATABASE_URL || process.env.PGHOST);
let pgPool = null;

if (usePostgres) {
    pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    console.log('[DB] PostgreSQL connection pool initialized.');
} else {
    console.log('[DB] Running in JSON File Persistent Database mode.');
}

// Default Seed Data
const DEFAULT_DB = {
    users: [
        {
            id: 'usr-uuid-1001',
            google_id: '109823471092834710928',
            email: 'elena.r@healthnet.org',
            full_name: 'Elena Rostova',
            profile_picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            blood_group: 'O-',
            role: 'donor',
            is_email_verified: true,
            phone_number: '+1 (555) 234-5678',
            region: 'Central Metro',
            created_at: new Date().toISOString()
        }
    ],
    donors: [
        { id: 1, userId: 'USR-1001', name: 'Elena Rostova', bloodType: 'O-', distanceKm: 1.4, region: 'Central Metro', ready: 'Immediate', verified: true, phone: '+1 (555) 234-5678', email: 'elena.rostova@gmail.com', donationsCount: 14, lastDonated: '4 months ago', rating: '4.9 ★' },
        { id: 2, userId: 'USR-1002', name: 'Marcus Sterling', bloodType: 'A+', distanceKm: 2.8, region: 'Central Metro', ready: 'Immediate', verified: true, phone: '+1 (555) 876-5432', email: 'marcus.sterling@gmail.com', donationsCount: 8, lastDonated: '6 months ago', rating: '4.8 ★' },
        { id: 3, userId: 'USR-1003', name: 'Sophia Chen', bloodType: 'B+', distanceKm: 3.5, region: 'Central Metro', ready: 'Today', verified: true, phone: '+1 (555) 345-6789', email: 'sophia.chen@gmail.com', donationsCount: 22, lastDonated: '5 months ago', rating: '5.0 ★' },
        { id: 4, userId: 'USR-1004', name: 'David Miller', bloodType: 'O+', distanceKm: 4.1, region: 'Central Metro', ready: 'Immediate', verified: false, phone: '+1 (555) 987-6543', email: 'david.m@gmail.com', donationsCount: 5, lastDonated: '3 months ago', rating: '4.7 ★' },
        { id: 5, userId: 'USR-1005', name: 'Amara Vance', bloodType: 'AB+', distanceKm: 4.8, region: 'Central Metro', ready: 'Immediate', verified: true, phone: '+1 (555) 456-7890', email: 'amara.vance@gmail.com', donationsCount: 19, lastDonated: '7 months ago', rating: '4.9 ★' }
    ],
    inventory: {
        'Central Metro': { 'O-': 12, 'O+': 45, 'A+': 38, 'A-': 15, 'B+': 30, 'B-': 8, 'AB+': 22, 'AB-': 4 },
        'North District': { 'O-': 6, 'O+': 28, 'A+': 20, 'A-': 8, 'B+': 18, 'B-': 3, 'AB+': 14, 'AB-': 2 },
        'South Hub': { 'O-': 9, 'O+': 34, 'A+': 29, 'A-': 12, 'B+': 24, 'B-': 7, 'AB+': 16, 'AB-': 5 },
        'East Coast': { 'O-': 14, 'O+': 50, 'A+': 42, 'A-': 18, 'B+': 35, 'B-': 11, 'AB+': 26, 'AB-': 8 },
        'West Suburban': { 'O-': 5, 'O+': 22, 'A+': 19, 'A-': 6, 'B+': 15, 'B-': 4, 'AB+': 10, 'AB-': 1 }
    },
    emergency_requests: [
        {
            id: 'REQ-101',
            requesterName: 'Dr. Robert Vance',
            hospitalName: 'Central Metro General Hospital',
            bloodType: 'O-',
            unitsRequired: 3,
            urgencyLevel: 'CRITICAL',
            region: 'Central Metro',
            status: 'PENDING',
            contactPhone: '+1 (555) 911-0022',
            createdAt: new Date().toISOString()
        }
    ],
    audit_ledger: [
        { id: 1, timestamp: '14:32:10', category: 'Donor Reg', details: 'Elena Rostova (USR-1001)', bloodType: 'O-', status: 'Synced' },
        { id: 2, timestamp: '14:15:44', category: 'Stock Update', details: 'Metro Central (+15 Units)', bloodType: 'A+', status: 'Synced' },
        { id: 3, timestamp: '13:58:02', category: 'Request', details: 'St. Jude Hospital (Surgery)', bloodType: 'B-', status: 'Fulfilled' }
    ]
};

// Internal Persistent File Database Helper
class FileDatabase {
    constructor() {
        this.data = this.load();
    }

    load() {
        try {
            if (fs.existsSync(DB_FILE_PATH)) {
                const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
                return JSON.parse(raw);
            }
        } catch (err) {
            console.error('[DB] Failed to load JSON database file, initializing default:', err.message);
        }
        this.save(DEFAULT_DB);
        return DEFAULT_DB;
    }

    save(dataToSave) {
        try {
            fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dataToSave || this.data, null, 2), 'utf8');
        } catch (err) {
            console.error('[DB] Failed to write database file:', err.message);
        }
    }
}

const fileDb = new FileDatabase();

// DATABASE API INTERFACE
const Database = {
    // --- USERS ---
    async findUserByEmail(email) {
        if (usePostgres) {
            const res = await pgPool.query('SELECT * FROM users WHERE email = $1', [email]);
            return res.rows[0] || null;
        }
        return fileDb.data.users.find(u => u.email === email) || null;
    },

    async findUserById(id) {
        if (usePostgres) {
            const res = await pgPool.query('SELECT * FROM users WHERE id = $1', [id]);
            return res.rows[0] || null;
        }
        return fileDb.data.users.find(u => u.id === id) || null;
    },

    async createUser(userObj) {
        if (usePostgres) {
            const res = await pgPool.query(
                `INSERT INTO users (google_id, email, full_name, profile_picture, blood_group, role)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [userObj.google_id, userObj.email, userObj.full_name, userObj.profile_picture, userObj.blood_group, userObj.role || 'donor']
            );
            return res.rows[0];
        }
        fileDb.data.users.push(userObj);
        fileDb.save();
        return userObj;
    },

    // --- DONORS ---
    async getDonors(filters = {}) {
        let donors = fileDb.data.donors;
        if (filters.bloodType) {
            donors = donors.filter(d => d.bloodType.toUpperCase() === filters.bloodType.toUpperCase());
        }
        if (filters.region) {
            donors = donors.filter(d => d.region.toLowerCase().includes(filters.region.toLowerCase()));
        }
        if (filters.ready) {
            donors = donors.filter(d => d.ready.toLowerCase() === filters.ready.toLowerCase());
        }
        return donors;
    },

    async getDonorById(id) {
        return fileDb.data.donors.find(d => String(d.id) === String(id)) || null;
    },

    async createDonor(donorObj) {
        const newId = fileDb.data.donors.length > 0 
            ? Math.max(...fileDb.data.donors.map(d => Number(d.id) || 0)) + 1 
            : 1;

        const newDonor = {
            id: newId,
            userId: donorObj.userId || `USR-${1000 + newId}`,
            name: donorObj.name,
            bloodType: donorObj.bloodType,
            distanceKm: donorObj.distanceKm || 2.5,
            region: donorObj.region || 'Central Metro',
            ready: donorObj.ready || 'Immediate',
            verified: donorObj.verified !== undefined ? donorObj.verified : true,
            phone: donorObj.phone,
            email: donorObj.email,
            donationsCount: donorObj.donationsCount || 0,
            lastDonated: donorObj.lastDonated || 'Never',
            rating: '5.0 ★'
        };

        fileDb.data.donors.push(newDonor);
        fileDb.save();

        // Log into audit ledger
        await this.addLedgerEntry({
            category: 'Donor Reg',
            details: `${newDonor.name} (${newDonor.userId})`,
            bloodType: newDonor.bloodType,
            status: 'Synced'
        });

        return newDonor;
    },

    async updateDonor(id, updateFields) {
        const index = fileDb.data.donors.findIndex(d => String(d.id) === String(id));
        if (index === -1) return null;

        fileDb.data.donors[index] = { ...fileDb.data.donors[index], ...updateFields };
        fileDb.save();
        return fileDb.data.donors[index];
    },

    async deleteDonor(id) {
        const initialLen = fileDb.data.donors.length;
        fileDb.data.donors = fileDb.data.donors.filter(d => String(d.id) !== String(id));
        const deleted = fileDb.data.donors.length < initialLen;
        if (deleted) fileDb.save();
        return deleted;
    },

    // --- INVENTORY ---
    async getInventory() {
        return fileDb.data.inventory;
    },

    async updateInventory(region, bloodType, units) {
        if (!fileDb.data.inventory[region]) {
            fileDb.data.inventory[region] = {};
        }
        fileDb.data.inventory[region][bloodType] = units;
        fileDb.save();

        await this.addLedgerEntry({
            category: 'Stock Update',
            details: `${region} (${units > 0 ? '+' : ''}${units} Units)`,
            bloodType,
            status: 'Synced'
        });

        return fileDb.data.inventory[region];
    },

    // --- EMERGENCY REQUESTS ---
    async getEmergencyRequests() {
        return fileDb.data.emergency_requests;
    },

    async createEmergencyRequest(reqObj) {
        const newReq = {
            id: `REQ-${Date.now().toString().slice(-4)}`,
            requesterName: reqObj.requesterName,
            hospitalName: reqObj.hospitalName,
            bloodType: reqObj.bloodType,
            unitsRequired: Number(reqObj.unitsRequired) || 1,
            urgencyLevel: reqObj.urgencyLevel || 'HIGH',
            region: reqObj.region || 'Central Metro',
            status: 'PENDING',
            contactPhone: reqObj.contactPhone,
            createdAt: new Date().toISOString()
        };

        fileDb.data.emergency_requests.unshift(newReq);
        fileDb.save();

        await this.addLedgerEntry({
            category: 'Request',
            details: `${newReq.hospitalName} (${newReq.unitsRequired} Units)`,
            bloodType: newReq.bloodType,
            status: 'Pending'
        });

        return newReq;
    },

    async updateRequestStatus(id, status) {
        const reqItem = fileDb.data.emergency_requests.find(r => r.id === id);
        if (!reqItem) return null;

        reqItem.status = status.toUpperCase();
        fileDb.save();

        await this.addLedgerEntry({
            category: 'Request Update',
            details: `${reqItem.hospitalName} status changed to ${status}`,
            bloodType: reqItem.bloodType,
            status: status === 'FULFILLED' ? 'Fulfilled' : 'Updated'
        });

        return reqItem;
    },

    // --- AUDIT LEDGER ---
    async getLedger() {
        return fileDb.data.audit_ledger;
    },

    async addLedgerEntry(entry) {
        const newId = fileDb.data.audit_ledger.length + 1;
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];

        const item = {
            id: newId,
            timestamp: timeStr,
            category: entry.category,
            details: entry.details,
            bloodType: entry.bloodType,
            status: entry.status || 'Synced'
        };

        fileDb.data.audit_ledger.unshift(item);
        if (fileDb.data.audit_ledger.length > 100) {
            fileDb.data.audit_ledger.pop();
        }
        fileDb.save();
        return item;
    }
};

module.exports = Database;
