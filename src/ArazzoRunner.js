'use strict';

const fs = require('node:fs/promises')

class ArazzoRunner {
    constructor(pathToArazzoSpecification = './arazzo.json') {
        this.pathToArazzoSpecification = pathToArazzoSpecification;
    }
}

module.exports = ArazzoRunner;
