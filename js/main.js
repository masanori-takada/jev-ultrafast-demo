import { initSite } from './site.js';
import { startApp } from './app.js';
import { demoAdapter } from './adapters/demo.js';
import { registerSW } from './sw-register.js';

const site = initSite();
startApp({ host: document.getElementById('panel-host'), mode: 'demo', adapter: demoAdapter, ctx: { site } });
registerSW();
