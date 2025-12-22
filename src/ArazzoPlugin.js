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
                            format: {
                                usage: 'Arazzo file format (yml|json) [default: json]',
                                shortcut: 'f',
                                type: 'string'
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
            file: "arazzo.json",
            arazzoVersion: "1.0.1",
            validationWarn: false,
        };

        config.format = this.serverless.processedInput.options.format || "json";

        if (["yaml", "json"].indexOf(config.format.toLowerCase()) < 0) {
            throw new this.serverless.classes.Error(
                'Invalid Output Format Specified - must be one of "yaml" or "json"'
            );
        }

        config.file =
            this.serverless.processedInput.options.output ||
            (config.format === "yaml" ? "arazzo.yml" : "arazzo.json");

        this.config = config;
    }
}

module.exports = ArazzoPlugin;
