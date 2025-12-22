'use strict';

class ArazzoGenerator {
    constructor(arazzoDocumentation, options) {
        this.arazzoDocumentation = arazzoDocumentation;

        this.arazzo = {
            arazzo: options.arazzo
        }

        this.sls = options?.sls
    }

    async parse() {
        this.generateInfo()
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
