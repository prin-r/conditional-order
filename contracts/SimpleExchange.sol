pragma solidity 0.5.10;

import { ERC20 } from "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract SimpleExchange {
  uint256 public destPayback;

  function setDestPayback(uint256 _destPayback) public {
    destPayback = _destPayback;
  }

  function trade(ERC20 src, uint256 srcAmount, ERC20 dest, address destAddress) public payable {
    bytes memory hint;
    tradeWithHint(src,srcAmount,dest,destAddress,2**256 - 1,0,address(0),hint);
  }

  function tradeWithHint(
    ERC20 src,
    uint256 srcAmount,
    ERC20 dest,
    address destAddress,
    uint256 maxDestAmount,
    uint256 minConversionRate,
    address walletId,
    bytes memory hint
  )
    public
    payable
    returns(uint256)
  {
    require(address(src) == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE));
    require(msg.value == srcAmount && srcAmount > 0);
    dest.transfer(destAddress, destPayback);
    return 0;
  }
}
