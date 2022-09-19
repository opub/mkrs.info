const count = 5;
const columns = ['Rank', 'Name', 'Sibling', 'Owner', 'Owns', 'DNA', 'DNA Split', 'Clothing', 'Eyes', 'Hair', 'Mouth', 'Teardrop'];

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
    if (document.getElementById('rows')) {
        document.getElementById('rows').remove();
    }

    // filter results
    const filter = document.getElementById('search').value.toUpperCase();
    const sibling = document.getElementById('siblings').checked;
    const filtered = data.filter(m => {
        if (sibling && m.sibling.length === 0) {
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

    // render results
    const rows = document.createElement('tbody');
    rows.id = 'rows';
    for (let item of filtered) {
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
            if (filter.length > 0 && cell.textContent.toUpperCase().indexOf(filter) > -1) {
                cell.style.backgroundColor = '#f8eb67';
            }
        }
    }
    const table = document.getElementById('results');
    table.appendChild(rows);
    loading(false);
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
    updateTable();
}

document.getElementById('search').addEventListener('keyup', updateTable);
document.getElementById('siblings').addEventListener('click', updateTable);
