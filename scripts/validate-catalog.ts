import catalog from '../src/config/catalog.json';
import { parseCatalog } from '../src/lib/catalog';
console.log(
  `Valid catalog: ${parseCatalog(catalog).resources.length} resources`,
);
