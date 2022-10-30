const { get, requestError, progress, clear, log } = require('./common/util');
const { Connection, PublicKey } = require('@solana/web3.js');
const { programs } = require('@metaplex/js');
const { metadata: { Metadata } } = programs;

const collection = 'mkrs';
const magicEden = 'https://api-mainnet.magiceden.dev/v2';
const howrare = 'https://api.howrare.is/v0.1';
const clusterURLs = ['https://restless-white-spree.solana-mainnet.discover.quiknode.pro/75b80d7fb5be2115e1c4d82863de65556b701d7d/', 'https://ssc-dao.genesysgo.net/', 'https://api.mainnet-beta.solana.com/'];
const commitment = 'confirmed';
const connections = clusterURLs.map(url => new Connection(url, { commitment }));

const RPS = 180;
let lastRequest = 0;

// get both onchain and offchain metadata for each nft
exports.getMetadata = async function (mint) {
    let loading = true;
    let name, image, attributes;
    let endpoint = 0;
    do {
        try {
            const pda = await Metadata.getPDA(mint);
            const { data: onchain } = await Metadata.load(connect(endpoint), pda);
            if (onchain) {
                name = onchain.name;
                const { data: offchain } = await get(onchain.data.uri);
                if (offchain) {
                    if (!name) {
                        name = offchain.name;
                    }
                    image = offchain.image;
                    attributes = flattenAttributes(offchain.attributes);
                }
            }
            loading = false;
        }
        catch (e) {
            loading = await requestError('getMetadata', e);
            endpoint = endpoint < clusterURLs.length - 1 ? endpoint + 1 : 0;
        }
    }
    while (loading)
    return attributes ? {
        mint,
        name,
        image,
        last: Date.now(),
        ...attributes
    } : {};
}

function flattenAttributes(attributes) {
    if (attributes && attributes.length) {
        const attrs = [];
        for (const trait of attributes) {
            attrs[trait.trait_type] = trait.value;
        }
        return attrs;
    }
}

// get current MagicEden listing prices for all items in collection
exports.getPrices = async function () {
    const prices = [];
    const limit = 20;
    let loading = true;
    let offset = 0;
    do {
        try {
            const url = `${magicEden}/collections/${collection}/listings?offset=${offset}&limit=${limit}`;
            const { data } = await get(url);
            loading = (data && data.length == limit);
            offset += limit;
            prices.push(...data);
        }
        catch (e) {
            loading = await requestError('getPrices', e);
        }
    }
    while (loading)

    return new Map(prices.map(item => [item.tokenMint, { price: item.price, seller: item.seller }]));
}

// get HowRare rarity ranks for all items in collection
exports.getRanks = async function () {
    const ranks = [];
    try {
        const url = `${howrare}/collections/${collection}`;
        const { data } = await get(url);
        if (data && data.result && data.result.data && data.result.data.items) {
            ranks.push(...data.result.data.items);
        }
    }
    catch (e) {
        log('getRanks', e);
    }
    return new Map(ranks.map(item => [item.mint, item.rank]));
}

// get collection owners - this has a fast method that may be 24hrs out of date and a slower more accurate option
exports.getOwners = async function (fast, mints) {
    try {
        if (fast) {
            const url = `${howrare}/collections/${collection}/owners`;
            const { data } = await get(url);
            if (data && data.result && data.result.data && data.result.data.owners) {
                return data.result.data.owners;
            }
        } else {
            const owners = [];
            let endpoint = 0;
            for (let i = 0; i < mints.length; i++) {
                const mint = mints[i];
                let loading = false;
                do {
                    try {
                        const accounts = await connect(endpoint).getTokenLargestAccounts(new PublicKey(mint));
                        const info = await connect(endpoint).getParsedAccountInfo(accounts.value[0].address);
                        owners[mint] = info.value.data.parsed.info.owner;
                        endpoint = 0;
                    }
                    catch (e) {
                        loading = await requestError('getOwners', e);
                        endpoint = endpoint < clusterURLs.length - 1 ? endpoint + 1 : 0;
                    }
                }
                while (loading)
                progress(i / mints.length, 'getOwners');
            }
            clear();
            return owners;
        }
    }
    catch (e) {
        clear();
        log('getOwners', e);
    }
    return {};
}

// blocking call to force request throttling
function connect(index) {
    const stop = lastRequest + (1 / RPS * 1000);
    while (Date.now() < stop) { }
    lastRequest = Date.now();
    return connections[index];
}
