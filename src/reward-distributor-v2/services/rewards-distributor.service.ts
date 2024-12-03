import { EventEmitter, Injectable, Output } from '@angular/core';
import detectEthereumProvider from '@metamask/detect-provider';
import { BigNumber, ethers } from 'ethers';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RewardDistributor, RewardDistributorFactory__factory, RewardDistributor__factory } from 'src/typechain/v2/';
import { IRewardDistributor } from 'src/typechain/v2/RewardDistributor';
import { IRewardDistributorFactory, RewardDistributorFactory } from 'src/typechain/v2/RewardDistributorFactory';
import { Commons } from '../../reward-distributor-v1/commons';
import { ChainIdInfo } from '../../reward-distributor-v1/model/chain-id-info';
import { NamedInstance } from '../../reward-distributor-v1/model/named-instance';
import { Recipient, RewardsDistributorRequest, RewardsDistributorRequestDto, OperatingAddress } from '../model/reward-distributor-request';
import { TransactionMessage } from '../../reward-distributor-v1/model/transaction-message';
import { TransactionOperationEnum } from '../../reward-distributor-v1/model/transaction-operation.enum';
declare const window: any;
const { ethereum } = window;
@Injectable({
  providedIn: 'root'
})
export class RewardsDistributorService {

  private _provider: ethers.providers.Web3Provider = null;
  private _signer: ethers.providers.JsonRpcSigner = null;
  private _rewardDistributorFactory: RewardDistributorFactory;
  private _address: string;
  private _selectedChain: ChainIdInfo;
  @Output() chainIdChanged: EventEmitter<ChainIdInfo> = new EventEmitter();
  @Output() addressChanged: EventEmitter<string> = new EventEmitter();
  constructor() { }

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
  public create(request: RewardsDistributorRequestDto): Observable<TransactionMessage> {
    let txMessage: TransactionMessage = new TransactionMessage();
    return new Observable<TransactionMessage>(observer => {
      let parsedRequest: RewardsDistributorRequest = Commons.marshallRequestV2(request);
      this._rewardDistributorFactory.create(
        parsedRequest.operatingAddress,
        parsedRequest.lowReserve,
        parsedRequest.highReserve,
        parsedRequest.recipients,
        parsedRequest.bips,
        parsedRequest.wrap,
        parsedRequest.editable,
        parsedRequest.description
      ).then(res => {
        txMessage = new TransactionMessage(TransactionOperationEnum.transacting);
        observer.next(txMessage);
        res.wait().then((txResponse) => {
          txMessage = new TransactionMessage(TransactionOperationEnum.confirmed);
          if (txResponse && txResponse.transactionHash) {
            txMessage.txId = txResponse.transactionHash;
          }
          // New instance address
          if (txResponse.events[0] && txResponse.events[0]['args'] && txResponse.events[0]['args']['instance']) {
            txMessage.message = txResponse.events[0]['args']['instance'].toString();
          }
          observer.next(txMessage)
        }).catch(waitErr => {
          observer.next(this.parseError(waitErr));
        }).finally(() => {
          observer.complete();
        });
      }).catch(err => {
        observer.next(this.parseError(err));
        observer.complete();
      });
    });
  }
  replaceOperatingAddress(request: RewardsDistributorRequestDto) {
    let txMessage: TransactionMessage = new TransactionMessage();
    return new Observable<TransactionMessage>(observer => {
      let _rewardDistributor = RewardDistributor__factory.connect(request.instanceAddress, this._signer);
      let parsedRequest: RewardsDistributorRequest = Commons.marshallRequestV2(request);
      _rewardDistributor.replaceOperatingAddresses(parsedRequest.operatingAddress, parsedRequest.lowReserve, parsedRequest.highReserve).then(res => {
        txMessage = new TransactionMessage(TransactionOperationEnum.transacting);
        observer.next(txMessage);
        res.wait().then((txResponse) => {
          txMessage = new TransactionMessage(TransactionOperationEnum.confirmed);
          if (txResponse && txResponse.transactionHash) {
            txMessage.txId = txResponse.transactionHash;
          }
          observer.next(txMessage)
        }).catch(waitErr => {
          observer.next(this.parseError(waitErr));
        }).finally(() => {
          observer.complete();
        });
      }).catch(err => {
        observer.next(this.parseError(err));
        observer.complete();
      });
    });
  }
  replaceRecipients(request: RewardsDistributorRequestDto): Observable<TransactionMessage> {
    let txMessage: TransactionMessage = new TransactionMessage();
    return new Observable<TransactionMessage>(observer => {
      let _rewardDistributor = RewardDistributor__factory.connect(request.instanceAddress, this._signer);
      let parsedRequest: RewardsDistributorRequest = Commons.marshallRequestV2(request);
      _rewardDistributor.replaceRecipients(parsedRequest.recipients, parsedRequest.bips, parsedRequest.wrap).then(res => {
        txMessage = new TransactionMessage(TransactionOperationEnum.transacting);
        observer.next(txMessage);
        res.wait().then((txResponse) => {
          txMessage = new TransactionMessage(TransactionOperationEnum.confirmed);
          if (txResponse && txResponse.transactionHash) {
            txMessage.txId = txResponse.transactionHash;
          }
          observer.next(txMessage)
        }).catch(waitErr => {
          observer.next(this.parseError(waitErr));
        }).finally(() => {
          observer.complete();
        });
      }).catch(err => {
        observer.next(this.parseError(err));
        observer.complete();
      });
    });
  }

