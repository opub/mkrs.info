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
const maxRows = 500;
const columns = ['Rank', 'Name', 'Price', 'Owner', 'Owns', 'XP', 'DNA', 'Split', 'Clothing', 'Eyes', 'Hair', 'Headwear', 'Pass', 'Mouth', 'Teardrop', 'Treats', 'Background'];

let listed = false, card = false, filter = '';

let data = [];
(function () { pageSetup() })();

function pageSetup () {
  // set filter values from hash or local storage
  const hash = window.location.hash;
  const state = hash.length > 1 ? hashToState(hash) : JSON.parse(localStorage.getItem('state'));
  setState(state);

  populateHeader();
  fetch('mkrs.json').then((resp) => resp.json()).then((json) => {
    data = json;
    const first = new Date(data.reduce((min, nft) => min < nft.last ? min : nft.last)).toLocaleString();
    const last = new Date(data.reduce((max, nft) => max > nft.last ? max : nft.last)).toLocaleString();
    get('metadata').innerHTML = `Metadata last updated between ${first} and ${last}.`;
    updateTable();
  });
}

function populateTable () {
  // delete all table rows
  if (get('rows')) {
    get('rows').remove();
  }

  // get and persist state values
  listed = get('listed').checked;
  card = get('card').checked;
  filter = get('search').value;

  // clean up advanced searches
  let search = [];
  if (filter.length > 0) {
    search = filter.trim().split(' ');
    for (let i = 0; i < search.length; i++) {
      const term = search[i];
      if (term.indexOf('=') > 0) {
        const key = term.substring(0, term.indexOf('='));
        const value = term.substring(term.indexOf('=') + 1);
        search[i] = {
          key: fixTraitCase(key, data[0]),
          value
        };
      }
    }
  }

  const state = { listed, card, filter };
  localStorage.setItem('state', JSON.stringify(state));
  window.location.hash = stateToHash(state);
  amplitude.getInstance().logEvent(`table populate - listed:${listed}, card:${card}, filter:${filter}`);

  // filter matching results
  let filtered = data.filter(m => {
    if (listed && !m.price || card && m.Headwear.indexOf(' of ') < 0 && m.Headwear.indexOf('Joker') < 0) {
      return false;
    } else if (search.length > 0) {
      return filterRow(m, search);
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
      if (search.length > 0) {
        for (let term of search) {
          term = term.value ? term.value.toUpperCase() : term.toUpperCase();
          if (term.length > 0 && cell.textContent.toUpperCase().indexOf(term) > -1) {
            cell.style.backgroundColor = '#f8eb67';
          }
        }
      }
    }
  }

  // add table footer message
  const row = rows.insertRow(-1);
  const cell = row.insertCell(0);
  cell.colSpan = columns.length;
  if (truncated) {
    cell.innerHTML = `Displaying ${filtered.length} of ${count} results. Change filter or sort to display additional results.`;
  } else if (filtered.length > 0) {
    cell.innerHTML = `Displaying ${filtered.length} matching results.`;
  } else {
    cell.innerHTML = 'No matching results found.';
  }

  // add rows to table DOM
  const table = get('results');
  table.appendChild(rows);
  loading(false);
}

function fixTraitCase (trait, item) {
  if (!item[trait]) {
    for (const attr in item) {
      if (attr.toLowerCase() === trait.toLowerCase()) {
        return attr;
      }
    }
  }
  console.log('could not match', trait);
  return trait;
}

function filterRow (row, search) {
  let include = false;
  for (const term of search) {
    if (term.key) {
      if (!matchSearch(`${row[term.key]}`, term.value)) {
        return false;
      } else {
        include = true;
      }
    } else {
      for (const cell in row) {
        include = include || matchSearch(`${row[cell]}`, term);
      }
    }
  }
  return include;
}

function matchSearch (value, search) {
  if (!value || value.length === 0 || !search || search.length === 0) {
    return false;
  } else {
    value = value.trim().toUpperCase();
    search = search.trim().toUpperCase();
    return value.indexOf(search) > -1;
  }
}

function setState (state) {
  let updated = false;
  if (state && (listed != state.listed || card != state.card || filter != state.filter)) {
    listed = state.listed;
    card = state.card;
    filter = state.filter;
    get('listed').checked = listed;
    get('card').checked = card;
    get('search').value = filter;
    updated = true;
  }
  return updated;
}

function stateToHash (state) {
  const params = [];
  if (state.listed) {
    params.push('l');
  }
  if (state.card) {
    params.push('c');
  }
  if (state.filter.trim().length > 0) {
    params.push('f=' + encodeURIComponent(state.filter.trim()));
  }
  return params.join('&');
}

function hashToState (hash) {
  hash = hash.startsWith('#') ? hash.substring(1) : hash;
  const params = hash.split('&');
  const state = {};
  state.listed = params.includes('l');
  state.card = params.includes('c');
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
get('listed').addEventListener('click', updateTable);
get('card').addEventListener('click', updateTable);
