const https = require('https');

function fetch(url, headers = {}) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'DebugScript/1.0', ...headers } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function run() {
    const q2 = "Sector 22, Chandigarh, India";
    console.log("--- Q2 Only ---");
    const r2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q2)}&limit=1&countrycodes=in`);
    try {
        const j2 = JSON.parse(r2);
        if (j2.length) console.log("Label 2:", j2[0].display_name);
        else console.log("No result for Q2");
    } catch (e) {
        console.log("Error parsing Q2");
        console.log(r2.substring(0, 100)); // Print start of response
    }
}

run();
