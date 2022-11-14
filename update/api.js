const { get, requestError, log } = require('./common/util');

const collection = 'mkrs';
const magicEden = 'https://api-mainnet.magiceden.dev/v2';
const howrare = 'https://api.howrare.is/v0.1';

// get current MagicEden wallet holdings
exports.loadWallet = async function (wallet) {
    const nfts = [];
    const limit = 500;
    let loading = true;
    let offset = 0;
    do {
        try {
            const url = `${magicEden}/wallets/${wallet}/tokens?listStatus=both&offset=${offset}&limit=${limit}`;
            const { data } = await get(url);
            loading = (data && data.length == limit);
            offset += limit;
            nfts.push(...(data.filter(nft => nft.collection === collection)));
        }
        catch (e) {
            loading = await requestError('loadWallet', e);
        }
    }
    while (loading)
    return nfts;
}

// get MagicEden token metadata
exports.loadToken = async function (mint) {
    let loading = true;
    do {
        try {
            const url = `${magicEden}/tokens/${mint}`;
            const { data } = await get(url);
            return data;
        }
        catch (e) {
            loading = await requestError('loadToken', e);
        }
    }
    while (loading)
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
