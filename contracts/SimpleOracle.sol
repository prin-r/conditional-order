pragma solidity 0.5.10;

import { Oracle } from "band-solidity/contracts/Band.sol";

contract SimpleOracle is Oracle {
  uint256 public value;

  constructor(uint256 _value) public {
    value = _value;
  }

  function query(bytes calldata)
    external payable returns (bytes32 output, uint256 updatedAt, QueryStatus status) {
      return (bytes32(value), now, QueryStatus.OK);
    }

  function queryPrice() external view returns (uint256) {
    return 0.001 ether;
  }

  function setValue(uint256 _value) public {
    value = _value;
  }
}
