/* ==========================================================================
   PULSERED - Donor Service (Andhra Pradesh Search & Donor Management Engine)
   ========================================================================== */

const { getCompatibleDonorGroups, calculateMatchScore } = require('../utils/bloodCompatibility');
const { inMemoryProfiles, inMemoryUsers } = require('./authService');

// Seed AP Donors
const sampleAPDonors = [
    { id: 'dp-101', userId: 'usr-101', name: 'Kalyan Varma', email: 'kalyan.v@gmail.com', phone: '+91 9848012345', bloodGroup: 'O-', state: 'Andhra Pradesh', district: 'Visakhapatnam', city: 'Visakhapatnam City', pincode: '530001', available: true, emergencyAvailable: true, rating: 4.9, donationsCount: 14 },
    { id: 'dp-102', userId: 'usr-102', name: 'Srinivas Rao', email: 'srinivas.r@gmail.com', phone: '+91 9849023456', bloodGroup: 'A+', state: 'Andhra Pradesh', district: 'Krishna', city: 'Vijayawada', pincode: '520001', available: true, emergencyAvailable: true, rating: 4.8, donationsCount: 8 },
    { id: 'dp-103', userId: 'usr-103', name: 'Lakshmi Prasanna', email: 'lakshmi.p@gmail.com', phone: '+91 9850034567', bloodGroup: 'B+', state: 'Andhra Pradesh', district: 'Guntur', city: 'Guntur City', pincode: '522002', available: true, emergencyAvailable: false, rating: 5.0, donationsCount: 22 },
    { id: 'dp-104', userId: 'usr-104', name: 'Venkat Naidu', email: 'venkat.n@gmail.com', phone: '+91 9851045678', bloodGroup: 'O+', state: 'Andhra Pradesh', district: 'Tirupati', city: 'Tirupati City', pincode: '517501', available: true, emergencyAvailable: true, rating: 4.7, donationsCount: 5 },
    { id: 'dp-105', userId: 'usr-105', name: 'Anusha Reddy', email: 'anusha.r@gmail.com', phone: '+91 9852056789', bloodGroup: 'AB+', state: 'Andhra Pradesh', district: 'Kurnool', city: 'Kurnool City', pincode: '518001', available: true, emergencyAvailable: true, rating: 4.9, donationsCount: 19 },
    { id: 'dp-106', userId: 'usr-106', name: 'Ramesh Babu', email: 'ramesh.b@gmail.com', phone: '+91 9853067890', bloodGroup: 'A-', state: 'Andhra Pradesh', district: 'YSR Kadapa', city: 'Kadapa City', pincode: '516001', available: true, emergencyAvailable: true, rating: 4.6, donationsCount: 11 },
    { id: 'dp-107', userId: 'usr-107', name: 'Divya Chowdary', email: 'divya.c@gmail.com', phone: '+91 9854078901', bloodGroup: 'O-', state: 'Andhra Pradesh', district: 'Nellore', city: 'Nellore City', pincode: '524001', available: true, emergencyAvailable: true, rating: 4.9, donationsCount: 16 }
];

class DonorService {
    constructor() {
        this.prisma = null;
        try {
            const { PrismaClient } = require('@prisma/client');
            this.prisma = new PrismaClient();
        } catch (e) {}
    }

    async searchDonors({ bloodGroup, state = 'Andhra Pradesh', district, city, pincode, availableOnly = 'true', page = 1, limit = 20 }) {
        let allDonors = [...sampleAPDonors];

        // Also add dynamically registered in-memory profiles
        for (const [userId, profile] of inMemoryProfiles.entries()) {
            const user = [...inMemoryUsers.values()].find(u => u.id === userId);
            allDonors.push({
                id: profile.id || `dp-${userId}`,
                userId: userId,
                name: user ? user.name : 'Registered Donor',
                email: user ? user.email : '',
                phone: user ? user.phone : '+91 9900112233',
                bloodGroup: profile.bloodGroup,
                state: profile.state || 'Andhra Pradesh',
                district: profile.district,
                city: profile.city,
                pincode: profile.pincode,
                available: profile.available !== false,
                emergencyAvailable: profile.emergencyAvailable !== false,
                rating: 4.8,
                donationsCount: 1
            });
        }

        // Filter logic
        if (bloodGroup) {
            const compatibleGroups = getCompatibleDonorGroups(bloodGroup);
            allDonors = allDonors.filter(d => compatibleGroups.includes(d.bloodGroup.toUpperCase()));
        }

        if (state && state.toLowerCase() !== 'all') {
            allDonors = allDonors.filter(d => d.state && d.state.toLowerCase() === state.toLowerCase());
        }

        if (district && district.toLowerCase() !== 'all') {
            allDonors = allDonors.filter(d => d.district && d.district.toLowerCase() === district.toLowerCase());
        }

        if (city) {
            allDonors = allDonors.filter(d => d.city.toLowerCase().includes(city.toLowerCase()));
        }

        if (pincode) {
            allDonors = allDonors.filter(d => d.pincode === pincode);
        }

        if (availableOnly === 'true' || availableOnly === true) {
            allDonors = allDonors.filter(d => d.available);
        }

        // Calculate pagination
        const startIndex = (page - 1) * limit;
        const paginated = allDonors.slice(startIndex, startIndex + parseInt(limit));

        return {
            success: true,
            totalCount: allDonors.length,
            page: parseInt(page),
            limit: parseInt(limit),
            donors: paginated
        };
    }

    async getDonorByUserId(userId) {
        let profile = inMemoryProfiles.get(userId);
        if (!profile) {
            profile = sampleAPDonors.find(d => d.userId === userId || d.id === userId);
        }
        if (!profile) {
            throw { statusCode: 404, message: 'Donor profile not found.' };
        }
        return profile;
    }

    async upsertDonorProfile(userId, profileData) {
        const updated = {
            id: `dp-${userId}`,
            userId,
            bloodGroup: profileData.bloodGroup,
            state: profileData.state || 'Andhra Pradesh',
            district: profileData.district || 'Visakhapatnam',
            city: profileData.city || 'Visakhapatnam City',
            pincode: profileData.pincode || '530001',
            available: profileData.available !== false,
            emergencyAvailable: profileData.emergencyAvailable !== false,
            updatedAt: new Date()
        };

        inMemoryProfiles.set(userId, updated);
        return updated;
    }

    async updateAvailability(userId, { available, emergencyAvailable }) {
        let profile = inMemoryProfiles.get(userId);
        if (!profile) {
            profile = {
                id: `dp-${userId}`,
                userId,
                bloodGroup: 'O-',
                state: 'Andhra Pradesh',
                district: 'Visakhapatnam',
                city: 'Visakhapatnam City'
            };
        }
        if (available !== undefined) profile.available = available;
        if (emergencyAvailable !== undefined) profile.emergencyAvailable = emergencyAvailable;

        inMemoryProfiles.set(userId, profile);
        return profile;
    }
}

module.exports = new DonorService();
