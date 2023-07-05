import {Address, toNano} from 'ton-core';
import { IDO } from '../wrappers/IDO';
import { compile, NetworkProvider } from '@ton-community/blueprint';
import {SwapToV2Contract} from "../wrappers/SwapToV2Contract";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const idoContract = provider.open(
        IDO.createFromConfig({
                admin_wallet: Address.parse(await ui.input("Admin wallet:")),
                jetton_wallet: null,
                balance: BigInt(0),
                sold_jetton_amount: BigInt(0),
                price: BigInt(parseInt(await ui.input("Price for 1 TON in jettons: ")) * (10 ** (parseInt(await ui.input("Decimals:")) - 1))),
            },
            await compile('ido')
        )
    );

    await idoContract.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(idoContract.address);
}
