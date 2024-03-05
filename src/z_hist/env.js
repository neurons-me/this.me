// env.js
// Detect if running in Node.js or Browser
let isNodeEnvironment = (typeof process !== 'undefined' && process.versions && process.versions.node);
if (isNodeEnvironment) {
    module.exports = require('./me-node');
} else {
    module.exports = require('./me-browser');
}
