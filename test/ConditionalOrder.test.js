const {
  BN,
  expectRevert,
  time,
  balance
} = require("openzeppelin-test-helpers");

const { expect } = require("chai");

require("chai").should();

const ConditionalOrder = artifacts.require("ConditionalOrder");
const SimpleExchange = artifacts.require("SimpleExchange");
const ERC20Base = artifacts.require("ERC20Base");
const SimpleOracle = artifacts.require("SimpleOracle");
const SimpleMinimumThresholdCondition = artifacts.require(
  "SimpleMinimumThresholdCondition"
);

contract("ConditionalOrder", ([owner, alice, bob]) => {
  beforeEach(async () => {
    this.oracle = await SimpleOracle.new("200", { from: owner });
    this.exchange = await SimpleExchange.new({ from: owner });
    this.dai = await ERC20Base.new("DAI", "DAI", {
      from: owner
    });
    this.condition = await SimpleMinimumThresholdCondition.new(
      "300",
      this.oracle.address,
      "0x4554482d555344", // ETH-USD
      { from: owner }
    );
    this.ether = { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" };
    this.conditionalOrder = await ConditionalOrder.new(
      this.condition.address,
      this.exchange.address,
      this.ether.address, // ERC20 Address that represent Ether in kyber
      this.dai.address,
      { from: owner }
    );

    await this.dai.mint(alice, "1000000", { from: owner });
    await this.dai.mint(bob, "1000000", { from: owner });
  });

  context("Basic getter/setter", () => {
    it("should be able to change condition address of conditionalOrder", async () => {
      (await this.conditionalOrder.condition())
        .toString()
        .should.eq(this.condition.address);
      await this.conditionalOrder.setCondition(
        "0xc0FfEeC0FFeEC0fFEEc0fFEEc0FFeec0FFeEc0Ff",
        { from: owner }
      );
      (await this.conditionalOrder.condition())
        .toString()
        .should.eq("0xc0FfEeC0FFeEC0fFEEc0fFEEc0FFeec0FFeEc0Ff");
    });
    it("should be able to set commission percentage of conditionalOrder", async () => {
      (await this.conditionalOrder.commissionPercentage())
        .toString()
        .should.eq("10000000000000000");
      await this.conditionalOrder.setCommissionPercentage("100", {
        from: owner
      });
      (await this.conditionalOrder.commissionPercentage())
        .toString()
        .should.eq("100");
    });
    it("should be able to set destination payback of the exchange", async () => {
      (await this.exchange.destPayback()).toString().should.eq("0");
      await this.exchange.setDestPayback("10", {
        from: owner
      });
      (await this.exchange.destPayback()).toString().should.eq("10");
    });
    it("should be able to set value of the oracle", async () => {
      (await this.oracle.value()).toString().should.eq("200");
      await this.oracle.setValue("99", {
        from: owner
      });
      (await this.oracle.value()).toString().should.eq("99");
    });
    it("should be able to set threshold of the oracle", async () => {
      (await this.condition.threshold()).toString().should.eq("300");
      await this.condition.setThreshold("666", {
        from: owner
      });
      (await this.condition.threshold()).toString().should.eq("666");
    });
  });

  context("Condition functionalities", () => {
    // beforeEach(async () => {
    //   await this.conditionalOrder.deposit({
    //     from: owner,
    //     value: web3.utils.toWei("1", "ether")
    //   });
    //   await this.payout.setRate("1000000000000000000", { from: owner });
    //   await this.oracle.setValue("5000000000000000000", { from: owner });
    // });
    it("should be able update condition", async () => {
      (await this.condition.lastUpdate()).toString().should.eq("0");
      (await this.condition.value()).toString().should.eq("0");
      await this.condition.update({
        from: owner,
        value: web3.utils.toWei("0.001", "ether")
      });
      (await this.condition.lastUpdate())
        .toString()
        .should.eq((await time.latest()).toString());
      (await this.condition.value()).toString().should.eq("200");
    });
    it("should not be able check condition if not update", async () => {
      await expectRevert(this.condition.check(), "VALUE_NOT_UPTODATE");
    });
    it("should not be able check condition if now - lastUpdate >= 1 minute", async () => {
      (await this.condition.lastUpdate()).toString().should.eq("0");
      (await this.condition.value()).toString().should.eq("0");
      await this.condition.update({
        from: owner,
        value: web3.utils.toWei("0.001", "ether")
      });
      (await this.condition.lastUpdate())
        .toString()
        .should.eq((await time.latest()).toString());
      (await this.condition.value()).toString().should.eq("200");

      await time.increase(60);
      await expectRevert(this.condition.check(), "VALUE_NOT_UPTODATE");
    });
    it("should be able check condition after update", async () => {
      (await this.condition.lastUpdate()).toString().should.eq("0");
      (await this.condition.value()).toString().should.eq("0");
      await this.condition.update({
        from: owner,
        value: web3.utils.toWei("0.001", "ether")
      });
      (await this.condition.lastUpdate())
        .toString()
        .should.eq((await time.latest()).toString());
      (await this.condition.value()).toString().should.eq("200");

      (await this.condition.check()).toString().should.eq("false");
    });
    it("should pass the condition after increase value in oracle", async () => {
      (await this.condition.lastUpdate()).toString().should.eq("0");
      (await this.condition.value()).toString().should.eq("0");
      await this.condition.update({
        from: owner,
        value: web3.utils.toWei("0.001", "ether")
      });
      (await this.condition.lastUpdate())
        .toString()
        .should.eq((await time.latest()).toString());
      (await this.condition.value()).toString().should.eq("200");

      await this.oracle.setValue("301");
      await this.condition.update({
        from: owner,
        value: web3.utils.toWei("0.001", "ether")
      });
      (await this.condition.check()).toString().should.eq("true");
    });
  });
  context("Condition functionalities", () => {
    beforeEach(async () => {
      await this.exchange.setDestPayback("500", { from: owner });
      await this.oracle.setValue("250", { from: owner });
      await this.dai.transfer(this.exchange.address, "100000", { from: bob });
    });
    it("should be able to trade directly with exchange", async () => {
      // check states before trading
      (await this.dai.balanceOf(alice)).toString().should.eq("1000000");
      const aliceEtherBalanceBefore = await balance.current(alice);
      aliceEtherBalanceBefore.toString().should.eq("100000000000000000000");
      (await this.dai.balanceOf(this.exchange.address))
        .toString()
        .should.eq("100000");
      (await balance.current(this.exchange.address)).toString().should.eq("0");
      // perform trading
      await this.exchange.trade(
        this.ether.address,
        web3.utils.toWei("10", "ether"),
        this.dai.address,
        alice,
        { from: alice, value: web3.utils.toWei("10", "ether") }
      );
      // check states after trading
      (await this.dai.balanceOf(alice))
        .toString()
        .should.eq(`${1000000 + 500}`);
      const aliceEtherBalanceAfter = await balance.current(alice);
      aliceEtherBalanceAfter
        .lt(
          aliceEtherBalanceBefore.sub(new BN(web3.utils.toWei("10", "ether")))
        )
        .should.eq(true);
      (await this.dai.balanceOf(this.exchange.address))
        .toString()
        .should.eq(`${100000 - 500}`);
      (await balance.current(this.exchange.address))
        .toString()
        .should.eq(web3.utils.toWei("10", "ether"));
    });
    it("should be able to deposit ether to conditional order contract", async () => {
      (await balance.current(this.conditionalOrder.address))
        .toString()
        .should.eq(web3.utils.toWei("0", "ether"));
      await this.conditionalOrder.deposit(
        new BN(web3.utils.toWei("10", "ether")),
        { from: owner, value: new BN(web3.utils.toWei("10", "ether")) }
      );
      (await balance.current(this.conditionalOrder.address))
        .toString()
        .should.eq(web3.utils.toWei("10", "ether"));
    });
  });
  context("Condition functionalities", () => {
    beforeEach(async () => {
      await this.exchange.setDestPayback("500", { from: owner });
      await this.oracle.setValue("250", { from: owner });
      await this.dai.transfer(this.exchange.address, "100000", { from: bob });
      (await this.dai.balanceOf(this.exchange.address))
        .toString()
        .should.eq("100000");
      (await balance.current(this.exchange.address)).toString().should.eq("0");
      // owner deposit his/her ether to conditionalOrder contract
      await this.conditionalOrder.deposit(
        new BN(web3.utils.toWei("10", "ether")),
        { from: owner, value: new BN(web3.utils.toWei("10", "ether")) }
      );
    });
    it("should not be able to sell the asset if wrong condition (VALUE_NOT_UPTODATE)", async () => {
      // check states before selling
      (await this.oracle.value()).toString().should.eq("250");
      (await this.condition.threshold()).toString().should.eq("300");
      // perform selling
      // should fail because now - lastUpdate >= 1 minutes
      await expectRevert(
        this.conditionalOrder.sell({ from: alice }),
        "VALUE_NOT_UPTODATE"
      );
    });
    it("should not be able to sell the asset if wrong condition (CONDITION_CHECK_FAIL)", async () => {
      // check states before selling
      // update oracle value
      await this.oracle.setValue("299", { from: owner });
      // update condition
      await this.condition.update({
        from: alice,
        value: web3.utils.toWei("0.001", "ether")
      });

      // check states
      (await this.oracle.value()).toString().should.eq("299");
      (await this.condition.threshold()).toString().should.eq("300");
      // perform selling
      // should fail because value from oracle < condition threshold
      await expectRevert(
        this.conditionalOrder.sell({ from: alice }),
        "CONDITION_CHECK_FAIL"
      );
    });
    it("should be able to sell the asset if correct condition", async () => {
      // check states before selling
      // update oracle value
      await this.oracle.setValue("301", { from: owner });
      // update condition
      await this.condition.update({
        from: alice,
        value: web3.utils.toWei("0.001", "ether")
      });

      // check states before selling
      (await this.dai.balanceOf(owner)).toString().should.eq("0");
      (await balance.current(this.exchange.address)).toString().should.eq("0");
      (await balance.current(this.conditionalOrder.address))
        .toString()
        .should.eq("10000000000000000000");
      const alicePrevETHBalance = await balance.current(alice);

      // perform selling
      await this.conditionalOrder.sell({ from: alice });

      // check states after selling
      (await this.dai.balanceOf(owner)).toString().should.eq("500");
      // exchange should receive 9.9 ether because 0.1 ether was paid for commission
      (await balance.current(this.exchange.address))
        .toString()
        .should.eq("9900000000000000000");
      (await balance.current(this.conditionalOrder.address))
        .toString()
        .should.eq("0");
      const commission = (await balance.current(alice)).sub(
        alicePrevETHBalance
      );
      // commission should be 0.1 ether (ideal) but was a bit diluted by paying gas
      commission.lt(new BN("100000000000000000")).should.eq(true);
      commission.gt(new BN("95000000000000000")).should.eq(true);
    });
  });
});
