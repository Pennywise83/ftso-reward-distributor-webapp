import { EventEmitter, Injectable, Output } from "@angular/core";
import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from "ethers";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { ChainIdInfo } from "src/reward-distributor-v1/model/chain-id-info";
import { INetwork } from "src/reward-distributor-v1/services/rewards-distributor.service";
declare const window: any;
const { ethereum } = window;
@Injectable({
    providedIn: 'root'
})
export class MetamaskService {
    private _provider: ethers.providers.Web3Provider = null;
    private _signer: ethers.providers.JsonRpcSigner = null;
    private _address: string;
    private _selectedChain: ChainIdInfo;
    @Output() chainIdChanged: EventEmitter<ChainIdInfo> = new EventEmitter();
    @Output() addressChanged: EventEmitter<string> = new EventEmitter();

    public checkMetamaskProvider(): Observable<boolean> {
        return new Observable<boolean>(observer => {
            detectEthereumProvider().then(provider => {
                if (provider && typeof (provider as any).isMetaMask != 'undefined') {
                    this._provider = new ethers.providers.Web3Provider(window.ethereum);
                    this._signer = this._provider.getSigner();
                    this.subscribeToAccountChangedEvent();
                    this.subscribeToChainChangedEvent();
                    this.checkIfIsConnected();
                    observer.next(true);
                    observer.complete();
                } else {
                    observer.next(false);
                    observer.complete();
                }
            });
        });
    }
    private checkIfIsConnected() {
        ethereum.request({ method: 'eth_accounts' }).then(async (res) => {
            this.addressChanged.emit(res[0]);
            this._address = res[0];
            this._provider.getNetwork().then(async (network: INetwork) => {
                environment.availableChainsV1.filter(currentChainId => currentChainId.chainId == network.chainId).map(async currentChainId => {
                    this._selectedChain = currentChainId;
                    this.chainIdChanged.emit(this._selectedChain);
                });
            });
        });
    }
    private subscribeToChainChangedEvent(): void {
        window.ethereum.on('chainChanged', async (chain: any) => {
            this._provider = new ethers.providers.Web3Provider(window.ethereum);
            this._signer = this._provider.getSigner();
            try {
                this._provider.getNetwork().then(async (network: INetwork) => {
                    environment.availableChainsV1.filter(currentChainId => currentChainId.chainId == network.chainId).map(async currentChainId => {
                        this._selectedChain = currentChainId;
                        this.chainIdChanged.emit(this._selectedChain);
                    });
                });
            } catch (initializeSmartContractError) {
                this.chainIdChanged.emit(null);
                console.error(initializeSmartContractError);
            }
        });
    }

    private subscribeToAccountChangedEvent(): void {
        window.ethereum.on('accountsChanged', async (accounts: any) => {
            this._provider = new ethers.providers.Web3Provider(window.ethereum);
            this._signer = this._provider.getSigner();
            try {
                this._address = accounts[0];
                this.addressChanged.emit(accounts[0]);
                this.chainIdChanged.emit(this._selectedChain);
            } catch (initializeSmartContractError) {
                this.chainIdChanged.emit(null);
                console.error(initializeSmartContractError);
            }
        });
    }
    public connectMetamask(): Observable<boolean> {
        return new Observable<boolean>(observer => {
            try {
                this._provider.send("eth_requestAccounts", []).then(async (accounts) => {
                    this._address = accounts[0];
                    this.addressChanged.emit(accounts[0]);
                    this._provider.getNetwork().then(async (network: INetwork) => {
                        environment.availableChainsV1.filter(currentChainId => currentChainId.chainId == network.chainId).map(async currentChainId => {
                            this._selectedChain = currentChainId;
                            this.chainIdChanged.emit(this._selectedChain);
                        });
                    });
                    observer.next(true);
                    observer.complete();
                });
            } catch (error) {
                observer.error(error);
                observer.complete();
            }
        });
    }
}