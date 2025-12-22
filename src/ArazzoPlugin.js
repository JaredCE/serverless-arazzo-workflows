'use strict';

const fs = require('fs/promises')

const serverlessSchema = require('../schema/serverlessSchema.json')

class ArazzoPlugin {
    constructor(serverless) {
        this.serverless = serverless;

        this.commands = {
            arazzo: {
                commands: {
                    generate: {
                        lifecycleEvents: ['serverless'],
                        usage: 'Generate Arazzo Documents',
                        options: {
                            output: {
                                usage: 'Arazzo file output location [default: arazzo.json]',
                                shortcut: 'o',
                                type: 'string',
                            },
                            format: {
                                usage: 'Arazzo file format (yaml|json) [default: json]',
                                shortcut: 'f',
                                type: 'string',
                            },
                            source: {
                                usage: 'The default OpenAPI Source file to use [default: openapi.json]',
                                shortcut: 's',
                                type: 'string',
                            }
                        }
                    }
                }
            }
        }

        this.hooks = {
            "arazzo:generate:serverless": this.generate.bind(this),
        };

        this.serverless.configSchemaHandler.defineCustomProperties(serverlessSchema);
    }

    async generate() {
        this.processCLIInput();
    }

    async arazzoGeneration() {
        await this.writeArazzoFile();
    }

    async writeArazzoFile() {
        await fs.writeFile(this.config.file, '');
    }

    processCLIInput() {
        const config = {
            format: "json",
            file: "arazzo",
            arazzoVersion: "1.0.1",
            validationWarn: false,
            source: 'openapi.json'
        };

        if (this.serverless.processedInput?.options?.format?.toLowerCase() === 'yaml') {this.serverless.processedInput.options.format = 'yml';}

        config.format = this.serverless.processedInput.options.format.toLowerCase() || "json";

        if (["yml", "json"].indexOf(config.format.toLowerCase()) < 0) {
            throw new this.serverless.classes.Error(
                'Invalid Output Format Specified - must be one of "yaml" or "json"'
            );
        }

        if (this.serverless.processedInput.options.output) {
            config.file = `${this.serverless.processedInput.options.output}.${config.format}`;
        } else {
            config.file = `arazzo.${config.format}`;
        }

        if (this.serverless.processedInput.options.source) {
            config.source = this.serverless.processedInput.options.source;
        }

        this.config = config;
    }
}

module.exports = ArazzoPlugin;
