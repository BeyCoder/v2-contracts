import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { IDO } from '../wrappers/IDO';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('IDO', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('IDO');
    });

    let blockchain: Blockchain;
    let iDO: SandboxContract<IDO>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        iDO = blockchain.openContract(IDO.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await iDO.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: iDO.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and iDO are ready to use
    });
});
