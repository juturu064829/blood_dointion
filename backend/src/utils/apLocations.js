/* ==========================================================================
   PULSERED - Andhra Pradesh Location Dataset & Hierarchy Engine
   Contains all 26 districts of Andhra Pradesh, India with major cities/towns
   ========================================================================== */

const AP_DISTRICTS = [
    {
        district: 'Visakhapatnam',
        cities: [
            { city: 'Visakhapatnam City', pincode: '530001' },
            { city: 'Gajuwaka', pincode: '530026' },
            { city: 'Anakapalle', pincode: '531001' },
            { city: 'Bheemunipatnam', pincode: '531163' },
            { city: 'Pendurthi', pincode: '530051' }
        ]
    },
    {
        district: 'Krishna',
        cities: [
            { city: 'Vijayawada', pincode: '520001' },
            { city: 'Machilipatnam', pincode: '521001' },
            { city: 'Gudivada', pincode: '521301' },
            { city: 'Jaggayyapeta', pincode: '521175' },
            { city: 'Nuzvid', pincode: '521201' }
        ]
    },
    {
        district: 'Guntur',
        cities: [
            { city: 'Guntur City', pincode: '522002' },
            { city: 'Tenali', pincode: '522201' },
            { city: 'Mangalagiri', pincode: '522503' },
            { city: 'Tadikonda', pincode: '522236' }
        ]
    },
    {
        district: 'Tirupati',
        cities: [
            { city: 'Tirupati City', pincode: '517501' },
            { city: 'Srikalahasti', pincode: '517644' },
            { city: 'Gudur', pincode: '524101' },
            { city: 'Sulurpeta', pincode: '524121' },
            { city: 'Chandragiri', pincode: '517101' }
        ]
    },
    {
        district: 'Kurnool',
        cities: [
            { city: 'Kurnool City', pincode: '518001' },
            { city: 'Adoni', pincode: '518301' },
            { city: 'Yemmiganur', pincode: '518360' },
            { city: 'Kodumur', pincode: '518464' }
        ]
    },
    {
        district: 'Nandyal',
        cities: [
            { city: 'Nandyal Town', pincode: '518501' },
            { city: 'Allagadda', pincode: '518543' },
            { city: 'Dhone', pincode: '518222' },
            { city: 'Atmakur', pincode: '518422' },
            { city: 'Srisailam', pincode: '518101' }
        ]
    },
    {
        district: 'Nellore',
        cities: [
            { city: 'Nellore City', pincode: '524001' },
            { city: 'Kavali', pincode: '524201' },
            { city: 'Kandukur', pincode: '523105' },
            { city: 'Atmakur', pincode: '524322' }
        ]
    },
    {
        district: 'Kakinada',
        cities: [
            { city: 'Kakinada City', pincode: '533001' },
            { city: 'Samalkot', pincode: '533440' },
            { city: 'Pithapuram', pincode: '533450' },
            { city: 'Tuni', pincode: '533401' },
            { city: 'Peddapuram', pincode: '533437' }
        ]
    },
    {
        district: 'East Godavari',
        cities: [
            { city: 'Rajamahendravaram (Rajahmundry)', pincode: '533101' },
            { city: 'Nidadavole', pincode: '534301' },
            { city: 'Anaparthy', pincode: '533342' },
            { city: 'Kovvur', pincode: '534350' }
        ]
    },
    {
        district: 'Dr. B. R. Ambedkar Konaseema',
        cities: [
            { city: 'Amalapuram', pincode: '533201' },
            { city: 'Ramachandrapuram', pincode: '533255' },
            { city: 'Mandapeta', pincode: '533249' },
            { city: 'Razole', pincode: '533242' }
        ]
    },
    {
        district: 'Eluru',
        cities: [
            { city: 'Eluru City', pincode: '534001' },
            { city: 'Jangareddigudem', pincode: '534447' },
            { city: 'Nuzvid', pincode: '521201' },
            { city: 'Kaikaluru', pincode: '521333' }
        ]
    },
    {
        district: 'West Godavari',
        cities: [
            { city: 'Bhimavaram', pincode: '534201' },
            { city: 'Tadepalligudem', pincode: '534101' },
            { city: 'Palakollu', pincode: '534260' },
            { city: 'Narasapuram', pincode: '534275' },
            { city: 'Tanuku', pincode: '534211' }
        ]
    },
    {
        district: 'YSR Kadapa',
        cities: [
            { city: 'Kadapa City', pincode: '516001' },
            { city: 'Proddatur', pincode: '516360' },
            { city: 'Pulivendula', pincode: '516390' },
            { city: 'Badvel', pincode: '516227' },
            { city: 'Jammalamadugu', pincode: '516434' }
        ]
    },
    {
        district: 'Annamayya',
        cities: [
            { city: 'Rayachoti', pincode: '516269' },
            { city: 'Madanapalle', pincode: '517325' },
            { city: 'Rajampet', pincode: '516115' },
            { city: 'Pileru', pincode: '517113' }
        ]
    },
    {
        district: 'Anantapur',
        cities: [
            { city: 'Anantapur City', pincode: '515001' },
            { city: 'Guntakal', pincode: '515801' },
            { city: 'Tadpatri', pincode: '515411' },
            { city: 'Rayadurg', pincode: '515301' },
            { city: 'Kalyandurg', pincode: '515761' }
        ]
    },
    {
        district: 'Sri Sathya Sai',
        cities: [
            { city: 'Puttaparthi', pincode: '515134' },
            { city: 'Dharmavaram', pincode: '515671' },
            { city: 'Kadiri', pincode: '515591' },
            { city: 'Hindupur', pincode: '515201' },
            { city: 'Penukonda', pincode: '515110' }
        ]
    },
    {
        district: 'Chittoor',
        cities: [
            { city: 'Chittoor City', pincode: '517001' },
            { city: 'Nagari', pincode: '517590' },
            { city: 'Palamaner', pincode: '517408' },
            { city: 'Kuppam', pincode: '517425' },
            { city: 'Puthalapattu', pincode: '517124' }
        ]
    },
    {
        district: 'Prakasam',
        cities: [
            { city: 'Ongole', pincode: '523001' },
            { city: 'Markapur', pincode: '523316' },
            { city: 'Giddalur', pincode: '523357' },
            { city: 'Kanigiri', pincode: '523230' }
        ]
    },
    {
        district: 'Bapatla',
        cities: [
            { city: 'Bapatla Town', pincode: '522101' },
            { city: 'Chirala', pincode: '523155' },
            { city: 'Repalle', pincode: '522265' },
            { city: 'Vemuru', pincode: '522261' }
        ]
    },
    {
        district: 'Palnadu',
        cities: [
            { city: 'Narasaraopet', pincode: '522601' },
            { city: 'Gurazala', pincode: '522415' },
            { city: 'Sattenapalle', pincode: '522403' },
            { city: 'Vinukonda', pincode: '522647' },
            { city: 'Macherla', pincode: '522426' }
        ]
    },
    {
        district: 'Srikakulam',
        cities: [
            { city: 'Srikakulam City', pincode: '532001' },
            { city: 'Palasa', pincode: '532221' },
            { city: 'Amadalavalasa', pincode: '532185' },
            { city: 'Narasannapeta', pincode: '532421' },
            { city: 'Tekkali', pincode: '532201' }
        ]
    },
    {
        district: 'Parvathipuram Manyam',
        cities: [
            { city: 'Parvathipuram', pincode: '535501' },
            { city: 'Palakonda', pincode: '532440' },
            { city: 'Salur', pincode: '535591' },
            { city: 'Kurupam', pincode: '535524' }
        ]
    },
    {
        district: 'Vizianagaram',
        cities: [
            { city: 'Vizianagaram City', pincode: '535001' },
            { city: 'Bobbili', pincode: '535558' },
            { city: 'Gajapathinagaram', pincode: '535270' },
            { city: 'Cheepurupalli', pincode: '535128' }
        ]
    }
];

function getDistricts() {
    return AP_DISTRICTS.map(d => d.district);
}

function getCitiesByDistrict(districtName) {
    const dist = AP_DISTRICTS.find(d => d.district.toLowerCase() === districtName.toLowerCase());
    return dist ? dist.cities : [];
}

function getAllLocationsFlat() {
    const flat = [];
    AP_DISTRICTS.forEach(d => {
        d.cities.forEach(c => {
            flat.push({
                state: 'Andhra Pradesh',
                district: d.district,
                city: c.city,
                pincode: c.pincode
            });
        });
    });
    return flat;
}

module.exports = {
    AP_DISTRICTS,
    getDistricts,
    getCitiesByDistrict,
    getAllLocationsFlat
};
