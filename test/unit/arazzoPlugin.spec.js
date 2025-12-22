'use strict';

const expect = require("chai").expect;

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
        }
    });

    describe(`constructor`, function () {
        it(`generate an instance of ArazzoPlugin`, function() {
            const expected = new ArazzoPlugin(sls);

            expect(expected).to.be.instanceOf(ArazzoPlugin);
        });
    });

    describe(`process CLI Input`, function () {
        it(`should correctly set the file output for json`, function() {
            const arazzoPlugin = new ArazzoPlugin(sls, {});
            arazzoPlugin.processCLIInput();

            expect(arazzoPlugin.config.format).to.be.eql('json');
        });

        it(`should correctly set the file output for yaml`, function() {
            sls.processedInput.options.format = 'yaml'
            const arazzoPlugin = new ArazzoPlugin(sls, {});
            arazzoPlugin.processCLIInput();


            expect(arazzoPlugin.config.format).to.be.eql('yaml');
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
