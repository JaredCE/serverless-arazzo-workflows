'use strict';

const expect = require("chai").expect;

const ArazzoPlugin = require('../../src/ArazzoPlugin.js');

describe(`Arazzo Plugin`, function () {
    describe(`constructor`, function () {
        it(`generate an instance of ArazzoPlugin`, function() {
            const expected = new ArazzoPlugin();

            expect(expected).to.be.instanceOf(ArazzoPlugin);
        });
    });
});
