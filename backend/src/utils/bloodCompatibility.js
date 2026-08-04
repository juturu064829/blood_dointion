/* ==========================================================================
   PULSERED - Blood Group Compatibility & Matching Matrix Engine
   Determines ABO and Rh blood compatibility for transfusions & donor search
   ========================================================================== */

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Compatibility mapping: Who can RECEIVE from whom?
// Recipient Blood Group -> Array of compatible Donor Blood Groups
const COMPATIBLE_DONORS_FOR_RECIPIENT = {
    'A+':  ['A+', 'A-', 'O+', 'O-'],
    'A-':  ['A-', 'O-'],
    'B+':  ['B+', 'B-', 'O+', 'O-'],
    'B-':  ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal Recipient
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'O+':  ['O+', 'O-'],
    'O-':  ['O-'] // Can only receive O-
};

// Compatibility mapping: Who can DONATE to whom?
// Donor Blood Group -> Array of compatible Recipient Blood Groups
const COMPATIBLE_RECIPIENTS_FOR_DONOR = {
    'O-':  ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal Donor
    'O+':  ['O+', 'A+', 'B+', 'AB+'],
    'A-':  ['A+', 'A-', 'AB+', 'AB-'],
    'A+':  ['A+', 'AB+'],
    'B-':  ['B+', 'B-', 'AB+', 'AB-'],
    'B+':  ['B+', 'AB+'],
    'AB-': ['AB+', 'AB-'],
    'AB+': ['AB+']
};

/**
 * Check if a donor can donate to a recipient based on blood group
 * @param {string} donorGroup 
 * @param {string} recipientGroup 
 * @returns {boolean}
 */
function isBloodCompatible(donorGroup, recipientGroup) {
    if (!donorGroup || !recipientGroup) return false;
    const compatibleDonors = COMPATIBLE_DONORS_FOR_RECIPIENT[recipientGroup.toUpperCase()];
    if (!compatibleDonors) return false;
    return compatibleDonors.includes(donorGroup.toUpperCase());
}

/**
 * Get all donor blood groups compatible for a patient request
 * @param {string} recipientGroup 
 * @returns {string[]}
 */
function getCompatibleDonorGroups(recipientGroup) {
    return COMPATIBLE_DONORS_FOR_RECIPIENT[recipientGroup?.toUpperCase()] || [];
}

/**
 * Calculate match priority score between donor profile and blood request
 * @param {Object} donor - DonorProfile with location & bloodGroup
 * @param {Object} request - BloodRequest with location & bloodGroup
 * @returns {number} Higher score means better match
 */
function calculateMatchScore(donor, request) {
    let score = 0;

    // 1. Blood group compatibility
    if (donor.bloodGroup === request.bloodGroup) {
        score += 100; // Exact match
    } else if (isBloodCompatible(donor.bloodGroup, request.bloodGroup)) {
        score += 70; // Compatible match
    } else {
        return -1; // Incompatible
    }

    // 2. Location proximity (Andhra Pradesh hierarchy)
    if (donor.city && request.city && donor.city.toLowerCase() === request.city.toLowerCase()) {
        score += 50; // Same city
    } else if (donor.district && request.district && donor.district.toLowerCase() === request.district.toLowerCase()) {
        score += 30; // Same district
    } else if (donor.state && request.state && donor.state.toLowerCase() === request.state.toLowerCase()) {
        score += 10; // Same state
    }

    // 3. Availability boost
    if (donor.available) score += 20;
    if (donor.emergencyAvailable) score += 15;

    return score;
}

module.exports = {
    BLOOD_GROUPS,
    COMPATIBLE_DONORS_FOR_RECIPIENT,
    COMPATIBLE_RECIPIENTS_FOR_DONOR,
    isBloodCompatible,
    getCompatibleDonorGroups,
    calculateMatchScore
};
