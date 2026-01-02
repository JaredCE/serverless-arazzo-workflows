'use strict';

const peggy = require('peggy');
const { chain } = require('stream-chain');
const Pick = require('stream-json/filters/Pick');
const { streamValues } = require('stream-json/streamers/StreamValues');

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const Arazzo = require('./Arazzo');
const Input = require('./Input');

class ArazzoRunner {
    constructor(pathToArazzoSpecification = './arazzo.json', options) {
        this.pathToArazzoSpecification = pathToArazzoSpecification;

        this.logger = options.logger;

        this.openAPISteps = false;

        this.inputFile = new Input(options.inputFile, 'inputs');
    }

    async runArazzoWorkflows() {
        await this.loadPeggyRules();

        this.arazzoDocument = new Arazzo(
            this.pathToArazzoSpecification,
            'mainArazzo',
            {
                parser: this.parser,
                logger: this.logger
            }
        );

        this.arazzoDocument.setMainArazzo()

        await this.arazzoDocument.runWorkflows(this.inputFile);
    }

    async loadPeggyRules() {
        const peggyPath = path.join(__dirname, '..', 'resources', 'rules.peggy');
        const peggyRuleSet = await fsp.readFile(peggyPath);

        this.parser = peggy.generate(peggyRuleSet.toString());
    }


    JSONPicker(key, file) {
        const pipeline = chain([
            fs.createReadStream(file),
            Pick.withParser({filter: key}),
            streamValues()
        ]);
        return pipeline
    }
}

module.exports = ArazzoRunner;
