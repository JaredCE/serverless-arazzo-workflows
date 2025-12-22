'use strict';

const expect = require("chai").expect;

const ArazzoGenerator = require('../../src/ArazzoGenerator.js');

const mockArazzo = require('../mocks/arazzoMock.json');
const sls = require('../mocks/sls.js')

describe(`Arazzo Generator`, function () {
    const options = {
        arazzo: '1.0.1',
        sourceFile: './openapi.json',
        sls
    }

    describe(`constructor`, function () {
        it(`generate an instance of Arazzo Generator`, function() {
            const expected = new ArazzoGenerator(mockArazzo, options);

            expect(expected).to.be.instanceOf(ArazzoGenerator);
            expect(expected).to.have.property('arazzo');
            expect(expected.arazzo).to.have.property('arazzo');
        });
    });

    describe(`parse`, function () {
        it(`generates an expected azarro specification`, async function() {
            const azarroGenerator = new ArazzoGenerator(mockArazzo, options);

            await azarroGenerator.parse()
                .catch(err => {
                    console.error(err);
                });

            expect(azarroGenerator.arazzo.info).to.have.property('title', 'Arazzo Pet Store');
            expect(azarroGenerator.arazzo.sourceDescriptions).to.be.an('array');
            expect(azarroGenerator.arazzo.sourceDescriptions).to.have.lengthOf(1);
        });


    });

    describe(`generateInfo`, function () {
        it(`Uses the serverless service as the title if not defined`, async function() {
            const infoTestingMock = structuredClone(mockArazzo)
            delete infoTestingMock.info.title;

            const azarroGenerator = new ArazzoGenerator(infoTestingMock, options);

            await azarroGenerator.parse()
                .catch(err => {
                    console.error(err);
                });

            expect(azarroGenerator.arazzo.info).to.have.property('title', 'Test API');
        });

        it(`does not generate a description if not defined`, async function() {
            const infoTestingMock = structuredClone(mockArazzo)
            delete infoTestingMock.info.description;

            const azarroGenerator = new ArazzoGenerator(infoTestingMock, options);

            await azarroGenerator.parse()
                .catch(err => {
                    console.error(err);
                });

            expect(azarroGenerator.arazzo.info).to.not.have.property('description');
        });

        it(`does not generate a sumamry if not defined`, async function() {
            const infoTestingMock = structuredClone(mockArazzo)
            delete infoTestingMock.info.summary;

            const azarroGenerator = new ArazzoGenerator(mockArazzo, options);

            await azarroGenerator.parse()
                .catch(err => {
                    console.error(err);
                });

            expect(azarroGenerator.arazzo.info).to.have.property('summary');
        });

        it(`uses a UUID of a version is not defined`, async function() {
            const infoTestingMock = structuredClone(mockArazzo)
            delete infoTestingMock.info.version;
            const azarroGenerator = new ArazzoGenerator(infoTestingMock, options);


            await azarroGenerator.parse()
                .catch(err => {
                    console.error(err);
                });

            expect(azarroGenerator.arazzo.info).to.have.property('version');
        });

        it(`extends the info definition when extended properties are passed in`, async function() {
            const infoTestingMock = structuredClone(mockArazzo)
            infoTestingMock.info['x-extended-test'] = 'extended test';
            const azarroGenerator = new ArazzoGenerator(infoTestingMock, options);


            await azarroGenerator.parse()
                .catch(err => {
                    console.error(err);
                });

            expect(azarroGenerator.arazzo.info).to.have.property('x-extended-test');
        });
    });


    describe(`generateSourceDescriptions`, function () {
        it(`generates a default sourceDescription`, async function() {
            const azarroGenerator = new ArazzoGenerator(mockArazzo, options);

            await azarroGenerator.parse()
                .catch(err => {
                    console.error(err);
                });

            expect(azarroGenerator.arazzo).to.have.property('sourceDescriptions');
        });

        it(`generates a default sourceDescription with user provided ones when documented`, async function() {
            const sourceDescriptionTestingMock = structuredClone(mockArazzo)
            sourceDescriptionTestingMock.sourceDescriptions = [
                {
                    name: 'LoginOpenAPI',
                    url: './login-openapi.json',
                    type: 'openapi'
                }
            ]
            const azarroGenerator = new ArazzoGenerator(sourceDescriptionTestingMock, options);

            await azarroGenerator.parse()
                .catch(err => {
                    console.error(err);
                });

            expect(azarroGenerator.arazzo).to.have.property('sourceDescriptions');
            expect(azarroGenerator.arazzo.sourceDescriptions).to.have.lengthOf(2);
        });

        it(`generates a default sourceDescription with user provided ones when documented with extended fields`, async function() {
            const sourceDescriptionTestingMock = structuredClone(mockArazzo)
            sourceDescriptionTestingMock.sourceDescriptions = [
                {
                    name: 'LoginOpenAPI',
                    url: './login-openapi.json',
                    type: 'openapi',
                    'x-extended-field': 'extended test'
                }
            ]
            const azarroGenerator = new ArazzoGenerator(sourceDescriptionTestingMock, options);

            await azarroGenerator.parse()
                .catch(err => {
                    console.error(err);
                });

            expect(azarroGenerator.arazzo).to.have.property('sourceDescriptions');
            expect(azarroGenerator.arazzo.sourceDescriptions).to.have.lengthOf(2);

            let hasExtendedField = false;
            for (const sourceDescription of azarroGenerator.arazzo.sourceDescriptions) {
                if (sourceDescription.hasOwnProperty('x-extended-field')) {
                    hasExtendedField = true
                }
            }

            expect(hasExtendedField).to.be.true;

        });
    });
});
