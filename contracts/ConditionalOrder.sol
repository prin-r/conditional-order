pragma solidity 0.5.10;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { ERC20 } from "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import { Condition } from "./Condition.sol";
import { Exchange } from "./IExchange.sol";


contract ConditionalOrder is Ownable {
  using SafeMath for uint;

  Condition public condition;
  Exchange public exchange;
  ERC20 public srcAsset;
  ERC20 public destAsset;

  uint256 public commissionPercentage = 1e16; // commission 1%

  constructor(Condition _condition, Exchange _exchange, ERC20 _srcAsset, ERC20 _destAsset) public {
    condition = _condition;
    exchange = _exchange;
    srcAsset = _srcAsset;
    destAsset = _destAsset;
  }

  function setCondition(Condition _condition) public onlyOwner {
    condition = _condition;
  }

  function setCommissionPercentage(uint256 _commissionPercentage) public onlyOwner {
    require(_commissionPercentage <= 1e18);
    commissionPercentage = _commissionPercentage;
  }

  function sell() public {
    require(condition.check(), "CONDITION_CHECK_FAIL");
    uint256 balance = address(this).balance;
    require(balance > 0);
    uint256 commission = balance.mul(commissionPercentage).div(1e18);
    uint256 sellAmount = balance.sub(commission);
    exchange.trade.value(sellAmount)(srcAsset,sellAmount,destAsset,owner());
    msg.sender.transfer(commission);
  }

  function deposit(uint256 amount) public payable {
    require(msg.value == amount && amount > 0);
  }
}
