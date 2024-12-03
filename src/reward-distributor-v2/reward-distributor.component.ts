import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ChainIdInfo } from 'src/reward-distributor-v1/model/chain-id-info';
import { NamedInstance } from 'src/reward-distributor-v1/model/named-instance';
import { OperatingAddress, RewardsDistributorRequestDto } from "src/reward-distributor-v2/model/reward-distributor-request";
import { TransactionOperationEnum } from 'src/reward-distributor-v1/model/transaction-operation.enum';
import { EditTypeEnum } from 'src/reward-distributor-v2/model/edit-type.enum';
import { RewardsDistributorService } from './services/rewards-distributor.service';
import { Commons } from 'src/reward-distributor-v1/commons';
import { ClientMessage } from 'src/reward-distributor-v2/model/client-message';

@Component({
  selector: 'reward-distributor-v2',
  templateUrl: './reward-distributor.component.html',
  styleUrls: ['./reward-distributor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RewardDistributorComponentV2 implements OnInit {
  public isMetamaskInstalled: boolean = false;
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
      instanceAddress: [null],
      reserveBalance: [0, [Validators.min(0.01), Validators.required]],
      description: [null, Validators.required],
      editable: [true],
      recipients: this._formBuilder.array([], Validators.required)
    }, { validator: [this.proportionValidator, this.operatingAddressValidator] });
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
  private operatingAddressValidator(group: FormGroup) {
    let operatingAddress: FormArray = group.controls['operatingAddress'] as FormArray;
    if (operatingAddress && operatingAddress.length > 0) {
      operatingAddress.controls.map(group => {
        let low: number = parseFloat(group.get('lowReserve').value);
        let high: number = parseFloat(group.get('highReserve').value);
        let recipient: string = group.get('recipient').value;
        if (low > high) {
          let errors: any = {};
          if (group.get('lowReserve').errors && group.get('lowReserve').errors != null) {
            errors = group.get('lowReserve').errors;
            errors['invalidReserve'] = true;
          } else {
            errors['invalidReserve'] = true;
          }

          if (group.get('highReserve').errors && group.get('highReserve').errors != null) {
            errors = group.get('highReserve').errors;
            errors['invalidReserve'] = true;
          } else {
            errors['invalidReserve'] = true;
          }
          group.get('lowReserve').setErrors(errors);
          group.get('lowReserve').markAsTouched({ onlySelf: true });
          group.get('highReserve').setErrors(errors);
          group.get('highReserve').markAsTouched({ onlySelf: true })
        } else if (recipient == null || recipient != null && recipient.trim() == '') {
          let errors: any = {};
          if (group.get('recipient').errors && group.get('recipient').errors != null) {
            errors = group.get('recipient').errors;
            errors['invalidRecipientAddress'] = true;
          } else {
            errors['invalidRecipientAddress'] = true;
          }
          group.get('recipient').setErrors(errors);
          group.get('recipient').markAsTouched({ onlySelf: true });
        } else {
          group.get('lowReserve').setErrors(null);
          group.get('lowReserve').markAsTouched({ onlySelf: true });
          group.get('highReserve').setErrors(null);
          group.get('highReserve').markAsTouched({ onlySelf: true })
        }
      });
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

  public get operatingAddress(): FormArray {
    return this.requestFormGroup.controls['operatingAddress'] as FormArray;
  }

  public addOperatingAddress() {
    let operatingAddressForm: FormGroup = this._formBuilder.group({
      recipient: [null, Validators.required],
      lowReserve: [0, Validators.min(0.01)],
      highReserve: [0, Validators.min(0.01)]
    });

    let addresses: Array<string> = [];
    if (this.operatingAddress && this.operatingAddress.controls.length > 0) {
      this.operatingAddress.controls.map(operatingAddressFormElement => {
        addresses.push(operatingAddressFormElement.get('recipient').value);
      });
    }
    addresses = [... new Set(addresses)];
    this.operatingAddress.push(operatingAddressForm);
    this.requestFormGroup.updateValueAndValidity();
    this._cdr.detectChanges();
  }

  deleteRecipient(recipientIndex: number) {
    this.recipients.removeAt(recipientIndex);
    this._cdr.detectChanges();
  }

  deleteOperatingAddress(recipientIndex: number) {
    this.operatingAddress.removeAt(recipientIndex);
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
    this.requestFormGroup.controls['operatingAddress'] = this._formBuilder.array([]);
    this.requestFormGroup.controls['operatingAddress'].setValidators(Validators.required);
    this.selectedInstanceIdx = null;
    this._cdr.detectChanges();
  }


  public unmarshallRequestDto(instanceData: RewardsDistributorRequestDto): void {
    this.requestFormGroup = this._formBuilder.group({
      owner: [instanceData.owner],
      instanceAddress: [instanceData.instanceAddress],
      description: [instanceData.description, Validators.required],
      editable: [instanceData.editable],
      recipients: this._formBuilder.array([], Validators.required),
      operatingAddress: this._formBuilder.array([], Validators.required)

    }, { validator: [this.proportionValidator, this.operatingAddressValidator] })
    instanceData.recipients.map(recipient => {
      let recipientForm: FormGroup = this._formBuilder.group({
        address: [recipient.address, Validators.required],
        bips: [recipient.bips, Validators.min(0)],
        wrap: [recipient.wrap]
      });
      (this.requestFormGroup.controls['recipients'] as FormArray).push(recipientForm);
    });
    instanceData.operatingAddress.map(operatingAddress => {
      let operatingAddressForm: FormGroup = this._formBuilder.group({
        recipient: [operatingAddress.recipient, Validators.required],
        lowReserve: [operatingAddress.lowReserve, Validators.min(0)],
        highReserve: [operatingAddress.highReserve, Validators.min(0)]
      });
      (this.requestFormGroup.controls['operatingAddress'] as FormArray).push(operatingAddressForm);
    });

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
          if (JSON.stringify(this.selectedInstanceData.operatingAddress) != JSON.stringify(this.requestFormGroup.get('operatingAddress').value)) {
            this.editCalls.push(EditTypeEnum.operatingAddress);
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
    let request: RewardsDistributorRequestDto = Commons.marshallRequestDtoV2(this.requestFormGroup);
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
    let request: RewardsDistributorRequestDto = Commons.marshallRequestDtoV2(this.requestFormGroup);
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
    let request: RewardsDistributorRequestDto = Commons.marshallRequestDtoV2(this.requestFormGroup);
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
  public replaceOperatingAddresses(): void {
    this.operation = TransactionOperationEnum.submitting;
    let request: RewardsDistributorRequestDto = Commons.marshallRequestDtoV2(this.requestFormGroup);
    this._rewardsDistributorService.replaceOperatingAddress(request).subscribe(res => {
      if (res.operation == TransactionOperationEnum.transacting) {
        this.operation = TransactionOperationEnum.transacting;
        this._cdr.detectChanges();
      } else if (res.operation == TransactionOperationEnum.confirmed) {
        this.modalClientMessage = new ClientMessage('Transaction successfull', `RewardDistributor operating address succesfully replaced.`, res.txId != null ? `${this.selectedChainId.blockExplorerUrl}tx/${res.txId}` : null, 'info');
        this.editCalls.splice(this.editCalls.indexOf(EditTypeEnum.operatingAddress), 1);
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
    let request: RewardsDistributorRequestDto = Commons.marshallRequestDtoV2(this.requestFormGroup);
    this._rewardsDistributorService.replaceRecipients(request).subscribe(res => {
      if (res.operation == TransactionOperationEnum.transacting) {
        this.operation = TransactionOperationEnum.transacting;
        this._cdr.detectChanges();
      } else if (res.operation == TransactionOperationEnum.confirmed) {
        this.modalClientMessage = new ClientMessage('Transaction successfull', `RewardDistributor recipients succesfully replaced.`, res.txId != null ? `${this.selectedChainId.blockExplorerUrl}tx/${res.txId}` : null, 'info');
        this.editCalls.splice(this.editCalls.indexOf(EditTypeEnum.recipients), 1);
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

