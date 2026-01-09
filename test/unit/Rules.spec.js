"use strict";

const expect = require("chai").expect;

const Rules = require("../../src/Rules");

describe(`Rules`, function () {
  it(`constructor`, function () {
    const expected = new Rules();

    expect(expected).to.be.an.instanceOf(Rules);
  });
});
