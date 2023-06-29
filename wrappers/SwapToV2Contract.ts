import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type SwapToV2ContractConfig = {};

export function swapToV2ContractConfigToCell(config: SwapToV2ContractConfig): Cell {
    return beginCell().endCell();
}

export class SwapToV2Contract implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new SwapToV2Contract(address);
    }

    static createFromConfig(config: SwapToV2ContractConfig, code: Cell, workchain = 0) {
        const data = swapToV2ContractConfigToCell(config);
        const init = { code, data };
        return new SwapToV2Contract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
