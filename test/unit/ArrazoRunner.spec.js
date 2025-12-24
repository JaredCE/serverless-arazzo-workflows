'use strict';

const expect = require("chai").expect;
const sinon = require('sinon');

const ArazzoRunner = require('../../src/ArazzoRunner.js');

describe(`Arazzo Runner`, function () {
    describe(`constructor`, function () {
        it(`correctly sets the path of the Arazzo Specification File when not passed in `, function() {
            const expected = new ArazzoRunner();

            expect(expected.pathToArazzoSpecification).to.be.equal('./arazzo.json');

        });

        it(`correctly sets the path of the Arazzo Specification File when passed in `, function() {
            const expected = new ArazzoRunner('./my-arazzo.json');

            expect(expected.pathToArazzoSpecification).to.be.equal('./my-arazzo.json');

        });
    });
});
