const { get, requestError, progress, clear } = require('./common/util');
const { Connection, PublicKey } = require('@solana/web3.js');
const { programs } = require('@metaplex/js');
const { metadata: { Metadata } } = programs;

const collection = 'mkrs';
const magicEden = 'https://api-mainnet.magiceden.dev/v2';
const howrare = 'https://api.howrare.is/v0.1';
const clusterURL = 'https://ssc-dao.genesysgo.net/';
const commitment = 'confirmed';
const connection = new Connection(clusterURL, { commitment });

const RPS = 200;
let lastRequest = 0;

// get both onchain and offchain metadata for each nft
exports.getMetadata = async function (mint) {
    let loading = true;
    let name, image, attributes;
    do {
        try {
            const pda = await Metadata.getPDA(mint);
            const { data: onchain } = await Metadata.load(connect(), pda);
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
        }
    }
    while (loading)
    return attributes ? {
        mint,
        name,
        image,
        metaUpdated: Date.now(),
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
        console.log('getRanks', e);
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
            for (let i = 0; i < mints.length; i++) {
                const mint = mints[i];
                let loading = false;
                do {
                    try {
                        const accounts = await connect().getTokenLargestAccounts(new PublicKey(mint));
                        const info = await connect().getParsedAccountInfo(accounts.value[0].address);
                        owners[mint] = info.value.data.parsed.info.owner;
                    }
                    catch (e) {
                        loading = await requestError('getOwners', e);
                    }
                }
                while (loading)
                progress(i / mints.length);
            }
            clear();
            return owners;
        }
    }
    catch (e) {
        clear();
        console.log('getOwners', e);
    }
    return {};
}

// blocking call to force request throttling
function connect() {
    const stop = lastRequest + (1 / RPS * 1000);
    while (Date.now() < stop) { }
    lastRequest = Date.now();
    return connection;
}