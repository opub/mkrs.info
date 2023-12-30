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
const traits = ['Owner', 'Price', 'XP', 'DNA', 'Split', 'Clothing', 'Eyes', 'Hair', 'Headwear', 'Pass', 'Mouth', 'Teardrop', 'Treats', 'Background'];

function loading (active) {
  get('loader').style.display = active ? 'block' : 'none';
  get('container').style.display = 'block';
}

function get (id) {
  const elem = document.getElementById(id);
  if (!elem) {
    console.error('unable to find element with id', id);
  }
  return elem;
}

function showDetails (event) {
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
  get('details-name').innerHTML = `${nft.name} ${nft.rank ? '(Rank ' + nft.rank + ')' : ''}`;
  get('details-image-link').href = nft.image;
  get('details-image').src = nft.image;
  get('details-traits').innerHTML = getTraits(nft);
  get('details').style.display = 'block';
}

function getTraits (nft) {
  let html = '';
  for (let trait of traits) {
    let value = nft[trait] ? nft[trait] : nft[trait.toLowerCase()];
    if (trait === 'Owner') {
      value = `<a href="https://magiceden.io/u/${value}" title="${value}" target="_blank">${mask(value)}${nft.ownerAlt ? ' (' + nft.ownerAlt + ')' : ''}</a>`;
    } else if (trait === 'Price') {
      value = value ? `${value} SOL` : 'Not Listed';
      value = `<a href="https://magiceden.io/item-details/${nft.mint}?name=${encodeURI(nft.name)}" title="${value}" target="_blank">${value}</a></div><br><div>`;
    }
    value = value ? value : '';
    html += `<div class="trait"><span class="title">${trait}: </span>${value}</div>`;
  }
  return html;
}

function mask (address) {
  address = pretty(address)
  return address.length > 40 ? `${address.substring(0, 5)}...${address.substring(40)}` : '';
}

function pretty (value) {
  return value ? value : '';
}

function hideDetails () {
  get('details').style.display = 'none';
}

document.addEventListener('click', hideDetails, true);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hideDetails();
  }
});

function updateTable () {
  loading(true);
  setTimeout(populateTable, 10);
}

function populateHeader () {
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

function toggleArrow (event) {
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

function clearArrow () {
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
