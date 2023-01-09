import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { RewardDistributorModule } from './reward-distributor/reward-distributor.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(RewardDistributorModule)
  .catch(err => console.error(err));
