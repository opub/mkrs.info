const fs = require('fs');
const { loadWallet, loadToken, getRanks, getPrices } = require('./api');
const { increment, progress, clear, log, elapsed } = require('./common/util');
const hashList = require('./data/hash-list.json');

const common = ['mint', 'name', 'image', 'rank', 'owner', 'owns', 'ownerAlt', 'siblings', 'last', 'price', 'Traits'];
const treasury = 'J5u2FCqJWmSsC9pFcpvq8X9eG27W8tAbm96bPYVwNth2';
const magiceden = '1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix';
const cacheFile = '../mkrs.json';

// load all nfts and metadata using locally cached values if available
exports.loadNFTs = async function () {
  let started = Date.now();

  const cached = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf-8')) : [];
  const lookup = new Map(cached.map(nft => [nft.mint, nft]));
  hashList.forEach(hash => {
    if (!lookup.has(hash)) {
      lookup.set(hash, {});
    }
  });

  const nfts = [];
  const wallets = [...new Set(cached.filter(nft => nft.owns > 1).map(nft => nft.owner))];
  for (let i = 0; i < wallets.length; i++) {
    const loaded = await loadWallet(wallets[i]);
    for (let j = 0; j < loaded.length; j++) {
      const nft = normalize(loaded[j]);
      nfts.push(nft);
      lookup.delete(nft.mint);
    }
    progress(i / wallets.length, 'wallets');
  }
  clear();
  console.log('wallets', wallets.length, ' mkrs', nfts.length, elapsed(Date.now() - started));

  started = Date.now();
  const remaining = Array.from(lookup.keys());
  for (let i = 0; i < remaining.length; i++) {
    const loaded = await loadToken(remaining[i]);
    if (loaded) {
      const nft = normalize(loaded);
      nfts.push(nft);
      lookup.delete(nft.mint);
      progress(i / remaining.length, 'remaining');
    }
  }
  clear();
  console.log('tokens', remaining.length, 'mkrs', nfts.length, elapsed(Date.now() - started));

  countTraits(nfts);
  await loadRanks(nfts);
  await loadPrices(nfts);
  await countOwners(nfts);

  return nfts;
}

function normalize (nft) {
  const attributes = flatten(nft.attributes);
  return {
    mint: nft.mintAddress,
    name: nft.name,
    image: nft.image,
    owner: nft.owner,
    price: nft.price,
    updateAuthority: nft.updateAuthority,
    collection: nft.collection,
    last: Date.now(),
    ...attributes
  };
}

function flatten (attributes) {
  if (attributes && attributes.length) {
    const attrs = [];
    for (const trait of attributes) {
      attrs[trait.trait_type] = trait.value;
    }
    return attrs;
  }
}

function countTraits (nfts) {
  // collect all attribute trait types
  const types = [];
  nfts.forEach(nft => {
    for (const trait in nft) {
      if (!common.includes(trait) && !types.includes(trait)) {
        types.push(trait);
      }
    }
  });
  types.sort();
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
async function loadRanks (nfts) {
  log('loading ranks');
  const ranks = await getRanks();
  nfts.forEach(nft => { nft.rank = ranks.get(nft.mint) });
  nfts.sort((a, b) => a.rank - b.rank);
}

// get the currently listed price on ME if available
// listed items will have owner=magiceden so set real owner now
async function loadPrices (nfts) {
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

// get number owned
function countOwners (nfts) {
  log('counting owners');
  const owned = new Map();
  nfts.forEach(nft => {
    const owner = nft.owner;
    if (owner) {
      let ownerAlt;
      if (owner === treasury) {
        ownerAlt = 'treasury';
      }
      else if (owner === magiceden || nft.price.length > 0) {
        ownerAlt = 'listed';
      }
      nft.ownerAlt = ownerAlt;
    }
    if (owner) {
      increment(owned, owner);
    }
  });
  nfts.forEach(nft => { nft.owns = owned.has(nft.owner) ? owned.get(nft.owner) : nft.owns });
}

