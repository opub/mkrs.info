const readline = require('readline');
const axios = require('axios');
const axiosThrottle = require('axios-request-throttle');

const requestsPerSecond = 4;
axiosThrottle.use(axios, { requestsPerSecond });

const backoff = 1000;
let attempts = 0;

exports.get = async function (url, options) {
    try {
        const results = await axios.get(url, options);
        attempts = 0;
        return results;
    }
    catch (e) {
        // console.error('GET', url, e);
        throw e;
    }
}

// handle request error and wait to retry if 408 or 429 status
exports.requestError = async function (from, err) {
    clear();
    attempts++;
    const resp = err.response;
    if (resp && resp.config && (resp.status === 408 || resp.status === 429)) {
        // hitting timeout or the QPM limit so snooze a bit
        await sleep(attempts * backoff);
        console.log('WARN', from, resp.statusText, resp.config.url);
        return true;
    } else {
        console.log('ERROR', from, JSON.stringify(err, null, 2));
        return false;
    }
}

exports.increment = function (map, key) {
    if (map.has(key)) {
        map.set(key, map.get(key) + 1);
    } else {
        map.set(key, 1);
    }
}

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
exports.sleep = sleep;

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