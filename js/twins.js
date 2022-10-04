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
 * ANY WARRANTY; without even the implied warranty of  MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program.  If not, see <http://www.gnu.org/licenses/>.
 */
let data = [];
let lookup = new Map();

(function () {
    fetch('mkrs.json')
        .then((response) => response.json())
        .then((json) => {
            data = json.filter(x => x.siblings && x.siblings.length > 0);
            data.sort((a, b) => a.siblings.length === b.siblings.length ? a.rank - b.rank : b.siblings.length - a.siblings.length);
            lookup = new Map(data.map(x => [x.mint, x]));
            updateDisplay();
        });
})();

function updateDisplay() {
    loading(true);
    setTimeout(populateDisplay, 10);
}

function populateDisplay() {
    const container = get('container');
    for (const nft of data) {
        if (nft.image && lookup.has(nft.mint)) {
            const line = document.createElement('div');
            const row = document.createElement('span');
            row.className = 'twins';
            line.appendChild(row);

            const title = document.createElement('div');
            title.className = 'sibling';
            title.innerHTML = `${nft.Twins} ${nft.DNA} wearing ${nft.Clothing}`;
            row.appendChild(title);

            const siblings = nft.siblings.map(x => lookup.get(x));
            siblings.push(nft);
            siblings.sort((a, b) => a.name.localeCompare(b.name));
            const owner = nft.owner;
            let complete = true;
            for (const twin of siblings) {
                complete = complete && owner === twin.owner;
                const holder = document.createElement('span');
                holder.className = 'twin';
                holder.innerHTML = `<a href="${twin.image}" title="${twin.name}" target="_blank"><img src="${twin.image}" loading="lazy" alt="${twin.name}" class="picture"></a><br>${twin.name}`;
                row.appendChild(holder);
                lookup.delete(twin.mint);
            }
            if(complete) {
                row.className = 'twins complete';
            }
            container.appendChild(line);
        }
    }
    loading(false);
}

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
