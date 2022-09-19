const count = 5;
const columns = ['Rank', 'Name', 'Sibling', 'Owner', 'Owns', 'DNA', 'DNA Split', 'Clothing', 'Eyes', 'Hair', 'Mouth', 'Teardrop'];

let data = [];
(function () {
    populateHeader();
    fetch('mkrs.json')
        .then((response) => response.json())
        .then((json) => {
            data = json;
            setTimeout(populateTable, 10);
        });
})();

function populateTable() {
    document.getElementById('rows').remove();
    const rows = document.createElement('tbody');
    rows.id = 'rows';
    for (let item of data) {
        const row = rows.insertRow(-1);
        for (let i = 0; i < columns.length; i++) {
            const cell = row.insertCell(i);
            if (columns[i] === 'Name') {
                cell.innerHTML = `<a href="${item.details}" target="_blank">${item.name}</a>`;
            } else if (columns[i] === 'Owner') {
                cell.innerHTML = `<a href="https://magiceden.io/u/${item.owner}" title="${item.ownerAlt ? item.ownerAlt : ''}" target="_blank">${item.owner}</a>`;
            } else {
                cell.innerHTML = item.hasOwnProperty(columns[i]) ? item[columns[i]] : item[columns[i].toLowerCase()];
            }
        }
    }
    const table = document.getElementById('results');
    table.appendChild(rows);
    filterTable();
    loading(false);
}

function filterTable() {
    const filter = document.getElementById('search').value.toUpperCase();
    const sibling = document.getElementById('siblings').checked;
    const table = document.getElementById('rows');
    const rows = table.getElementsByTagName('tr');
    let flag = false;
    let even = false;

    for (let row of rows) {
        let cells = row.getElementsByTagName('td');
        for (let cell of cells) {
            if (cell.textContent.toUpperCase().indexOf(filter) > -1) {
                cell.style.backgroundColor = filter ? '#ffff99' : '';
                flag = true;
            } else {
                cell.style.backgroundColor = '';
            }
        }
        if (sibling && flag) {
            flag = cells[2].textContent.length > 0;
        }
        row.style.display = flag ? '' : 'none';
        if (flag) {
            row.className = even ? 'zebra' : '';
            even = !even;
        }
        flag = false;
    }
}

function loading(active) {
    document.getElementById('loader').style.display = active ? 'block' : 'none';
    document.getElementById('container').style.display = 'block';
}

function populateHeader() {
    const header = document.getElementById('header');
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

function clearArrow() {
    let carets = document.getElementsByClassName('caret');
    for (let caret of carets) {
        caret.className = 'caret fa fa-sort';
    }
}

function toggleArrow(event) {
    loading(true);
    let element = event.target;
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
    let showing = caret.className;
    clearArrow();
    if (showing.includes(sortUp)) {
        caret.className = `caret ${sortDown}`;
        reverse = false;
    } else {
        caret.className = `caret ${sortUp}`;
        reverse = true;
    }

    data.sort(sortBy(field, reverse));
    setTimeout(populateTable, 10);
}

document.getElementById('search').addEventListener('keyup', filterTable);
document.getElementById('siblings').addEventListener('click', filterTable);
