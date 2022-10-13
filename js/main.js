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
const maxRows = 500;
const columns = ['Rank', 'Name', 'Twins', 'Price', 'Owner', 'Owns', 'DNA', 'DNA Split', 'Clothing', 'Eyes', 'Hair', 'Level', 'Mouth', 'Teardrop', 'Treats', 'Background'];

let siblings = false, listed = false, filter = '';

let data = [];
(function () { pageSetup() })();

function pageSetup() {
    // set filter values from hash or local storage
    const hash = window.location.hash;
    const state = hash.length > 1 ? hashToState(hash) : JSON.parse(localStorage.getItem('state'));
    setState(state);

    populateHeader();
    fetch('mkrs.json').then((resp) => resp.json()).then((json) => {
        data = json;
        const first = new Date(data.reduce((min, nft) => min < nft.metaUpdated ? min : nft.metaUpdated)).toLocaleString();
        const last = new Date(data.reduce((max, nft) => max > nft.metaUpdated ? max : nft.metaUpdated)).toLocaleString();
        get('metadata').innerHTML = `Metadata last updated between ${first} and ${last}.`;
        updateTable();
    });
}

function updateTable() {
    loading(true);
    setTimeout(populateTable, 10);
}

function populateTable() {
    // delete all table rows
    if (get('rows')) {
        get('rows').remove();
    }

    // get and persist state values
    siblings = get('siblings').checked;
    listed = get('listed').checked;
    filter = get('search').value;
    const state = { siblings, listed, filter };
    localStorage.setItem('state', JSON.stringify(state));
    window.location.hash = stateToHash(state);
    amplitude.getInstance().logEvent(`table populate - siblings:${siblings}, listed:${listed}, filter:${filter}`);

    // filter matching results
    let filtered = data.filter(m => {
        if (siblings && (!m.Twins || m.Twins.length === 0 || m.Twins === 'None') || listed && !m.price) {
            return false;
        } else if (filter.length > 0) {
            const search = filter.toUpperCase().split(' ');
            for (const term of search) {
                for (const a in m) {
                    if (m[a]) {
                        const text = `${m[a]}`.toUpperCase();
                        if (term.length > 0 && text.indexOf(term) > -1) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        return true;
    });

    // truncate results for page performance
    let count = filtered.length;
    let truncated = false;
    if (filtered.length > maxRows) {
        filtered = filtered.slice(0, maxRows);
        truncated = true;
    }

    // render results with cell highlighting
    const rows = document.createElement('tbody');
    rows.id = 'rows';
    for (let item of filtered) {
        const row = rows.insertRow(-1);
        row.dataset.id = item.mint;
        row.addEventListener('click', showDetails);
        for (let i = 0; i < columns.length; i++) {
            const cell = row.insertCell(i);
            if (columns[i] === 'Owner') {
                cell.innerHTML = mask(item.owner);
            } else {
                cell.innerHTML = pretty(item.hasOwnProperty(columns[i]) ? item[columns[i]] : item[columns[i].toLowerCase()]);
            }
            if (filter.length > 0) {
                const search = filter.toUpperCase().split(' ');
                for (const term of search) {
                    if (term.length > 0 && cell.textContent.toUpperCase().indexOf(term) > -1) {
                        cell.style.backgroundColor = '#f8eb67';
                    }
                }
            }
        }
    }

    // add table footer message
    if (truncated || filtered.length === 0) {
        const row = rows.insertRow(-1);
        const cell = row.insertCell(0);
        cell.colSpan = columns.length;
        cell.innerHTML = truncated ? `Showing ${filtered.length} of ${count} results. Change filter or sort to display additional results.` : 'No matching results found.';
    }

    // add rows to table DOM
    const table = get('results');
    table.appendChild(rows);
    loading(false);
}

function populateHeader() {
    const header = get('header');
    const row = header.insertRow(-1);
    for (let col of columns) {
        const th = document.createElement('th');
        th.addEventListener('click', function (event) {
            toggleArrow(event);
        });
        const div = document.createElement('div');
        div.id = col;
        div.innerHTML = col;
        const caret = document.createElement('i');
        caret.className = 'caret fa fa-sort';
        div.appendChild(caret);
        th.appendChild(div);
        row.appendChild(th);
    }
}

function toggleArrow(event) {
    const element = event.target;
    let caret, field, reverse;
    if (element.tagName === 'I') {
        caret = element;
        field = element.parentElement.id;
    } else {
        caret = element.getElementsByClassName('caret')[0];
        field = element.id;
    }

    const sortUp = 'fa fa-caret-up';
    const sortDown = 'fa fa-caret-down';
    const showing = caret.className;
    clearArrow();
    if (showing.includes(sortUp)) {
        caret.className = `caret ${sortDown}`;
        reverse = false;
    } else {
        caret.className = `caret ${sortUp}`;
        reverse = true;
    }

    amplitude.getInstance().logEvent(`table sort - field:${field}, reverse:${reverse}`);
    data.sort(sortBy(field, reverse));
    updateTable();
}

function clearArrow() {
    let carets = document.getElementsByClassName('caret');
    for (let caret of carets) {
        caret.className = 'caret fa fa-sort';
    }
}

const sortBy = (field, reverse) => {
    reverse = reverse ? 1 : -1;
    return function (a, b) {
        let x, y;
        if (a.hasOwnProperty(field)) {
            x = a[field];
            y = b[field];
        } else {
            x = a[field.toLowerCase()];
            y = b[field.toLowerCase()];
        }
        return reverse * ((x > y) - (y > x));
    };
};

function setState(state) {
    let updated = false;
    if (state && (siblings != state.siblings || listed != state.listed || filter != state.filter)) {
        siblings = state.siblings;
        listed = state.listed;
        filter = state.filter;
        get('siblings').checked = siblings;
        get('listed').checked = listed;
        get('search').value = filter;
        updated = true;
    }
    return updated;
}

function stateToHash(state) {
    const params = [];
    if (state.siblings) {
        params.push('s');
    }
    if (state.listed) {
        params.push('l');
    }
    if (state.filter.trim().length > 0) {
        params.push('f=' + encodeURIComponent(state.filter.trim()));
    }
    return params.join('&');
}

function hashToState(hash) {
    hash = hash.startsWith('#') ? hash.substring(1) : hash;
    const params = hash.split('&');
    const state = {};
    state.siblings = params.includes('s');
    state.listed = params.includes('l');
    if (params.length > 0 && params[params.length - 1].startsWith('f=')) {
        state.filter = decodeURIComponent(params[params.length - 1].substring(2));
    } else {
        state.filter = '';
    }
    return state;
}

window.onpopstate = function (event) {
    if (setState(hashToState(window.location.hash))) {
        updateTable();
    }
};

get('search').addEventListener('keyup', updateTable);
get('siblings').addEventListener('click', updateTable);
get('listed').addEventListener('click', updateTable);
