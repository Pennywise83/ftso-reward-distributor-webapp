import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RewardDistributorComponent } from './reward-distributor.component';
import { RewardsDistributorService } from './services/rewards-distributor.service';
import { NgxNumberFormatModule } from 'ngx-number-format';

@NgModule({
  declarations: [
    RewardDistributorComponent
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
    RewardsDistributorService
  ],
  bootstrap: [RewardDistributorComponent]
})
export class RewardDistributorModule { }
