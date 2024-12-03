import { EventEmitter, Injectable, Output } from '@angular/core';
import detectEthereumProvider from '@metamask/detect-provider';
import { BigNumber, ethers } from 'ethers';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RewardDistributor, RewardDistributorFactory__factory, RewardDistributor__factory } from 'src/typechain/v1';
import { IRewardDistributor } from 'src/typechain/v1/RewardDistributor';
import { IRewardDistributorFactory, RewardDistributorFactory } from 'src/typechain/v1/RewardDistributorFactory';
import { Commons } from '../commons';
import { ChainIdInfo } from '../model/chain-id-info';
import { NamedInstance } from '../model/named-instance';
import { Recipient, RewardsDistributorRequest, RewardsDistributorRequestDto } from '../model/reward-distributor-request';
import { TransactionMessage } from '../model/transaction-message';
import { TransactionOperationEnum } from '../model/transaction-operation.enum';
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
        environment.availableChainsV1.filter(currentChainId => currentChainId.chainId == network.chainId).map(async currentChainId => {
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
      rewardDistributorRequestDto.provider = instanceAddress;
      rewardDistributorRequestDto.editable = false;
      let _rewardDistributor: RewardDistributor = RewardDistributor__factory.connect(instanceAddress, this._signer);
      let calls: Array<Promise<any>> = [];
      calls.push(_rewardDistributor.reserveBalance());
      calls.push(_rewardDistributor.recipientsAll());
      calls.push(_rewardDistributor.functions.provider());
      calls.push(_rewardDistributor.owner());
      Promise.all(calls).then(res => {
        let reserveBalance: BigNumber = res[0];
        let recipientsAll: IRewardDistributor.RecipientStructOutput[] = res[1] as IRewardDistributor.RecipientStructOutput[];
        let provider: string = res[2][0];
        let owner: string = res[3];
        rewardDistributorRequestDto.instanceAddress = instanceAddress;
        rewardDistributorRequestDto.provider = provider;
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
        rewardDistributorRequestDto.reserveBalance = parseInt(ethers.utils.formatUnits(reserveBalance.toString()).toString());


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
  replaceReserveBalance(request: RewardsDistributorRequestDto): Observable<TransactionMessage> {
    return new Observable<TransactionMessage>(observer => {
      let txMessage: TransactionMessage = new TransactionMessage();
      this._signer = this._provider.getSigner();
      let _rewardDistributor = RewardDistributor__factory.connect(request.instanceAddress, this._signer);
      let parsedRequest: RewardsDistributorRequest = Commons.marshallRequestV1(request);
      _rewardDistributor.replaceReserveBalance(parsedRequest.reserveBalance).then(res => {
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
      let parsedRequest: RewardsDistributorRequest = Commons.marshallRequestV1(request);
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
  public create(request: RewardsDistributorRequestDto): Observable<TransactionMessage> {
    let txMessage: TransactionMessage = new TransactionMessage();
    return new Observable<TransactionMessage>(observer => {
      let parsedRequest: RewardsDistributorRequest = Commons.marshallRequestV1(request);
      this._rewardDistributorFactory.create(
        parsedRequest.provider,
        parsedRequest.reserveBalance,
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