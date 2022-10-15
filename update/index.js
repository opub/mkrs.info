const { loadNFTs } = require('./nft');
const { elapsed, log } = require('./common/util');
const fs = require('fs');
const file = '../mkrs.json';

(async () => {
    const started = Date.now();

    const nfts = await loadNFTs();
    exportJSON(nfts);

    log('completed', elapsed(Date.now() - started));
})();

// export all to JSON for mkrs.info
function exportJSON(nfts) {
    const len = nfts.length;
    log('saving', len, 'nfts');
    fs.writeFileSync(file, '[\n');
    for (let i = 0; i < len; i++) {
        fs.appendFileSync(file, JSON.stringify(nfts[i], null, 2));
        if (i < len - 1) {
            fs.appendFileSync(file, ',\n');
        }
    }
    fs.appendFileSync(file, '\n]');
}