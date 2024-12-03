import { BigNumberish } from "ethers";
import { PromiseOrValue } from "src/typechain/v1/common";

export class RewardsDistributorRequest {
    lowReserve: PromiseOrValue<BigNumberish>[];
    highReserve: PromiseOrValue<BigNumberish>[];
    operatingAddress: PromiseOrValue<string>[];
    recipients: PromiseOrValue<string>[];
    wrap: PromiseOrValue<boolean>[];
    bips: PromiseOrValue<BigNumberish>[];
    editable: PromiseOrValue<boolean>;
    description: PromiseOrValue<string>;
}

export class RewardsDistributorRequestDto {
    owner: string = null;
    instanceAddress: string = null;
    recipients: Array<Recipient> = [];
    operatingAddress: Array<OperatingAddress> = [];
    description: string = null;
    editable: boolean = true;
}

export class Recipient {
    address: string = null;
    bips: number = null;
    wrap: boolean = false;
}

export class OperatingAddress {
    recipient: string = null;
    lowReserve: number = null;
    highReserve: number = null;
}