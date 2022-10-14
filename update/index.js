const { loadNFTs } = require('./nft');
const { elapsed, log } = require('./common/util');
const fs = require('fs');

(async () => {
    const started = Date.now();

    const nfts = await loadNFTs();
    exportJSON(nfts);

    log('completed', elapsed(Date.now() - started));
})();

// export all to JSON for mkrs.info
function exportJSON(nfts) {
    log('saving', nfts.length, 'nfts');
    fs.writeFileSync('../mkrs.json', JSON.stringify(nfts, null, 2));
}