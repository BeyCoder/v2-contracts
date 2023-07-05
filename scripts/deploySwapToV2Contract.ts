import {Address, toNano} from 'ton-core';
import { SwapToV2Contract } from '../wrappers/SwapToV2Contract';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const swapToV2Contract = provider.open(
        SwapToV2Contract.createFromConfig({
            admin_wallet: Address.parse(await ui.input("Admin wallet:")),
            old_jetton_wallet: null,
            new_jetton_wallet: null,
            old_jetton_balance: BigInt(0),
            old_jetton_decimals: 5,
            new_jetton_balance: BigInt(0),
            new_jetton_decimals: 9,
        },
        await compile('SwapToV2Contract')
        )
    );

    await swapToV2Contract.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(swapToV2Contract.address);
}
