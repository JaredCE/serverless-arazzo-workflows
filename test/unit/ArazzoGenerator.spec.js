'use strict';

const expect = require("chai").expect;

const ArazzoGenerator = require('../../src/ArazzoGenerator.js');

const mockArazzo = require('../mocks/arazzoMock.json');

describe(`Arazzo Generator`, function () {
    describe(`constructor`, function () {
        it(`generate an instance of Arazzo Generator`, function() {
            const expected = new ArazzoGenerator(mockArazzo, {arazzo: '1.0.1'});

            expect(expected).to.be.instanceOf(ArazzoGenerator);
            expect(expected).to.have.property('arazzo');
            expect(expected.arazzo).to.have.property('arazzo');
        });
    });
});
