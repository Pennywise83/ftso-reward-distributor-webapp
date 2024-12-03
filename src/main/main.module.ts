import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RewardDistributorComponentV1 } from '../reward-distributor-v1/reward-distributor.component';
import { RewardDistributorComponentV2 } from '../reward-distributor-v2/reward-distributor.component';

import { RewardsDistributorService as RewardsDistributorServiceV1 } from '../reward-distributor-v1/services/rewards-distributor.service';
import { RewardsDistributorService as RewardsDistributorServiceV2 } from '../reward-distributor-v2/services/rewards-distributor.service';
import { NgxNumberFormatModule } from 'ngx-number-format';
import { MainComponent } from 'src/main/main.component';
import { MetamaskService } from 'src/main/metamask-service';

@NgModule({
  declarations: [
    MainComponent,
    RewardDistributorComponentV1,
    RewardDistributorComponentV2,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    NgbModule,
    NgxNumberFormatModule
  ],
  providers: [
    MetamaskService,
    RewardsDistributorServiceV1,
    RewardsDistributorServiceV2,
  ],
  bootstrap: [MainComponent]
})
export class MainModule { }
