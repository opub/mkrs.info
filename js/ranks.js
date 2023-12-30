/*
 * MKRS.info
 * Copyright (C) 2024 Ted O'Connor
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
const maxRows = 50;
const columns = ['Rank', 'Owner', 'Owns', 'XP', 'Average'];
const treasury = 'J5u2FCqJWmSsC9pFcpvq8X9eG27W8tAbm96bPYVwNth2';

let data = [];
(function () { pageSetup() })();

function pageSetup () {
    populateHeader();
    fetch('mkrs.json').then((resp) => resp.json()).then((json) => {
        const owners = new Map();
        for (const nft of json) {
            if (nft.owns > 0 && nft.owner !== treasury) {
                if (owners.has(nft.owner)) {
                    nft.XP += owners.get(nft.owner).XP;
                }
                owners.set(nft.owner, {
                    Owner: nft.owner,
                    Owns: nft.owns,
                    XP: nft.XP,
                    Average: Math.round(nft.XP / nft.owns * 100) / 100
                });
            }
        }
        const ranks = Array.from(owners.values()).sort((a, b) => b.XP - a.XP);
        ranks.forEach((item, index) => {
            item.Rank = index + 1;
        });
        data = ranks.slice(0, maxRows);
        updateTable();
    });
}

function populateTable () {
    // delete all table rows
    if (get('rows')) {
        get('rows').remove();
    }

    // render results with cell highlighting
    const rows = document.createElement('tbody');
    rows.id = 'rows';
    for (let item of data) {
        const row = rows.insertRow(-1);
        row.dataset.id = item.Owner;
        row.addEventListener('click', showOwner);
        for (let i = 0; i < columns.length; i++) {
            const cell = row.insertCell(i);
            cell.innerHTML = pretty(item[columns[i]]);
        }
    }

    // add rows to table DOM
    const table = get('results');
    table.appendChild(rows);
    loading(false);
}

function showOwner (event) {
    let owner;
    if (typeof event === 'string') {
        owner = event;
    } else {
        let target = event.target;
        while (!target.dataset.id) {
            target = target.parentElement;
        }
        owner = target.dataset.id;
    }
    window.open(`https://magiceden.io/u/${owner}`, '_blank');
}