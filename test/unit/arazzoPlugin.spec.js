'use strict';

const expect = require("chai").expect;
const sinon = require('sinon');

const ArazzoPlugin = require('../../src/ArazzoPlugin.js');

describe(`Arazzo Plugin`, function () {
    let sls;

    beforeEach(function() {
        sls = {
            version: '3.4.0',
            classes: {
                Error: class ServerlessError {
                    constructor(err) {
                        return new Error(err);
                    }
                },
            },
            processedInput: {
                options: {
                    format: "json",
                },
            },
            configSchemaHandler: {
                defineCustomProperties: () => {},
            },
        }
    });

    describe(`constructor`, function () {
        it(`generate an instance of ArazzoPlugin`, function() {
            const expected = new ArazzoPlugin(sls);

            expect(expected).to.be.instanceOf(ArazzoPlugin);
        });
    });

    describe(`Arazzo Generation`, function () {
        it(`should generate an Arazzo Specification`, async function() {
            const arazzoPlugin = new ArazzoPlugin(sls, {});

            const writeFileStub = sinon.stub(arazzoPlugin, 'writeArazzoFile').resolves();

            arazzoPlugin.processCLIInput();

            await arazzoPlugin.arazzoGeneration().catch(err => {
                console.error(err);
            });

            expect(writeFileStub.called).to.be.true;

            writeFileStub.restore();
        });
    });

    describe(`process CLI Input`, function () {
        it(`should default the file output to arazzo.json`, function() {
            const arazzoPlugin = new ArazzoPlugin(sls, {});
            arazzoPlugin.processCLIInput();

            expect(arazzoPlugin.config.file).to.be.eql('arazzo.json');
        });

        it(`should set the user file output when set`, function() {
            sls.processedInput.options.output = 'jared'
            const arazzoPlugin = new ArazzoPlugin(sls, {});
            arazzoPlugin.processCLIInput();

            expect(arazzoPlugin.config.file).to.be.eql('jared.json');
        });

        it(`should set the user file output when set and using yaml`, function() {
            sls.processedInput.options.output = 'jared'
            sls.processedInput.options.format = 'yaml'
            const arazzoPlugin = new ArazzoPlugin(sls, {});
            arazzoPlugin.processCLIInput();

            expect(arazzoPlugin.config.file).to.be.eql('jared.yml');
        });

        it(`should correctly set the file output for json`, function() {
            const arazzoPlugin = new ArazzoPlugin(sls, {});
            arazzoPlugin.processCLIInput();

            expect(arazzoPlugin.config.format).to.be.eql('json');
        });

        it(`should correctly set the file output for yaml`, function() {
            sls.processedInput.options.format = 'yaml'
            const arazzoPlugin = new ArazzoPlugin(sls, {});
            arazzoPlugin.processCLIInput();


            expect(arazzoPlugin.config.format).to.be.eql('yml');
        });

        it(`should throw an error if a file format other than yaml or json is tried`, function() {
            expect(function () {
                sls.processedInput.options.format = 'docx'
                const arazzoPlugin = new ArazzoPlugin(sls, {});
                arazzoPlugin.processCLIInput();
            }).to.throw(`Invalid Output Format Specified - must be one of "yaml" or "json"`);
        });
    });
});
