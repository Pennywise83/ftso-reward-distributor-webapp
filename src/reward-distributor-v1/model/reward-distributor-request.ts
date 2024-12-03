import { BigNumberish } from "ethers";
import { PromiseOrValue } from "src/typechain/v1/common";

export class RewardsDistributorRequest {
    provider: PromiseOrValue<string>;
    reserveBalance: PromiseOrValue<BigNumberish>;
    recipients: PromiseOrValue<string>[];
    bips: PromiseOrValue<BigNumberish>[];
    wrap: PromiseOrValue<boolean>[];
    editable: PromiseOrValue<boolean>;
    description: PromiseOrValue<string>;
}

export class RewardsDistributorRequestDto {
    owner: string = null;
    provider: string = null;
    instanceAddress: string = null;
    reserveBalance: number = null;
    recipients: Array<Recipient> = [];
    description: string = null;
    editable: boolean = true;
}

export class Recipient {
    address: string = null;
    bips: number = null;
    wrap: boolean = false;
}