import { FormBuilder, FormGroup } from "@angular/forms";
import { BigNumber, ethers } from "ethers";
import { parse } from "path";
import { Recipient, RewardsDistributorRequest as RewardsDistributorRequestV1, RewardsDistributorRequestDto as RewardsDistributorRequestDtoV1 } from "src/reward-distributor-v1/model/reward-distributor-request";
import { RewardsDistributorRequest as RewardsDistributorRequestV2, RewardsDistributorRequestDto as RewardsDistributorRequestDtoV2 } from "src/reward-distributor-v2/model/reward-distributor-request";

export class Commons {
    public static marshallRequestV1(request: RewardsDistributorRequestDtoV1): RewardsDistributorRequestV1 {
        let parsedRequest: RewardsDistributorRequestV1 = new RewardsDistributorRequestV1();
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
    public static marshallRequestV2(request: RewardsDistributorRequestDtoV2): RewardsDistributorRequestV2 {
        let parsedRequest: RewardsDistributorRequestV2 = new RewardsDistributorRequestV2();
        parsedRequest.recipients = [];
        parsedRequest.operatingAddress = [];
        parsedRequest.lowReserve = [];
        parsedRequest.highReserve = [];
        parsedRequest.wrap = [];
        parsedRequest.bips = [];
        parsedRequest.description = request.description;
        parsedRequest.editable = request.editable;
        //parsedRequest.reserveBalance = ethers.utils.parseUnits(request.reserveBalance.toString());
        request.recipients.map(recipient => {
            parsedRequest.recipients.push(recipient.address);
            recipient.bips = parseFloat(recipient.bips.toString());
            parsedRequest.bips.push(BigNumber.from(recipient.bips.toString() + "00"));
            parsedRequest.wrap.push(recipient.wrap);
        });
        request.operatingAddress.map(operatingAddress => {
            parsedRequest.operatingAddress.push(operatingAddress.recipient);
            operatingAddress.lowReserve = parseFloat(operatingAddress.lowReserve.toString());
            operatingAddress.highReserve = parseFloat(operatingAddress.highReserve.toString());
            parsedRequest.lowReserve.push(ethers.utils.parseUnits(operatingAddress.lowReserve.toString()));
            parsedRequest.highReserve.push(ethers.utils.parseUnits(operatingAddress.highReserve.toString()));
            
        });
        return parsedRequest
    }

    public static marshallRequestDtoV1(formGroup: FormGroup): RewardsDistributorRequestDtoV1 {
        let parsedRequest: RewardsDistributorRequestDtoV1 = new RewardsDistributorRequestDtoV1();
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
    public static marshallRequestDtoV2(formGroup: FormGroup): RewardsDistributorRequestDtoV2 {
        let parsedRequest: RewardsDistributorRequestDtoV2 = new RewardsDistributorRequestDtoV2();
        parsedRequest.owner = (formGroup.controls['owner'] && formGroup.controls['owner'].value != null) ? formGroup.controls['owner'].value : null;
        parsedRequest.description = (formGroup.controls['description'] && formGroup.controls['description'].value != null) ? formGroup.controls['description'].value : null;
        parsedRequest.instanceAddress = (formGroup.controls['instanceAddress'] && formGroup.controls['instanceAddress'].value != null) ? formGroup.controls['instanceAddress'].value : null;
        parsedRequest.editable = (formGroup.controls['editable'] && formGroup.controls['editable'].value != null) ? formGroup.controls['editable'].value : true;
        if (formGroup.controls['recipients'] && formGroup.controls['recipients'].value != null) {
            parsedRequest.recipients = formGroup.controls['recipients'].value;
        }
        if (formGroup.controls['operatingAddress'] && formGroup.controls['operatingAddress'].value != null) {
            parsedRequest.operatingAddress = formGroup.controls['operatingAddress'].value;
        }
        return parsedRequest;
    }
    public static unmarshallRequestDtoV1(request: RewardsDistributorRequestDtoV1, formGroup: FormGroup): FormGroup {
        formGroup.controls['provider'].setValue(request.provider);
        formGroup.controls['owner'].setValue(request.owner);
        formGroup.controls['instanceAddress'].setValue(request.instanceAddress);
        formGroup.controls['reserveBalance'].setValue(request.reserveBalance);
        formGroup.controls['description'].setValue(request.description);
        formGroup.controls['editable'].setValue(request.editable);
        return formGroup;
    }
    public static unmarshallRequestDtoV2(request: RewardsDistributorRequestDtoV2, formGroup: FormGroup): FormGroup {    
        formGroup.controls['owner'].setValue(request.owner);
        formGroup.controls['instanceAddress'].setValue(request.instanceAddress);
        formGroup.controls['operatingAddress'].setValue(request.operatingAddress);
        formGroup.controls['recipients'].setValue(request.recipients);
        formGroup.controls['description'].setValue(request.description);
        formGroup.controls['editable'].setValue(request.editable);
        return formGroup;
    }
}