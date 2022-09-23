const { loadNFTs } = require('./nft');
const { elapsed } = require('./common/util');
const fs = require('fs');

(async () => {
    const started = Date.now();

    const { nfts } = await loadNFTs();
    exportJSON(nfts);

    console.log('completed', elapsed(Date.now() - started));
})();

// export all to JSON for mkrs.info
function exportJSON(nfts) {
    const info = [];
    nfts.forEach(nft => {
        info.push({
            mint: nft.mint,
            name: nft.name,
            image: nft.image,
            details: nft.details,
            rank: nft.rank,
            owner: nft.owner,
            ownerAlt: nft.ownerAlt,
            owns: nft.owns,
            sibling: nft.sibling.startsWith('my') ? nft.sibling.substring(3) : nft.sibling,
            siblings: nft.siblings,
            ...nft.attributes
        });
    });
    console.log('saving', info.length, 'info');
    fs.writeFileSync('../mkrs.json', JSON.stringify(info, null, 2));
}