"use strict";

const { Contract } = require("fabric-contract-api");
const crypto = require("crypto");

class ZaiAnchorContract extends Contract {
  constructor() {
    super("ZaiAnchorContract");
  }

  async initLedger(ctx) {
    const initAnchor = {
      anchorId: "genesis",
      batchName: "genesis-anchor",
      merkleRoot: "0".repeat(64),
      previousAnchorHash: null,
      fabricTxId: ctx.stub.getTxID(),
      fabricBlockNumber: ctx.stub.getTxTimestamp().getSeconds(),
      entryCount: 0,
      anchoredAt: new Date().toISOString(),
      status: "anchored",
    };
    await ctx.stub.putState("anchor:genesis", Buffer.from(JSON.stringify(initAnchor)));
    return initAnchor;
  }

  async createAnchor(ctx, anchorId, batchName, merkleRoot, previousAnchorHash, entryCount) {
    const exists = await ctx.stub.getState(`anchor:${anchorId}`);
    if (exists && exists.length > 0) {
      throw new Error(`Anchor ${anchorId} already exists`);
    }

    const anchor = {
      anchorId,
      batchName,
      merkleRoot,
      previousAnchorHash: previousAnchorHash || null,
      fabricTxId: ctx.stub.getTxID(),
      fabricBlockNumber: ctx.stub.getTxTimestamp().getSeconds(),
      entryCount: parseInt(entryCount, 10),
      anchoredAt: new Date().toISOString(),
      status: "anchored",
    };

    await ctx.stub.putState(`anchor:${anchorId}`, Buffer.from(JSON.stringify(anchor)));
    return anchor;
  }

  async queryAnchor(ctx, anchorId) {
    const data = await ctx.stub.getState(`anchor:${anchorId}`);
    if (!data || data.length === 0) {
      throw new Error(`Anchor ${anchorId} does not exist`);
    }
    return JSON.parse(data.toString());
  }

  async queryAllAnchors(ctx) {
    const iterator = await ctx.stub.getStateByRange("anchor:", "anchor;");
    const results = [];
    let res = await iterator.next();
    while (!res.done) {
      if (res.value) {
        results.push(JSON.parse(res.value.value.toString()));
      }
      res = await iterator.next();
    }
    await iterator.close();
    return results;
  }

  async verifyAnchor(ctx, anchorId, recomputedRoot) {
    const anchor = await this.queryAnchor(ctx, anchorId);
    return {
      anchorId,
      storedRoot: anchor.merkleRoot,
      recomputedRoot,
      isValid: anchor.merkleRoot.toLowerCase() === recomputedRoot.toLowerCase(),
      fabricTxId: anchor.fabricTxId,
      fabricBlockNumber: anchor.fabricBlockNumber,
    };
  }

  async getAnchorHistory(ctx, anchorId) {
    const iterator = await ctx.stub.getHistoryForKey(`anchor:${anchorId}`);
    const results = [];
    let res = await iterator.next();
    while (!res.done) {
      if (res.value) {
        results.push({
          txId: res.value.txId,
          timestamp: res.value.timestamp,
          isDelete: res.value.isDelete,
          value: res.value.value ? JSON.parse(res.value.value.toString()) : null,
        });
      }
      res = await iterator.next();
    }
    await iterator.close();
    return results;
  }
}

module.exports = { ZaiAnchorContract };
