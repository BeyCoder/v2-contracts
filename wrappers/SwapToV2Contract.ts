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
import {JettonMaster} from "ton";

export type SwapToV2ContractConfig = {
    admin_wallet: Address,
    old_jetton_wallet: Address|null,
    new_jetton_wallet: Address|null,
    old_jetton_balance: bigint,
    old_jetton_decimals: number,
    new_jetton_balance: bigint,
    new_jetton_decimals: number,
};

export function swapToV2ContractConfigToCell(config: SwapToV2ContractConfig): Cell {
    return beginCell()
        .storeAddress(config.admin_wallet)
        .storeAddress(config.old_jetton_wallet)
        .storeAddress(config.new_jetton_wallet)
        .storeCoins(config.old_jetton_balance)
        .storeUint(config.old_jetton_balance, 8)
        .storeCoins(config.new_jetton_balance)
        .storeUint(config.new_jetton_balance, 8)
    .endCell();
}

export const Opcodes = {
    set_jetton_wallets: 0x996c7334,
    withdraw_old_jettons: 0x49f9255e,
    withdraw_new_jettons: 0xe12fafe0,
};

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

    async sendSetJettonWallets(
        provider: ContractProvider,
        via: Sender,
        opts: {
            old_jetton_wallet: Address;
            old_jetton_decimals: number;
            new_jetton_wallet: Address;
            new_jetton_decimals: number;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: toNano("0.01"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.set_jetton_wallets, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeAddress(opts.old_jetton_wallet)
                .storeUint(opts.old_jetton_decimals, 8)
                .storeAddress(opts.new_jetton_wallet)
                .storeUint(opts.new_jetton_decimals, 8)
                .endCell(),
        });
    }

    async sendWithdrawOldJettons(
        provider: ContractProvider,
        via: Sender,
        opts: {
            amount: number;
            decimals: number;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: toNano("0.1"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.withdraw_old_jettons, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeCoins(opts.amount * (10 ** opts.decimals))
                .endCell(),
        });
    }

    async sendWithdrawNewJettons(
        provider: ContractProvider,
        via: Sender,
        opts: {
            amount: number;
            decimals: number;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: toNano("0.1"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.withdraw_new_jettons, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeCoins(opts.amount * (10 ** opts.decimals))
                .endCell(),
        });
    }

    async sendSwap(
        provider: ContractProvider,
        via: Sender,
        opts: {
            old_jetton_wallet: Address
            jetton_amount: bigint,
            value: bigint;
            decimals: number
            queryID?: number;
        }
    ) {
        if(!via.address) {
            console.error("Sender excepted! Can't find JettonWallet of user.");
            return;
        }
        const body = beginCell()
            .storeUint(0xf8a7ea5, 32)
            .storeUint(0, 64)
            .storeCoins(Number(opts.jetton_amount) * (10 ** opts.decimals))
            .storeAddress(this.address)
            .storeAddress(via.address)
            .storeUint(0, 1)
            .storeCoins(toNano("0.1"))
            .storeUint(0, 1)
            .storeUint(0, 32)
            .endCell();

        await provider.internal(via, {
            value: toNano("0.15"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async getBalances(provider: ContractProvider) {
        const result = await provider.get('get_balances', []);
        return {
            old_jetton: result.stack.readBigNumber(),
            new_jetton: result.stack.readBigNumber()
        };
    }

    async getJettonWallets(provider: ContractProvider) {
        const result = await provider.get('get_jetton_wallets', []);
        return {
            old_jetton: result.stack.readAddressOpt(),
            old_jetton_decimals: result.stack.readNumber(),
            new_jetton: result.stack.readAddressOpt(),
            new_jetton_decimals: result.stack.readNumber()
        };
    }
}
