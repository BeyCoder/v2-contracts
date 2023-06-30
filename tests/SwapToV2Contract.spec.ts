import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { SwapToV2Contract } from '../wrappers/SwapToV2Contract';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('SwapToV2Contract', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('SwapToV2Contract');
    });

    let blockchain: Blockchain;
    let swapToV2Contract: SandboxContract<SwapToV2Contract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        swapToV2Contract = blockchain.openContract(SwapToV2Contract.createFromConfig({
            
        }, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await swapToV2Contract.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: swapToV2Contract.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and swapToV2Contract are ready to use
    });
});