  private checkIfIsConnected() {
    ethereum.request({ method: 'eth_accounts' }).then(async (res) => {
      this.addressChanged.emit(res[0]);
      this._address = res[0];
      await firstValueFrom(this.initializeSmartContract());
      this.chainIdChanged.emit(this._selectedChain);
    });
  }

  public initializeSmartContract(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this._selectedChain = null;
      this._provider.getNetwork().then(async (network: INetwork) => {
        environment.availableChainsV2.filter(currentChainId => currentChainId.chainId == network.chainId).map(async currentChainId => {
          this._selectedChain = currentChainId;
          try {
            this._rewardDistributorFactory = RewardDistributorFactory__factory.connect(this._selectedChain.contractAddress, this._signer);
            observer.next(true);
            observer.complete();
          } catch (e) {
            observer.error(e);
            observer.complete();
          }
        });
        if (this._selectedChain == null) {
          // Unsupported network
          observer.next(null);
          observer.complete();
        }
      }).catch(networkError => {
        observer.error(`${networkError.message}`);
        observer.complete();
      });
    });
  }


  private subscribeToChainChangedEvent(): void {
    window.ethereum.on('chainChanged', async (chain: any) => {
      this._provider = new ethers.providers.Web3Provider(window.ethereum);
      this._signer = this._provider.getSigner();
      try {
        await firstValueFrom(this.initializeSmartContract());
        this.chainIdChanged.emit(this._selectedChain);
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
        await firstValueFrom(this.initializeSmartContract());
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
          await firstValueFrom(this.initializeSmartContract());
          this._address = accounts[0];
          this.addressChanged.emit(accounts[0]);
          this.chainIdChanged.emit(this._selectedChain);
          observer.next(true);
          observer.complete();
        });
      } catch (error) {
        observer.error(error);
        observer.complete();
      }
    });
  }

  public destroy(instanceAddress: string): Observable<TransactionMessage> {
    return new Observable<TransactionMessage>(observer => {
      let txMessage: TransactionMessage = new TransactionMessage();
      let _rewardDistributor: RewardDistributor = RewardDistributor__factory.connect(instanceAddress, this._signer);
      _rewardDistributor.destroy().then(res => {
        txMessage = new TransactionMessage(TransactionOperationEnum.transacting);
        observer.next(txMessage);
        res.wait().then((txResponse) => {
          txMessage = new TransactionMessage(TransactionOperationEnum.confirmed);
          if (txResponse && txResponse.transactionHash) {
            txMessage.txId = txResponse.transactionHash;
          }
          observer.next(txMessage)
        }).catch(waitErr => {
          observer.next(this.parseError(waitErr));
        }).finally(() => {
          observer.complete();
        });
      }).catch(err => {
        observer.next(this.parseError(err));
        observer.complete();
      });
    });
  }

  public remove(instanceAddress: string): Observable<TransactionMessage> {
    return new Observable<TransactionMessage>(observer => {
      let txMessage: TransactionMessage = new TransactionMessage();
      this._rewardDistributorFactory.remove(instanceAddress).then(res => {
        txMessage = new TransactionMessage(TransactionOperationEnum.transacting);
        observer.next(txMessage);
        res.wait().then((txResponse) => {
          txMessage = new TransactionMessage(TransactionOperationEnum.confirmed);
          if (txResponse && txResponse.transactionHash) {
            txMessage.txId = txResponse.transactionHash;
          }
          observer.next(txMessage)
        }).catch(waitErr => {
          observer.next(this.parseError(waitErr));
        }).finally(() => {
          observer.complete();
        });
      }).catch(err => {
        observer.next(this.parseError(err));
        observer.complete();
      });
    });
  }

  public getInstanceData(instanceAddress: string): Observable<RewardsDistributorRequestDto> {
    return new Observable<RewardsDistributorRequestDto>(observer => {
      let rewardDistributorRequestDto: RewardsDistributorRequestDto = new RewardsDistributorRequestDto();
      rewardDistributorRequestDto.editable = false;
      let _rewardDistributor: RewardDistributor = RewardDistributor__factory.connect(instanceAddress, this._signer);
      let calls: Array<Promise<any>> = [];
      calls.push(_rewardDistributor.operatingAddressesAll());
      calls.push(_rewardDistributor.recipientsAll());
      calls.push(_rewardDistributor.owner());
      Promise.all(calls).then(res => {
        let operatingAddressAll: IRewardDistributor.OperatingAddressStructOutput[] = res[0] as IRewardDistributor.OperatingAddressStructOutput[];
        let recipientsAll: IRewardDistributor.RecipientStructOutput[] = res[1] as IRewardDistributor.RecipientStructOutput[];
        let owner: string = res[2];
        let provider: string = res[2];
        rewardDistributorRequestDto.instanceAddress = instanceAddress;
        rewardDistributorRequestDto.owner = owner;
        if (this._address.toLowerCase() == owner.toLowerCase()) {
          rewardDistributorRequestDto.editable = true;
        }
        recipientsAll.map(recipientData => {
          let recipient: Recipient = new Recipient();
          recipient.address = recipientData.recipient;
          recipient.bips = parseInt(recipientData.bips.toString()) / 100;
          recipient.wrap = recipientData.wrap;
          rewardDistributorRequestDto.recipients.push(recipient);
        });
        operatingAddressAll.map(operatingAddressData => {
          let operatingAddress: OperatingAddress = new OperatingAddress();
          operatingAddress.recipient = operatingAddressData.recipient;
          operatingAddress.lowReserve = parseInt(ethers.utils.formatUnits(operatingAddressData.lowReserve.toString()).toString());
          operatingAddress.highReserve = parseInt(ethers.utils.formatUnits(operatingAddressData.highReserve.toString()).toString());
          rewardDistributorRequestDto.operatingAddress.push(operatingAddress);
        });
        observer.next(rewardDistributorRequestDto);
        observer.complete();
      }).catch(err => {
        observer.error(err);

      }).finally(() => {
        observer.complete();

      })
    });
  }
  public getAll(): Observable<Array<NamedInstance>> {
    return new Observable<Array<NamedInstance>>(observer => {
      this._rewardDistributorFactory.getAll(this._address).then((res: IRewardDistributorFactory.NamedInstanceStructOutput[]) => {
        let namedInstances: Array<NamedInstance> = [];
        res.map(async ni => {
          namedInstances.push(new NamedInstance(ni.instance, ni.description));
        });

        observer.next(namedInstances);
      }).catch(err => {
        observer.error(err);
      }).finally(() => {
        observer.complete();
      })
    });
  }
  public get(idx: number): Observable<Array<NamedInstance>> {
    return new Observable<Array<NamedInstance>>(observer => {
      this._rewardDistributorFactory.get(this._address, BigNumber.from(idx)).then((res) => {
        console.log();
        observer.complete();
      }).catch(err => {
        observer.error(err);
        observer.complete();
      })
    });
  }

  replaceOwner(request: RewardsDistributorRequestDto): Observable<TransactionMessage> {
    return new Observable<TransactionMessage>(observer => {
      let txMessage: TransactionMessage = new TransactionMessage();
      this._signer = this._provider.getSigner();
      let _rewardDistributor = RewardDistributor__factory.connect(request.instanceAddress, this._signer);
      _rewardDistributor.replaceOwner('0x0000000000000000000000000000000000000000').then(res => {
        txMessage = new TransactionMessage(TransactionOperationEnum.transacting);
        observer.next(txMessage);
        res.wait().then((txResponse) => {
          txMessage = new TransactionMessage(TransactionOperationEnum.confirmed);
          if (txResponse && txResponse.transactionHash) {
            txMessage.txId = txResponse.transactionHash;
          }
          observer.next(txMessage)
        }).catch(waitErr => {
          observer.next(this.parseError(waitErr));
        }).finally(() => {
          observer.complete();
        });
      }).catch(err => {
        observer.next(this.parseError(err));
        observer.complete();
      });
    });
  }

  public rename(instanceAddress: string, description: string): Observable<TransactionMessage> {
    let txMessage: TransactionMessage = new TransactionMessage();
    return new Observable<TransactionMessage>(observer => {
      this._rewardDistributorFactory.rename(instanceAddress, description).then(res => {
        txMessage = new TransactionMessage(TransactionOperationEnum.transacting);
        observer.next(txMessage);
        res.wait().then((txResponse) => {
          txMessage = new TransactionMessage(TransactionOperationEnum.confirmed);
          if (txResponse && txResponse.transactionHash) {
            txMessage.txId = txResponse.transactionHash;
          }
          observer.next(txMessage)
        }).catch(waitErr => {
          observer.next(this.parseError(waitErr));
        }).finally(() => {
          observer.complete();
        });
      }).catch(err => {
        observer.next(this.parseError(err));
        observer.complete();
      });

    });
  }




  private parseError(err: any): TransactionMessage {
    let txMessage: TransactionMessage = new TransactionMessage();
    if (err.code && err.code == 4001) {
      txMessage.operation = TransactionOperationEnum.cancelled;
      txMessage.message = 'Transaction was cancelled';
    } else if (err && err.data && err.data.message) {
      txMessage.operation = TransactionOperationEnum.failed;
      txMessage.message = err.data.message;
    } else if (err && err.reason) {
      txMessage.operation = TransactionOperationEnum.failed;
      txMessage.message = err.reason;
    } else {
      txMessage.operation = TransactionOperationEnum.failed;
      txMessage.message = err.message;
    }
    if (err && err.transactionHash) {
      txMessage.txId = err.transactionHash;
    }
    return txMessage;
  }
}


export interface INetwork {
  name: string;
  chainId: number;
}