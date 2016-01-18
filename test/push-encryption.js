'use strict';

// This is a test and we want descriptions to be useful, if this
// breaks the max-length, it's ok.

/* eslint-disable max-len */

require('chai').should();
var Buffer = require('buffer').Buffer;
var urlBase64 = require('urlsafe-base64');

const PREDEFINED_SERVER_KEYS = {
  public: 'BOg5KfYiBdDDRF12Ri17y3v+POPr8X0nVP2jDjowPVI/DMKU1aQ3OLdPH1iaakvR9/PHq6tNCzJH35v/JUz2crY=',
  private: 'uDNsfsz91y2ywQeOHljVoiUg3j5RGrDVAswRqjP3v90=',
  salt: new Buffer('AAAAAAAAAAAAAAAAAAAAAA', 'base64')
};

const PREDEFINED_SUBSCRIPTIONOBJECT = {
  endpoint: 'https://android.googleapis.com/gcm/send/FAKE_GCM_REGISTRATION_ID',
  keys: {
    p256dh: 'BCIWgsnyXDv1VkhqL2P7YRBvdeuDnlwAPT2guNhdIoW3IP7GmHh1SMKPLxRf7x8vJy6ZFK3ol2ohgn_-0yP7QQA=',
    auth: '8eDyX_uCN0XRhSbY5hs7Hg=='
  }
};

const CORRECT_VALUES = {
  sharedSecret: 'vgkL5otElJ7tB3jnxop9g7sGxuM4gGs5NL3qTCxe9JE',
  context: 'UC0yNTYAAEEEIhaCyfJcO_VWSGovY_thEG9164OeXAA9PaC42F0ihbcg_saYeHVIwo8vFF_vHy8nLpkUreiXaiGCf_7TI_tBAABBBOg5KfYiBdDDRF12Ri17y3v-POPr8X0nVP2jDjowPVI_DMKU1aQ3OLdPH1iaakvR9_PHq6tNCzJH35v_JUz2crY',
  cekInfo: 'Q29udGVudC1FbmNvZGluZzogYWVzZ2NtMTI4AFAtMjU2AABBBCIWgsnyXDv1VkhqL2P7YRBvdeuDnlwAPT2guNhdIoW3IP7GmHh1SMKPLxRf7x8vJy6ZFK3ol2ohgn_-0yP7QQAAQQToOSn2IgXQw0RddkYte8t7_jzj6_F9J1T9ow46MD1SPwzClNWkNzi3Tx9YmmpL0ffzx6urTQsyR9-b_yVM9nK2',
  nonceInfo: 'Q29udGVudC1FbmNvZGluZzogbm9uY2UAUC0yNTYAAEEEIhaCyfJcO_VWSGovY_thEG9164OeXAA9PaC42F0ihbcg_saYeHVIwo8vFF_vHy8nLpkUreiXaiGCf_7TI_tBAABBBOg5KfYiBdDDRF12Ri17y3v-POPr8X0nVP2jDjowPVI_DMKU1aQ3OLdPH1iaakvR9_PHq6tNCzJH35v_JUz2crY',
  prk: '9Ua-rfDdC4WzwO_W644ZISWGXpNp8bxDSICxjlr03xQ',
  contentEncryptionKey: '-Oh_SKtuK8nP0kuCTYUeSQ',
  nonce: '6CkTryo-JSdq8TcG'
};

const PAYLOAD = 'hello';

