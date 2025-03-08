import { register } from 'tsconfig-paths';
import { resolve } from 'path';

// Register path aliases
register({
  baseUrl: resolve(__dirname, '..'),
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