pragma solidity 0.5.10;

import { ERC20 } from "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

interface Exchange {
  function trade(ERC20 src, uint256 srcAmount, ERC20 dest, address destAddress) external payable;
}
