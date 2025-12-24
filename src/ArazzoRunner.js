'use strict';

const Pick = require('stream-json/filters/Pick');
const {streamValues} = require('stream-json/streamers/StreamValues');
const {chain} = require('stream-chain');

const fs = require('node:fs');

class ArazzoRunner {
    constructor(pathToArazzoSpecification = './arazzo.json', options) {
        this.pathToArazzoSpecification = pathToArazzoSpecification;

        this.logger = options.logger;

    }

    async runArazzoWorkflows() {
        await this.getSourceDescriptions();
        await this.getWorkflows();
    }

    async getSourceDescriptions() {
        const pipeline = this.JSONPicker('sourceDescriptions', this.pathToArazzoSpecification);

        let sourceDescriptions = [];
        for await (const { value } of pipeline) {
            sourceDescriptions = value.flat();
        }

        this.sourceDescriptions = sourceDescriptions;
    }

    async getWorkflows() {
        const pipeline = this.JSONPicker('workflows', this.pathToArazzoSpecification);

        let workflows = [];
        for await (const { value } of pipeline) {
            workflows = value.flat();
        }

        this.workflows = workflows;
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
