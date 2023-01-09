/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "./common";

export declare namespace IRewardDistributorFactory {
  export type NamedInstanceStruct = {
    instance: PromiseOrValue<string>;
    description: PromiseOrValue<string>;
  };

  export type NamedInstanceStructOutput = [string, string] & {
    instance: string;
    description: string;
  };
}

export interface RewardDistributorFactoryInterface extends utils.Interface {
  functions: {
    "count(address)": FunctionFragment;
    "create(address,uint256,address[],uint256[],bool[],bool,string)": FunctionFragment;
    "get(address,uint256)": FunctionFragment;
    "getAll(address)": FunctionFragment;
    "remove(address)": FunctionFragment;
    "rename(address,string)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "count"
      | "create"
      | "get"
      | "getAll"
      | "remove"
      | "rename"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "count",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "create",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<string>[],
      PromiseOrValue<BigNumberish>[],
      PromiseOrValue<boolean>[],
      PromiseOrValue<boolean>,
      PromiseOrValue<string>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "get",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getAll",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "remove",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "rename",
    values: [PromiseOrValue<string>, PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(functionFragment: "count", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "create", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "get", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getAll", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "remove", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "rename", data: BytesLike): Result;

  events: {
    "Created(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Created"): EventFragment;
}

export interface CreatedEventObject {
  instance: string;
  provider: string;
}
export type CreatedEvent = TypedEvent<[string, string], CreatedEventObject>;

export type CreatedEventFilter = TypedEventFilter<CreatedEvent>;

export interface RewardDistributorFactory extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: RewardDistributorFactoryInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    count(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    create(
      provider: PromiseOrValue<string>,
      reserveBalance: PromiseOrValue<BigNumberish>,
      recipients: PromiseOrValue<string>[],
      bips: PromiseOrValue<BigNumberish>[],
      wrap: PromiseOrValue<boolean>[],
      editable: PromiseOrValue<boolean>,
      description: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    get(
      owner: PromiseOrValue<string>,
      i: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string, string] & { instance: string; description: string }>;

    getAll(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[IRewardDistributorFactory.NamedInstanceStructOutput[]]>;

    remove(
      instance: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    rename(
      instance: PromiseOrValue<string>,
      description: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  count(
    owner: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  create(
    provider: PromiseOrValue<string>,
    reserveBalance: PromiseOrValue<BigNumberish>,
    recipients: PromiseOrValue<string>[],
    bips: PromiseOrValue<BigNumberish>[],
    wrap: PromiseOrValue<boolean>[],
    editable: PromiseOrValue<boolean>,
    description: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  get(
    owner: PromiseOrValue<string>,
    i: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<[string, string] & { instance: string; description: string }>;

  getAll(
    owner: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<IRewardDistributorFactory.NamedInstanceStructOutput[]>;

  remove(
    instance: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  rename(
    instance: PromiseOrValue<string>,
    description: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    count(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    create(
      provider: PromiseOrValue<string>,
      reserveBalance: PromiseOrValue<BigNumberish>,
      recipients: PromiseOrValue<string>[],
      bips: PromiseOrValue<BigNumberish>[],
      wrap: PromiseOrValue<boolean>[],
      editable: PromiseOrValue<boolean>,
      description: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;

    get(
      owner: PromiseOrValue<string>,
      i: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string, string] & { instance: string; description: string }>;

    getAll(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<IRewardDistributorFactory.NamedInstanceStructOutput[]>;

    remove(
      instance: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    rename(
      instance: PromiseOrValue<string>,
      description: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "Created(address,address)"(
      instance?: PromiseOrValue<string> | null,
      provider?: PromiseOrValue<string> | null
    ): CreatedEventFilter;
    Created(
      instance?: PromiseOrValue<string> | null,
      provider?: PromiseOrValue<string> | null
    ): CreatedEventFilter;
  };

  estimateGas: {
    count(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    create(
      provider: PromiseOrValue<string>,
      reserveBalance: PromiseOrValue<BigNumberish>,
      recipients: PromiseOrValue<string>[],
      bips: PromiseOrValue<BigNumberish>[],
      wrap: PromiseOrValue<boolean>[],
      editable: PromiseOrValue<boolean>,
      description: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    get(
      owner: PromiseOrValue<string>,
      i: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getAll(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    remove(
      instance: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    rename(
      instance: PromiseOrValue<string>,
      description: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    count(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    create(
      provider: PromiseOrValue<string>,
      reserveBalance: PromiseOrValue<BigNumberish>,
      recipients: PromiseOrValue<string>[],
      bips: PromiseOrValue<BigNumberish>[],
      wrap: PromiseOrValue<boolean>[],
      editable: PromiseOrValue<boolean>,
      description: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    get(
      owner: PromiseOrValue<string>,
      i: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getAll(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    remove(
      instance: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    rename(
      instance: PromiseOrValue<string>,
      description: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
