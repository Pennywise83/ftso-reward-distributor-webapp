import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MetamaskService } from './metamask-service';
import { ClientMessage } from 'src/reward-distributor-v1/model/client-message';
import { INetwork } from 'src/reward-distributor-v1/services/rewards-distributor.service';
import { ethers } from 'ethers';


@Component({
    selector: 'main',
    templateUrl: './main.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class MainComponent implements OnInit {
    public activeTab = 0;
    public mainClientMessage: ClientMessage = new ClientMessage();
    public isMetamaskInstalled: boolean = false;
    public walletConnected: boolean = false;
    public selectedAddress: string = null;
    public selectedChainId: INetwork;

    constructor(private _metamaskService: MetamaskService, private _cdr: ChangeDetectorRef) {

    }

    public connectMetamask(): void {
        this._metamaskService.connectMetamask().subscribe(metamaskRes => {
            this.walletConnected = true;
        }, metamaskError => {
            this.mainClientMessage = new ClientMessage('Unable to connect wallet with Metamask', metamaskError, null, 'danger')
        })
    }
    public isWalletConnected(): boolean {
        return (this.walletConnected && typeof this.selectedAddress != 'undefined' && this.selectedAddress != null);
    }

    ngOnInit(): void {
        this._metamaskService.checkMetamaskProvider().subscribe(metamaskInstalled => {
            if (metamaskInstalled) {
                this.isMetamaskInstalled = true;
                this._cdr.detectChanges();
                this._metamaskService.chainIdChanged.subscribe(changedChainId => {
                    if (changedChainId != null) {
                        this.selectedChainId = changedChainId;
                        this.walletConnected = true;
                    } else {
                        this.walletConnected = false;
                        this.mainClientMessage = new ClientMessage('Unsupported network', 'Please, select a supported network.', null, 'danger');
                    }
                    this._cdr.detectChanges();
                });
                this._metamaskService.addressChanged.subscribe(changedAddress => {
                    this.selectedAddress = changedAddress;
                    if (this.isWalletConnected()) {
                        this._cdr.detectChanges();
                    }
                });
            } else {
                this.mainClientMessage = new ClientMessage('MetaMask is not installed', 'Please, install MetaMask first.', null, 'danger');
                this.isMetamaskInstalled = false;
                this._cdr.detectChanges();
            }
        }, metamaskError => {
            this.mainClientMessage = new ClientMessage('Network error', metamaskError, null, 'danger');
            this._cdr.detectChanges();
        });
    }
}