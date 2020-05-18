/**
 * Exports a factory function that when called returns a new data store object that just persists
 * values to memory.
 */
function InMemoryDataStore() {
    const store = {};

    function clear(key) {
        delete store[key];
    }

    function get(key) {
        return store[key];
    }

    function set(key, value) {
        return store[key] = value;
    }

    return {
        clear,
        get,
        set
    };
}

module.exports = InMemoryDataStore;
