pragma solidity 0.5.10;

import { ERC20 } from "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import { MinterRole } from "openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

interface ERC20Interface {
  // Standard ERC-20 interface.
  function transfer(address to, uint256 value) external returns (bool);
  function approve(address spender, uint256 value) external returns (bool);
  function transferFrom(address from, address to, uint256 value) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address who) external view returns (uint256);
  function allowance(address owner, address spender) external view returns (uint256);
  // Extension of ERC-20 interface to support supply adjustment.
  function mint(address to, uint256 value) external returns (bool);
  function burn(address from, uint256 value) external returns (bool);
}

contract ERC20Base is ERC20Interface, ERC20, MinterRole {
  string public name;
  string public symbol;
  uint8 public decimals = 18;

  constructor(string memory _name, string memory _symbol) public {
    name = _name;
    symbol = _symbol;
  }

  function mint(address to, uint256 value) public onlyMinter returns (bool) {
    _mint(to, value);
    return true;
  }

  function burn(address from, uint256 value) public onlyMinter returns (bool) {
    _burn(from, value);
    return true;
  }
}
