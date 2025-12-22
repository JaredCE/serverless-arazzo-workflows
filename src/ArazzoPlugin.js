'use strict';

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
                            }
                        }
                    }
                }
            }
        }

        this.hooks = {
            "arazzo:generate:serverless": this.generate.bind(this),
        };
    }

    generate() {
        this.processCLIInput();
    }

    processCLIInput() {
        const config = {
            format: "json",
            file: "arazzo",
            arazzoVersion: "1.0.1",
            validationWarn: false,
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

        this.config = config;
    }
}

module.exports = ArazzoPlugin;