describe('Test Encryption Steps of a Push Message Payload', () => {
  var EncryptionHelper = require('../encryption-helper').EncryptionHelper;
  var HMAC = require('../encryption-helper').HMAC;
  var HKDF = require('../encryption-helper').HKDF;

  it('should instantiate a new helper', () => {
    new EncryptionHelper();
  });

  it('should create a server public, private key pair', () => {
    var serverKeys = new EncryptionHelper().getServerKeys();
    serverKeys.should.be.a('object');
    serverKeys.should.have.property('public');
    serverKeys.should.have.property('private');
  });

  it('should instantiate a new helper with predefined server keys', () => {
    new EncryptionHelper({
      serverKeys: PREDEFINED_SERVER_KEYS
    });
  });

  // This test may work in Node 5.2 - See: https://github.com/nodejs/node/blob/master/CHANGELOG.md
  it('should have the provided server public, private key pair', () => {
    var serverKeys = new EncryptionHelper({
      serverKeys: PREDEFINED_SERVER_KEYS
    }).getServerKeys();
    serverKeys.should.be.a('object');
    serverKeys.should.have.property('public');
    serverKeys.should.have.property('private');
    serverKeys.public.should.equal(PREDEFINED_SERVER_KEYS.public);
    serverKeys.private.should.equal(PREDEFINED_SERVER_KEYS.private);
  });

  it('should calculate a shared secret', () => {
    var encryptionHelper = new EncryptionHelper();
    var sharedSecretTest = encryptionHelper.getSharedSecret(
      PREDEFINED_SUBSCRIPTIONOBJECT.keys.p256dh
    );
    sharedSecretTest.should.be.a('string');
  });

  it('should calculate a shared secret', () => {
    var encryptionHelper = new EncryptionHelper({
      serverKeys: PREDEFINED_SERVER_KEYS
    });
    var sharedSecretTest = encryptionHelper.getSharedSecret(
      PREDEFINED_SUBSCRIPTIONOBJECT.keys.p256dh
    );
    sharedSecretTest.should.be.a('string');
    urlBase64.encode(urlBase64.decode(sharedSecretTest)).should.equal(CORRECT_VALUES.sharedSecret);
  });

  it('should generate a random salt - 16byte buffer', () => {
    var encryptionHelper = new EncryptionHelper();
    var randSalt = encryptionHelper.getSalt();
    Buffer.isBuffer(randSalt).should.equal(true);
    randSalt.should.have.length(16);
  });

  it('should get the defined salt - 16byte buffer', () => {
    var encryptionHelper = new EncryptionHelper({
      salt: PREDEFINED_SERVER_KEYS.salt
    });
    var randSalt = encryptionHelper.getSalt();
    Buffer.isBuffer(randSalt).should.equal(true);
    randSalt.should.have.length(16);
    randSalt.should.equal(PREDEFINED_SERVER_KEYS.salt);
  });

  it('should generate a context', () => {
    var encryptionHelper = new EncryptionHelper();
    var context = encryptionHelper.generateContext(PREDEFINED_SUBSCRIPTIONOBJECT.keys.p256dh, PREDEFINED_SERVER_KEYS.public);

    Buffer.isBuffer(context).should.equal(true);
    // See: https://martinthomson.github.io/http-encryption/#rfc.section.4.2
    context.should.have.length(5 + 1 + 2 + 65 + 2 + 65);
    urlBase64.encode(context).should.equal(CORRECT_VALUES.context);
  });

  it('should generate the specific context', () => {
    var encryptionHelper = new EncryptionHelper({
      serverKeys: PREDEFINED_SERVER_KEYS,
      salt: PREDEFINED_SERVER_KEYS.salt
    });
    var context = encryptionHelper.generateContext(PREDEFINED_SUBSCRIPTIONOBJECT.keys.p256dh, PREDEFINED_SERVER_KEYS.public);

    Buffer.isBuffer(context).should.equal(true);
    // See: https://martinthomson.github.io/http-encryption/#rfc.section.4.2
    context.should.have.length(5 + 1 + 2 + 65 + 2 + 65);
    urlBase64.encode(context).should.equal(CORRECT_VALUES.context);
  });

  it('should generate the specific cekInfo', () => {
    var encryptionHelper = new EncryptionHelper({
      serverKeys: PREDEFINED_SERVER_KEYS,
      salt: PREDEFINED_SERVER_KEYS.salt
    });
    var context = encryptionHelper.generateContext(PREDEFINED_SUBSCRIPTIONOBJECT.keys.p256dh, PREDEFINED_SERVER_KEYS.public);
    var cekInfo = encryptionHelper.generateCEKInfo(context);

    Buffer.isBuffer(cekInfo).should.equal(true);
    // See: https://martinthomson.github.io/http-encryption/#rfc.section.4.2
    cekInfo.should.have.length(27 + 1 + context.length);
    urlBase64.encode(cekInfo).should.equal(CORRECT_VALUES.cekInfo);
  });

  it('should generate the specific nonceInfo', () => {
    var encryptionHelper = new EncryptionHelper({
      serverKeys: PREDEFINED_SERVER_KEYS,
      salt: PREDEFINED_SERVER_KEYS.salt
    });
    var context = encryptionHelper.generateContext(PREDEFINED_SUBSCRIPTIONOBJECT.keys.p256dh, PREDEFINED_SERVER_KEYS.public);
    var nonceInfo = encryptionHelper.generateNonceInfo(context);

    Buffer.isBuffer(nonceInfo).should.equal(true);
    // See: https://martinthomson.github.io/http-encryption/#rfc.section.4.2
    nonceInfo.should.have.length(23 + 1 + context.length);
    urlBase64.encode(nonceInfo).should.equal(CORRECT_VALUES.nonceInfo);
  });

  it('should have a working HMAC implementation', () => {
    var hmac = new HMAC(urlBase64.decode('AAAAAAAAAAAAAAAAAAAAAA'));
    var prk = hmac.sign(urlBase64.decode('AAAAAAAAAAAAAAAAAAAAAA'));
    urlBase64.encode(prk).should.equal('hTx0A5N9i2I5VpsYTreZP8X3Ua786ijyyGOFji0pxQs');
  });

  it('should have a working HKDF implementation', () => {
    var hkdf = new HKDF(urlBase64.decode('AAAAAAAAAAAAAAAAAAAAAA'), urlBase64.decode('AAAAAAAAAAAAAAAAAAAAAA'));
    var hkdfOutput = hkdf.generate(urlBase64.decode('AAAAAAAAAAAAAAAAAAAAAA'), 16);
    urlBase64.encode(hkdfOutput).should.equal('cS9spnQtVwB3AuvBt3wglw');
  });

  it('should generate pseudo random key', () => {
    var encryptionHelper = new EncryptionHelper({
      serverKeys: PREDEFINED_SERVER_KEYS,
      salt: PREDEFINED_SERVER_KEYS.salt
    });
    var sharedSecretTest = encryptionHelper.getSharedSecret(
      PREDEFINED_SUBSCRIPTIONOBJECT.keys.p256dh
    );
    var prk = encryptionHelper.generatePRK(sharedSecretTest, PREDEFINED_SUBSCRIPTIONOBJECT.keys.auth);
    urlBase64.encode(prk).should.equal(CORRECT_VALUES.prk);
  });

  it('should generate keys', () => {
    var encryptionHelper = new EncryptionHelper({
      serverKeys: PREDEFINED_SERVER_KEYS,
      salt: PREDEFINED_SERVER_KEYS.salt
    });
    var sharedSecretTest = encryptionHelper.getSharedSecret(
      PREDEFINED_SUBSCRIPTIONOBJECT.keys.p256dh
    );

    var context = encryptionHelper.generateContext(PREDEFINED_SUBSCRIPTIONOBJECT.keys.p256dh, PREDEFINED_SERVER_KEYS.public);
    var cekInfo = encryptionHelper.generateCEKInfo(context);
    var nonceInfo = encryptionHelper.generateNonceInfo(context);

    var prk = encryptionHelper.generatePRK(sharedSecretTest, PREDEFINED_SUBSCRIPTIONOBJECT.keys.auth);
    var keys = encryptionHelper.generateKeys(
      prk,
      PREDEFINED_SERVER_KEYS.salt,
      cekInfo,
      nonceInfo
    );

    Buffer.isBuffer(keys.contentEncryptionKey).should.equal(true);
    Buffer.isBuffer(keys.nonce).should.equal(true);
    keys.contentEncryptionKey.should.have.length(16);
    keys.nonce.should.have.length(12);
    urlBase64.encode(keys.contentEncryptionKey).should.equal('-Oh_SKtuK8nP0kuCTYUeSQ');
    urlBase64.encode(keys.nonce).should.equal('6CkTryo-JSdq8TcG');
  });

  it('should generate a padded payload', () => {
    var paddingLength = 0;
    var encryptionHelper = new EncryptionHelper({
      serverKeys: PREDEFINED_SERVER_KEYS,
      salt: PREDEFINED_SERVER_KEYS.salt
    });

    var recordBuffer = encryptionHelper.generateMessageBuffer(PAYLOAD, paddingLength);
    Buffer.isBuffer(recordBuffer).should.equal(true);
    recordBuffer.should.have.length(1 + paddingLength + PAYLOAD.length);
    urlBase64.encode(recordBuffer).should.equal('AGhlbGxv');
  });

  it('should encrypt message', () => {
    var encryptionHelper = new EncryptionHelper({
      serverKeys: PREDEFINED_SERVER_KEYS,
      salt: PREDEFINED_SERVER_KEYS.salt
    });
    var sharedSecretTest = encryptionHelper.getSharedSecret(
      PREDEFINED_SUBSCRIPTIONOBJECT.keys.p256dh
    );

    var context = encryptionHelper.generateContext(PREDEFINED_SUBSCRIPTIONOBJECT.keys.p256dh, PREDEFINED_SERVER_KEYS.public);
    var cekInfo = encryptionHelper.generateCEKInfo(context);
    var nonceInfo = encryptionHelper.generateNonceInfo(context);

    var prk = encryptionHelper.generatePRK(sharedSecretTest, PREDEFINED_SUBSCRIPTIONOBJECT.keys.auth);
    var keys = encryptionHelper.generateKeys(
      prk,
      PREDEFINED_SERVER_KEYS.salt,
      cekInfo,
      nonceInfo
    );

    var encryptedMsg = encryptionHelper.encryptMessage(
      PAYLOAD,
      keys
    );
    urlBase64.encode(encryptedMsg).should.equal('hCVH5wnzy6VJJXPW4faO2lvVtGDCtw');
  });
});
