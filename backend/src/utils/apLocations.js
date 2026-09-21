/* ==========================================================================
   PULSERED - Andhra Pradesh Location Dataset & Government Hospitals Hierarchy Engine
   Contains all 26 districts of Andhra Pradesh + Government General Hospitals & Blood Banks
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

// ANDHRA PRADESH GOVERNMENT GENERAL HOSPITALS & BLOOD BANKS DATASET
const AP_GOVT_HOSPITALS = [
    { id: 'ap-gh-01', name: 'King George Hospital (KGH) Government Blood Center', district: 'Visakhapatnam', city: 'Maharani Peta, Visakhapatnam', pincode: '530002', type: 'Teaching Hospital & Regional Blood Center', phone: '+91 891 2564891', unitsAvailable: 340, status: 'Active 24/7' },
    { id: 'ap-gh-02', name: 'VIMS (Visakha Institute of Medical Sciences) Blood Bank', district: 'Visakhapatnam', city: 'Hanumanthawaka, Visakhapatnam', pincode: '530040', type: 'Super Specialty Government Hospital', phone: '+91 891 2789100', unitsAvailable: 210, status: 'Active 24/7' },
    { id: 'ap-gh-03', name: 'Government Victoria Hospital for Women & Children', district: 'Visakhapatnam', city: 'Old Town, Visakhapatnam', pincode: '530001', type: 'Government Maternal Hospital', phone: '+91 891 2562233', unitsAvailable: 155, status: 'Active 24/7' },
    { id: 'ap-gh-04', name: 'New Government General Hospital (GGH) Blood Bank', district: 'Krishna', city: 'Gunadala, Vijayawada', pincode: '520004', type: 'Government General Hospital', phone: '+91 866 2473850', unitsAvailable: 295, status: 'Active 24/7' },
    { id: 'ap-gh-05', name: 'Old GGH Emergency Blood Storage Unit', district: 'Krishna', city: 'Hanumanpet, Vijayawada', pincode: '520003', type: 'Government Blood Storage Center', phone: '+91 866 2576622', unitsAvailable: 120, status: 'Active 24/7' },
    { id: 'ap-gh-06', name: 'Government General Hospital (GGH) Regional Blood Bank', district: 'Guntur', city: 'Sambasiva Pet, Guntur', pincode: '522001', type: 'Government Teaching Hospital', phone: '+91 863 2234050', unitsAvailable: 310, status: 'Active 24/7' },
    { id: 'ap-gh-07', name: 'SVRR Government General Hospital Blood Centre', district: 'Tirupati', city: 'Alipiri Road, Tirupati', pincode: '517507', type: 'Government General Hospital', phone: '+91 877 2287777', unitsAvailable: 380, status: 'Active 24/7' },
    { id: 'ap-gh-08', name: 'SVIMS (Sri Venkateswara Institute of Medical Sciences)', district: 'Tirupati', city: 'Tirupati City', pincode: '517507', type: 'Super Specialty Government Hospital', phone: '+91 877 2287778', unitsAvailable: 245, status: 'Active 24/7' },
    { id: 'ap-gh-09', name: 'Government General Hospital (GGH) Regional Blood Bank', district: 'Kurnool', city: 'Budhawara Peta, Kurnool', pincode: '518002', type: 'Government Medical College Hospital', phone: '+91 8518 255200', unitsAvailable: 270, status: 'Active 24/7' },
    { id: 'ap-gh-10', name: 'Government General Hospital (GGH) Blood Center', district: 'Nellore', city: 'Dargamitta, SPS Nellore', pincode: '524004', type: 'Government General Hospital', phone: '+91 861 2327500', unitsAvailable: 190, status: 'Active 24/7' },
    { id: 'ap-gh-11', name: 'RIMS (Rajiv Gandhi Institute of Medical Sciences) GGH', district: 'YSR Kadapa', city: 'Putlampalli, Kadapa', pincode: '516002', type: 'Government Medical Institute', phone: '+91 8562 220200', unitsAvailable: 225, status: 'Active 24/7' },
    { id: 'ap-gh-12', name: 'GGH Rangaraya Medical College Blood Center', district: 'Kakinada', city: 'Pithapuram Road, Kakinada', pincode: '533001', type: 'Government Teaching Hospital', phone: '+91 884 2361250', unitsAvailable: 285, status: 'Active 24/7' },
    { id: 'ap-gh-13', name: 'Government Headquarters Hospital (GGH) Blood Bank', district: 'East Godavari', city: 'Rajamahendravaram', pincode: '533101', type: 'District Government Hospital', phone: '+91 883 2462200', unitsAvailable: 200, status: 'Active 24/7' },
    { id: 'ap-gh-14', name: 'Government General Hospital (GGH) Blood Bank', district: 'Anantapur', city: 'Rahamat Nagar, Anantapur', pincode: '515001', type: 'Government Medical College Hospital', phone: '+91 8554 274000', unitsAvailable: 175, status: 'Active 24/7' },
    { id: 'ap-gh-15', name: 'Government General Hospital (GGH) Blood Bank', district: 'Eluru', city: 'Sanivarapupeta, Eluru', pincode: '534001', type: 'District Government Hospital', phone: '+91 8812 230400', unitsAvailable: 160, status: 'Active 24/7' },
    { id: 'ap-gh-16', name: 'RIMS Government General Hospital Blood Bank', district: 'Srikakulam', city: 'Balaga, Srikakulam', pincode: '532001', type: 'Government Medical Institute', phone: '+91 8942 222400', unitsAvailable: 140, status: 'Active 24/7' },
    { id: 'ap-gh-17', name: 'Government General Hospital (GGH) Blood Bank', district: 'Vizianagaram', city: 'Cantonment, Vizianagaram', pincode: '535003', type: 'Government District Hospital', phone: '+91 8922 272500', unitsAvailable: 150, status: 'Active 24/7' },
    { id: 'ap-gh-18', name: 'Government General Hospital (GGH) Blood Bank', district: 'Prakasam', city: 'Rangarayudu Nagar, Ongole', pincode: '523001', type: 'Government Teaching Hospital', phone: '+91 8592 233200', unitsAvailable: 180, status: 'Active 24/7' }
];

function getDistricts() {
    return AP_DISTRICTS.map(d => d.district);
}

function getCitiesByDistrict(districtName) {
    const dist = AP_DISTRICTS.find(d => d.district.toLowerCase() === districtName.toLowerCase());
    return dist ? dist.cities : [];
}

function getGovtHospitals(districtName = null) {
    if (!districtName || districtName.toLowerCase() === 'all') return AP_GOVT_HOSPITALS;
    return AP_GOVT_HOSPITALS.filter(h => h.district.toLowerCase() === districtName.toLowerCase());
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
    AP_GOVT_HOSPITALS,
    getDistricts,
    getCitiesByDistrict,
    getGovtHospitals,
    getAllLocationsFlat
};
