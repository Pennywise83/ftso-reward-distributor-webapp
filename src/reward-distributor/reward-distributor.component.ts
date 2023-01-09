import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Commons } from './commons';
import { ChainIdInfo } from './model/chain-id-info';
import { ClientMessage } from './model/client-message';
import { EditTypeEnum } from './model/edit-type.enum';
import { NamedInstance } from './model/named-instance';
import { RewardsDistributorRequestDto } from './model/reward-distributor-request';
import { TransactionOperationEnum } from './model/transaction-operation.enum';
import { RewardsDistributorService } from './services/rewards-distributor.service';

@Component({
  selector: 'reward-distributor',
  templateUrl: './reward-distributor.component.html',
  styleUrls: ['./reward-distributor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RewardDistributorComponent implements OnInit {
  public isMetamaskInstalled: boolean = false;
  public activeTab = 0;
  public operations = TransactionOperationEnum;
  public operation: TransactionOperationEnum = null;
  public instancesList: Array<NamedInstance> = [];
  public selectedInstanceIdx: number = null;
  public mainClientMessage: ClientMessage = new ClientMessage();
  public modalClientMessage: ClientMessage = new ClientMessage();
  public selectedAddress: string = null;
  public selectedChainId: ChainIdInfo = null;
  public walletConnected: boolean = false;
  public editCalls: Array<EditTypeEnum> = [];
  public editTypes = EditTypeEnum;
  public requestFormGroup: FormGroup;
  public selectedInstanceData: RewardsDistributorRequestDto = null;
  @ViewChild('signModal') public signModal: any;

  constructor(
    private _rewardsDistributorService: RewardsDistributorService,
    private _modalService: NgbModal,
    private _formBuilder: FormBuilder,
    private _cdr: ChangeDetectorRef
  ) {
    this.requestFormGroup = this._formBuilder.group({
      owner: [null],
      provider: [null, Validators.required],
      instanceAddress: [null],
      reserveBalance: [0, [Validators.min(0.01), Validators.required]],
      description: [null, Validators.required],
      editable: [true],
      recipients: this._formBuilder.array([], Validators.required)
    }, { validator: this.proportionValidator });
  }

  private proportionValidator(group: FormGroup) {
    let sum = 0;
    let recipients: FormArray = group.controls['recipients'] as FormArray;
    if (recipients && recipients.length > 0) {
      recipients.controls.map(recipientForm => {
        let bips: number = parseFloat(recipientForm.get('bips').value);
        sum += bips;
      });
      sum = parseFloat(sum.toFixed(2));
    }
    if (sum != 0 && sum != 100) {
      if (recipients && recipients.length > 0) {
        recipients.controls.map(recipientForm => {
          let errors: any = {};
          if (recipientForm.get('bips').errors && recipientForm.get('bips').errors != null) {
            errors = recipientForm.get('bips').errors;
            errors['bipsSumIsNot100'] = true;
          } else {
            errors['bipsSumIsNot100'] = true;
          }
          recipientForm.get('bips').setErrors(errors);
        });
      }
    } else {
      if (recipients && recipients.length > 0) {
        recipients.controls.map(recipientForm => {
          recipientForm.get('bips').setErrors(null);
        });
      }
    }
  }

  public get recipients(): FormArray {
    return this.requestFormGroup.controls['recipients'] as FormArray;
  }

  public addRecipient() {
    let recipientForm: FormGroup = this._formBuilder.group({
      address: [null, Validators.required],
      bips: [0, Validators.min(0.01)],
      wrap: [false]
    });
    let bipsSum: number = 0;
    let addresses: Array<string> = [];
    if (this.recipients && this.recipients.controls.length > 0) {
      this.recipients.controls.map(recipientForm => {
        bipsSum += parseFloat(recipientForm.get('bips').value);
        addresses.push(recipientForm.get('address').value);
      });
    }
    addresses = [... new Set(addresses)];
    this.recipients.push(recipientForm);
    if (bipsSum == 100 && addresses.length == 1) {
      let newBips: number = parseFloat((100 / this.recipients.controls.length).toFixed(2));
      if (this.recipients && this.recipients.controls.length > 0) {
        this.recipients.controls.map(recipientForm => {
          recipientForm.get('bips').patchValue(newBips);
        });
      }
    } else if (bipsSum == 100 && addresses.length > 1) {
      recipientForm.get('bips').patchValue(0);
    } else if (bipsSum < 100) {
      recipientForm.controls['bips'].patchValue(100 - bipsSum);
    }
    bipsSum = 0;
    if (this.recipients && this.recipients.controls.length > 0) {
      this.recipients.controls.map(recipientForm => {
        bipsSum += parseFloat(recipientForm.get('bips').value);
      });
    }
    if (bipsSum != 100) {
      let diff: number = 100 - bipsSum;
      this.recipients.controls[this.recipients.controls.length - 1].get('bips').patchValue((this.recipients.controls[this.recipients.controls.length - 1].get('bips').value + diff));
    }

    this.requestFormGroup.updateValueAndValidity();
    this._cdr.detectChanges();
  }

  deleteRecipient(recipientIndex: number) {
    this.recipients.removeAt(recipientIndex);
    this._cdr.detectChanges();
  }


  ngOnInit(): void {
    this.mainClientMessage = new ClientMessage('Connect wallet.', 'Please connect wallet to a supported network first.', null, 'info');
    this._rewardsDistributorService.checkMetamaskProvider().subscribe(metamaskInstalled => {
      if (metamaskInstalled) {
        this.isMetamaskInstalled = true;
        this._rewardsDistributorService.chainIdChanged.subscribe(changedChainId => {
          if (changedChainId != null) {
            this.selectedChainId = changedChainId;
            this.walletConnected = true;
            if (this.isWalletConnected()) {
              this.resetRequest();
              this.getAllInstances();
            } else {
              this.mainClientMessage = new ClientMessage('Connect wallet.', 'Please connect wallet to Songbird or Coston network first.', null, 'info');
            }
          } else {
            this.walletConnected = false;
            this.mainClientMessage = new ClientMessage('Unsupported network', 'Please, select a supported network.', null, 'danger');
          }
          this._cdr.detectChanges();
        });
        this._rewardsDistributorService.addressChanged.subscribe(changedAddress => {
          this.selectedAddress = changedAddress;
          if (this.isWalletConnected()) {
            this.resetRequest();
            this.getAllInstances();
            this._cdr.detectChanges();
          }
        });
        this._cdr.detectChanges();
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

  public resetRequest(): void {
    this.mainClientMessage.reset();
    this.requestFormGroup.reset();
    this.requestFormGroup.enable();
    this.requestFormGroup.controls['editable'].setValue(true);
    this.requestFormGroup.controls['recipients'] = this._formBuilder.array([]);
    this.requestFormGroup.controls['recipients'].setValidators(Validators.required);
    this.selectedInstanceIdx = null;
    this._cdr.detectChanges();
  }


  public unmarshallRequestDto(instanceData: RewardsDistributorRequestDto): void {
    this.requestFormGroup = this._formBuilder.group({
      owner: [instanceData.owner],
      provider: [instanceData.provider, Validators.required],
      instanceAddress: [instanceData.instanceAddress],
      reserveBalance: [instanceData.reserveBalance, [Validators.required, Validators.min(0.01)]],
      description: [instanceData.description, Validators.required],
      editable: [instanceData.editable],
      recipients: this._formBuilder.array([], Validators.required)

    }, { validator: this.proportionValidator })
    instanceData.recipients.map(recipient => {
      let recipientForm: FormGroup = this._formBuilder.group({
        address: [recipient.address, Validators.required],
        bips: [recipient.bips, Validators.min(0)],
        wrap: [recipient.wrap]
      });
      (this.requestFormGroup.controls['recipients'] as FormArray).push(recipientForm);
    })

  }

  public selectNamedInstance(namedInstance: NamedInstance, idx: number): void {
    this.resetRequest();
    this.mainClientMessage.reset();
    this._rewardsDistributorService.getInstanceData(namedInstance.instance).subscribe(instanceData => {
      this.selectedInstanceData = instanceData;
      instanceData.description = namedInstance.description;
      this.selectedInstanceData.description = namedInstance.description;
      this.unmarshallRequestDto(instanceData);
      Object.keys(this.requestFormGroup.controls).forEach(field => {
        const control = this.requestFormGroup.get(field);
        control.markAsTouched({ onlySelf: true });
      });
      this.requestFormGroup.controls['recipients'].markAllAsTouched();
      this.requestFormGroup.controls['instanceAddress'].disable();
      this.requestFormGroup.controls['owner'].disable();
      this.requestFormGroup.controls['provider'].disable();
      if (!this.requestFormGroup.controls['editable'].value) {
        this.requestFormGroup.controls['editable'].disable();
      }
      this.requestFormGroup.updateValueAndValidity();
      this.selectedInstanceIdx = idx;
    }, instanceDataErr => {
      this.mainClientMessage = new ClientMessage('Unable to get instance data', 'The instance may not exists anymore', null, 'danger');
      this.selectedInstanceIdx = idx;
    }).add(() => {
      this._cdr.detectChanges();
    })
  }
  public connectMetamask(): void {
    this._rewardsDistributorService.connectMetamask().subscribe(metamaskRes => {
      this.walletConnected = true;
      if (this.isWalletConnected()) {
        this.getAllInstances();
      }
      this._cdr.detectChanges();
    }, metamaskError => {
      this.mainClientMessage = new ClientMessage('Unable to connect wallet with Metamask', metamaskError, null, 'danger')
    })
  }

  private getAllInstances() {
    this.mainClientMessage.reset();
    this.instancesList = [];
    this._rewardsDistributorService.getAll().subscribe(namedInstances => {
      this.instancesList = namedInstances;
    }, namedInstancesErr => {
      this.mainClientMessage = new ClientMessage('Unable to get named instances', namedInstancesErr.message, null, 'danger');
    }).add(() => {
      this._cdr.detectChanges();
    });
  }

  public isWalletConnected(): boolean {
    return (this.walletConnected && this.selectedChainId != null && typeof this.selectedAddress != 'undefined' && this.selectedAddress != null);
  }
  public openRemoveModal(operation: TransactionOperationEnum): void {
    switch (operation) {
      case TransactionOperationEnum.remove:
        this.operation = operation;
        this.mainClientMessage.reset();
        this.modalClientMessage.reset();
        this._modalService.open(this.signModal, { centered: true, size: 'lg', keyboard: false });
        this._cdr.detectChanges();
        break;
    }
  }
  public openModal(operation: TransactionOperationEnum): void {
    Object.keys(this.requestFormGroup.controls).forEach(field => {
      const control = this.requestFormGroup.get(field);
      control.markAsTouched({ onlySelf: true });
    });
    this.requestFormGroup.controls['recipients'].markAllAsTouched();
    this.requestFormGroup.updateValueAndValidity();

    switch (operation) {
      case TransactionOperationEnum.create:
        if (this.requestFormGroup.valid && this.isWalletConnected()) {
          this.operation = operation;
          this.mainClientMessage.reset();
          this.modalClientMessage.reset();
          this._modalService.open(this.signModal, { centered: true, size: 'lg', keyboard: false });
        }
        break;

      case TransactionOperationEnum.edit:
        if (this.requestFormGroup.valid && this.isWalletConnected()) {
          this.operation = operation;
          this.editCalls = [];
          this.mainClientMessage.reset();
          this.modalClientMessage.reset();
          if (this.selectedInstanceData.description != this.requestFormGroup.get('description').value) {
            this.editCalls.push(EditTypeEnum.description);
          }
          if (this.selectedInstanceData.reserveBalance != this.requestFormGroup.get('reserveBalance').value) {
            this.editCalls.push(EditTypeEnum.reserveBalance);
          }
          if (this.selectedInstanceData.editable != this.requestFormGroup.get('editable').value) {
            this.editCalls.push(EditTypeEnum.editable);
          }

          if (JSON.stringify(this.selectedInstanceData.recipients) != JSON.stringify(this.requestFormGroup.get('recipients').value)) {
            this.editCalls.push(EditTypeEnum.recipients);
          }
          this._modalService.open(this.signModal, { centered: true, size: 'lg', keyboard: false }).result.then(modalClosed => {
            if (this.selectedInstanceIdx != null) {
              this.selectNamedInstance(this.instancesList[this.selectedInstanceIdx], this.selectedInstanceIdx);
            }
          }).catch(modalClosed => {
            if (this.selectedInstanceIdx != null) {
              this.selectNamedInstance(this.instancesList[this.selectedInstanceIdx], this.selectedInstanceIdx);
            }
          })
          this._cdr.detectChanges();
        }
        break;

      case TransactionOperationEnum.destroy:
        if (this.isWalletConnected()) {
          this.operation = operation;
          this.mainClientMessage.reset();
          this.modalClientMessage.reset();
          this._modalService.open(this.signModal, { centered: true, size: 'lg', keyboard: false });
          this._cdr.detectChanges();
        }
        break;
      case TransactionOperationEnum.remove:
        if (this.isWalletConnected()) {
          this.operation = operation;
          this.mainClientMessage.reset();
          this.modalClientMessage.reset();
          this._modalService.open(this.signModal, { centered: true, size: 'lg', keyboard: false });
          this._cdr.detectChanges();
        }
        break;
    }
  }

  public setCheckboxValue(formControl: AbstractControl, value: boolean): void {
    formControl.setValue(value, { emitEvent: true });
    formControl.updateValueAndValidity();
    this._cdr.detectChanges();
  }
  public createInstance(): void {
    this.operation = TransactionOperationEnum.submitting;
    let request: RewardsDistributorRequestDto = Commons.marshallRequestDto(this.requestFormGroup);
    this._rewardsDistributorService.create(request).subscribe(res => {
      if (res.operation == TransactionOperationEnum.transacting) {
        this.operation = TransactionOperationEnum.transacting;
        this._cdr.detectChanges();
      } else if (res.operation == TransactionOperationEnum.confirmed) {
        this.modalClientMessage = new ClientMessage('Transaction successfull', `RewardDistributor instance created succesfully. Instance address: ${res.message}`, res.txId != null ? `${this.selectedChainId.blockExplorerUrl}tx/${res.txId}` : null, 'info');
        this.operation = TransactionOperationEnum.confirmed;
        this.mainClientMessage = new ClientMessage('RewardDistributor instance address', res.message, 'info');
        this.getAllInstances();
        this._cdr.detectChanges();
      } else {
        this.operation = res.operation;
        this.modalClientMessage = new ClientMessage('Transaction failed', res.message, res.txId != null ? `${this.selectedChainId.blockExplorerUrl}tx/${res.txId}` : null, 'danger');
        this._cdr.detectChanges();
      }
    });
  }
  public destroyInstance(instanceAddress: string): void {
    this.operation = TransactionOperationEnum.submitting;
    this._rewardsDistributorService.destroy(instanceAddress).subscribe(res => {
      if (res.operation == TransactionOperationEnum.transacting) {
        this.operation = TransactionOperationEnum.transacting;
        this._cdr.detectChanges();
      } else if (res.operation == TransactionOperationEnum.confirmed) {
        this.modalClientMessage = new ClientMessage('Transaction successfull', `RewardDistributor instance succesfully destroyed.`, res.txId != null ? `${this.selectedChainId.blockExplorerUrl}tx/${res.txId}` : null, 'info');
        this.operation = TransactionOperationEnum.confirmed;
        this.getAllInstances();
        this._cdr.detectChanges();
      } else {
        this.operation = res.operation;
        this.modalClientMessage = new ClientMessage('Transaction failed', res.message, res.txId != null ? `${this.selectedChainId.blockExplorerUrl}tx/${res.txId}` : null, 'danger');
        this._cdr.detectChanges();
      }
    });
  }

  public removeInstance(instanceAddress: string): void {
    this.operation = TransactionOperationEnum.submitting;
    this._rewardsDistributorService.remove(instanceAddress).subscribe(res => {
      if (res.operation == TransactionOperationEnum.transacting) {
        this.operation = TransactionOperationEnum.transacting;
        this._cdr.detectChanges();
      } else if (res.operation == TransactionOperationEnum.confirmed) {
        this.modalClientMessage = new ClientMessage('Transaction successfull', `Instance succesfully removed from RewardDistributor list.`, res.txId != null ? `${this.selectedChainId.blockExplorerUrl}tx/${res.txId}` : null, 'info');
        this.operation = TransactionOperationEnum.confirmed;
        this.getAllInstances();
        this.resetRequest();
        this._cdr.detectChanges();
      } else {
        this.operation = res.operation;
        this.modalClientMessage = new ClientMessage('Transaction failed', res.message, res.txId != null ? `${this.selectedChainId.blockExplorerUrl}tx/${res.txId}` : null, 'danger');
        this._cdr.detectChanges();
      }
    });
  }
  public replaceOwner(): void {
    this.operation = TransactionOperationEnum.submitting;
    let request: RewardsDistributorRequestDto = Commons.marshallRequestDto(this.requestFormGroup);
    this._rewardsDistributorService.replaceOwner(request).subscribe(res => {
      if (res.operation == TransactionOperationEnum.transacting) {
        this.operation = TransactionOperationEnum.transacting;
        this._cdr.detectChanges();
      } else if (res.operation == TransactionOperationEnum.confirmed) {
        this.modalClientMessage = new ClientMessage('Transaction successfull', `RewardDistributor instance made immutable.`, res.txId != null ? res.txId != null ? `${this.selectedChainId.blockExplorerUrl}tx/${res.txId}` : null : null, 'info');
        this.editCalls.splice(this.editCalls.indexOf(EditTypeEnum.description), 1);
        if (this.editCalls.length > 0) {
          this.operation = TransactionOperationEnum.edit;
        } else {
          this.operation = TransactionOperationEnum.confirmed;
        }
        this.getAllInstances();
        this._cdr.detectChanges();
      } else {
        this.operation = res.operation;
        this.modalClientMessage = new ClientMessage('Transaction failed', res.message, res.txId != null ? `${this.selectedChainId.blockExplorerUrl}tx/${res.txId}` : null, 'danger');
        this._cdr.detectChanges();
      }
    });
  }
  public renameInstance(): void {
    this.operation = TransactionOperationEnum.submitting;
    let request: RewardsDistributorRequestDto = Commons.marshallRequestDto(this.requestFormGroup);
    this._rewardsDistributorService.rename(request.instanceAddress, request.description).subscribe(res => {
      if (res.operation == TransactionOperationEnum.transacting) {
        this.operation = TransactionOperationEnum.transacting;
        this._cdr.detectChanges();
      } else if (res.operation == TransactionOperationEnum.confirmed) {
        this.modalClientMessage = new ClientMessage('Transaction successfull', `RewardDistributor instance succesfully renamed.`, res.txId != null ? `${this.selectedChainId.blockExplorerUrl}tx/${res.txId}` : null, 'info');
        this.editCalls.splice(this.editCalls.indexOf(EditTypeEnum.description), 1);
        if (this.editCalls.length > 0) {
          this.operation = TransactionOperationEnum.edit;
        } else {
          this.operation = TransactionOperationEnum.confirmed;
        }
        this.getAllInstances();

        this._cdr.detectChanges();
      } else {
        this.operation = res.operation;
        this.modalClientMessage = new ClientMessage('Transaction failed', res.message, res.txId != null ? `${this.selectedChainId.blockExplorerUrl}tx/${res.txId}` : null, 'danger');
        this._cdr.detectChanges();
      }
    });
  }
  public replaceReserveBalance(): void {
    this.operation = TransactionOperationEnum.submitting;
    let request: RewardsDistributorRequestDto = Commons.marshallRequestDto(this.requestFormGroup);
    this._rewardsDistributorService.replaceReserveBalance(request).subscribe(res => {
      if (res.operation == TransactionOperationEnum.transacting) {
        this.operation = TransactionOperationEnum.transacting;
        this._cdr.detectChanges();
      } else if (res.operation == TransactionOperationEnum.confirmed) {
        this.modalClientMessage = new ClientMessage('Transaction successfull', `RewardDistributor reserve balance succesfully replaced.`, res.txId != null ? `${this.selectedChainId.blockExplorerUrl}tx/${res.txId}` : null, 'info');
        this.editCalls.splice(this.editCalls.indexOf(EditTypeEnum.reserveBalance), 1);
        if (this.editCalls.length > 0) {
          this.operation = TransactionOperationEnum.edit;
        } else {
          this.operation = TransactionOperationEnum.confirmed;
        }
        this.getAllInstances();
        this._cdr.detectChanges();
      } else {
        this.operation = res.operation;
        this.modalClientMessage = new ClientMessage('Transaction failed', res.message, res.txId != null ? `${this.selectedChainId.blockExplorerUrl}tx/${res.txId}` : null, 'danger');
        this._cdr.detectChanges();
      }
    });
  }
  public replaceRecipients(): void {
    this.operation = TransactionOperationEnum.submitting;
    let request: RewardsDistributorRequestDto = Commons.marshallRequestDto(this.requestFormGroup);
    this._rewardsDistributorService.replaceRecipients(request).subscribe(res => {
      if (res.operation == TransactionOperationEnum.transacting) {
        this.operation = TransactionOperationEnum.transacting;
        this._cdr.detectChanges();
      } else if (res.operation == TransactionOperationEnum.confirmed) {
        this.modalClientMessage = new ClientMessage('Transaction successfull', `RewardDistributor recipients succesfully replaced.`, res.txId != null ? `${this.selectedChainId.blockExplorerUrl}tx/${res.txId}` : null, 'info');
        this.editCalls.splice(this.editCalls.indexOf(EditTypeEnum.reserveBalance), 1);
        if (this.editCalls.length > 0) {
          this.operation = TransactionOperationEnum.edit;
        } else {
          this.operation = TransactionOperationEnum.confirmed;
        }
        this.getAllInstances();
        this._cdr.detectChanges();
      } else {
        this.operation = res.operation;
        this.modalClientMessage = new ClientMessage('Transaction failed', res.message, res.txId != null ? `${this.selectedChainId.blockExplorerUrl}tx/${res.txId}` : null, 'danger');
        this._cdr.detectChanges();
      }
    });
  }


  public isNullOrEmpty(input: string): boolean {
    return (input == null || (input != null && input.trim() == ''));
  }

}


