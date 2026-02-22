/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Shield, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Settings, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle,
  History,
  Plus,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { WalletService, WalletData } from './services/walletService';
import { cn } from './utils/cn';

type AppState = 'onboarding' | 'create' | 'import' | 'locked' | 'dashboard';

export default function App() {
  const [appState, setAppState] = useState<AppState>('onboarding');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState(0.04235); // Mocked balance
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const savedWallet = localStorage.getItem('bitguard_wallet');
    if (savedWallet) {
      setAppState('locked');
    }
  }, []);

  const handleCreateWallet = async () => {
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    try {
      const newMnemonic = WalletService.generateMnemonic();
      setMnemonic(newMnemonic);
      const newWallet = await WalletService.createWallet(newMnemonic);
      setWallet(newWallet);
      
      const encrypted = await WalletService.encryptData(JSON.stringify(newWallet), password);
      localStorage.setItem('bitguard_wallet', encrypted);
      setAppState('create');
    } catch (err) {
      setError('Erro ao criar carteira');
    }
  };

  const handleUnlock = async () => {
    const savedWallet = localStorage.getItem('bitguard_wallet');
    if (!savedWallet) return;

    try {
      const decrypted = await WalletService.decryptData(savedWallet, password);
      const walletData = JSON.parse(decrypted);
      setWallet(walletData);
      setAppState('dashboard');
      setError('');
    } catch (err) {
      setError('Senha incorreta');
    }
  };

  const handleLogout = () => {
    setWallet(null);
    setPassword('');
    setAppState('locked');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshBalance = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setBalance(prev => prev + (Math.random() * 0.001));
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-brand-dark overflow-x-hidden">
      <AnimatePresence mode="wait">
        {/* ONBOARDING */}
        {appState === 'onboarding' && (
          <motion.div 
            key="onboarding"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md w-full glass p-8 rounded-3xl text-center space-y-8"
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-brand-primary/20 rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-brand-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-white">BitGuard</h1>
              <p className="text-white/60">Sua carteira Bitcoin segura e privada.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-white/60 ml-1">Defina uma senha mestre</label>
                <div className="relative">
                  <input 
                    type={isPasswordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field w-full pr-12 text-white"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button 
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-white/60 ml-1">Confirme sua senha</label>
                <input 
                  type={isPasswordVisible ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field w-full text-white"
                  placeholder="Repita a senha"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button 
                onClick={handleCreateWallet}
                className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Criar Nova Carteira
              </button>
              
              <button 
                onClick={() => setAppState('import')}
                className="text-brand-primary hover:underline text-sm font-medium"
              >
                Já tenho uma carteira
              </button>
            </div>
          </motion.div>
        )}

        {/* CREATE (Mnemonic Display) */}
        {appState === 'create' && wallet && (
          <motion.div 
            key="create"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full glass p-8 rounded-3xl space-y-6"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-white">Sua Frase de Recuperação</h2>
              <p className="text-white/60 text-sm">Anote estas 12 palavras em um papel e guarde em local seguro. Nunca compartilhe com ninguém.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {wallet.mnemonic.split(' ').map((word, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-white/30 text-xs font-mono">{i + 1}.</span>
                  <span className="font-medium text-white">{word}</span>
                </div>
              ))}
            </div>

            <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-4 flex gap-3 items-start">
              <AlertTriangle className="text-red-400 shrink-0" size={20} />
              <p className="text-xs text-red-200">Se você perder esta frase, perderá o acesso aos seus fundos para sempre. Não há como recuperar.</p>
            </div>

            <button 
              onClick={() => setAppState('dashboard')}
              className="btn-primary w-full py-4"
            >
              Eu salvei a frase
            </button>
          </motion.div>
        )}

        {/* LOCKED */}
        {appState === 'locked' && (
          <motion.div 
            key="locked"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full glass p-8 rounded-3xl text-center space-y-8"
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-brand-primary/20 rounded-full flex items-center justify-center">
                <Lock className="w-10 h-10 text-brand-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Carteira Bloqueada</h1>
              <p className="text-white/60">Insira sua senha para acessar.</p>
            </div>

            <div className="space-y-4">
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full text-center text-xl tracking-widest text-white"
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button 
                onClick={handleUnlock}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2"
              >
                <Unlock size={20} /> Desbloquear
              </button>
              <button 
                onClick={() => {
                  if(confirm('Tem certeza? Isso apagará a carteira local. Certifique-se de ter sua frase de recuperação.')) {
                    localStorage.removeItem('bitguard_wallet');
                    setAppState('onboarding');
                  }
                }}
                className="text-white/40 hover:text-red-400 text-xs"
              >
                Apagar carteira local
              </button>
            </div>
          </motion.div>
        )}

        {/* DASHBOARD */}
        {appState === 'dashboard' && wallet && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {/* Sidebar / Nav */}
            <div className="md:col-span-3 space-y-4">
              <div className="glass p-6 rounded-3xl flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                  <Wallet className="text-white" size={24} />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-white">BitGuard</h3>
                  <p className="text-[10px] text-white/40 font-mono">v1.0.0 Mainnet</p>
                </div>
              </div>

              <nav className="glass p-2 rounded-3xl flex flex-col gap-1">
                <button className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 text-white font-medium">
                  <Wallet size={18} /> Carteira
                </button>
                <button className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white/60 hover:bg-white/5 transition-colors">
                  <History size={18} /> Atividade
                </button>
                <button className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white/60 hover:bg-white/5 transition-colors">
                  <Settings size={18} /> Configurações
                </button>
                <div className="h-px bg-white/10 my-2 mx-4" />
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <LogOut size={18} /> Sair
                </button>
              </nav>
            </div>

            {/* Main Content */}
            <div className="md:col-span-9 space-y-6">
              {/* Balance Card */}
              <div className="glass p-8 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Wallet size={120} className="text-white" />
                </div>
                
                <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-white/60 text-sm font-medium">Saldo Total</p>
                      <div className="flex items-baseline gap-2">
                        <h1 className="text-5xl font-bold tracking-tight text-white">{balance.toFixed(8)}</h1>
                        <span className="text-brand-primary font-bold text-xl">BTC</span>
                      </div>
                      <p className="text-white/40 font-mono text-sm">≈ R$ {(balance * 500000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <button 
                      onClick={refreshBalance}
                      className={cn(
                        "p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-white",
                        isRefreshing && "animate-spin"
                      )}
                    >
                      <RefreshCw size={20} />
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button className="btn-primary flex-1 py-4 flex items-center justify-center gap-2">
                      <ArrowUpRight size={20} /> Enviar
                    </button>
                    <button className="btn-secondary flex-1 py-4 flex items-center justify-center gap-2">
                      <ArrowDownLeft size={20} /> Receber
                    </button>
                  </div>
                </div>
              </div>

              {/* Address & QR */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass p-6 rounded-3xl space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-white">
                    <ArrowDownLeft size={18} className="text-green-400" /> Seu Endereço
                  </h3>
                  <div className="bg-black/20 p-4 rounded-2xl break-all font-mono text-sm text-white/80 border border-white/5">
                    {wallet.address}
                  </div>
                  <button 
                    onClick={() => copyToClipboard(wallet.address)}
                    className="w-full btn-secondary flex items-center justify-center gap-2 py-3"
                  >
                    {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                    {copied ? 'Copiado!' : 'Copiar Endereço'}
                  </button>
                </div>

                <div className="glass p-6 rounded-3xl flex flex-col items-center justify-center gap-4">
                  <div className="bg-white p-3 rounded-2xl">
                    <QRCodeSVG value={wallet.address} size={140} />
                  </div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Scan para receber</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="glass p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white">Atividade Recente</h3>
                  <button className="text-brand-primary text-sm font-medium hover:underline">Ver tudo</button>
                </div>
                
                <div className="space-y-2">
                  {[
                    { type: 'received', amount: '+0.00450000', date: 'Hoje, 14:20', status: 'Confirmado' },
                    { type: 'sent', amount: '-0.00120000', date: 'Ontem, 09:15', status: 'Confirmado' },
                  ].map((tx, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4 text-white">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          tx.type === 'received' ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                        )}>
                          {tx.type === 'received' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <p className="font-medium">{tx.type === 'received' ? 'Recebido' : 'Enviado'}</p>
                          <p className="text-xs text-white/40">{tx.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("font-mono font-bold", tx.type === 'received' ? "text-green-400" : "text-white")}>
                          {tx.amount} BTC
                        </p>
                        <p className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">{tx.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <div className="mt-8 flex items-center gap-2 text-white/20">
        <Shield size={14} />
        <span className="text-xs font-medium tracking-widest uppercase">BitGuard Secure Protocol</span>
      </div>
    </div>
  );
}
