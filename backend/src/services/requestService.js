/* ==========================================================================
   PULSERED - Blood Request & Matching Service
   ========================================================================== */

const { getCompatibleDonorGroups, isBloodCompatible } = require('../utils/bloodCompatibility');
const notificationService = require('./notificationService');

const inMemoryRequests = [
    {
        id: 'req-201',
        requesterId: 'usr-admin-01',
        patientName: 'Venkatesh Naidu',
        bloodGroup: 'O-',
        unitsRequired: 2,
        hospitalName: 'Apollo Hospital Trauma Center',
        hospitalAddress: 'Health City, Arilova',
        state: 'Andhra Pradesh',
        district: 'Visakhapatnam',
        city: 'Visakhapatnam City',
        pincode: '530040',
        urgency: 'CRITICAL',
        description: 'Urgent emergency surgery patient requiring O- universal donor blood.',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 3600000)
    },
    {
        id: 'req-202',
        requesterId: 'usr-102',
        patientName: 'Sujatha Rao',
        bloodGroup: 'B+',
        unitsRequired: 3,
        hospitalName: 'Ramesh Hospitals Emergency Care',
        hospitalAddress: 'MG Road, Labbipet',
        state: 'Andhra Pradesh',
        district: 'Krishna',
        city: 'Vijayawada',
        pincode: '520010',
        urgency: 'HIGH',
        description: 'Post-accident trauma care requiring B+ blood units.',
        status: 'ACCEPTED',
        createdAt: new Date(Date.now() - 7200000)
    }
];

class RequestService {
    async createBloodRequest(userId, requestData) {
        const {
            patientName,
            bloodGroup,
            unitsRequired = 1,
            hospitalName,
            hospitalAddress,
            state = 'Andhra Pradesh',
            district = 'Visakhapatnam',
            city = 'Visakhapatnam City',
            pincode,
            urgency = 'HIGH',
            description
        } = requestData;

        if (!patientName || !bloodGroup || !hospitalName) {
            throw { statusCode: 400, message: 'Patient name, blood group, and hospital name are required.' };
        }

        const newRequest = {
            id: `req-${Date.now()}`,
            requesterId: userId,
            patientName,
            bloodGroup: bloodGroup.toUpperCase(),
            unitsRequired: parseInt(unitsRequired),
            hospitalName,
            hospitalAddress: hospitalAddress || hospitalName,
            state,
            district,
            city,
            pincode: pincode || '530001',
            urgency,
            description: description || `Urgent ${bloodGroup} blood requirement at ${hospitalName}`,
            status: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        inMemoryRequests.unshift(newRequest);

        // Notify compatible donors in the district
        const compatibleGroups = getCompatibleDonorGroups(bloodGroup);
        notificationService.broadcastEmergencyAlert({
            title: `🚨 Emergency Blood Request (${bloodGroup})`,
            message: `Patient ${patientName} urgently needs ${unitsRequired} unit(s) of ${bloodGroup} at ${hospitalName}, ${city}, ${district}.`,
            district,
            compatibleGroups
        });

        return newRequest;
    }

    async getBloodRequests({ bloodGroup, district, city, status, urgency, page = 1, limit = 20 }) {
        let results = [...inMemoryRequests];

        if (bloodGroup) {
            results = results.filter(r => r.bloodGroup.toUpperCase() === bloodGroup.toUpperCase());
        }
        if (district) {
            results = results.filter(r => r.district.toLowerCase() === district.toLowerCase());
        }
        if (city) {
            results = results.filter(r => r.city.toLowerCase().includes(city.toLowerCase()));
        }
        if (status) {
            results = results.filter(r => r.status.toUpperCase() === status.toUpperCase());
        }
        if (urgency) {
            results = results.filter(r => r.urgency.toUpperCase() === urgency.toUpperCase());
        }

        return {
            success: true,
            count: results.length,
            requests: results
        };
    }

    async getBloodRequestById(requestId) {
        const reqItem = inMemoryRequests.find(r => r.id === requestId);
        if (!reqItem) {
            throw { statusCode: 404, message: 'Blood request not found.' };
        }
        return reqItem;
    }

    async updateRequestStatus(requestId, status, userId) {
        const reqItem = inMemoryRequests.find(r => r.id === requestId);
        if (!reqItem) {
            throw { statusCode: 404, message: 'Blood request not found.' };
        }

        reqItem.status = status.toUpperCase();
        reqItem.updatedAt = new Date();

        notificationService.createNotification({
            userId: reqItem.requesterId,
            title: `Blood Request Status Updated`,
            message: `Your request for ${reqItem.patientName} (${reqItem.bloodGroup}) is now ${reqItem.status}.`,
            type: 'STATUS_UPDATE'
        });

        return reqItem;
    }
}

module.exports = new RequestService();
