'use strict';

const expect = require("chai").expect;
const sinon = require('sinon');

const assert = require('node:assert/strict');
const fs = require('node:fs')
const { Readable } = require('node:stream');

const arazzoMock = require('../mocks/finalisedArazzoMock.json');


const Logger = require('../../src/Logger.js')
const ArazzoRunner = require('../../src/ArazzoRunner.js');

describe(`Arazzo Runner`, function () {
    const logger = new Logger(
        '3',
        {
            notice: (str) => {},
            error: (str) => {},
            success: (str) => {},
            verbose: (str) => {},
        }
    );

    describe(`constructor`, function () {
        it(`correctly sets the path of the Arazzo Specification File when not passed in `, function() {
            const expected = new ArazzoRunner(undefined, {logger});

            expect(expected.pathToArazzoSpecification).to.be.equal('./arazzo.json');
        });

        it(`correctly sets the path of the Arazzo Specification File when passed in `, function() {
            const expected = new ArazzoRunner('./my-arazzo.json', {logger});

            expect(expected.pathToArazzoSpecification).to.be.equal('./my-arazzo.json');
        });
    });

    describe(`runArazzoWorkflows`, function () {
        it(`should generate a list of source descriptions`, async function() {
            const arazzoRunner = new ArazzoRunner('/Users/jaredevans/Projects/GitHub/Personal/serverless-arazzo-workflows/test/mocks/finalisedArazzoMock.json', {logger});

            await arazzoRunner.runArazzoWorkflows()
                .catch(err => {
                    console.error(err);
                });

            expect(arazzoRunner.sourceDescriptions).to.be.an('array');
            expect(arazzoRunner.sourceDescriptions).to.have.lengthOf(1);
        });

        xit(`should generate a list of source descriptions when there is more than one`, async function() {
            const arazzoSourceDescriptionsMock = structuredClone(arazzoMock)
            arazzoSourceDescriptionsMock.sourceDescriptions.push({name: 'abc', url: './abc.json', type: 'openapi'});

            const fakeStream = new Readable({
                read() {} // No-op, we'll push manually
            });

            // Push fake data and end
            process.nextTick(() => {
                fakeStream.push(JSON.stringify(arazzoSourceDescriptionsMock));
                fakeStream.push(null); // End of stream
            });

            const stub = sinon.stub(fs, 'createReadStream').returns(fakeStream)

            const arazzoRunner = new ArazzoRunner('/Users/jaredevans/Projects/GitHub/Personal/serverless-arazzo-workflows/test/mocks/finalisedArazzoMock.json', {logger});

            await arazzoRunner.runArazzoWorkflows()
                .catch(err => {
                    console.error(err);
                });

            expect(arazzoRunner.sourceDescriptions).to.be.an('array');
            expect(arazzoRunner.sourceDescriptions).to.have.lengthOf(2);

            stub.restore();
        });

        it(`should get the workflows`, async function() {
            const arazzoRunner = new ArazzoRunner('/Users/jaredevans/Projects/GitHub/Personal/serverless-arazzo-workflows/test/mocks/finalisedArazzoMock.json', {logger});

            await arazzoRunner.runArazzoWorkflows()
                .catch(err => {
                    console.error(err);
                });

            expect(arazzoRunner.workflows).to.be.an('array');
            expect(arazzoRunner.workflows).to.have.lengthOf(1);
        });
    });
});
