const { get, sleep, progress, clear } = require('./common/util');
const { Connection, PublicKey } = require('@solana/web3.js');
const { programs } = require('@metaplex/js');
const { metadata: { Metadata } } = programs;

const collection = 'mkrs';
const howrare = 'https://api.howrare.is/v0.1';
const clusterURL = 'https://ssc-dao.genesysgo.net/';
const commitment = 'confirmed';
const connection = new Connection(clusterURL, { commitment });

const RPS = 200;
let lastRequest = 0;

// get both onchain and offchain metadata for each nft
exports.getMetadata = async function (mint) {
    const nft = { mint };
    try {
        const pda = await Metadata.getPDA(mint);
        const onchain = (await Metadata.load(connect(), pda)).data;
        if (onchain) {
            nft.name = onchain.name;
            const offchain = (await get(onchain.data.uri)).data;
            if (offchain) {
                if (!nft.name) {
                    nft.name = offchain.name;
                }
                nft.image = offchain.image;
                nft.attributes = offchain.attributes;
            }
        }
        nft.details = `https://magiceden.io/item-details/${mint}?name=${encodeURI(nft.name)}`;
    }
    catch (e) {
        console.error('getMetadata', e);
    }
    return nft;
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
        console.error('getRanks', e);
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
                        loading = await requestError(e);
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
        console.error('getOwners', e);
    }
    return {};
}

// handle request error and wait to retry if 429 status
async function requestError(err) {
    const resp = err.response;
    if (resp && resp.status === 429 && resp.config) {
        // hitting the QPM limit so snooze a bit
        await sleep(5000);
        console.log('WARN', resp.statusText, resp.config.url);
        return true;
    } else {
        console.error('ERROR', JSON.stringify(err, null, 2));
        return false;
    }
}

// blocking call to force request throttling
function connect() {
    const stop = lastRequest + (1 / RPS * 1000);
    while (Date.now() < stop) { }
    lastRequest = Date.now();
    return connection;
}