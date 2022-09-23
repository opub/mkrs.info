const readline = require('readline');
const axios = require('axios');
const axiosThrottle = require('axios-request-throttle');

const requestsPerSecond = 4;
axiosThrottle.use(axios, { requestsPerSecond });

exports.get = async function (url, options) {
    try {
        return await axios.get(url, options);
    }
    catch (e) {
        console.error('GET', url, e);
    }
}

exports.increment = function (map, key) {
    if (map.has(key)) {
        map.set(key, map.get(key) + 1);
    } else {
        map.set(key, 1);
    }
}

exports.sleep = function (milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

exports.progress = function (step) {
    const width = 50;
    const left = Math.ceil(width * step);
    const fill = "■".repeat(left);
    const empty = "□".repeat(width - left);
    const pct = Math.ceil(step * 100);
    clear();
    process.stdout.write(`${fill}${empty} ${pct}%`)
};

function clear() {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
};
exports.clear = clear;

exports.elapsed = function (milliseconds) {
    let time = milliseconds / 1000;
    let format = "";
    const hours = Math.floor(time / 3600);
    time %= 3600;
    if (hours > 0) {
        format += `${hours}h `;
    }
    const minutes = Math.floor(time / 60);
    if (hours > 0 || minutes > 0) {
        format += `${minutes}m `;
    }
    const seconds = Math.round(time % 60);
    return format + `${seconds}s`;
}