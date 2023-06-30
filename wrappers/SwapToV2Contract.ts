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
    old_jetton_wallet: Address,
    new_jetton_wallet: Address,
    old_jetton_balance: bigint,
    old_jetton_decimals: number,
    new_jetton_balance: bigint,
    new_jetton_decimals: bigint,
};

export function swapToV2ContractConfigToCell(config: SwapToV2ContractConfig): Cell {
    return beginCell()
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
    withdraw_old_jettons: 0xbe4d8345,
    withdraw_new_jettons: 0x923ccb44,
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
            old_jetton_address: Address;
            old_jetton_decimals: number;
            new_jetton_address: Address;
            new_jetton_decimals: number;
            queryID?: number;
        }
    ) {
        const old_masterContract = JettonMaster.create(opts.old_jetton_address);
        const old_jetton_wallet = await old_masterContract.getWalletAddress(provider, this.address);

        const new_masterContract = JettonMaster.create(opts.new_jetton_address);
        const new_jetton_wallet = await new_masterContract.getWalletAddress(provider, this.address);

        await provider.internal(via, {
            value: toNano("0.01"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.set_jetton_wallets, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeAddress(old_jetton_wallet)
                .storeUint(opts.old_jetton_decimals, 8)
                .storeAddress(new_jetton_wallet)
                .storeUint(opts.new_jetton_decimals, 8)
                .endCell(),
        });
    }

    async sendSwap(
        provider: ContractProvider,
        via: Sender,
        opts: {
            old_jetton_address: Address
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

        const jettonMaster = JettonMaster.create(opts.old_jetton_address);
        const new_jetton_wallet = await jettonMaster.getWalletAddress(provider, via.address);

        const body = beginCell()
            .storeUint(0xf8a7ea5, 32)
            .storeUint(0, 64)
            .storeCoins(opts.jetton_amount * (10 ** opts.decimals))
            .storeAddress(this.address)
            .storeAddress(via.address)
            .storeUint(0, 1)
            .storeCoins(toNano("0.1"))
            .storeUint(0, 1)
            .storeUint(0, 32)
            .storeStringTail("Migrating to v2")
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
            old_jetton: result.stack.readAddress(),
            old_jetton_decimals: result.stack.readNumber(),
            new_jetton: result.stack.readAddress(),
            new_jetton_decimals: result.stack.readNumber()
        };
    }
}
