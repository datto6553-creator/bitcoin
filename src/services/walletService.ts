import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import { BIP32Factory, BIP32Interface } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { Buffer } from 'buffer';

const bip32 = BIP32Factory(ecc);

export interface WalletData {
  mnemonic: string;
  address: string;
  publicKey: string;
  network: 'bitcoin' | 'testnet';
}

export class WalletService {
  static generateMnemonic(): string {
    return bip39.generateMnemonic();
  }

  static async createWallet(mnemonic: string, network: 'bitcoin' | 'testnet' = 'bitcoin'): Promise<WalletData> {
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const bitcoinNetwork = network === 'bitcoin' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
    
    const root = bip32.fromSeed(seed, bitcoinNetwork);
    
    // Path for SegWit (Bech32) - BIP84
    // m / 84' / 0' / 0' / 0 / 0
    const path = `m/84'/${network === 'bitcoin' ? '0' : '1'}'/0'/0/0`;
    const child = root.derivePath(path);
    
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: child.publicKey,
      network: bitcoinNetwork,
    });

    if (!address) throw new Error('Failed to generate address');

    return {
      mnemonic,
      address,
      publicKey: Buffer.from(child.publicKey).toString('hex'),
      network
    };
  }

  static validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  }

  // Encryption logic using Web Crypto API
  static async encryptData(data: string, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = (window.crypto as any).getRandomValues(new Uint8Array(16));
    
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const iv = (window.crypto as any).getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return Buffer.from(combined).toString('base64');
  }

  static async decryptData(encryptedBase64: string, password: string): Promise<string> {
    const combined = Buffer.from(encryptedBase64, 'base64');
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);

    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  }
}
