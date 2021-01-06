const Queue = require('../index');

const newQueue = (options = {}) => {
    return new Queue({
        concurrent: 1,
        timeout: 10,
        ...options
    });
};

const reject = () => {
    return new Promise((_, reject) => reject('Error'));
};

const resolve = () => {
    return new Promise((resolve, _) => resolve('Success'));
};

module.exports = {
    newQueue,
    reject,
    resolve
};
