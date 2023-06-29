import { toNano } from 'ton-core';
import { SwapToV2Contract } from '../wrappers/SwapToV2Contract';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const swapToV2Contract = provider.open(SwapToV2Contract.createFromConfig({}, await compile('SwapToV2Contract')));

    await swapToV2Contract.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(swapToV2Contract.address);

    // run methods on `swapToV2Contract`
}
