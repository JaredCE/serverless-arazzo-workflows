'use strict';

const expect = require("chai").expect;
const sinon = require('sinon');

const fsp = require('node:fs/promises');

const Arazzo = require('../../src/Arazzo.js');
const Logger = require('../../src/Logger.js');
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
            const expected = new ArazzoRunner(undefined, {logger, inputFile: './input.json'});

            expect(expected.pathToArazzoSpecification).to.be.equal('./arazzo.json');
        });

        it(`correctly sets the path of the Arazzo Specification File when passed in `, function() {
            const expected = new ArazzoRunner('./my-arazzo.json', {logger, inputFile: './input.json'});

            expect(expected.pathToArazzoSpecification).to.be.equal('./my-arazzo.json');
        });
    });

    describe(`runArazzoWorkflows`, function () {
        it(`should run an Arazzo Workflow as expected`, async function() {
            const arazzoStub = sinon.stub(Arazzo.prototype, 'runWorkflows').resolves();

            const runner = new ArazzoRunner(undefined, {logger, inputFile: './input.json'});

            try {
                await runner.runArazzoWorkflows();
            } catch (err) {
                throw new Error('Err not expected');
            }

            arazzoStub.restore();
        });

        it(`throws an error reading the peggy rules fails`, async function() {
            const readFileStub = sinon.stub(fsp, 'readFile').rejects(new Error('Error thrown from sinon'));

            const runner = new ArazzoRunner(undefined, {logger, inputFile: './input.json'});

            try {
                await runner.runArazzoWorkflows();
            } catch (err) {
                expect(err).to.be.instanceOf(Error);
            }

            readFileStub.restore();
        });
    });
});
