const fs = require('fs');
const { getMetadata, getRanks, getPrices, getOwners } = require('./api');
const { increment, progress, clear, log } = require('./common/util');
const hashList = require('./data/hash-list.json');

// this should allow full nft metadata updates daily
const batchSize = hashList.length / 24;
const fastOwners = false;

const common = ['mint', 'name', 'image', 'details', 'rank', 'owner', 'owns', 'ownerAlt', 'sibling', 'siblings', 'last', 'price', 'Traits'];
const twinTraits = ['Background', 'Clothing', 'DNA', 'DNA Split', 'Eyes', 'Hair', 'Mouth', 'Teardrop', 'Twins'];
const treasury = '6Kxyza4XQ63aiEnpzJy9h7eqzdPqsZZinRFk1NPiExek';
const exchange = 'FoeRYSmfasEUfdf1FfYg5f4PsQVtsCeKGhrNkCZu4sRu';
const magiceden = '1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix';
const cacheFile = '../mkrs.json';

// load all nfts and metadata using locally cached values if available
exports.loadNFTs = async function () {
    const lookup = await loadMetadata();
    const nfts = Array.from(lookup.values());

    countTraits(nfts);
    await loadRanks(nfts);
    await loadPrices(nfts);
    await loadOwners(nfts, lookup);
    findSiblings(nfts);

    return nfts;
}

async function loadMetadata() {
    log('loading metadata');

    // determine which nfts to fetch metadata for
    // this is really slow so avoid updating them all every time
    const loaded = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf-8')) : [];
    const nfts = new Map(loaded.map(nft => [nft.mint, nft]));
    let fetch = hashList.filter(hash => {
        const filtered = loaded.filter(nft => nft.mint === hash);
        return filtered.length === 0 || !filtered[0].image;
    });

    if (fetch.length < batchSize) {
        // none missing so just update a batch of them
        loaded.sort((a, b) => {
            const x = a.last ? a.last : 0;
            const y = b.last ? b.last : 0;
            return x - y;
        });
        fetch = fetch.concat(loaded.map(nft => nft.mint).slice(0, batchSize - fetch.length));
    }

    for (let i = 0; i < fetch.length; i++) {
        const nft = await getMetadata(fetch[i]);
        if (nft.image) {
            // use image as proxy for clean fetch and don't override existing when error
            nfts.set(fetch[i], nft);
        }
        progress(i / fetch.length, 'loadMetadata');
    }
    clear();
    return nfts;
}

function countTraits(nfts) {
    // collect all attribute trait types
    const types = [];
    nfts.forEach(nft => {
        for (const trait in nft) {
            if (!common.includes(trait) && !types.includes(trait)) {
                types.push(trait);
            }
        }
    });
    // normalize traits with count
    nfts.forEach(nft => {
        nft.Traits = 0;
        types.forEach(type => {
            let added = false;
            for (const trait in nft) {
                if (type === trait) {
                    if (nft[trait] != 'None') {
                        nft.Traits++;
                    }
                    added = true;
                }
            }
            if (!added) {
                nft[type] = 'None';
            }
        });
    });
}

// get official ranks from HowRare
async function loadRanks(nfts) {
    log('loading ranks');
    const ranks = await getRanks();
    nfts.forEach(nft => { nft.rank = ranks.get(nft.mint) });
    nfts.sort((a, b) => a.rank - b.rank);
}

// get the currently listed price on ME if available
// listed items will have owner=magiceden so set real owner now
async function loadPrices(nfts) {
    log('loading prices');
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
async function loadOwners(nfts, lookup) {
    log('loading owners');
    const owners = await getOwners(fastOwners, nfts.map(nft => nft.mint));
    const owned = new Map();
    nfts.forEach(nft => {
        let owner = owners[nft.mint] || nft.owner || lookup.get(nft.mint).owner;
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
    log('finding siblings');
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
    });
}

// generates trait signature to determine siblings
function signature(nft) {
    const filtered = {};
    twinTraits.forEach(t => filtered[t] = nft[t]);
    return JSON.stringify(filtered);
}
