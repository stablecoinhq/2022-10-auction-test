// SPDX-License-Identifier: MIT

pragma solidity =0.6.12;

import "../lib/dss-exec-lib/src/DssAction.sol";
import "../lib/dss-exec-lib/src/DssExec.sol";
import "../lib/dss-exec-lib/src/DssExecLib.sol";

contract DssSpellAction is DssAction {
    string public constant override description =
        "2022-10-26 Change auction parameters";

    // uint256 internal constant WAD = 10**18;
    function officeHours() public view override returns (bool) {
        return false;
    }

    function actions() public override {
        // sump [rad] 45 digits
        DssExecLib.setDebtAuctionDAIAmount(100);
        // bump 1000
        DssExecLib.setSurplusAuctionAmount(1300);
        // hump 100
        DssExecLib.setSurplusBuffer(100);
    }
}

contract DssSpell is DssExec {
    constructor()
        public
        DssExec(block.timestamp + 30 days, address(new DssSpellAction()))
    {}
}
