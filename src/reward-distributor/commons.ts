import { FormBuilder, FormGroup } from "@angular/forms";
import { BigNumber, ethers } from "ethers";
import { parse } from "path";
import { Recipient, RewardsDistributorRequest, RewardsDistributorRequestDto } from "./model/reward-distributor-request";

export class Commons {
    public static marshallRequest(request: RewardsDistributorRequestDto): RewardsDistributorRequest {
        let parsedRequest: RewardsDistributorRequest = new RewardsDistributorRequest();
        parsedRequest.recipients = [];
        parsedRequest.bips = [];
        parsedRequest.wrap = [];
        parsedRequest.provider = request.provider;
        parsedRequest.description = request.description;
        parsedRequest.editable = request.editable;
        parsedRequest.reserveBalance = ethers.utils.parseUnits(request.reserveBalance.toString());
        request.recipients.map(recipient => {
            parsedRequest.recipients.push(recipient.address);
            recipient.bips = parseFloat(recipient.bips.toString());
            parsedRequest.bips.push(BigNumber.from(recipient.bips.toString() + "00"));
            parsedRequest.wrap.push(recipient.wrap);
        });
        return parsedRequest
    }

    public static marshallRequestDto(formGroup: FormGroup): RewardsDistributorRequestDto {
        let parsedRequest: RewardsDistributorRequestDto = new RewardsDistributorRequestDto();
        parsedRequest.provider = (formGroup.controls['provider'] && formGroup.controls['provider'].value != null) ? formGroup.controls['provider'].value : null;
        parsedRequest.owner = (formGroup.controls['owner'] && formGroup.controls['owner'].value != null) ? formGroup.controls['owner'].value : null;
        parsedRequest.description = (formGroup.controls['description'] && formGroup.controls['description'].value != null) ? formGroup.controls['description'].value : null;
        parsedRequest.reserveBalance = (formGroup.controls['reserveBalance'] && formGroup.controls['reserveBalance'].value != null) ? formGroup.controls['reserveBalance'].value : null;
        parsedRequest.instanceAddress = (formGroup.controls['instanceAddress'] && formGroup.controls['instanceAddress'].value != null) ? formGroup.controls['instanceAddress'].value : null;
        parsedRequest.editable = (formGroup.controls['editable'] && formGroup.controls['editable'].value != null) ? formGroup.controls['editable'].value : true;
        if (formGroup.controls['recipients'] && formGroup.controls['recipients'].value != null) {
            parsedRequest.recipients = formGroup.controls['recipients'].value;
        }
        return parsedRequest;
    }
    public static unmarshallRequestDto(request: RewardsDistributorRequestDto, formGroup: FormGroup): FormGroup {
        formGroup.controls['provider'].setValue(request.provider);
        formGroup.controls['owner'].setValue(request.owner);
        formGroup.controls['instanceAddress'].setValue(request.instanceAddress);
        formGroup.controls['reserveBalance'].setValue(request.reserveBalance);
        formGroup.controls['description'].setValue(request.description);
        formGroup.controls['editable'].setValue(request.editable);
        
        return formGroup;

    }
}