'use strict';

class ArazzoGenerator {
    constructor(arazzoDocumentation, options) {
        this.arazzoDocumentation = arazzoDocumentation;

        this.arazzo = {
            arazzo: options.arazzo
        }

        this.sls = options?.sls
        this.sourceFile = options?.sourceFile;
    }

    async parse() {
        this.generateInfo();
        this.generateSourceDescriptions();
    }

    generateInfo() {
        const info = {
            title: this.arazzoDocumentation?.info?.title || this.sls.service.service,
            description: this.arazzoDocumentation?.info?.description || null,
            summary: this.arazzoDocumentation?.info?.summary || null,
            version: this.arazzoDocumentation?.info?.version || '1',
        }

        if (info.description === null) delete info.description;
        if (info.summary === null) delete info.summary;

        const extended = this.extendSpecification(this.arazzoDocumentation?.info)
        Object.assign(info, extended);

        this.arazzo.info = info
    }

    generateSourceDescriptions() {
        const sourceDescriptions = []

        const sourceDescription = {
            name: `${this.arazzo.info.title}-openAPI`,
            url: this.sourceFile,
            type: 'openapi'
        }

        sourceDescriptions.push(sourceDescription);

        if (this.arazzoDocumentation?.sourceDescriptions){
            for (const sourceDescription of this.arazzoDocumentation?.sourceDescriptions) {
                const extended = this.extendSpecification(sourceDescription)
                sourceDescription.type = sourceDescription.type.toLowerCase()

                Object.assign(sourceDescription, extended)

                sourceDescriptions.push(sourceDescription);
            }
        }

        this.arazzo.sourceDescriptions = sourceDescriptions;
    }

    extendSpecification(spec) {
        const obj = {};
        for (const key of Object.keys(spec)) {
            if (/^[x\-]/i.test(key)) {
                Object.assign(obj, { [key]: spec[key] });
            }
        }

        return obj;
  }
}

module.exports = ArazzoGenerator;
