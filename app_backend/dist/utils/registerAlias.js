"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tsconfig_paths_1 = require("tsconfig-paths");
const path_1 = require("path");
(0, tsconfig_paths_1.register)({
    baseUrl: (0, path_1.resolve)(__dirname, '..'),
    paths: {
        '@/*': ['*'],
        '@utils/*': ['utils/*'],
        '@middlewares/*': ['middlewares/*'],
        '@controllers/*': ['controllers/*'],
        '@services/*': ['services/*'],
        '@models/*': ['models/*'],
        '@config/*': ['config/*'],
        '@constants/*': ['constants/*'],
        '@helpers/*': ['helpers/*']
    }
});
//# sourceMappingURL=registerAlias.js.map