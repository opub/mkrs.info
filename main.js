const maxRows = 500;
const columns = ['Rank', 'Name', 'Sibling', 'Price', 'Owner', 'Owns', 'DNA', 'DNA Split', 'Clothing', 'Eyes', 'Hair', 'Mouth', 'Teardrop'];
const traits = ['Owner', 'Siblings', 'Price', 'DNA', 'DNA Split', 'Clothing', 'Eyes', 'Hair', 'Mouth', 'Teardrop'];

let data = [];
(function () {
    populateHeader();
    fetch('mkrs.json')
        .then((response) => response.json())
        .then((json) => {
            data = json;
            updateTable();
        });
})();

function updateTable() {
    loading(true);
    setTimeout(populateTable, 10);
}

function populateTable() {
    if (get('rows')) {
        get('rows').remove();
    }

    // filter results
    const filter = get('search').value.toUpperCase();
    const sibling = get('siblings').checked;
    const listed = get('listed').checked;
    let filtered = data.filter(m => {
        if (sibling && m.sibling.length === 0 || listed && !m.price) {
            return false;
        } else if (filter.length > 0) {
            for (let a in m) {
                if (m[a]) {
                    const text = `${m[a]}`.toUpperCase();
                    if (text.indexOf(filter) > -1) {
                        return true;
                    }
                }
            }
            return false;
        }
        return true;
    });
    let truncated = false;
    if (filtered.length > maxRows) {
        filtered = filtered.slice(0, maxRows);
        truncated = true;
    }

    // render results
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
            if (filter.length > 0 && cell.textContent.toUpperCase().indexOf(filter) > -1) {
                cell.style.backgroundColor = '#f8eb67';
            }
        }
    }
    if (truncated || filtered.length === 0) {
        const row = rows.insertRow(-1);
        const cell = row.insertCell(0);
        cell.colSpan = columns.length;
        cell.innerHTML = truncated ? 'Change filter or sort to display additional results.' : 'No matching results found.';
    }
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

function loading(active) {
    get('loader').style.display = active ? 'block' : 'none';
    get('container').style.display = 'block';
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
                let links = '';
                for (let sib of value) {
                    const twin = data.find(item => item.mint === sib);
                    links += `<a href="javascript:showDetails('${twin.mint}')">${twin.name}</a> `;
                }
                value = links;
            }
        } else if (trait === 'Price') {
            value = value ? `${value} SOL` : 'Not Listed';
            value = `<a href="https://magiceden.io/item-details/${nft.mint}?name=${encodeURI(nft.name)}" title="${value}" target="_blank">${value}</a></div><br><div>`;
        }
        html += `<div class="trait"><span class="title">${trait}: </span>${value}</div>`;
    }
    return html;
}

function mask(address) {
    return address ? `${address.substring(0, 5)}...${address.substring(40)}` : '';
}

function pretty(value) {
    return value ? value : '';
}

function hideDetails() {
    get('details').style.display = 'none';
}

function get(id) {
    const elem = document.getElementById(id);
    if (!elem) {
        console.error('unable to find element with id', id);
    }
    return elem;
}

get('search').addEventListener('keyup', updateTable);
get('siblings').addEventListener('click', updateTable);
get('listed').addEventListener('click', updateTable);

document.addEventListener('click', hideDetails, true);
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        hideDetails();
    }
});