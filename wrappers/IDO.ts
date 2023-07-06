import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano
} from 'ton-core';

export type IDOConfig = {
    admin_wallet: Address,
    jetton_wallet: Address|null,
    balance: bigint,
    price: bigint,
    sold_jetton_amount: bigint
};

export const Opcodes = {
    set_jetton_wallet: 0x6a48fe56,
    set_price: 0x0f990365,
    withdraw_jettons: 0xba2c493a,
    withdraw: 0xcb03bfaf,
    buy: 0xdec25470
}

export function IDOConfigToCell(config: IDOConfig): Cell {
    return beginCell()
        .storeAddress(config.admin_wallet)
        .storeAddress(config.jetton_wallet)
        .storeCoins(config.balance)
        .storeCoins(config.price)
        .storeCoins(config.sold_jetton_amount)
    .endCell();
}

export class IDO implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new IDO(address);
    }

    static createFromConfig(config: IDOConfig, code: Cell, workchain = 0) {
        const data = IDOConfigToCell(config);
        const init = { code, data };
        return new IDO(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendSetJettonWallet(
        provider: ContractProvider,
        via: Sender,
        opts: {
            jetton_wallet: Address;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: toNano("0.01"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.set_jetton_wallet, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeAddress(opts.jetton_wallet)
                .endCell(),
        });
    }

    async sendSetPrice(
        provider: ContractProvider,
        via: Sender,
        opts: {
            price: bigint;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: toNano("0.01"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.set_jetton_wallet, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeCoins(opts.price)
                .endCell(),
        });
    }

    async sendWithdraw(
        provider: ContractProvider,
        via: Sender,
        opts: {
            amount: bigint;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: toNano("0.01"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.withdraw, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeCoins(opts.amount)
                .endCell(),
        });
    }

    async sendWithdrawJettons(
        provider: ContractProvider,
        via: Sender,
        opts: {
            amount: bigint;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: toNano("0.1"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.withdraw_jettons, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeCoins(opts.amount)
                .endCell(),
        });
    }
    async sendBuy(
        provider: ContractProvider,
        via: Sender,
        opts: {
            amount: bigint;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.amount + toNano("0.1"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.buy, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .endCell(),
        });
    }

    async getJettonBalance(provider: ContractProvider) {
        const result = await provider.get('get_jetton_balance', []);
        return result.stack.readBigNumber();
    }

    async getJettonWallet(provider: ContractProvider) {
        const result = await provider.get('get_jetton_wallet', []);
        return result.stack.readAddressOpt();
    }

    async getPrice(provider: ContractProvider) {
        const result = await provider.get('get_price', []);
        return result.stack.readBigNumber();
    }
    async getSoldJettonAmount(provider: ContractProvider) {
        const result = await provider.get('get_sold_jetton_amount', []);
        return result.stack.readBigNumber();
    }
    async getAllData(provider: ContractProvider) {
        const result = await provider.get('get_data', []);
        return {
            jetton_balance: result.stack.readBigNumber(),
            price: result.stack.readBigNumber(),
            sold_jetton_amount: result.stack.readBigNumber(),
            jetton_wallet: result.stack.readAddressOpt(),
        };
    }
}
