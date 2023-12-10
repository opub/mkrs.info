const { loadNFTs } = require('./nft');
const { elapsed, log } = require('./common/util');
const fs = require('fs');

const MKRS = '../mkrs.json';
const STATS = '../stats.json';

const TRAITS = [
    'DNA',
    'Split',
    'Clothing',
    'Eyes',
    'Hair',
    'Headwear',
    'Pass',
    'Mouth',
    'Teardrop',
    'Treats',
    'Background'
];

(async () => {
    const started = Date.now();

    const nfts = await loadNFTs();
    exportJSON(nfts, MKRS);

    const stats = countTraits(nfts);
    fs.writeFileSync(STATS, JSON.stringify(stats, null, 2));

    log('completed', elapsed(Date.now() - started));
})();

// export all to JSON for mkrs.info
function exportJSON (data, file) {
    const len = data.length;
    log('saving', len, 'items');
    fs.writeFileSync(file, '[\n');
    for (let i = 0; i < len; i++) {
        fs.appendFileSync(file, JSON.stringify(data[i], null, 2));
        if (i < len - 1) {
            fs.appendFileSync(file, ',\n');
        }
    }
    fs.appendFileSync(file, '\n]');
}

// count occurrence of each trait to determine rarity
function countTraits (nfts) {
    console.log('counting traits');
    const counts = {};
    TRAITS.forEach(trait => counts[trait] = {});
    nfts.forEach(nft => {
        for (const trait of TRAITS) {
            const type = nft[trait];
            counts[trait][type] = (counts[trait][type] || 0) + 1;
        }
    });
    return counts;
}
