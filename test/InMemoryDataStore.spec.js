const expect = require('chai').expect;

const DataStore = require('../src/InMemoryDataStore');
const store = DataStore();

describe('Setting, getting, and clearing values', () => {
    it('has no values until you set them', () => {
        expect(store.get('noValue')).to.be.an('undefined');
    });

    it(`doesn't mind if you clear a value that hasn't been set`, () => {
        function clearNoValue(){ store.clear('KeyNotSet') }

        expect(clearNoValue).not.to.throw();
    });

    it(`returns a value with get after you set it with a key`, () => {
        store.set('key1', 'value1');

        expect(store.get('key1')).to.equal('value1');
    });

    it('deletes values if you clear them', () => {
        store.set('key2', 'value2');
        store.clear('key2');
        expect(store.get('key2')).to.be.an('undefined');
    });
});