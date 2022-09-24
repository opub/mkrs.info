const fs = require('fs');
const { getMetadata, getRanks, getPrices, getOwners } = require('./api');
const { increment, progress, clear } = require('./common/util');
const hashList = require('./data/hash-list.json');
const listSize = hashList.length;

const treasury = '6Kxyza4XQ63aiEnpzJy9h7eqzdPqsZZinRFk1NPiExek';
const exchange = 'FoeRYSmfasEUfdf1FfYg5f4PsQVtsCeKGhrNkCZu4sRu';
const magiceden = '1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix';
const cacheFile = '../mkrs.json';

// load all nfts and metadata using locally cached values if available
exports.loadNFTs = async function () {
    console.log('loading nfts');

    const loaded = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf-8')) : [];
    const nfts = loaded.filter(nft => nft.image);
    const exists = new Map(nfts.map(object => [object.mint, object]));

    // get metadata for each nft - this is slow so cache results
    if (nfts.length != listSize) {
        for (let i = 0; i < listSize; i++) {
            if (!exists.has(hashList[i])) {
                const nft = await getMetadata(hashList[i]);
                nfts.push(nft);
            }
            progress(i / listSize);
        }
        clear();
    }
    await loadRanks(nfts);
    await loadPrices(nfts);
    await loadOwners(nfts);
    findSiblings(nfts);

    return nfts;
}

// get official ranks from HowRare
async function loadRanks(nfts) {
    console.log('loading ranks');
    const ranks = await getRanks();
    nfts.forEach(nft => { nft.rank = ranks.get(nft.mint) });
    nfts.sort((a, b) => a.rank - b.rank);
}

// get the currently listed price on ME if available
// listed items will have owner=magiceden so set real owner now
async function loadPrices(nfts) {
    console.log('loading prices');
    const prices = await getPrices();
    nfts.forEach(nft => {
        if (prices.has(nft.mint)) {
            nft.price = prices.get(nft.mint).price;
            nft.owner = prices.get(nft.mint).seller;
        } else {
            nft.price = '';
        }
    });
}

// get current owner and number owned
async function loadOwners(nfts) {
    console.log('loading owners');
    const owners = await getOwners(false, nfts.map(nft => nft.mint));
    const owned = new Map();
    nfts.forEach(nft => {
        let owner = owners[nft.mint] || nft.owner;
        if (owner) {
            let ownerAlt;
            if (owner === exchange) {
                ownerAlt = 'exchange';
            }
            else if (owner === treasury) {
                ownerAlt = 'treasury';
            }
            else if (owner === magiceden) {
                // use seller as owner instead of ME
                owner = nft.owner;
                ownerAlt = 'listed';
            }
            nft.owner = owner;
            nft.ownerAlt = ownerAlt;
        }
        if (owner) {
            increment(owned, owner);
        }
    });
    nfts.forEach(nft => { nft.owns = owned.has(nft.owner) ? owned.get(nft.owner) : nft.owns });
}

// determine nfts that have identical attributes
function findSiblings(nfts) {
    console.log('finding siblings');
    const siblings = new Map();
    nfts.forEach(nft => {
        const key = signature(nft);
        if (!siblings.has(key)) {
            siblings.set(key, []);
        }
        const found = siblings.get(key);
        found.push(nft.mint);
        siblings.set(key, found);
    });

    nfts.forEach(nft => {
        const key = signature(nft);
        nft.siblings = siblings.get(key).filter(sib => sib != nft.mint);
        switch (siblings.get(key).length) {
            case 5:
                nft.sibling = `quintuplet`;
                break;
            case 4:
                nft.sibling = `quadruplet`;
                break;
            case 3:
                nft.sibling = `triplet`;
                break;
            case 2:
                nft.sibling = `twin`;
                break;
            default:
                nft.sibling = '';
        }
    });
}

// generates trait signature to determine siblings
function signature(nft) {
    const filtered = {
        ...nft,
        mint: undefined,
        name: undefined,
        image: undefined,
        rank: undefined,
        owner: undefined,
        ownerAlt: undefined,
        owns: undefined,
        price: undefined,
        sibling: undefined,
        siblings: undefined
    };
    return JSON.stringify(filtered);
}
