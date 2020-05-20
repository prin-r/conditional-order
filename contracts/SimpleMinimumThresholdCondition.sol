pragma solidity 0.5.10;

import { Condition } from "./Condition.sol";
import { Oracle, usingBandProtocol } from "band-solidity/contracts/Band.sol";
import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract SimpleMinimumThresholdCondition is usingBandProtocol, Condition, Ownable {
  uint256 public threshold;
  bytes public key;
  uint256 public value;
  uint256 public lastUpdate;

  Oracle public oracle;

  constructor(uint256 _threshold, Oracle _oracle, bytes memory _key) public {
    threshold = _threshold;
    oracle = _oracle;
    key = _key;
  }

  function setThreshold(uint256 _threshold) public onlyOwner {
    threshold = _threshold;
  }

  function update() public payable {
    value = oracle.querySpotPrice(string(abi.encodePacked(key)));
    lastUpdate = now;
  }

  function check() public view returns(bool) {
    require(lastUpdate > now - 1 minutes, "VALUE_NOT_UPTODATE");
    return value >= threshold;
  }
}
