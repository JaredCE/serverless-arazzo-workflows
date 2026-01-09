"use strict";

const { bundleFromString } = require("@redocly/openapi-core");
const expect = require("chai").expect;
const peggy = require("peggy");
const nock = require("nock");
const sinon = require("sinon");

const path = require("node:path");
const fs = require("node:fs");
const fsp = require("node:fs/promises");

const openAPIMock = require("../mocks/petStoreOpenAPI.json");

const Expression = require("../../src/Expression.js");
const Input = require("../../src/Input.js");
const Logger = require("../../src/Logger.js");
const OpenAPI = require("../../src/OpenAPI.js");

const Arazzo = require("../../src/Arazzo");

const petsArazzo = require("../serverless-pets/arazzo.json");
const userArazzo = require("../serverless-users/arazzo.json");

describe(`Arazzo Document`, function () {
  let parser;
  before(async () => {
    const peggyPath = path.join(
      __dirname,
      "..",
      "..",
      "resources",
      "rules.peggy",
    );
    const peggyRuleSet = await fsp.readFile(peggyPath);

    parser = peggy.generate(peggyRuleSet.toString());
  });

  const logger = new Logger("3", {
    notice: (str) => {},
    error: (str) => {},
    success: (str) => {},
    verbose: (str) => {},
  });

  describe(`constructor`, function () {
    it(`should set the type to arazzo`, function () {
      const expected = new Arazzo("./arazzo.json", "arazzo", {
        logger: logger,
        parser,
      });

      expect(expected).to.be.instanceOf(Arazzo);
      expect(expected.type).to.be.equal("arazzo");
    });
  });

  describe(`setMainArazzo`, function () {
    it(`should correctly set the filePath`, function () {
      const arazzo = new Arazzo("./arazzo.json", "arazzo", {
        logger: logger,
        parser,
      });
      arazzo.setMainArazzo();

      expect(arazzo.filePath).to.be.equal(
        `${path.resolve(__dirname, "..", "..")}/arazzo.json`,
      );
    });
  });

  describe(`runWorkflows`, function () {
    describe(`OpenAPI SourceDescriptions`, function () {
      describe(`single workflow`, function () {
        describe(`single step`, function () {
          describe(`without successCriteria`, function () {
            it(`should throw an error when the operation does not respond with json`, async function () {
              nock("https://raw.githubusercontent.com:443", {
                encodedQueryParams: true,
              })
                .get(
                  "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                )
                .reply(
                  200,
                  [
                    "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                  ],
                  {
                    "accept-ranges": "bytes",
                    "access-control-allow-origin": "*",
                    "cache-control": "max-age=300",
                    connection: "keep-alive",
                    "content-encoding": "gzip",
                    "content-length": "1638",
                    "content-security-policy":
                      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                    "content-type": "text/plain; charset=utf-8",
                    "cross-origin-resource-policy": "cross-origin",
                    date: "Tue, 06 Jan 2026 19:19:56 GMT",
                    etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                    expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                    "source-age": "0",
                    "strict-transport-security": "max-age=31536000",
                    vary: "Authorization,Accept-Encoding",
                    via: "1.1 varnish",
                    "x-cache": "HIT",
                    "x-cache-hits": "0",
                    "x-content-type-options": "nosniff",
                    "x-fastly-request-id":
                      "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                    "x-frame-options": "deny",
                    "x-github-request-id": "8DCE:156854:683A3:BD766:695D41E9",
                    "x-served-by": "cache-lhr-egll1980052-LHR",
                    "x-timer": "S1767727197.761065,VS0,VE107",
                    "x-xss-protection": "1; mode=block",
                  },
                );

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .post("/v2/user", "[object Object]")
                .reply(
                  405,
                  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><apiResponse><type>unknown</type></apiResponse>',
                  {
                    "access-control-allow-headers":
                      "Content-Type, api_key, Authorization",
                    "access-control-allow-methods": "GET, POST, DELETE, PUT",
                    "access-control-allow-origin": "*",
                    connection: "keep-alive",
                    "content-length": "102",
                    "content-type": "application/xml",
                    date: "Tue, 06 Jan 2026 19:48:54 GMT",
                    server: "Jetty(9.2.9.v20150224)",
                  },
                );

              const inputFile = new Input(
                "./test/mocks/inputs/userInput.json",
                "inputs",
              );

              const arazzo = new Arazzo(
                "./test/mocks/single-workflow/single-step/arazzoMock-user-single-workflow-single-step.json",
                "arazzo",
                { logger: logger, parser },
              );
              arazzo.setMainArazzo();

              try {
                await arazzo.runWorkflows(inputFile);
                throw new Error("Expected promise to reject but it resolved");
              } catch (err) {
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.be.equal(
                  `SyntaxError: Unexpected token '<', "<?xml vers"... is not valid JSON`,
                );
              }
            });

            it(`should throw an error when the operation does not respond with the expected outputs`, async function () {
              nock("https://raw.githubusercontent.com:443", {
                encodedQueryParams: true,
              })
                .get(
                  "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                )
                .reply(
                  200,
                  [
                    "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                  ],
                  {
                    "accept-ranges": "bytes",
                    "access-control-allow-origin": "*",
                    "cache-control": "max-age=300",
                    connection: "keep-alive",
                    "content-encoding": "gzip",
                    "content-length": "1638",
                    "content-security-policy":
                      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                    "content-type": "text/plain; charset=utf-8",
                    "cross-origin-resource-policy": "cross-origin",
                    date: "Tue, 06 Jan 2026 19:19:56 GMT",
                    etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                    expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                    "source-age": "0",
                    "strict-transport-security": "max-age=31536000",
                    vary: "Authorization,Accept-Encoding",
                    via: "1.1 varnish",
                    "x-cache": "HIT",
                    "x-cache-hits": "0",
                    "x-content-type-options": "nosniff",
                    "x-fastly-request-id":
                      "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                    "x-frame-options": "deny",
                    "x-github-request-id": "8DCE:156854:683A3:BD766:695D41E9",
                    "x-served-by": "cache-lhr-egll1980052-LHR",
                    "x-timer": "S1767727197.761065,VS0,VE107",
                    "x-xss-protection": "1; mode=block",
                  },
                );

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .post("/v2/user", "[object Object]")
                .reply(201, { john: "paul" });

              const inputFile = new Input(
                "./test/mocks/inputs/userInput.json",
                "inputs",
              );

              const arazzo = new Arazzo(
                "./test/mocks/single-workflow/single-step/arazzoMock-user-single-workflow-single-step.json",
                "arazzo",
                { logger: logger, parser },
              );
              arazzo.setMainArazzo();

              try {
                await arazzo.runWorkflows(inputFile);
                throw new Error("Expected promise to reject but it resolved");
              } catch (err) {
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.be.equal(
                  `Invalid JSON pointer '/id': Invalid object key "id" at position 0 in "/id": key not found in object`,
                );
              }
            });

            it(`resolve if the outputs resolve on a 201`, async function () {
              nock("https://raw.githubusercontent.com:443", {
                encodedQueryParams: true,
              })
                .get(
                  "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                )
                .reply(
                  200,
                  [
                    "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                  ],
                  {
                    "accept-ranges": "bytes",
                    "access-control-allow-origin": "*",
                    "cache-control": "max-age=300",
                    connection: "keep-alive",
                    "content-encoding": "gzip",
                    "content-length": "1638",
                    "content-security-policy":
                      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                    "content-type": "text/plain; charset=utf-8",
                    "cross-origin-resource-policy": "cross-origin",
                    date: "Tue, 06 Jan 2026 19:19:56 GMT",
                    etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                    expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                    "source-age": "0",
                    "strict-transport-security": "max-age=31536000",
                    vary: "Authorization,Accept-Encoding",
                    via: "1.1 varnish",
                    "x-cache": "HIT",
                    "x-cache-hits": "0",
                    "x-content-type-options": "nosniff",
                    "x-fastly-request-id":
                      "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                    "x-frame-options": "deny",
                    "x-github-request-id": "8DCE:156854:683A3:BD766:695D41E9",
                    "x-served-by": "cache-lhr-egll1980052-LHR",
                    "x-timer": "S1767727197.761065,VS0,VE107",
                    "x-xss-protection": "1; mode=block",
                  },
                );

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .post("/v2/user", "[object Object]")
                .reply(201, { id: 123 });

              const inputFile = new Input(
                "./test/mocks/inputs/userInput.json",
                "inputs",
              );

              const arazzo = new Arazzo(
                "./test/mocks/single-workflow/single-step/arazzoMock-user-single-workflow-single-step.json",
                "arazzo",
                { logger: logger, parser },
              );
              arazzo.setMainArazzo();

              try {
                await arazzo.runWorkflows(inputFile);
              } catch (err) {
                expect(err).to.not.be.instanceOf(Error);
              }
            });

            it(`resolve if the outputs resolve on a 404`, async function () {
              nock("https://raw.githubusercontent.com:443", {
                encodedQueryParams: true,
              })
                .get(
                  "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                )
                .reply(
                  200,
                  [
                    "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                  ],
                  {
                    "accept-ranges": "bytes",
                    "access-control-allow-origin": "*",
                    "cache-control": "max-age=300",
                    connection: "keep-alive",
                    "content-encoding": "gzip",
                    "content-length": "1638",
                    "content-security-policy":
                      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                    "content-type": "text/plain; charset=utf-8",
                    "cross-origin-resource-policy": "cross-origin",
                    date: "Tue, 06 Jan 2026 19:19:56 GMT",
                    etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                    expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                    "source-age": "0",
                    "strict-transport-security": "max-age=31536000",
                    vary: "Authorization,Accept-Encoding",
                    via: "1.1 varnish",
                    "x-cache": "HIT",
                    "x-cache-hits": "0",
                    "x-content-type-options": "nosniff",
                    "x-fastly-request-id":
                      "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                    "x-frame-options": "deny",
                    "x-github-request-id": "8DCE:156854:683A3:BD766:695D41E9",
                    "x-served-by": "cache-lhr-egll1980052-LHR",
                    "x-timer": "S1767727197.761065,VS0,VE107",
                    "x-xss-protection": "1; mode=block",
                  },
                );

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .post("/v2/user", "[object Object]")
                .reply(404, { id: 123 });

              const inputFile = new Input(
                "./test/mocks/inputs/userInput.json",
                "inputs",
              );

              const arazzo = new Arazzo(
                "./test/mocks/single-workflow/single-step/arazzoMock-user-single-workflow-single-step.json",
                "arazzo",
                { logger: logger, parser },
              );
              arazzo.setMainArazzo();

              try {
                await arazzo.runWorkflows(inputFile);
              } catch (err) {
                expect(err).to.not.be.instanceOf(Error);
              }
            });
          });

          describe(`with successCriteria`, function () {
            it(`throws an error if the successCriteria are not all met`, async function () {
              nock("https://raw.githubusercontent.com:443", {
                encodedQueryParams: true,
              })
                .get(
                  "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                )
                .reply(
                  200,
                  [
                    "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                  ],
                  {
                    "accept-ranges": "bytes",
                    "access-control-allow-origin": "*",
                    "cache-control": "max-age=300",
                    connection: "keep-alive",
                    "content-encoding": "gzip",
                    "content-length": "1638",
                    "content-security-policy":
                      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                    "content-type": "text/plain; charset=utf-8",
                    "cross-origin-resource-policy": "cross-origin",
                    date: "Tue, 06 Jan 2026 19:19:56 GMT",
                    etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                    expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                    "source-age": "0",
                    "strict-transport-security": "max-age=31536000",
                    vary: "Authorization,Accept-Encoding",
                    via: "1.1 varnish",
                    "x-cache": "HIT",
                    "x-cache-hits": "0",
                    "x-content-type-options": "nosniff",
                    "x-fastly-request-id":
                      "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                    "x-frame-options": "deny",
                    "x-github-request-id": "8DCE:156854:683A3:BD766:695D41E9",
                    "x-served-by": "cache-lhr-egll1980052-LHR",
                    "x-timer": "S1767727197.761065,VS0,VE107",
                    "x-xss-protection": "1; mode=block",
                  },
                );

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .post("/v2/user", "[object Object]")
                .reply(201, { id: 123 });

              const inputFile = new Input(
                "./test/mocks/inputs/userInput.json",
                "inputs",
              );

              const arazzo = new Arazzo(
                "./test/mocks/single-workflow/single-step/arazzoMock-user-single-workflow-single-step-with-successCriteria.json",
                "arazzo",
                { logger: logger, parser },
              );
              arazzo.setMainArazzo();

              try {
                await arazzo.runWorkflows(inputFile);
                throw new Error("Expected promise to reject but it resolved");
              } catch (err) {
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.be.equal(
                  `createAUser step of the createUser workflow failed the successCriteria`,
                );
              }
            });

            it(`resolves if the successCriteria are all met`, async function () {
              nock("https://raw.githubusercontent.com:443", {
                encodedQueryParams: true,
              })
                .get(
                  "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                )
                .reply(
                  200,
                  [
                    "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                  ],
                  {
                    "accept-ranges": "bytes",
                    "access-control-allow-origin": "*",
                    "cache-control": "max-age=300",
                    connection: "keep-alive",
                    "content-encoding": "gzip",
                    "content-length": "1638",
                    "content-security-policy":
                      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                    "content-type": "text/plain; charset=utf-8",
                    "cross-origin-resource-policy": "cross-origin",
                    date: "Tue, 06 Jan 2026 19:19:56 GMT",
                    etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                    expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                    "source-age": "0",
                    "strict-transport-security": "max-age=31536000",
                    vary: "Authorization,Accept-Encoding",
                    via: "1.1 varnish",
                    "x-cache": "HIT",
                    "x-cache-hits": "0",
                    "x-content-type-options": "nosniff",
                    "x-fastly-request-id":
                      "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                    "x-frame-options": "deny",
                    "x-github-request-id": "8DCE:156854:683A3:BD766:695D41E9",
                    "x-served-by": "cache-lhr-egll1980052-LHR",
                    "x-timer": "S1767727197.761065,VS0,VE107",
                    "x-xss-protection": "1; mode=block",
                  },
                );

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .post("/v2/user", "[object Object]")
                .reply(200, { id: 123 });

              const inputFile = new Input(
                "./test/mocks/inputs/userInput.json",
                "inputs",
              );

              const arazzo = new Arazzo(
                "./test/mocks/single-workflow/single-step/arazzoMock-user-single-workflow-single-step-with-successCriteria.json",
                "arazzo",
                { logger: logger, parser },
              );
              arazzo.setMainArazzo();

              try {
                await arazzo.runWorkflows(inputFile);
              } catch (err) {
                expect(err).to.not.be.instanceOf(Error);
              }
            });

            xdescribe(`with onFailure`, function () {
              describe(`single onFailure`, function () {
                describe(`onFailure without criteria`, function () {
                  it(`resolves when onFailure is set to end`, async function () {
                    nock("https://raw.githubusercontent.com:443", {
                      encodedQueryParams: true,
                    })
                      .get(
                        "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                      )
                      .reply(
                        200,
                        [
                          "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                        ],
                        {
                          "accept-ranges": "bytes",
                          "access-control-allow-origin": "*",
                          "cache-control": "max-age=300",
                          connection: "keep-alive",
                          "content-encoding": "gzip",
                          "content-length": "1638",
                          "content-security-policy":
                            "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                          "content-type": "text/plain; charset=utf-8",
                          "cross-origin-resource-policy": "cross-origin",
                          date: "Tue, 06 Jan 2026 19:19:56 GMT",
                          etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                          expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                          "source-age": "0",
                          "strict-transport-security": "max-age=31536000",
                          vary: "Authorization,Accept-Encoding",
                          via: "1.1 varnish",
                          "x-cache": "HIT",
                          "x-cache-hits": "0",
                          "x-content-type-options": "nosniff",
                          "x-fastly-request-id":
                            "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                          "x-frame-options": "deny",
                          "x-github-request-id":
                            "8DCE:156854:683A3:BD766:695D41E9",
                          "x-served-by": "cache-lhr-egll1980052-LHR",
                          "x-timer": "S1767727197.761065,VS0,VE107",
                          "x-xss-protection": "1; mode=block",
                        },
                      );

                    nock("http://petstore.swagger.io:80", {
                      encodedQueryParams: true,
                    })
                      .post("/v2/user", "[object Object]")
                      .reply(201, { id: 123 });

                    const inputFile = new Input(
                      "./test/mocks/inputs/userInput.json",
                      "inputs",
                    );

                    const arazzo = new Arazzo(
                      "./test/mocks/single-workflow/single-step/arazzoMock-user-single-workflow-single-step-with-successCriteria-and-onFailure-set-to-end.json",
                      "arazzo",
                      { logger: logger, parser },
                    );
                    arazzo.setMainArazzo();

                    try {
                      await arazzo.runWorkflows(inputFile);
                    } catch (err) {
                      expect(err).to.not.be.instanceOf(Error);
                    }
                  });

                  it(`retries when onFailure is set to retry and no retryLimit is set`, async function () {
                    nock("https://raw.githubusercontent.com:443", {
                      encodedQueryParams: true,
                    })
                      .get(
                        "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                      )
                      .reply(
                        200,
                        [
                          "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                        ],
                        {
                          "accept-ranges": "bytes",
                          "access-control-allow-origin": "*",
                          "cache-control": "max-age=300",
                          connection: "keep-alive",
                          "content-encoding": "gzip",
                          "content-length": "1638",
                          "content-security-policy":
                            "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                          "content-type": "text/plain; charset=utf-8",
                          "cross-origin-resource-policy": "cross-origin",
                          date: "Tue, 06 Jan 2026 19:19:56 GMT",
                          etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                          expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                          "source-age": "0",
                          "strict-transport-security": "max-age=31536000",
                          vary: "Authorization,Accept-Encoding",
                          via: "1.1 varnish",
                          "x-cache": "HIT",
                          "x-cache-hits": "0",
                          "x-content-type-options": "nosniff",
                          "x-fastly-request-id":
                            "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                          "x-frame-options": "deny",
                          "x-github-request-id":
                            "8DCE:156854:683A3:BD766:695D41E9",
                          "x-served-by": "cache-lhr-egll1980052-LHR",
                          "x-timer": "S1767727197.761065,VS0,VE107",
                          "x-xss-protection": "1; mode=block",
                        },
                      );

                    nock("http://petstore.swagger.io:80", {
                      encodedQueryParams: true,
                    })
                      .post("/v2/user", "[object Object]")
                      .times(2)
                      .reply(201, { id: 123 });

                    const inputFile = new Input(
                      "./test/mocks/inputs/userInput.json",
                      "inputs",
                    );

                    const arazzo = new Arazzo(
                      "./test/mocks/single-workflow/single-step/arazzoMock-user-single-workflow-single-step-with-successCriteria-and-onFailure-set-to-retry.json",
                      "arazzo",
                      { logger: logger, parser },
                    );
                    arazzo.setMainArazzo();

                    try {
                      await arazzo.runWorkflows(inputFile);
                      throw new Error(
                        "Expected promise to reject but it resolved",
                      );
                    } catch (err) {
                      expect(err).to.be.instanceOf(Error);
                      expect(err.message).to.be.equal(
                        `createAUser step of the createUser workflow failed the successCriteria`,
                      );
                    }
                  });

                  xit(`retries when onFailure is set to retry and retries the max times when retryLimit is set`, async function () {
                    nock("https://raw.githubusercontent.com:443", {
                      encodedQueryParams: true,
                    })
                      .get(
                        "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                      )
                      .reply(
                        200,
                        [
                          "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                        ],
                        {
                          "accept-ranges": "bytes",
                          "access-control-allow-origin": "*",
                          "cache-control": "max-age=300",
                          connection: "keep-alive",
                          "content-encoding": "gzip",
                          "content-length": "1638",
                          "content-security-policy":
                            "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                          "content-type": "text/plain; charset=utf-8",
                          "cross-origin-resource-policy": "cross-origin",
                          date: "Tue, 06 Jan 2026 19:19:56 GMT",
                          etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                          expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                          "source-age": "0",
                          "strict-transport-security": "max-age=31536000",
                          vary: "Authorization,Accept-Encoding",
                          via: "1.1 varnish",
                          "x-cache": "HIT",
                          "x-cache-hits": "0",
                          "x-content-type-options": "nosniff",
                          "x-fastly-request-id":
                            "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                          "x-frame-options": "deny",
                          "x-github-request-id":
                            "8DCE:156854:683A3:BD766:695D41E9",
                          "x-served-by": "cache-lhr-egll1980052-LHR",
                          "x-timer": "S1767727197.761065,VS0,VE107",
                          "x-xss-protection": "1; mode=block",
                        },
                      );

                    nock("http://petstore.swagger.io:80", {
                      encodedQueryParams: true,
                    })
                      .post("/v2/user", "[object Object]")
                      .reply(201, { id: 123 });

                    const inputFile = new Input(
                      "./test/mocks/inputs/userInput.json",
                      "inputs",
                    );

                    const arazzo = new Arazzo(
                      "./test/mocks/single-workflow/single-step/arazzoMock-user-single-workflow-single-step-with-successCriteria-and-onFailure-set-to-retry.json",
                      "arazzo",
                      { logger: logger, parser },
                    );
                    arazzo.setMainArazzo();

                    try {
                      await arazzo.runWorkflows(inputFile);
                      throw new Error(
                        "Expected promise to reject but it resolved",
                      );
                    } catch (err) {
                      expect(err).to.be.instanceOf(Error);
                      expect(err.message).to.be.equal(
                        `createAUser step of the createUser workflow failed the successCriteria`,
                      );
                    }
                  });
                });

                xdescribe(`onFailure with criteria`, function () {
                  xit(`resolves when onFailure is set to end and matches the criteria`, async function () {
                    nock("https://raw.githubusercontent.com:443", {
                      encodedQueryParams: true,
                    })
                      .get(
                        "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                      )
                      .reply(
                        200,
                        [
                          "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                        ],
                        {
                          "accept-ranges": "bytes",
                          "access-control-allow-origin": "*",
                          "cache-control": "max-age=300",
                          connection: "keep-alive",
                          "content-encoding": "gzip",
                          "content-length": "1638",
                          "content-security-policy":
                            "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                          "content-type": "text/plain; charset=utf-8",
                          "cross-origin-resource-policy": "cross-origin",
                          date: "Tue, 06 Jan 2026 19:19:56 GMT",
                          etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                          expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                          "source-age": "0",
                          "strict-transport-security": "max-age=31536000",
                          vary: "Authorization,Accept-Encoding",
                          via: "1.1 varnish",
                          "x-cache": "HIT",
                          "x-cache-hits": "0",
                          "x-content-type-options": "nosniff",
                          "x-fastly-request-id":
                            "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                          "x-frame-options": "deny",
                          "x-github-request-id":
                            "8DCE:156854:683A3:BD766:695D41E9",
                          "x-served-by": "cache-lhr-egll1980052-LHR",
                          "x-timer": "S1767727197.761065,VS0,VE107",
                          "x-xss-protection": "1; mode=block",
                        },
                      );

                    nock("http://petstore.swagger.io:80", {
                      encodedQueryParams: true,
                    })
                      .post("/v2/user", "[object Object]")
                      .reply(201, { id: 123 });

                    const inputFile = new Input(
                      "./test/mocks/inputs/userInput.json",
                      "inputs",
                    );

                    const arazzo = new Arazzo(
                      "./test/mocks/single-workflow/single-step/arazzoMock-user-single-workflow-single-step-with-successCriteria.json",
                      "arazzo",
                      { logger: logger, parser },
                    );
                    arazzo.setMainArazzo();

                    try {
                      await arazzo.runWorkflows(inputFile);
                      throw new Error(
                        "Expected promise to reject but it resolved",
                      );
                    } catch (err) {
                      expect(err).to.be.instanceOf(Error);
                      expect(err.message).to.be.equal(
                        `createAUser step of the createUser workflow failed the successCriteria`,
                      );
                    }
                  });

                  xit(`retries when onFailure is set to retry and matches the criteria`, async function () {
                    nock("https://raw.githubusercontent.com:443", {
                      encodedQueryParams: true,
                    })
                      .get(
                        "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                      )
                      .reply(
                        200,
                        [
                          "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                        ],
                        {
                          "accept-ranges": "bytes",
                          "access-control-allow-origin": "*",
                          "cache-control": "max-age=300",
                          connection: "keep-alive",
                          "content-encoding": "gzip",
                          "content-length": "1638",
                          "content-security-policy":
                            "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                          "content-type": "text/plain; charset=utf-8",
                          "cross-origin-resource-policy": "cross-origin",
                          date: "Tue, 06 Jan 2026 19:19:56 GMT",
                          etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                          expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                          "source-age": "0",
                          "strict-transport-security": "max-age=31536000",
                          vary: "Authorization,Accept-Encoding",
                          via: "1.1 varnish",
                          "x-cache": "HIT",
                          "x-cache-hits": "0",
                          "x-content-type-options": "nosniff",
                          "x-fastly-request-id":
                            "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                          "x-frame-options": "deny",
                          "x-github-request-id":
                            "8DCE:156854:683A3:BD766:695D41E9",
                          "x-served-by": "cache-lhr-egll1980052-LHR",
                          "x-timer": "S1767727197.761065,VS0,VE107",
                          "x-xss-protection": "1; mode=block",
                        },
                      );

                    nock("http://petstore.swagger.io:80", {
                      encodedQueryParams: true,
                    })
                      .post("/v2/user", "[object Object]")
                      .reply(201, { id: 123 });

                    const inputFile = new Input(
                      "./test/mocks/inputs/userInput.json",
                      "inputs",
                    );

                    const arazzo = new Arazzo(
                      "./test/mocks/single-workflow/single-step/arazzoMock-user-single-workflow-single-step-with-successCriteria-and-onFailure-set-to-retry.json",
                      "arazzo",
                      { logger: logger, parser },
                    );
                    arazzo.setMainArazzo();

                    try {
                      await arazzo.runWorkflows(inputFile);
                      throw new Error(
                        "Expected promise to reject but it resolved",
                      );
                    } catch (err) {
                      expect(err).to.be.instanceOf(Error);
                      expect(err.message).to.be.equal(
                        `createAUser step of the createUser workflow failed the successCriteria`,
                      );
                    }
                  });
                });
              });

              describe(`multiple onFailure`, function () {});
            });

            xdescribe(`with onSuccess`, () => {});
          });
        });

        describe(`multiple steps`, function () {
          describe(`without successCriteria`, function () {
            it(`should throw an error when the operation does not respond with json`, async function () {
              nock("https://raw.githubusercontent.com:443", {
                encodedQueryParams: true,
              })
                .get(
                  "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                )
                .reply(
                  200,
                  [
                    "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                  ],
                  {
                    "accept-ranges": "bytes",
                    "access-control-allow-origin": "*",
                    "cache-control": "max-age=300",
                    connection: "keep-alive",
                    "content-encoding": "gzip",
                    "content-length": "1638",
                    "content-security-policy":
                      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                    "content-type": "text/plain; charset=utf-8",
                    "cross-origin-resource-policy": "cross-origin",
                    date: "Tue, 06 Jan 2026 19:19:56 GMT",
                    etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                    expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                    "source-age": "0",
                    "strict-transport-security": "max-age=31536000",
                    vary: "Authorization,Accept-Encoding",
                    via: "1.1 varnish",
                    "x-cache": "HIT",
                    "x-cache-hits": "0",
                    "x-content-type-options": "nosniff",
                    "x-fastly-request-id":
                      "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                    "x-frame-options": "deny",
                    "x-github-request-id": "8DCE:156854:683A3:BD766:695D41E9",
                    "x-served-by": "cache-lhr-egll1980052-LHR",
                    "x-timer": "S1767727197.761065,VS0,VE107",
                    "x-xss-protection": "1; mode=block",
                  },
                );

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .post("/v2/user", "[object Object]")
                .reply(
                  405,
                  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><apiResponse><type>unknown</type></apiResponse>',
                  {
                    "access-control-allow-headers":
                      "Content-Type, api_key, Authorization",
                    "access-control-allow-methods": "GET, POST, DELETE, PUT",
                    "access-control-allow-origin": "*",
                    connection: "keep-alive",
                    "content-length": "102",
                    "content-type": "application/xml",
                    date: "Tue, 06 Jan 2026 19:48:54 GMT",
                    server: "Jetty(9.2.9.v20150224)",
                  },
                );

              const inputFile = new Input(
                "./test/mocks/inputs/userInput.json",
                "inputs",
              );

              const arazzo = new Arazzo(
                "./test/mocks/single-workflow/multiple-steps/arazzoMock-user-single-workflow-multiple-step.json",
                "arazzo",
                { logger: logger, parser },
              );
              arazzo.setMainArazzo();

              try {
                await arazzo.runWorkflows(inputFile);
                throw new Error("Expected promise to reject but it resolved");
              } catch (err) {
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.be.equal(
                  `SyntaxError: Unexpected token '<', "<?xml vers"... is not valid JSON`,
                );
              }
            });

            it(`should throw an error when the operation does not respond with the expected outputs`, async function () {
              nock("https://raw.githubusercontent.com:443", {
                encodedQueryParams: true,
              })
                .get(
                  "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                )
                .reply(
                  200,
                  [
                    "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                  ],
                  {
                    "accept-ranges": "bytes",
                    "access-control-allow-origin": "*",
                    "cache-control": "max-age=300",
                    connection: "keep-alive",
                    "content-encoding": "gzip",
                    "content-length": "1638",
                    "content-security-policy":
                      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                    "content-type": "text/plain; charset=utf-8",
                    "cross-origin-resource-policy": "cross-origin",
                    date: "Tue, 06 Jan 2026 19:19:56 GMT",
                    etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                    expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                    "source-age": "0",
                    "strict-transport-security": "max-age=31536000",
                    vary: "Authorization,Accept-Encoding",
                    via: "1.1 varnish",
                    "x-cache": "HIT",
                    "x-cache-hits": "0",
                    "x-content-type-options": "nosniff",
                    "x-fastly-request-id":
                      "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                    "x-frame-options": "deny",
                    "x-github-request-id": "8DCE:156854:683A3:BD766:695D41E9",
                    "x-served-by": "cache-lhr-egll1980052-LHR",
                    "x-timer": "S1767727197.761065,VS0,VE107",
                    "x-xss-protection": "1; mode=block",
                  },
                );

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .post("/v2/user", "[object Object]")
                .reply(201, { john: "paul" });

              const inputFile = new Input(
                "./test/mocks/inputs/userInput.json",
                "inputs",
              );

              const arazzo = new Arazzo(
                "./test/mocks/single-workflow/multiple-steps/arazzoMock-user-single-workflow-multiple-step.json",
                "arazzo",
                { logger: logger, parser },
              );
              arazzo.setMainArazzo();

              const spy = sinon.spy(arazzo, "runStep");

              try {
                await arazzo.runWorkflows(inputFile);
                throw new Error("Expected promise to reject but it resolved");
              } catch (err) {
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.be.equal(
                  `Invalid JSON pointer '/id': Invalid object key "id" at position 0 in "/id": key not found in object`,
                );

                expect(spy.callCount).to.equal(1);
              }

              spy.restore();
            });

            it(`resolve all the outputs resolve as expected`, async function () {
              nock("https://raw.githubusercontent.com:443", {
                encodedQueryParams: true,
              })
                .get(
                  "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                )
                .reply(
                  200,
                  [
                    "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                  ],
                  {
                    "accept-ranges": "bytes",
                    "access-control-allow-origin": "*",
                    "cache-control": "max-age=300",
                    connection: "keep-alive",
                    "content-encoding": "gzip",
                    "content-length": "1638",
                    "content-security-policy":
                      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                    "content-type": "text/plain; charset=utf-8",
                    "cross-origin-resource-policy": "cross-origin",
                    date: "Tue, 06 Jan 2026 19:19:56 GMT",
                    etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                    expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                    "source-age": "0",
                    "strict-transport-security": "max-age=31536000",
                    vary: "Authorization,Accept-Encoding",
                    via: "1.1 varnish",
                    "x-cache": "HIT",
                    "x-cache-hits": "0",
                    "x-content-type-options": "nosniff",
                    "x-fastly-request-id":
                      "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                    "x-frame-options": "deny",
                    "x-github-request-id": "8DCE:156854:683A3:BD766:695D41E9",
                    "x-served-by": "cache-lhr-egll1980052-LHR",
                    "x-timer": "S1767727197.761065,VS0,VE107",
                    "x-xss-protection": "1; mode=block",
                  },
                );

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .post("/v2/user", "[object Object]")
                .reply(201, { id: 123 });

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .get("/v2/user/DannyB")
                .reply(0, { id: 123 });

              const inputFile = new Input(
                "./test/mocks/inputs/userInput.json",
                "inputs",
              );

              const arazzo = new Arazzo(
                "./test/mocks/single-workflow/multiple-steps/arazzoMock-user-single-workflow-multiple-step.json",
                "arazzo",
                { logger: logger, parser },
              );
              arazzo.setMainArazzo();

              const spy = sinon.spy(arazzo, "runOperation");

              try {
                await arazzo.runWorkflows(inputFile);
                expect(spy.callCount).to.be.equal(2);
              } catch (err) {
                console.error(err);
                expect(err).to.not.be.instanceOf(Error);
              }

              spy.restore();
            });

            it(`resolve if the outputs resolve on a 404`, async function () {
              nock("https://raw.githubusercontent.com:443", {
                encodedQueryParams: true,
              })
                .get(
                  "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                )
                .reply(
                  200,
                  [
                    "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                  ],
                  {
                    "accept-ranges": "bytes",
                    "access-control-allow-origin": "*",
                    "cache-control": "max-age=300",
                    connection: "keep-alive",
                    "content-encoding": "gzip",
                    "content-length": "1638",
                    "content-security-policy":
                      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                    "content-type": "text/plain; charset=utf-8",
                    "cross-origin-resource-policy": "cross-origin",
                    date: "Tue, 06 Jan 2026 19:19:56 GMT",
                    etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                    expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                    "source-age": "0",
                    "strict-transport-security": "max-age=31536000",
                    vary: "Authorization,Accept-Encoding",
                    via: "1.1 varnish",
                    "x-cache": "HIT",
                    "x-cache-hits": "0",
                    "x-content-type-options": "nosniff",
                    "x-fastly-request-id":
                      "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                    "x-frame-options": "deny",
                    "x-github-request-id": "8DCE:156854:683A3:BD766:695D41E9",
                    "x-served-by": "cache-lhr-egll1980052-LHR",
                    "x-timer": "S1767727197.761065,VS0,VE107",
                    "x-xss-protection": "1; mode=block",
                  },
                );

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .post("/v2/user", "[object Object]")
                .reply(404, { id: 123 });

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .get("/v2/user/DannyB")
                .reply(0, { id: 123 });

              const inputFile = new Input(
                "./test/mocks/inputs/userInput.json",
                "inputs",
              );

              const arazzo = new Arazzo(
                "./test/mocks/single-workflow/multiple-steps/arazzoMock-user-single-workflow-multiple-step.json",
                "arazzo",
                { logger: logger, parser },
              );
              arazzo.setMainArazzo();

              try {
                await arazzo.runWorkflows(inputFile);
              } catch (err) {
                expect(err).to.not.be.instanceOf(Error);
              }
            });

            it(`resolves and can use outputs from other steps output`, async function () {
              nock("https://raw.githubusercontent.com:443", {
                encodedQueryParams: true,
              })
                .get(
                  "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                )
                .reply(
                  200,
                  [
                    "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                  ],
                  {
                    "accept-ranges": "bytes",
                    "access-control-allow-origin": "*",
                    "cache-control": "max-age=300",
                    connection: "keep-alive",
                    "content-encoding": "gzip",
                    "content-length": "1638",
                    "content-security-policy":
                      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                    "content-type": "text/plain; charset=utf-8",
                    "cross-origin-resource-policy": "cross-origin",
                    date: "Tue, 06 Jan 2026 19:19:56 GMT",
                    etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                    expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                    "source-age": "0",
                    "strict-transport-security": "max-age=31536000",
                    vary: "Authorization,Accept-Encoding",
                    via: "1.1 varnish",
                    "x-cache": "HIT",
                    "x-cache-hits": "0",
                    "x-content-type-options": "nosniff",
                    "x-fastly-request-id":
                      "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                    "x-frame-options": "deny",
                    "x-github-request-id": "8DCE:156854:683A3:BD766:695D41E9",
                    "x-served-by": "cache-lhr-egll1980052-LHR",
                    "x-timer": "S1767727197.761065,VS0,VE107",
                    "x-xss-protection": "1; mode=block",
                  },
                );

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .post("/v2/user", "[object Object]")
                .reply(404, { username: "FatBoyS" });

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .get("/v2/user/FatBoyS")
                .reply(0, { id: 123 });

              const inputFile = new Input(
                "./test/mocks/inputs/userInput.json",
                "inputs",
              );

              const arazzo = new Arazzo(
                "./test/mocks/single-workflow/multiple-steps/arazzoMock-user-single-workflow-multiple-step-using-output-from-oneStep.json",
                "arazzo",
                { logger: logger, parser },
              );
              arazzo.setMainArazzo();

              try {
                await arazzo.runWorkflows(inputFile);
              } catch (err) {
                console.error(err);
                expect(err).to.not.be.instanceOf(Error);
              }
            });
          });

          describe(`with successCriteria`, function () {
            it(`throws an error if the successCriteria are not all met`, async function () {
              nock("https://raw.githubusercontent.com:443", {
                encodedQueryParams: true,
              })
                .get(
                  "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                )
                .reply(
                  200,
                  [
                    "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                  ],
                  {
                    "accept-ranges": "bytes",
                    "access-control-allow-origin": "*",
                    "cache-control": "max-age=300",
                    connection: "keep-alive",
                    "content-encoding": "gzip",
                    "content-length": "1638",
                    "content-security-policy":
                      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                    "content-type": "text/plain; charset=utf-8",
                    "cross-origin-resource-policy": "cross-origin",
                    date: "Tue, 06 Jan 2026 19:19:56 GMT",
                    etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                    expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                    "source-age": "0",
                    "strict-transport-security": "max-age=31536000",
                    vary: "Authorization,Accept-Encoding",
                    via: "1.1 varnish",
                    "x-cache": "HIT",
                    "x-cache-hits": "0",
                    "x-content-type-options": "nosniff",
                    "x-fastly-request-id":
                      "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                    "x-frame-options": "deny",
                    "x-github-request-id": "8DCE:156854:683A3:BD766:695D41E9",
                    "x-served-by": "cache-lhr-egll1980052-LHR",
                    "x-timer": "S1767727197.761065,VS0,VE107",
                    "x-xss-protection": "1; mode=block",
                  },
                );

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .post("/v2/user", "[object Object]")
                .reply(404, { id: 123 });

              const inputFile = new Input(
                "./test/mocks/inputs/userInput.json",
                "inputs",
              );

              const arazzo = new Arazzo(
                "./test/mocks/single-workflow/multiple-steps/arazzoMock-user-single-workflow-multiple-step-with-successCriteria.json",
                "arazzo",
                { logger: logger, parser },
              );
              arazzo.setMainArazzo();

              try {
                await arazzo.runWorkflows(inputFile);
                throw new Error("Expected promise to reject but it resolved");
              } catch (err) {
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.be.equal(
                  `createAUser step of the createUserMultiStep workflow failed the successCriteria`,
                );
              }
            });

            it(`resolves if the successCriteria are all met`, async function () {
              nock("https://raw.githubusercontent.com:443", {
                encodedQueryParams: true,
              })
                .get(
                  "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                )
                .reply(
                  200,
                  [
                    "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                  ],
                  {
                    "accept-ranges": "bytes",
                    "access-control-allow-origin": "*",
                    "cache-control": "max-age=300",
                    connection: "keep-alive",
                    "content-encoding": "gzip",
                    "content-length": "1638",
                    "content-security-policy":
                      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                    "content-type": "text/plain; charset=utf-8",
                    "cross-origin-resource-policy": "cross-origin",
                    date: "Tue, 06 Jan 2026 19:19:56 GMT",
                    etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                    expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                    "source-age": "0",
                    "strict-transport-security": "max-age=31536000",
                    vary: "Authorization,Accept-Encoding",
                    via: "1.1 varnish",
                    "x-cache": "HIT",
                    "x-cache-hits": "0",
                    "x-content-type-options": "nosniff",
                    "x-fastly-request-id":
                      "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                    "x-frame-options": "deny",
                    "x-github-request-id": "8DCE:156854:683A3:BD766:695D41E9",
                    "x-served-by": "cache-lhr-egll1980052-LHR",
                    "x-timer": "S1767727197.761065,VS0,VE107",
                    "x-xss-protection": "1; mode=block",
                  },
                );

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .post("/v2/user", "[object Object]")
                .reply(201, { username: "FatBoyS" });

              nock("http://petstore.swagger.io:80", {
                encodedQueryParams: true,
              })
                .get("/v2/user/FatBoyS")
                .reply(0, { id: 123 });

              const inputFile = new Input(
                "./test/mocks/inputs/userInput.json",
                "inputs",
              );

              const arazzo = new Arazzo(
                "./test/mocks/single-workflow/multiple-steps/arazzoMock-user-single-workflow-multiple-step-with-successCriteria.json",
                "arazzo",
                { logger: logger, parser },
              );
              arazzo.setMainArazzo();

              try {
                await arazzo.runWorkflows(inputFile);
              } catch (err) {
                expect(err).to.not.be.instanceOf(Error);
              }
            });

            xdescribe(`with onFailure`, function () {
              describe(`single onFailure`, function () {
                describe(`onFailure without criteria`, function () {
                  it(`resolves when onFailure is set to end`, async function () {
                    nock("https://raw.githubusercontent.com:443", {
                      encodedQueryParams: true,
                    })
                      .get(
                        "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                      )
                      .reply(
                        200,
                        [
                          "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                        ],
                        {
                          "accept-ranges": "bytes",
                          "access-control-allow-origin": "*",
                          "cache-control": "max-age=300",
                          connection: "keep-alive",
                          "content-encoding": "gzip",
                          "content-length": "1638",
                          "content-security-policy":
                            "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                          "content-type": "text/plain; charset=utf-8",
                          "cross-origin-resource-policy": "cross-origin",
                          date: "Tue, 06 Jan 2026 19:19:56 GMT",
                          etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                          expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                          "source-age": "0",
                          "strict-transport-security": "max-age=31536000",
                          vary: "Authorization,Accept-Encoding",
                          via: "1.1 varnish",
                          "x-cache": "HIT",
                          "x-cache-hits": "0",
                          "x-content-type-options": "nosniff",
                          "x-fastly-request-id":
                            "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                          "x-frame-options": "deny",
                          "x-github-request-id":
                            "8DCE:156854:683A3:BD766:695D41E9",
                          "x-served-by": "cache-lhr-egll1980052-LHR",
                          "x-timer": "S1767727197.761065,VS0,VE107",
                          "x-xss-protection": "1; mode=block",
                        },
                      );

                    nock("http://petstore.swagger.io:80", {
                      encodedQueryParams: true,
                    })
                      .post("/v2/user", "[object Object]")
                      .reply(201, { id: 123 });

                    const inputFile = new Input(
                      "./test/mocks/inputs/userInput.json",
                      "inputs",
                    );

                    const arazzo = new Arazzo(
                      "./test/mocks/single-workflow/single-step/arazzoMock-user-single-workflow-single-step-with-successCriteria-and-onFailure-set-to-end.json",
                      "arazzo",
                      { logger: logger, parser },
                    );
                    arazzo.setMainArazzo();

                    try {
                      await arazzo.runWorkflows(inputFile);
                    } catch (err) {
                      expect(err).to.not.be.instanceOf(Error);
                    }
                  });

                  it(`retries when onFailure is set to retry and no retryLimit is set`, async function () {
                    nock("https://raw.githubusercontent.com:443", {
                      encodedQueryParams: true,
                    })
                      .get(
                        "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                      )
                      .reply(
                        200,
                        [
                          "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                        ],
                        {
                          "accept-ranges": "bytes",
                          "access-control-allow-origin": "*",
                          "cache-control": "max-age=300",
                          connection: "keep-alive",
                          "content-encoding": "gzip",
                          "content-length": "1638",
                          "content-security-policy":
                            "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                          "content-type": "text/plain; charset=utf-8",
                          "cross-origin-resource-policy": "cross-origin",
                          date: "Tue, 06 Jan 2026 19:19:56 GMT",
                          etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                          expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                          "source-age": "0",
                          "strict-transport-security": "max-age=31536000",
                          vary: "Authorization,Accept-Encoding",
                          via: "1.1 varnish",
                          "x-cache": "HIT",
                          "x-cache-hits": "0",
                          "x-content-type-options": "nosniff",
                          "x-fastly-request-id":
                            "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                          "x-frame-options": "deny",
                          "x-github-request-id":
                            "8DCE:156854:683A3:BD766:695D41E9",
                          "x-served-by": "cache-lhr-egll1980052-LHR",
                          "x-timer": "S1767727197.761065,VS0,VE107",
                          "x-xss-protection": "1; mode=block",
                        },
                      );

                    nock("http://petstore.swagger.io:80", {
                      encodedQueryParams: true,
                    })
                      .post("/v2/user", "[object Object]")
                      .times(2)
                      .reply(201, { id: 123 });

                    const inputFile = new Input(
                      "./test/mocks/inputs/userInput.json",
                      "inputs",
                    );

                    const arazzo = new Arazzo(
                      "./test/mocks/single-workflow/single-step/arazzoMock-user-single-workflow-single-step-with-successCriteria-and-onFailure-set-to-retry.json",
                      "arazzo",
                      { logger: logger, parser },
                    );
                    arazzo.setMainArazzo();

                    try {
                      await arazzo.runWorkflows(inputFile);
                      throw new Error(
                        "Expected promise to reject but it resolved",
                      );
                    } catch (err) {
                      expect(err).to.be.instanceOf(Error);
                      expect(err.message).to.be.equal(
                        `createAUser step of the createUser workflow failed the successCriteria`,
                      );
                    }
                  });

                  xit(`retries when onFailure is set to retry and retries the max times when retryLimit is set`, async function () {
                    nock("https://raw.githubusercontent.com:443", {
                      encodedQueryParams: true,
                    })
                      .get(
                        "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                      )
                      .reply(
                        200,
                        [
                          "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                        ],
                        {
                          "accept-ranges": "bytes",
                          "access-control-allow-origin": "*",
                          "cache-control": "max-age=300",
                          connection: "keep-alive",
                          "content-encoding": "gzip",
                          "content-length": "1638",
                          "content-security-policy":
                            "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                          "content-type": "text/plain; charset=utf-8",
                          "cross-origin-resource-policy": "cross-origin",
                          date: "Tue, 06 Jan 2026 19:19:56 GMT",
                          etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                          expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                          "source-age": "0",
                          "strict-transport-security": "max-age=31536000",
                          vary: "Authorization,Accept-Encoding",
                          via: "1.1 varnish",
                          "x-cache": "HIT",
                          "x-cache-hits": "0",
                          "x-content-type-options": "nosniff",
                          "x-fastly-request-id":
                            "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                          "x-frame-options": "deny",
                          "x-github-request-id":
                            "8DCE:156854:683A3:BD766:695D41E9",
                          "x-served-by": "cache-lhr-egll1980052-LHR",
                          "x-timer": "S1767727197.761065,VS0,VE107",
                          "x-xss-protection": "1; mode=block",
                        },
                      );

                    nock("http://petstore.swagger.io:80", {
                      encodedQueryParams: true,
                    })
                      .post("/v2/user", "[object Object]")
                      .reply(201, { id: 123 });

                    const inputFile = new Input(
                      "./test/mocks/inputs/userInput.json",
                      "inputs",
                    );

                    const arazzo = new Arazzo(
                      "./test/mocks/single-workflow/single-step/arazzoMock-user-single-workflow-single-step-with-successCriteria-and-onFailure-set-to-retry.json",
                      "arazzo",
                      { logger: logger, parser },
                    );
                    arazzo.setMainArazzo();

                    try {
                      await arazzo.runWorkflows(inputFile);
                      throw new Error(
                        "Expected promise to reject but it resolved",
                      );
                    } catch (err) {
                      expect(err).to.be.instanceOf(Error);
                      expect(err.message).to.be.equal(
                        `createAUser step of the createUser workflow failed the successCriteria`,
                      );
                    }
                  });
                });

                xdescribe(`onFailure with criteria`, function () {
                  xit(`resolves when onFailure is set to end and matches the criteria`, async function () {
                    nock("https://raw.githubusercontent.com:443", {
                      encodedQueryParams: true,
                    })
                      .get(
                        "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                      )
                      .reply(
                        200,
                        [
                          "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                        ],
                        {
                          "accept-ranges": "bytes",
                          "access-control-allow-origin": "*",
                          "cache-control": "max-age=300",
                          connection: "keep-alive",
                          "content-encoding": "gzip",
                          "content-length": "1638",
                          "content-security-policy":
                            "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                          "content-type": "text/plain; charset=utf-8",
                          "cross-origin-resource-policy": "cross-origin",
                          date: "Tue, 06 Jan 2026 19:19:56 GMT",
                          etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                          expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                          "source-age": "0",
                          "strict-transport-security": "max-age=31536000",
                          vary: "Authorization,Accept-Encoding",
                          via: "1.1 varnish",
                          "x-cache": "HIT",
                          "x-cache-hits": "0",
                          "x-content-type-options": "nosniff",
                          "x-fastly-request-id":
                            "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                          "x-frame-options": "deny",
                          "x-github-request-id":
                            "8DCE:156854:683A3:BD766:695D41E9",
                          "x-served-by": "cache-lhr-egll1980052-LHR",
                          "x-timer": "S1767727197.761065,VS0,VE107",
                          "x-xss-protection": "1; mode=block",
                        },
                      );

                    nock("http://petstore.swagger.io:80", {
                      encodedQueryParams: true,
                    })
                      .post("/v2/user", "[object Object]")
                      .reply(201, { id: 123 });

                    const inputFile = new Input(
                      "./test/mocks/inputs/userInput.json",
                      "inputs",
                    );

                    const arazzo = new Arazzo(
                      "./test/mocks/single-workflow/single-step/arazzoMock-user-single-workflow-single-step-with-successCriteria.json",
                      "arazzo",
                      { logger: logger, parser },
                    );
                    arazzo.setMainArazzo();

                    try {
                      await arazzo.runWorkflows(inputFile);
                      throw new Error(
                        "Expected promise to reject but it resolved",
                      );
                    } catch (err) {
                      expect(err).to.be.instanceOf(Error);
                      expect(err.message).to.be.equal(
                        `createAUser step of the createUser workflow failed the successCriteria`,
                      );
                    }
                  });

                  xit(`retries when onFailure is set to retry and matches the criteria`, async function () {
                    nock("https://raw.githubusercontent.com:443", {
                      encodedQueryParams: true,
                    })
                      .get(
                        "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
                      )
                      .reply(
                        200,
                        [
                          "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
                        ],
                        {
                          "accept-ranges": "bytes",
                          "access-control-allow-origin": "*",
                          "cache-control": "max-age=300",
                          connection: "keep-alive",
                          "content-encoding": "gzip",
                          "content-length": "1638",
                          "content-security-policy":
                            "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                          "content-type": "text/plain; charset=utf-8",
                          "cross-origin-resource-policy": "cross-origin",
                          date: "Tue, 06 Jan 2026 19:19:56 GMT",
                          etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                          expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                          "source-age": "0",
                          "strict-transport-security": "max-age=31536000",
                          vary: "Authorization,Accept-Encoding",
                          via: "1.1 varnish",
                          "x-cache": "HIT",
                          "x-cache-hits": "0",
                          "x-content-type-options": "nosniff",
                          "x-fastly-request-id":
                            "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                          "x-frame-options": "deny",
                          "x-github-request-id":
                            "8DCE:156854:683A3:BD766:695D41E9",
                          "x-served-by": "cache-lhr-egll1980052-LHR",
                          "x-timer": "S1767727197.761065,VS0,VE107",
                          "x-xss-protection": "1; mode=block",
                        },
                      );

                    nock("http://petstore.swagger.io:80", {
                      encodedQueryParams: true,
                    })
                      .post("/v2/user", "[object Object]")
                      .reply(201, { id: 123 });

                    const inputFile = new Input(
                      "./test/mocks/inputs/userInput.json",
                      "inputs",
                    );

                    const arazzo = new Arazzo(
                      "./test/mocks/single-workflow/single-step/arazzoMock-user-single-workflow-single-step-with-successCriteria-and-onFailure-set-to-retry.json",
                      "arazzo",
                      { logger: logger, parser },
                    );
                    arazzo.setMainArazzo();

                    try {
                      await arazzo.runWorkflows(inputFile);
                      throw new Error(
                        "Expected promise to reject but it resolved",
                      );
                    } catch (err) {
                      expect(err).to.be.instanceOf(Error);
                      expect(err.message).to.be.equal(
                        `createAUser step of the createUser workflow failed the successCriteria`,
                      );
                    }
                  });
                });
              });

              describe(`multiple onFailure`, function () {});
            });

            xdescribe(`with onSuccess`, () => {});
          });
        });
      });

      describe(`multiple workflows`, function () {
        it(`resolve all the outputs resolve as expected`, async function () {
          // nock.recorder.rec()
          nock("https://raw.githubusercontent.com:443", {
            encodedQueryParams: true,
          })
            .get(
              "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
            )
            .reply(
              200,
              [
                "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
              ],
              {
                "accept-ranges": "bytes",
                "access-control-allow-origin": "*",
                "cache-control": "max-age=300",
                connection: "keep-alive",
                "content-encoding": "gzip",
                "content-length": "1638",
                "content-security-policy":
                  "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                "content-type": "text/plain; charset=utf-8",
                "cross-origin-resource-policy": "cross-origin",
                date: "Tue, 06 Jan 2026 19:19:56 GMT",
                etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                expires: "Tue, 06 Jan 2026 19:24:56 GMT",
                "source-age": "0",
                "strict-transport-security": "max-age=31536000",
                vary: "Authorization,Accept-Encoding",
                via: "1.1 varnish",
                "x-cache": "HIT",
                "x-cache-hits": "0",
                "x-content-type-options": "nosniff",
                "x-fastly-request-id":
                  "6345964a5ff2dfaf90e7f710c781377e2f0b2a7e",
                "x-frame-options": "deny",
                "x-github-request-id": "8DCE:156854:683A3:BD766:695D41E9",
                "x-served-by": "cache-lhr-egll1980052-LHR",
                "x-timer": "S1767727197.761065,VS0,VE107",
                "x-xss-protection": "1; mode=block",
              },
            );

          nock("http://petstore.swagger.io:80", { encodedQueryParams: true })
            .post("/v2/user", "[object Object]")
            .reply(201, { username: "FatBoyS" });

          nock("http://petstore.swagger.io:80", { encodedQueryParams: true })
            .post("/v2/user/login", "[object Object]")
            .reply(200, { AccessToken: "abc-def.123" });

          const inputFile = new Input(
            "./test/mocks/inputs/userInput.json",
            "inputs",
          );

          const arazzo = new Arazzo(
            "./test/mocks/multiple-workflows/single-sourceDescription/arazzoMock-user-multiple-workflow-multiple-step.json",
            "arazzo",
            { logger: logger, parser },
          );
          arazzo.setMainArazzo();

          const spy = sinon.spy(arazzo, "runOperation");

          try {
            await arazzo.runWorkflows(inputFile);
            expect(spy.callCount).to.be.equal(2);
          } catch (err) {
            console.error(err);
            expect(err).to.not.be.instanceOf(Error);
          }

          spy.restore();
        });
      });

      xdescribe(`singular step`, function () {
        xit(`return successfully when there are no more steps to run`, async function () {
          nock("https://raw.githubusercontent.com:443", {
            encodedQueryParams: true,
          })
            .get(
              "/readmeio/oas-examples/refs/heads/main/3.1/json/petstore.json",
            )
            .reply(
              200,
              [
                "1f8b0800000000000013ed5ddd73dbb8117ff75fb1c3eb436fc696ec5cda074faf53274e3a9a4b134f1cb7d7c964ee607245e142020c004a5633fedf3b00488ae0b7be1c39c93df8241104f60bbf5d2c16c8e723008f27c84842bd73f07e1a9d8d4ebd63fd2b6553ee9dc3e72300002f40e90b9a28ca996ef76e46255009042489930841a298a3802b545271917f1f01fc97a7e0130653ca02e0a982583f26b7fae3f58284210a200adecf944acec763697f1a51fee1cfb59f7e042e8033784f853f9a0a44c6031c3154c7f043d6aae1ad3115fef8c711c04b2e4069c22dcdc7b0cc684b25829a219084c2475cc2ef32419f92e8e4232e7f07c541a154b645aa665cd0ff112d0898d248a190232330006f8e4266023a1b9d668204f0145511ea5f73867331150d50c4f2cdf41ac59cfaa6659d0bd3669cbfe173a688af0a05017818131ae97749421592f81fab973dd3e63e7b37a23e3289e5771989cdb01709f167084f0ada01bc5444258a168bc5889856232ec271d6971cbf9a3c7ff1fafac5c993d1e968a6e2281bf2281bd6b30621bd73786f9e7c6eee3ec924332a713e7fb2eaec83e90cef140a46a24beecb561b7dd96e71b914ddb15d7959b215091b68cec595a05ac9a932fc8b398aa59a511666632f796a35bf7aa5918f5e5e8af77b38c8655668be467fd908eb835ef83e4aa9edbf98d65c045a899d9da6b21070bdcf37090a3379642615b7f56602c9bad2f275391a2ea0c2b412a266259bd206599e280997ca252cb710630c1f4a23cb348e89581a4906011060b8800495019419d649adb0587ec473b14d0233c383e0aa647a866c416254d90c2b932150265c4f51876c00efe9e95f2a3fd56998b0398968009425a9f24a4def8bcff76596d14f0555cb62c6d8ff2a63e473fc378da646740b41159e27666e688a4960bf7c681cd1e5ee538a523de3c1b2cadf9f044e350f3f8c7d1e279c215372bc6a4f518eb5108faa03140c799ae7b5757d9304442110067847a5d2f33f7175355ccfa9e96b17aa3e1daceac925c83449228a81a3f063b7c3a7bd1d5ea102c6154c79ca3abbea37c37f6bcaaccfc53b1fedefdf88353aae5bc3d1588752cf96d78aa8b4ac692fc40dcc5503a934000fb74b90b6d37663fd571a296a023ed312e6244a519a28ea1621117c4e030c6041d50c7c1ec704246a835518805482b25076d8bbe64c935270d76af6edfa5cf9b64a0fe629355c7c4a512cab8f2a9c5e3b0caa1951c010038ddeb7083e6792062830802917592458ed51ab970ad4ac299162e529de25110fb0f9a1f4671893dac4d04a5d26863f2204a9f2a019541857e77fe54dab87daab9a2496c6c660c89cd088dc46a86740822c302f80277914942da924bc29492365082bdead34bb3f6afbd6369b5ae0ecc9003893a9895ea66904859155f5a3836864aa49ca4423a06fde1adfc551b3405b9504fd8a826e65412b66d8412b68d12cd6e65fee6b365366f60f69e4f7f570db6e74153734dc4596b1ef60dc509fbf78679dc12ebd8579a3d3571857a19bade521467023cd6b67c7faef13f3f72703b47a254e59381ae444de55e85bd78554f883f51c881e5d7b0beb1be0b6d6feb0ddc377f03e4838fb0ede7539ac05de8a840786dc0e8226027d8d85d9bc6f47f5cf09aa4970bf1348376989db254c2e3be0fc2daa543093f3a52c8cb0baacadc07088ea0ad5b3e524d806820d93cd18ac33353d103cb9043ecd732ec2d0bf1e08f7e32c650ac35ae80fe04db98889ca9afcf5a9d76eca5f237eae8f070f83743ba06b0f98f4d03997d56a6db01de5f6b82bd42409fded239a463d01ed2a1db751eed5e6e3346c691ca06c957bb531a89ea7101045b64cd1fd87aad94b2ee28340bb3c5b21b37485a5b2d6f5a303bfaf3d67dd06ca2e249f2c168b132de2935444c87c1e1815d6d4d40185850af9ed1fe8aba6645022b4a92b5ad342d12233db9690b0a2163b0f03d02f693bd5d3d08d201ae96b5e8d409383b03c57d3a2c3a8ca96f43ba16b1b177254fdb482bf002354b83e005e9af73200dc0ce4ecd09dfb10fde096237e23bccd90049d09d42989e4fa00d5a4a55697bd1750d61e999aac71a6bfc70fc10715d77c494c3f2affd2b4381ba749c449308949e8945b6c16c9d8cea4de5aa4a6c70d0316ddcb4b1ae141442a3c8b4d1efdbc78e075d95e164017097ddb10e7d76553ffdee2c51e75a0c57d85ea442a8124de34be6adf6c5b19e22d657a8a6f1325b810642438a66c8e4c715166be234764eb515ab0274ffed83594ed97e2b03de355e22826899ef859b0a5e356b340f99412a6a889343bf3499382a1edca211ec954ed0dd1c15402513d0889aefac2f501e098357320f2a7277b0c72f79836689a11a67c6da023ee9c0e5711f14d8d8fe9d1ec4c6d115e27bab737c20d801f8161ef233768c5d06f5d0f9f1d1c4ad9b0c5c65a71746de8e629b4adbf6b115ba79f5b5f6443055491859d6966aad89a9b2415fe8ce8bd88c6357b35821ce633cd28e3cfe67f8377573aa1c2eeaf585ab302dadead165da96e359f4f75506209196cc3e452dadca5d9c782bfff0c674058007ffb19ce4e47f046cd50e4854b0b1a45102243bbc35e94cff5b85aa3b96d376f3229ee23a13945e5cfbe6042b3d620a68cc6a67aeaacfe8cdce5cf4e1fe972e33bd43fb6ad20c3436fd2e4a8d27d7796b113e86c9e715f50977049159d63f1c4e0db085e6348ccef5c33cb4e9cc715f8838bab09a0105c74a19f95404f38f650e0a73d9b15640d022d9d870981bb42b9473073dc28c21c6719b6c0304d5be6d27381da5e9dc3312da7f074611d67d1d2980467680af36608110f43d4bb60a697ae8239df0c7623b75e7e6cb0adbcf24b8f2fba3512db4d706bf51d185541c37a7fdd6056f733b67ad5fbd217a6ae6b57662921a2526974d26d337c0ee91c99dd73856a19d91a4be1952dca82f089d9c87da4a639e0dc87e6d66a684db5bea28e161f8d5635dddf95ea2835e2212da353c76ab34b95af78282d8850961f335c4a85f1667a3354753b86fe404893633e374642832aa967d615dada01bdf6b7e2da71e4b393cd6222e5828b96b06f28b3792f2b5eb51ff72324ba02feae9a0bde3fe7eb456dbb5a9bdaa280a67cb6f7ebc95ba2f0e4158d69d3dab53e9e4fa2486f5f0898e973c2248af802833c58aa045afda273c4d7954eef4fa6f7af777f3d7971975081f2e462aa9cf8b29d5f73089532b879f71c163364a0f847d4c7274d479bf3daba9fe5b0aa473f51345e7f1bf141d3137dc53c0f5b7d3f988a8131e63a8ba71ca4c705f434aea586fa32ee9c9cdec699e983fd7e2a04325559d28044295dd458cfb5f1541de6a2a743b69f73450d4c4d77c9f79f68af5fd02058b8d7cda419a211e5b3e5eb4a17bb0d1606a44db4fb3461425bcad81e2ed3e39c3927cae01b71aa5f30e1dbb4603e887cef40c2f688bb3b4a5dddc84d72beedf75c74c1475e3afb30492a5b25b6dfb5c8007871a165bfd5f53b069075cdf2214df21b49f395a7cc6669be61fb345dd336dba67998596ba9fce2b3b63d28d8d326ca179eba5fcaa31ce57fede569abc9540c93c9ceb989e04da52aababf4adfd548a47eb67607a56e85db5c0aea46cb9f3debacf0a20ab80b7e6086e72c11d41ce6872492a80010d26db3a40e392be3248f3d99b9e211a77df6af7ff98a6c5fd34b60c48d70393445f29613f0718d1b9be93c7ad0d7668d43659434e87ca5bce2324b5b879b5ce3347517afd583d802ef0ac525e5007f7e74461e816ee1ee0a4683cfed501816bcba9104387a86ee4a16347e1bdd61195d3c3940aa95e6fd54544b6ed21bf5e74c3d78bc4f8e63dcc38db827ead86da9d69953e06a26c3780198f998db48df5bb7167ddf2df91f0b00d7feff8a025d021a0ab5a56ac5540a578efbdedfed8189ce23722924e28bd5759d6c25012bc61d1b2ba1ca839b5267f01bd2b9b3abe6ea4c2aa93be33d72b9b98818721ed081856126e1da3e94a9a069b28535b745b2f515a089224f5e5558db28e0b6f36db2eccd7663be45291fa36cc4e18ecb41967ce75b3bc93705057ff66e785ca7737b44686dd37176e83363d97c596cfce6d0dcbbebdf96b4f8b81ac9f0d1d698c52bae759fb3ba8cbeda8d4b1e7944e94978635086f4e01f527803ad6eceb5d09d36eee7dd9f3fd90d068c50da7a7adf5d5132024086c1eb3f14aeae67c941b7d578bcbf6a3a5cdefb5db65726f88b45f95caa8ea49be36913af3213f0b77ada9746744f57c6c13d0e847e528d59b467c510f5762ad8d86f209cff9570e6e7aefe737e38d034a225e4373e9f3a4f14462f958ef3978310fe874a9cf7a189c3777e513dfe729ab1f7c2c9d013eb75f6c7bf3cb10ddd5cc7875aab0419c24a1bf38d75674dc68e1de66e1ea56a7c58eee8ffe0fa561a61773630000",
              ],
              {
                "accept-ranges": "bytes",
                "access-control-allow-origin": "*",
                "cache-control": "max-age=300",
                connection: "keep-alive",
                "content-encoding": "gzip",
                "content-length": "3189",
                "content-security-policy":
                  "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                "content-type": "text/plain; charset=utf-8",
                "cross-origin-resource-policy": "cross-origin",
                date: "Fri, 02 Jan 2026 12:03:42 GMT",
                etag: 'W/"6f618be854ed64cd6a2cb850eefecf34866e637d9e73287a9d9d64a8ca3d54b3"',
                expires: "Fri, 02 Jan 2026 12:08:42 GMT",
                "source-age": "0",
                "strict-transport-security": "max-age=31536000",
                vary: "Authorization,Accept-Encoding",
                via: "1.1 varnish",
                "x-cache": "HIT",
                "x-cache-hits": "1",
                "x-content-type-options": "nosniff",
                "x-fastly-request-id":
                  "e357bbd9481ed9b72541f1d5e4d6c921c6dbf9be",
                "x-frame-options": "deny",
                "x-github-request-id": "9733:2549FA:1BB33B8:30A9114:6957ADA3",
                "x-served-by": "cache-lhr-egll1980089-LHR",
                "x-timer": "S1767355422.386688,VS0,VE1",
                "x-xss-protection": "1; mode=block",
              },
            );

          nock("http://petstore.swagger.io:80", { encodedQueryParams: true })
            .get("/v2/pet/findByStatus")
            .query({ status: "pending" })
            .reply(
              200,
              [
                {
                  id: 9515,
                  category: { id: 7792, name: "string" },
                  name: "doggie",
                  photoUrls: ["string", "string"],
                  tags: [
                    { id: 7284, name: "string" },
                    { id: 9936, name: "string" },
                  ],
                  status: "pending",
                },
                {
                  id: 1109,
                  name: "Test9_02012026",
                  photoUrls: [],
                  tags: [],
                  status: "pending",
                },
                {
                  id: 1003,
                  name: "Lucy",
                  photoUrls: ["url1"],
                  tags: [],
                  status: "pending",
                },
                {
                  id: 5619,
                  category: { id: 5381, name: "string" },
                  name: "doggie",
                  photoUrls: ["string", "string"],
                  tags: [
                    { id: 9192, name: "string" },
                    { id: 8297, name: "string" },
                  ],
                  status: "pending",
                },
                {
                  id: 100002,
                  name: "Simple Cat",
                  photoUrls: ["https://example.com/cat.jpg"],
                  tags: [],
                  status: "pending",
                },
                {
                  id: 922337203685477600,
                  name: "chedder-89811222",
                  photoUrls: ["./dog.png"],
                  tags: [],
                  status: "pending",
                },
                {
                  id: 1088293,
                  category: { id: 1, name: "Dogs" },
                  name: "UpdatedWorkflowDog-1088293",
                  photoUrls: ["https://example.com/photo1.jpg"],
                  tags: [{ id: 1, name: "test-tag" }],
                  status: "pending",
                },
                {
                  id: 745215,
                  category: { id: 1, name: "Dogs" },
                  name: "UpdatedWorkflowDog-745215",
                  photoUrls: ["https://example.com/photo1.jpg"],
                  tags: [{ id: 1, name: "test-tag" }],
                  status: "pending",
                },
              ],
              {
                "access-control-allow-headers":
                  "Content-Type, api_key, Authorization",
                "access-control-allow-methods": "GET, POST, DELETE, PUT",
                "access-control-allow-origin": "*",
                connection: "keep-alive",
                "content-type": "application/json",
                date: "Fri, 02 Jan 2026 13:05:43 GMT",
                server: "Jetty(9.2.9.v20150224)",
                "transfer-encoding": "chunked",
              },
            );

          const inputFile = new Input(
            "./test/mocks/inputs/validInput.json",
            "inputs",
          );

          const arazzo = new Arazzo(
            "./test/mocks/workingArazzoMock.json",
            "arazzo",
            { logger: logger, parser },
          );
          arazzo.setMainArazzo();

          try {
            const expected = await arazzo.runWorkflows(inputFile);
            console.log(expected);
          } catch (err) {
            expect(err).to.not.be.instanceOf(Error);
          }
        });
      });

      xdescribe(`multiple Steps in one workflow`, function () {
        it(`returns successfully when there are no more steps to run`, async function () {
          nock.recorder.rec();

          // nock('https://raw.githubusercontent.com:443', {"encodedQueryParams":true})
          //     .get('/readmeio/oas-examples/refs/heads/main/3.1/json/petstore.json')
          //     .reply(200, ["1f8b0800000000000013ed5ddd73dbb8117ff75fb1c3eb436fc696ec5cda074faf53274e3a9a4b134f1cb7d7c964ee607245e142020c004a5633fedf3b00488ae0b7be1c39c93df8241104f60bbf5d2c16c8e723008f27c84842bd73f07e1a9d8d4ebd63fd2b6553ee9dc3e72300002f40e90b9a28ca996ef76e46255009042489930841a298a3802b545271917f1f01fc97a7e0130653ca02e0a982583f26b7fae3f58284210a200adecf944acec763697f1a51fee1cfb59f7e042e8033784f853f9a0a44c6031c3154c7f043d6aae1ad3115fef8c711c04b2e4069c22dcdc7b0cc684b25829a219084c2475cc2ef32419f92e8e4232e7f07c541a154b645aa665cd0ff112d0898d248a190232330006f8e4266023a1b9d668204f0145511ea5f73867331150d50c4f2cdf41ac59cfaa6659d0bd3669cbfe173a688af0a05017818131ae97749421592f81fab973dd3e63e7b37a23e3289e5771989cdb01709f167084f0ada01bc5444258a168bc5889856232ec271d6971cbf9a3c7ff1fafac5c993d1e968a6e2281bf2281bd6b30621bd73786f9e7c6eee3ec924332a713e7fb2eaec83e90cef140a46a24beecb561b7dd96e71b914ddb15d7959b215091b68cec595a05ac9a932fc8b398aa59a511666632f796a35bf7aa5918f5e5e8af77b38c8655668be467fd908eb835ef83e4aa9edbf98d65c045a899d9da6b21070bdcf37090a3379642615b7f56602c9bad2f275391a2ea0c2b412a266259bd206599e280997ca252cb710630c1f4a23cb348e89581a4906011060b8800495019419d649adb0587ec473b14d0233c383e0aa647a866c416254d90c2b932150265c4f51876c00efe9e95f2a3fd56998b0398968009425a9f24a4def8bcff76596d14f0555cb62c6d8ff2a63e473fc378da646740b41159e27666e688a4960bf7c681cd1e5ee538a523de3c1b2cadf9f044e350f3f8c7d1e279c215372bc6a4f518eb5108faa03140c799ae7b5757d9304442110067847a5d2f33f7175355ccfa9e96b17aa3e1daceac925c83449228a81a3f063b7c3a7bd1d5ea102c6154c79ca3abbea37c37f6bcaaccfc53b1fedefdf88353aae5bc3d1588752cf96d78aa8b4ac692fc40dcc5503a934000fb74b90b6d37663fd571a296a023ed312e6244a519a28ea1621117c4e030c6041d50c7c1ec704246a835518805482b25076d8bbe64c935270d76af6edfa5cf9b64a0fe629355c7c4a512cab8f2a9c5e3b0caa1951c010038ddeb7083e6792062830802917592458ed51ab970ad4ac299162e529de25110fb0f9a1f4671893dac4d04a5d26863f2204a9f2a019541857e77fe54dab87daab9a2496c6c660c89cd088dc46a86740822c302f80277914942da924bc29492365082bdead34bb3f6afbd6369b5ae0ecc9003893a9895ea66904859155f5a3836864aa49ca4423a06fde1adfc551b3405b9504fd8a826e65412b66d8412b68d12cd6e65fee6b365366f60f69e4f7f570db6e74153734dc4596b1ef60dc509fbf78679dc12ebd8579a3d3571857a19bade521467023cd6b67c7faef13f3f72703b47a254e59381ae444de55e85bd78554f883f51c881e5d7b0beb1be0b6d6feb0ddc377f03e4838fb0ede7539ac05de8a840786dc0e8226027d8d85d9bc6f47f5cf09aa4970bf1348376989db254c2e3be0fc2daa543093f3a52c8cb0baacadc07088ea0ad5b3e524d806820d93cd18ac33353d103cb9043ecd732ec2d0bf1e08f7e32c650ac35ae80fe04db98889ca9afcf5a9d76eca5f237eae8f070f83743ba06b0f98f4d03997d56a6db01de5f6b82bd42409fded239a463d01ed2a1db751eed5e6e3346c691ca06c957bb531a89ea7101045b64cd1fd87aad94b2ee28340bb3c5b21b37485a5b2d6f5a303bfaf3d67dd06ca2e249f2c168b132de2935444c87c1e1815d6d4d40185850af9ed1fe8aba6645022b4a92b5ad342d12233db9690b0a2163b0f03d02f693bd5d3d08d201ae96b5e8d409383b03c57d3a2c3a8ca96f43ba16b1b177254fdb482bf002354b83e005e9af73200dc0ce4ecd09dfb10fde096237e23bccd90049d09d42989e4fa00d5a4a55697bd1750d61e999aac71a6bfc70fc10715d77c494c3f2affd2b4381ba749c449308949e8945b6c16c9d8cea4de5aa4a6c70d0316ddcb4b1ae141442a3c8b4d1efdbc78e075d95e164017097ddb10e7d76553ffdee2c51e75a0c57d85ea442a8124de34be6adf6c5b19e22d657a8a6f1325b810642438a66c8e4c715166be234764eb515ab0274ffed83594ed97e2b03de355e22826899ef859b0a5e356b340f99412a6a889343bf3499382a1edca211ec954ed0dd1c15402513d0889aefac2f501e098357320f2a7277b0c72f79836689a11a67c6da023ee9c0e5711f14d8d8fe9d1ec4c6d115e27bab737c20d801f8161ef233768c5d06f5d0f9f1d1c4ad9b0c5c65a71746de8e629b4adbf6b115ba79f5b5f6443055491859d6966aad89a9b2415fe8ce8bd88c6357b35821ce633cd28e3cfe67f8377573aa1c2eeaf585ab302dadead165da96e359f4f75506209196cc3e452dadca5d9c782bfff0c674058007ffb19ce4e47f046cd50e4854b0b1a45102243bbc35e94cff5b85aa3b96d376f3229ee23a13945e5cfbe6042b3d620a68cc6a67aeaacfe8cdce5cf4e1fe972e33bd43fb6ad20c3436fd2e4a8d27d7796b113e86c9e715f50977049159d63f1c4e0db085e6348ccef5c33cb4e9cc715f8838bab09a0105c74a19f95404f38f650e0a73d9b15640d022d9d870981bb42b9473073dc28c21c6719b6c0304d5be6d27381da5e9dc3312da7f074611d67d1d2980467680af36608110f43d4bb60a697ae8239df0c7623b75e7e6cb0adbcf24b8f2fba3512db4d706bf51d185541c37a7fdd6056f733b67ad5fbd217a6ae6b57662921a2526974d26d337c0ee91c99dd73856a19d91a4be1952dca82f089d9c87da4a639e0dc87e6d66a684db5bea28e161f8d5635dddf95ea2835e2212da353c76ab34b95af78282d8850961f335c4a85f1667a3354753b86fe404893633e374642832aa967d615dada01bdf6b7e2da71e4b393cd6222e5828b96b06f28b3792f2b5eb51ff72324ba02feae9a0bde3fe7eb456dbb5a9bdaa280a67cb6f7ebc95ba2f0e4158d69d3dab53e9e4fa2486f5f0898e973c2248af802833c58aa045afda273c4d7954eef4fa6f7af777f3d7971975081f2e462aa9cf8b29d5f73089532b879f71c163364a0f847d4c7274d479bf3daba9fe5b0aa473f51345e7f1bf141d3137dc53c0f5b7d3f988a8131e63a8ba71ca4c705f434aea586fa32ee9c9cdec699e983fd7e2a04325559d28044295dd458cfb5f1541de6a2a743b69f73450d4c4d77c9f79f68af5fd02058b8d7cda419a211e5b3e5eb4a17bb0d1606a44db4fb3461425bcad81e2ed3e39c3927cae01b71aa5f30e1dbb4603e887cef40c2f688bb3b4a5dddc84d72beedf75c74c1475e3afb30492a5b25b6dfb5c8007871a165bfd5f53b069075cdf2214df21b49f395a7cc6669be61fb345dd336dba67998596ba9fce2b3b63d28d8d326ca179eba5fcaa31ce57fede569abc9540c93c9ceb989e04da52aababf4adfd548a47eb67607a56e85db5c0aea46cb9f3debacf0a20ab80b7e6086e72c11d41ce6872492a80010d26db3a40e392be3248f3d99b9e211a77df6af7ff98a6c5fd34b60c48d70393445f29613f0718d1b9be93c7ad0d7668d43659434e87ca5bce2324b5b879b5ce3347517afd583d802ef0ac525e5007f7e74461e816ee1ee0a4683cfed501816bcba9104387a86ee4a16347e1bdd61195d3c3940aa95e6fd54544b6ed21bf5e74c3d78bc4f8e63dcc38db827ead86da9d69953e06a26c3780198f998db48df5bb7167ddf2df91f0b00d7feff8a025d021a0ab5a56ac5540a578efbdedfed8189ce23722924e28bd5759d6c25012bc61d1b2ba1ca839b5267f01bd2b9b3abe6ea4c2aa93be33d72b9b98818721ed081856126e1da3e94a9a069b28535b745b2f515a089224f5e5558db28e0b6f36db2eccd7663be45291fa36cc4e18ecb41967ce75b3bc93705057ff66e785ca7737b44686dd37176e83363d97c596cfce6d0dcbbebdf96b4f8b81ac9f0d1d698c52bae759fb3ba8cbeda8d4b1e7944e94978635086f4e01f527803ad6eceb5d09d36eee7dd9f3fd90d068c50da7a7adf5d5132024086c1eb3f14aeae67c941b7d578bcbf6a3a5cdefb5db65726f88b45f95caa8ea49be36913af3213f0b77ada9746744f57c6c13d0e847e528d59b467c510f5762ad8d86f209cff9570e6e7aefe737e38d034a225e4373e9f3a4f14462f958ef3978310fe874a9cf7a189c3777e513dfe729ab1f7c2c9d013eb75f6c7bf3cb10ddd5cc7875aab0419c24a1bf38d75674dc68e1de66e1ea56a7c58eee8ffe0fa561a61773630000"], {
          //     'accept-ranges': 'bytes',
          //     'access-control-allow-origin': '*',
          //     'cache-control': 'max-age=300',
          //     connection: 'keep-alive',
          //     'content-encoding': 'gzip',
          //     'content-length': '3189',
          //     'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
          //     'content-type': 'text/plain; charset=utf-8',
          //     'cross-origin-resource-policy': 'cross-origin',
          //     date: 'Fri, 02 Jan 2026 12:03:42 GMT',
          //     etag: 'W/"6f618be854ed64cd6a2cb850eefecf34866e637d9e73287a9d9d64a8ca3d54b3"',
          //     expires: 'Fri, 02 Jan 2026 12:08:42 GMT',
          //     'source-age': '0',
          //     'strict-transport-security': 'max-age=31536000',
          //     vary: 'Authorization,Accept-Encoding',
          //     via: '1.1 varnish',
          //     'x-cache': 'HIT',
          //     'x-cache-hits': '1',
          //     'x-content-type-options': 'nosniff',
          //     'x-fastly-request-id': 'e357bbd9481ed9b72541f1d5e4d6c921c6dbf9be',
          //     'x-frame-options': 'deny',
          //     'x-github-request-id': '9733:2549FA:1BB33B8:30A9114:6957ADA3',
          //     'x-served-by': 'cache-lhr-egll1980089-LHR',
          //     'x-timer': 'S1767355422.386688,VS0,VE1',
          //     'x-xss-protection': '1; mode=block'
          //     });

          // nock('http://petstore.swagger.io:80', {"encodedQueryParams":true})
          //     .get('/v2/pet/findByStatus')
          //     .query({"status":"pending"})
          //     .reply(200, [{"id":9515,"category":{"id":7792,"name":"string"},"name":"doggie","photoUrls":["string","string"],"tags":[{"id":7284,"name":"string"},{"id":9936,"name":"string"}],"status":"pending"},{"id":1109,"name":"Test9_02012026","photoUrls":[],"tags":[],"status":"pending"},{"id":1003,"name":"Lucy","photoUrls":["url1"],"tags":[],"status":"pending"},{"id":5619,"category":{"id":5381,"name":"string"},"name":"doggie","photoUrls":["string","string"],"tags":[{"id":9192,"name":"string"},{"id":8297,"name":"string"}],"status":"pending"},{"id":100002,"name":"Simple Cat","photoUrls":["https://example.com/cat.jpg"],"tags":[],"status":"pending"},{"id":922337203685477600,"name":"chedder-89811222","photoUrls":["./dog.png"],"tags":[],"status":"pending"},{"id":1088293,"category":{"id":1,"name":"Dogs"},"name":"UpdatedWorkflowDog-1088293","photoUrls":["https://example.com/photo1.jpg"],"tags":[{"id":1,"name":"test-tag"}],"status":"pending"},{"id":745215,"category":{"id":1,"name":"Dogs"},"name":"UpdatedWorkflowDog-745215","photoUrls":["https://example.com/photo1.jpg"],"tags":[{"id":1,"name":"test-tag"}],"status":"pending"}], {
          //     'access-control-allow-headers': 'Content-Type, api_key, Authorization',
          //     'access-control-allow-methods': 'GET, POST, DELETE, PUT',
          //     'access-control-allow-origin': '*',
          //     connection: 'keep-alive',
          //     'content-type': 'application/json',
          //     date: 'Fri, 02 Jan 2026 13:05:43 GMT',
          //     server: 'Jetty(9.2.9.v20150224)',
          //     'transfer-encoding': 'chunked'
          //     });

          const inputFile = new Input(
            "./test/mocks/inputs/validInput.json",
            "inputs",
          );

          const arazzo = new Arazzo(
            "./test/mocks/workingArazzoMockWithTwoSteps.json",
            "arazzo",
            { logger: logger, parser },
          );
          arazzo.setMainArazzo();

          try {
            const expected = await arazzo.runWorkflows(inputFile);
            console.log(expected);
          } catch (err) {
            expect(err).to.not.be.instanceOf(Error);
          }
        });
      });

      xit(`should throw an error when the operationId does not exist in the OpenAPI document`, async function () {
        nock("https://raw.githubusercontent.com:443", {
          encodedQueryParams: true,
        })
          .get("/readmeio/oas-examples/refs/heads/main/3.1/json/petstore.json")
          .reply(
            200,
            [
              "1f8b0800000000000013ed5ddd73dbb8117ff75fb1c3eb436fc696ec5cda074faf53274e3a9a4b134f1cb7d7c964ee607245e142020c004a5633fedf3b00488ae0b7be1c39c93df8241104f60bbf5d2c16c8e723008f27c84842bd73f07e1a9d8d4ebd63fd2b6553ee9dc3e72300002f40e90b9a28ca996ef76e46255009042489930841a298a3802b545271917f1f01fc97a7e0130653ca02e0a982583f26b7fae3f58284210a200adecf944acec763697f1a51fee1cfb59f7e042e8033784f853f9a0a44c6031c3154c7f043d6aae1ad3115fef8c711c04b2e4069c22dcdc7b0cc684b25829a219084c2475cc2ef32419f92e8e4232e7f07c541a154b645aa665cd0ff112d0898d248a190232330006f8e4266023a1b9d668204f0145511ea5f73867331150d50c4f2cdf41ac59cfaa6659d0bd3669cbfe173a688af0a05017818131ae97749421592f81fab973dd3e63e7b37a23e3289e5771989cdb01709f167084f0ada01bc5444258a168bc5889856232ec271d6971cbf9a3c7ff1fafac5c993d1e968a6e2281bf2281bd6b30621bd73786f9e7c6eee3ec924332a713e7fb2eaec83e90cef140a46a24beecb561b7dd96e71b914ddb15d7959b215091b68cec595a05ac9a932fc8b398aa59a511666632f796a35bf7aa5918f5e5e8af77b38c8655668be467fd908eb835ef83e4aa9edbf98d65c045a899d9da6b21070bdcf37090a3379642615b7f56602c9bad2f275391a2ea0c2b412a266259bd206599e280997ca252cb710630c1f4a23cb348e89581a4906011060b8800495019419d649adb0587ec473b14d0233c383e0aa647a866c416254d90c2b932150265c4f51876c00efe9e95f2a3fd56998b0398968009425a9f24a4def8bcff76596d14f0555cb62c6d8ff2a63e473fc378da646740b41159e27666e688a4960bf7c681cd1e5ee538a523de3c1b2cadf9f044e350f3f8c7d1e279c215372bc6a4f518eb5108faa03140c799ae7b5757d9304442110067847a5d2f33f7175355ccfa9e96b17aa3e1daceac925c83449228a81a3f063b7c3a7bd1d5ea102c6154c79ca3abbea37c37f6bcaaccfc53b1fedefdf88353aae5bc3d1588752cf96d78aa8b4ac692fc40dcc5503a934000fb74b90b6d37663fd571a296a023ed312e6244a519a28ea1621117c4e030c6041d50c7c1ec704246a835518805482b25076d8bbe64c935270d76af6edfa5cf9b64a0fe629355c7c4a512cab8f2a9c5e3b0caa1951c010038ddeb7083e6792062830802917592458ed51ab970ad4ac299162e529de25110fb0f9a1f4671893dac4d04a5d26863f2204a9f2a019541857e77fe54dab87daab9a2496c6c660c89cd088dc46a86740822c302f80277914942da924bc29492365082bdead34bb3f6afbd6369b5ae0ecc9003893a9895ea66904859155f5a3836864aa49ca4423a06fde1adfc551b3405b9504fd8a826e65412b66d8412b68d12cd6e65fee6b365366f60f69e4f7f570db6e74153734dc4596b1ef60dc509fbf78679dc12ebd8579a3d3571857a19bade521467023cd6b67c7faef13f3f72703b47a254e59381ae444de55e85bd78554f883f51c881e5d7b0beb1be0b6d6feb0ddc377f03e4838fb0ede7539ac05de8a840786dc0e8226027d8d85d9bc6f47f5cf09aa4970bf1348376989db254c2e3be0fc2daa543093f3a52c8cb0baacadc07088ea0ad5b3e524d806820d93cd18ac33353d103cb9043ecd732ec2d0bf1e08f7e32c650ac35ae80fe04db98889ca9afcf5a9d76eca5f237eae8f070f83743ba06b0f98f4d03997d56a6db01de5f6b82bd42409fded239a463d01ed2a1db751eed5e6e3346c691ca06c957bb531a89ea7101045b64cd1fd87aad94b2ee28340bb3c5b21b37485a5b2d6f5a303bfaf3d67dd06ca2e249f2c168b132de2935444c87c1e1815d6d4d40185850af9ed1fe8aba6645022b4a92b5ad342d12233db9690b0a2163b0f03d02f693bd5d3d08d201ae96b5e8d409383b03c57d3a2c3a8ca96f43ba16b1b177254fdb482bf002354b83e005e9af73200dc0ce4ecd09dfb10fde096237e23bccd90049d09d42989e4fa00d5a4a55697bd1750d61e999aac71a6bfc70fc10715d77c494c3f2affd2b4381ba749c449308949e8945b6c16c9d8cea4de5aa4a6c70d0316ddcb4b1ae141442a3c8b4d1efdbc78e075d95e164017097ddb10e7d76553ffdee2c51e75a0c57d85ea442a8124de34be6adf6c5b19e22d657a8a6f1325b810642438a66c8e4c715166be234764eb515ab0274ffed83594ed97e2b03de355e22826899ef859b0a5e356b340f99412a6a889343bf3499382a1edca211ec954ed0dd1c15402513d0889aefac2f501e098357320f2a7277b0c72f79836689a11a67c6da023ee9c0e5711f14d8d8fe9d1ec4c6d115e27bab737c20d801f8161ef233768c5d06f5d0f9f1d1c4ad9b0c5c65a71746de8e629b4adbf6b115ba79f5b5f6443055491859d6966aad89a9b2415fe8ce8bd88c6357b35821ce633cd28e3cfe67f8377573aa1c2eeaf585ab302dadead165da96e359f4f75506209196cc3e452dadca5d9c782bfff0c674058007ffb19ce4e47f046cd50e4854b0b1a45102243bbc35e94cff5b85aa3b96d376f3229ee23a13945e5cfbe6042b3d620a68cc6a67aeaacfe8cdce5cf4e1fe972e33bd43fb6ad20c3436fd2e4a8d27d7796b113e86c9e715f50977049159d63f1c4e0db085e6348ccef5c33cb4e9cc715f8838bab09a0105c74a19f95404f38f650e0a73d9b15640d022d9d870981bb42b9473073dc28c21c6719b6c0304d5be6d27381da5e9dc3312da7f074611d67d1d2980467680af36608110f43d4bb60a697ae8239df0c7623b75e7e6cb0adbcf24b8f2fba3512db4d706bf51d185541c37a7fdd6056f733b67ad5fbd217a6ae6b57662921a2526974d26d337c0ee91c99dd73856a19d91a4be1952dca82f089d9c87da4a639e0dc87e6d66a684db5bea28e161f8d5635dddf95ea2835e2212da353c76ab34b95af78282d8850961f335c4a85f1667a3354753b86fe404893633e374642832aa967d615dada01bdf6b7e2da71e4b393cd6222e5828b96b06f28b3792f2b5eb51ff72324ba02feae9a0bde3fe7eb456dbb5a9bdaa280a67cb6f7ebc95ba2f0e4158d69d3dab53e9e4fa2486f5f0898e973c2248af802833c58aa045afda273c4d7954eef4fa6f7af777f3d7971975081f2e462aa9cf8b29d5f73089532b879f71c163364a0f847d4c7274d479bf3daba9fe5b0aa473f51345e7f1bf141d3137dc53c0f5b7d3f988a8131e63a8ba71ca4c705f434aea586fa32ee9c9cdec699e983fd7e2a04325559d28044295dd458cfb5f1541de6a2a743b69f73450d4c4d77c9f79f68af5fd02058b8d7cda419a211e5b3e5eb4a17bb0d1606a44db4fb3461425bcad81e2ed3e39c3927cae01b71aa5f30e1dbb4603e887cef40c2f688bb3b4a5dddc84d72beedf75c74c1475e3afb30492a5b25b6dfb5c8007871a165bfd5f53b069075cdf2214df21b49f395a7cc6669be61fb345dd336dba67998596ba9fce2b3b63d28d8d326ca179eba5fcaa31ce57fede569abc9540c93c9ceb989e04da52aababf4adfd548a47eb67607a56e85db5c0aea46cb9f3debacf0a20ab80b7e6086e72c11d41ce6872492a80010d26db3a40e392be3248f3d99b9e211a77df6af7ff98a6c5fd34b60c48d70393445f29613f0718d1b9be93c7ad0d7668d43659434e87ca5bce2324b5b879b5ce3347517afd583d802ef0ac525e5007f7e74461e816ee1ee0a4683cfed501816bcba9104387a86ee4a16347e1bdd61195d3c3940aa95e6fd54544b6ed21bf5e74c3d78bc4f8e63dcc38db827ead86da9d69953e06a26c3780198f998db48df5bb7167ddf2df91f0b00d7feff8a025d021a0ab5a56ac5540a578efbdedfed8189ce23722924e28bd5759d6c25012bc61d1b2ba1ca839b5267f01bd2b9b3abe6ea4c2aa93be33d72b9b98818721ed081856126e1da3e94a9a069b28535b745b2f515a089224f5e5558db28e0b6f36db2eccd7663be45291fa36cc4e18ecb41967ce75b3bc93705057ff66e785ca7737b44686dd37176e83363d97c596cfce6d0dcbbebdf96b4f8b81ac9f0d1d698c52bae759fb3ba8cbeda8d4b1e7944e94978635086f4e01f527803ad6eceb5d09d36eee7dd9f3fd90d068c50da7a7adf5d5132024086c1eb3f14aeae67c941b7d578bcbf6a3a5cdefb5db65726f88b45f95caa8ea49be36913af3213f0b77ada9746744f57c6c13d0e847e528d59b467c510f5762ad8d86f209cff9570e6e7aefe737e38d034a225e4373e9f3a4f14462f958ef3978310fe874a9cf7a189c3777e513dfe729ab1f7c2c9d013eb75f6c7bf3cb10ddd5cc7875aab0419c24a1bf38d75674dc68e1de66e1ea56a7c58eee8ffe0fa561a61773630000",
            ],
            {
              "accept-ranges": "bytes",
              "access-control-allow-origin": "*",
              "cache-control": "max-age=300",
              connection: "keep-alive",
              "content-encoding": "gzip",
              "content-length": "3189",
              "content-security-policy":
                "default-src 'none'; style-src 'unsafe-inline'; sandbox",
              "content-type": "text/plain; charset=utf-8",
              "cross-origin-resource-policy": "cross-origin",
              date: "Fri, 02 Jan 2026 12:03:42 GMT",
              etag: 'W/"6f618be854ed64cd6a2cb850eefecf34866e637d9e73287a9d9d64a8ca3d54b3"',
              expires: "Fri, 02 Jan 2026 12:08:42 GMT",
              "source-age": "0",
              "strict-transport-security": "max-age=31536000",
              vary: "Authorization,Accept-Encoding",
              via: "1.1 varnish",
              "x-cache": "HIT",
              "x-cache-hits": "1",
              "x-content-type-options": "nosniff",
              "x-fastly-request-id": "e357bbd9481ed9b72541f1d5e4d6c921c6dbf9be",
              "x-frame-options": "deny",
              "x-github-request-id": "9733:2549FA:1BB33B8:30A9114:6957ADA3",
              "x-served-by": "cache-lhr-egll1980089-LHR",
              "x-timer": "S1767355422.386688,VS0,VE1",
              "x-xss-protection": "1; mode=block",
            },
          );

        const missingOperationIdOpenAPIFile = structuredClone(openAPIMock);
        delete missingOperationIdOpenAPIFile.paths["/pet/findByStatus"];

        const stub = sinon.stub(OpenAPI.prototype, "writeDocument").resolves();
        OpenAPI.prototype.fileName =
          "Arazzo-Workflow-for-Petstore-openAPI.json";
        OpenAPI.prototype.filePath = path.resolve(
          __dirname,
          "../..",
          "Arazzo-Workflow-for-Petstore-openAPI.json",
        );
        await fsp.writeFile(
          "./Arazzo-Workflow-for-Petstore-openAPI.json",
          JSON.stringify(missingOperationIdOpenAPIFile),
        );

        const inputFile = new Input(
          "./test/mocks/inputs/validInput.json",
          "inputs",
        );

        const arazzo = new Arazzo(
          "./test/mocks/workingArazzoMock.json",
          "arazzo",
          { logger: logger, parser },
        );
        arazzo.setMainArazzo();

        try {
          await arazzo.runWorkflows(inputFile);
          throw new Error("Expected promise to reject but it resolved");
        } catch (err) {
          expect(err).to.be.instanceOf(Error);
          expect(err.message).to.be.equal(
            `The OperationId: findPetsByStatus does not exist`,
          );
        }

        stub.restore();
      });

      // not working for now
      xit(
        `should throw an error if redocly can not bundle the document`,
        async function () {
          // nock.recorder.rec();
          nock("https://raw.githubusercontent.com:443", {
            encodedQueryParams: true,
          })
            .get(
              "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
            )
            .reply(
              200,
              [
                "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
              ],
              {
                "accept-ranges": "bytes",
                "access-control-allow-origin": "*",
                "cache-control": "max-age=300",
                connection: "keep-alive",
                "content-encoding": "gzip",
                "content-length": "1638",
                "content-security-policy":
                  "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                "content-type": "text/plain; charset=utf-8",
                "cross-origin-resource-policy": "cross-origin",
                date: "Tue, 06 Jan 2026 19:06:53 GMT",
                etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
                expires: "Tue, 06 Jan 2026 19:11:53 GMT",
                "source-age": "0",
                "strict-transport-security": "max-age=31536000",
                vary: "Authorization,Accept-Encoding",
                via: "1.1 varnish",
                "x-cache": "HIT",
                "x-cache-hits": "0",
                "x-content-type-options": "nosniff",
                "x-fastly-request-id":
                  "afc0e2abf3e0f1ee55fdb9786c251fd30aba07d6",
                "x-frame-options": "deny",
                "x-github-request-id": "8DCE:156854:683A3:BD766:695D41E9",
                "x-served-by": "cache-lhr-egll1980099-LHR",
                "x-timer": "S1767726413.324350,VS0,VE102",
                "x-xss-protection": "1; mode=block",
              },
            );

          const stub = sinon
            .stub(bundleFromString)
            .rejects(
              new Error("sinon threw an error when bundling the document"),
            );

          // const inputFile = new Input('./test/mocks/inputs/validInput.json', 'inputs');

          // const arazzo = new Arazzo('./test/mocks/workingArazzoMock.json', 'arazzo', {logger: logger, parser});
          const inputFile = new Input(
            "./test/mocks/inputs/userInput.json",
            "inputs",
          );

          const arazzo = new Arazzo(
            "./test/serverless-users/arazzo.json",
            "arazzo",
            { logger: logger, parser },
          );

          arazzo.setMainArazzo();

          try {
            await arazzo.runWorkflows(inputFile);
            throw new Error("Expected promise to reject but it resolved");
          } catch (err) {
            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.be.equal(
              `sinon threw an error when bundling the document`,
            );
          }

          stub.restore();
        },
        "does not work?",
      );
    });

    it(`should throw an error when writing a downloaded sourceDescription file fails`, async function () {
      nock("https://raw.githubusercontent.com:443", {
        encodedQueryParams: true,
      })
        .get(
          "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
        )
        .reply(
          200,
          [
            "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
          ],
          {
            "accept-ranges": "bytes",
            "access-control-allow-origin": "*",
            "cache-control": "max-age=300",
            connection: "keep-alive",
            "content-encoding": "gzip",
            "content-length": "1638",
            "content-security-policy":
              "default-src 'none'; style-src 'unsafe-inline'; sandbox",
            "content-type": "text/plain; charset=utf-8",
            "cross-origin-resource-policy": "cross-origin",
            date: "Tue, 06 Jan 2026 18:57:25 GMT",
            etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
            expires: "Tue, 06 Jan 2026 19:02:25 GMT",
            "source-age": "0",
            "strict-transport-security": "max-age=31536000",
            vary: "Authorization,Accept-Encoding",
            via: "1.1 varnish",
            "x-cache": "HIT",
            "x-cache-hits": "0",
            "x-content-type-options": "nosniff",
            "x-fastly-request-id": "90122fbfe305d58e86c2231dd5780b0c34096559",
            "x-frame-options": "deny",
            "x-github-request-id": "8DCE:156854:683A3:BD766:695D41E9",
            "x-served-by": "cache-lhr-egll1980038-LHR",
            "x-timer": "S1767725845.132358,VS0,VE97",
            "x-xss-protection": "1; mode=block",
          },
        );

      const stub = sinon
        .stub(fsp, "writeFile")
        .rejects(
          new Error(
            "sinon threw an error when writing a sourceDescription file",
          ),
        );

      const inputFile = new Input(
        "./test/mocks/inputs/userInput.json",
        "inputs",
      );

      const arazzo = new Arazzo(
        "./test/serverless-users/arazzo.json",
        "arazzo",
        { logger: logger, parser },
      );
      arazzo.setMainArazzo();

      try {
        await arazzo.runWorkflows(inputFile);
        throw new Error("Expected promise to reject but it resolved");
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.be.equal(
          `sinon threw an error when writing a sourceDescription file`,
        );
      }

      stub.restore();
    });

    it(`handles more than oe source description correctly `, async function () {
      nock("https://raw.githubusercontent.com:443", {
        encodedQueryParams: true,
      })
        .get(
          "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
        )
        .reply(
          200,
          [
            "1f8b0800000000000013ed5a5b6fdb36147ecfaf3850f7b00289eca6dd1ef2b4346d8760415b2c29b6212b50463ab6d84aa4461ec5f18afcf781d4c51265c9d724ee9a3c38b6481e9ecb773e9247fcba07e0c914054bb97704de737fe83ff7f6cdd34026a91428487b47f0750f00c0d34184099b3d30dd1432c20f1a55ed298047d3148d4479f51903b2228b9654c9141571d48d11005ea6510996a0f3bc264d93e262ecd51a6ff7eb12465c697abb9188986d2a0113c6e3f587a74ceb8954e10612222936d0df84e19c18656e806a32b8201ca3f2f69bcd23a912464587e7876e73883a503c252e85e9635003c54c756daaef35bdbc9bc4f5a95760c5ca990928875783bdeda093f744641977fcfca2dfe58fc87f44feb6916f0c3ab10c1dee5c022c505bf7eacd9462d3bada9c306969dc69659f9df32d5d686bbfb50ed23a73a517ac75a7f53bd0e0e2d8bae801bcd749668b8c73c1d349692b0aea24b615e5ac1732474827c9ad2a672ed5ad28a487f056067c8bf496a63d07d70da0b5c9af93fe1673ca991c73b10bfbd4b556ba1ee36263d8efa85329346e6ee07110a0d617f20b8a6d697873a018e141cc134ef3152c51d61afae7c1eb9b942bd407c723eadac935b56986bd15abae517bb5b19ec620539ca6e7e6d0d3f091779c512415ff9715c09e47b129ff0d1b1c5b82b639b84ec23647226461cd0b7be5a755cbe3622467e731e2145b99ef913449856033a230c049be8b886be01a186896a4318246758d0aaab1f96f1fe02f9941c0048cb80841660489696657e6ebf9848dc7a880115c4644e9d160a0f3473e971f7f6c3d7a0a52811470c955e08f14a29021fa02691f9e14bde68c1a70150c9efa006fa402328ae73aefc3b4d02dd3081421b094c3179cc2279d62c0597cf005a79f8024106aca7bd4fd0d231e132aedff5dbadebb46a50b173df387feb07c4ea812fd6e748eea9a07d6cb6d356d9f41392290825850877715f42aced522621042c8925f66e2bc06fe621e60339b67104a5910211c56ca1aa0abb8a6e36432f199ede54b351e14b2f4e0ecf4e4f5dbf3d70787fed08f28893d075f25e8bd23b8b44d9d98bffc580dfd6887a68ca25aad6090354f5d5e2ab593f93a4b12a6cc5c5ebed9834c379699b91036d197229ec215422805c2d5d4c63996e33186c02d36945f176378ceea7d6a18b75eb3a8d321532c41030e6b5dad85d858570ea9f1ca8cfbeabd15fe93a1a697329cbabcea9853ec70adbe306f9765447165f7c0a4326cb419b0a1a0363fb3348d7960cd1d7cd6b2cde05521674e0b80f783c291d1eec96056021a14959f41cd75cec8dbbdae5ff34f35aa58ad5a8bcfe1f059dba8791b89a03820387b9a2ec72ce79a7ee72c724ffdbcd51a7cdbef31c78c7c1db0dee9de1dbd18feb4d057a7e29ac5dc24469a91ebacae59da2b79839baca10518fee014b9678d65925d43cc35811c59fc6b98708a60ccaf51e4aa42eb94e218b65486eb4abd53c7fead257c8b33f33f272a1dfce9fa7b3d2639ab79f21b6192d911f5a18944c3c96e3289fe1ea9c440797799c468f748248f44f248243b4a24b153e2e9e78f3339d639d6b93067c608414f3561b21e59d8c91ffe5c6177c7b6d605a65e606a74cd52c34ee6f1ac407777793c5c884c9dd9dad7288ba10aee2ea573b3d2b7bd7c760de9acd775392e6071ac21450591cc14b03896130ccbc3b973b0df86271a1a2e7644ab36dd5756ec323234450a2ee0c3c5094c221440a6460a980bdab281ae82ab06bb87a117e741c9d065fd745096ac416706e3ed456e53da965963df37c66eda5e9b9de537b771bb632adb28685f4b70dc2e1bb85f91f2e5f66a9affb715cdb5a2394632ebdccbe95b474433a8dde1288ba9d51b02c7357939de543517bccc779b7b96d63e4258bc3a5a2d97580cef1bc81dd0b957203fe49a3caf1c7a475bebd5897b65be76667cb15c3156488291ccc406cb42f52a23cdba19e4431a5635f3bb7f5390d9d9fa77f4f7c030368e14310281189ab75b5708b96e2d7f7f77ecb3d5fa471d5e79fda3f3d83462b1de8573d39dbe8cf94e1827c418093b49e7956dbe27cec9757970ceb988109abca30be2c9157c249e4df6efffefbcda2b3fcb4b05e662896edf2968de59488b8b287eed82c5f5e1ec86427ecda011d9d6cd88468abae6bd2b134d1797599abdf1868ca3e3573268c6cb95f366cebd1853f3b0dad793b669dfcc2cddbede931b37578565a62faee5943751ba2636f3deeeddfe076e0f2055f7310000",
          ],
          {
            "accept-ranges": "bytes",
            "access-control-allow-origin": "*",
            "cache-control": "max-age=300",
            connection: "keep-alive",
            "content-encoding": "gzip",
            "content-length": "1638",
            "content-security-policy":
              "default-src 'none'; style-src 'unsafe-inline'; sandbox",
            "content-type": "text/plain; charset=utf-8",
            "cross-origin-resource-policy": "cross-origin",
            date: "Thu, 08 Jan 2026 15:03:45 GMT",
            etag: 'W/"d38379461bc9571f3e57ed61b7c4f2b6d189a3b3cf79f0449c1fde6e9379637e"',
            expires: "Thu, 08 Jan 2026 15:08:45 GMT",
            "source-age": "169",
            "strict-transport-security": "max-age=31536000",
            vary: "Authorization,Accept-Encoding",
            via: "1.1 varnish",
            "x-cache": "HIT",
            "x-cache-hits": "1",
            "x-content-type-options": "nosniff",
            "x-fastly-request-id": "a7213c75fb95ab820529bcc3c9206b3601e1d15e",
            "x-frame-options": "deny",
            "x-github-request-id": "66E9:203639:9AF45:10475A:695FC2E0",
            "x-served-by": "cache-lhr-egll1980097-LHR",
            "x-timer": "S1767884625.451409,VS0,VE1",
            "x-xss-protection": "1; mode=block",
          },
        );

      nock("http://petstore.swagger.io:80", { encodedQueryParams: true })
        .post("/v2/user/login", "[object Object]")
        .reply(
          200,
          {
            code: 200,
            type: "unknown",
            message: "logged in user session:1767885054568",
          },
          {
            "access-control-allow-headers":
              "Content-Type, api_key, Authorization",
            "access-control-allow-methods": "GET, POST, DELETE, PUT",
            "access-control-allow-origin": "*",
            connection: "keep-alive",
            "content-type": "application/json",
            date: "Thu, 08 Jan 2026 15:10:54 GMT",
            server: "Jetty(9.2.9.v20150224)",
            "transfer-encoding": "chunked",
            "x-expires-after": "Thu Jan 08 16:10:54 UTC 2026",
            "x-rate-limit": "5000",
          },
        );
      const inputFile = new Input(
        "./test/mocks/inputs/petsInput.json",
        "inputs",
      );

      const arazzo = new Arazzo(
        "./test/mocks/correctSourceDescriptionReference-pets-arazzo.json",
        "arazzo",
        { logger: logger, parser },
      );
      arazzo.setMainArazzo();

      try {
        await arazzo.runWorkflows(inputFile);
      } catch (err) {
        expect(err).to.not.be.instanceOf(Error);
      }
    });

    it(`should throw an error when there is more than one sourceDescription and it is incorrectly referenced`, async function () {
      const inputFile = new Input(
        "./test/mocks/inputs/petsInput.json",
        "inputs",
      );

      // const arazzo = new Arazzo('./test/mocks/arazzoMockIncorrectlyReferencedSourceDescription.json', 'arazzo', {logger: logger, parser});
      const arazzo = new Arazzo(
        "./test/mocks/incorrectSourceDescriptionReference-pets-arazzo.json",
        "arazzo",
        { logger: logger, parser },
      );
      arazzo.setMainArazzo();

      try {
        await arazzo.runWorkflows(inputFile);
        throw new Error("Expected promise to reject but it resolved");
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.be.equal(
          `No known matching source description for $sourceDescriptions.usersOpenAP.loginUser`,
        );
      }
    });

    it(`should throw an error when loading a sourceDescription from a URL fails`, async function () {
      nock("https://raw.githubusercontent.com:443", {
        encodedQueryParams: true,
      })
        .get(
          "/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json",
        )
        .reply(404);

      const inputFile = new Input(
        "./test/mocks/inputs/userInput.json",
        "inputs",
      );

      const arazzo = new Arazzo(
        "./test/serverless-users/arazzo.json",
        "arazzo",
        { logger: logger, parser },
      );

      arazzo.setMainArazzo();

      try {
        await arazzo.runWorkflows(inputFile);
        throw new Error("Expected promise to reject but it resolved");
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.be.equal(
          `Error fetching document from https://raw.githubusercontent.com/JaredCE/serverless-arazzo-workflows/refs/heads/main/test/serverless-users/openapi.json`,
        );
      }
    });

    it(`should throw an error when a workflow does not have steps`, async function () {
      const inputFile = new Input(
        "./test/mocks/inputs/validInput.json",
        "inputs",
      );

      const arazzo = new Arazzo(
        "./test/mocks/arazzoMockMissingSteps.json",
        "arazzo",
        { logger: logger, parser },
      );
      arazzo.setMainArazzo();

      try {
        await arazzo.runWorkflows(inputFile);
        throw new Error("Expected promise to reject but it resolved");
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.be.equal(
          `Cannot read properties of undefined (reading '0')`,
        );
      }
    });

    it(`should throw an error when an invalid input file is attached and does not conform to the workflow schema`, async function () {
      const inputFile = new Input(
        "./test/mocks/inputs/invalidInput.json",
        "inputs",
      );

      const arazzo = new Arazzo(
        "./test/mocks/arazzoMockWithInvalidInputs.json",
        "arazzo",
        { logger: logger, parser },
      );
      arazzo.setMainArazzo();

      try {
        await arazzo.runWorkflows(inputFile);
        throw new Error("Expected promise to reject but it resolved");
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.be.equal(
          "Input values do not match Input schema",
        );
      }
    });

    it(`should throw an error when workflows are omitted`, async function () {
      const arazzo = new Arazzo(
        "./test/mocks/arazzoMockMissingWorkflows.json",
        "arazzo",
        { logger: logger, parser },
      );
      arazzo.setMainArazzo();

      try {
        await arazzo.runWorkflows();
        throw new Error("Expected promise to reject but it resolved");
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.be.equal("Missing Workflows");
      }
    });

    it(`should throw an error when sourceDescriptions are omitted`, async function () {
      const arazzo = new Arazzo(
        "./test/mocks/arazzoMockMissingSourceDescriptions.json",
        "arazzo",
        { logger: logger, parser },
      );
      arazzo.setMainArazzo();

      try {
        await arazzo.runWorkflows();
        throw new Error("Expected promise to reject but it resolved");
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.be.equal("Missing Source Descriptions");
      }
    });
  });
});
