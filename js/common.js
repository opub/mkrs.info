/*
 * MKRS.info
 * Copyright (C) 2022 Ted O'Connor
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program.  If not, see <http://www.gnu.org/licenses/>.
 */
const traits = ['Owner', 'Siblings', 'Price', 'DNA', 'DNA Split', 'Clothing', 'Eyes', 'Hair', 'Headwear', 'Based Pass', 'Mouth', 'Teardrop', 'Treats', 'Twins', 'Background'];

function loading(active) {
    get('loader').style.display = active ? 'block' : 'none';
    get('container').style.display = 'block';
}

function get(id) {
    const elem = document.getElementById(id);
    if (!elem) {
        console.error('unable to find element with id', id);
    }
    return elem;
}

function showDetails(event) {
    let mint;
    if (typeof event === 'string') {
        mint = event;
    } else {
        let target = event.target;
        while (!target.dataset.id) {
            target = target.parentElement;
        }
        mint = target.dataset.id;
    }
    const nft = data.find(item => item.mint === mint);
    console.log('showing', nft);
    get('details-name').innerHTML = `${nft.name} (Rank ${nft.rank})`;
    get('details-image-link').href = nft.image;
    get('details-image').src = nft.image;
    get('details-traits').innerHTML = getTraits(nft);
    get('details').style.display = 'block';
}

function getTraits(nft) {
    let html = '';
    for (let trait of traits) {
        let value = nft[trait] ? nft[trait] : nft[trait.toLowerCase()];
        if (trait === 'Owner') {
            value = `<a href="https://magiceden.io/u/${value}" title="${value}" target="_blank">${mask(value)}${nft.ownerAlt ? ' (' + nft.ownerAlt + ')' : ''}</a>`;
        } else if (trait === 'Siblings') {
            if (value.length === 0) {
                value = 'None';
            } else {
                const siblings = value.map(x => data.find(item => item.mint === x));
                siblings.sort((a, b) => a.name.localeCompare(b.name));
                let links = '';
                for (let sib of siblings) {
                    links += `<a href="javascript:showDetails('${sib.mint}')">${sib.name.substring(5)}</a> `;
                }
                value = links;
            }
        } else if (trait === 'Price') {
            value = value ? `${value} SOL` : 'Not Listed';
            value = `<a href="https://magiceden.io/item-details/${nft.mint}?name=${encodeURI(nft.name)}" title="${value}" target="_blank">${value}</a></div><br><div>`;
        }
        value = value ? value : '';
        html += `<div class="trait"><span class="title">${trait}: </span>${value}</div>`;
    }
    return html;
}

function mask(address) {
    address = pretty(address)
    return address.length > 40 ? `${address.substring(0, 5)}...${address.substring(40)}` : '';
}

function pretty(value) {
    return value ? value : '';
}

function hideDetails() {
    get('details').style.display = 'none';
}

document.addEventListener('click', hideDetails, true);
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        hideDetails();
    }
});
