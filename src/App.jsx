
import { useState, useEffect } from 'react'
import {
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import {
  Keypair,
  Connection,
  clusterApiUrl,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  VersionedTransaction
} from '@solana/web3.js'
import { generateMnemonic, mnemonicToSeedSync } from 'bip39'
import { derivePath } from 'ed25519-hd-key'
import { Buffer } from 'buffer'
import BN from 'bn.js'

import {
  WhirlpoolContext,
  buildWhirlpoolClient,
  swapQuoteByInputToken
} from '@orca-so/whirlpools-sdk'
import { AnchorProvider } from '@coral-xyz/anchor'

import {
  Percentage
} from '@orca-so/common-sdk'
import './App.css'
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
const USDC_MINT = new PublicKey(
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
)
// Orca Devnet SOL / devUSDC pool
const DEV_USDC_MINT = new PublicKey(
  'BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k'
)

const ORCA_POOL = new PublicKey(
  '3KBZiL2g8C7tiJ32hTv5v3KM7aK9htpqTw4cTXz1HvPt'
)

const ORCA_PROGRAM_ID = new PublicKey(
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'
)
function App() {
  const [wallet, setWallet] = useState(null)
  const [wallets, setWallets] = useState([])
  const [walletCount, setWalletCount] = useState(0)
  const [selectedWalletIndex, setSelectedWalletIndex] = useState(0)
  const [phrase, setPhrase] = useState(
  () => localStorage.getItem('walletPhrase') || ''
)
  const [solBalance, setSolBalance] = useState('0.00')
  const [usdcBalance, setUsdcBalance] = useState('0.00')
  const [error, setError] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
const [sendAmount, setSendAmount] = useState('')
const [sendStatus, setSendStatus] = useState('')
// Orca SOL to devUSDC swap
const [devUsdcBalance, setDevUsdcBalance] = useState('0.00')
const [swapAmount, setSwapAmount] = useState('')
const [swapQuote, setSwapQuote] = useState(null)
const [swapStatus, setSwapStatus] = useState('')
const [isSwapping, setIsSwapping] = useState(false)
useEffect(() => {
  async function restoreWallet() {
    try {
      if (!phrase) return

      const seed = mnemonicToSeedSync(phrase)
      const seedHex = Buffer.from(seed).toString('hex')

      const savedCount = Number(
        localStorage.getItem('walletCount') || 1
      )

      const restoredWallets = []

      for (let i = 0; i < savedCount; i++) {
        const path = `m/44'/501'/${i}'/0'`

        const derivedSeed = derivePath(
          path,
          seedHex
        ).key

        const keypair = await Keypair.fromSeed(derivedSeed)

        restoredWallets.push(
          keypair.publicKey.toBase58()
        )
      }

      setWallets(restoredWallets)
      setWalletCount(savedCount)
      const savedIndex = Number(
  localStorage.getItem('selectedWalletIndex') || 0
)

const safeIndex = Math.min(
  Math.max(savedIndex, 0),
  restoredWallets.length - 1
)

setSelectedWalletIndex(safeIndex)
setWallet(restoredWallets[safeIndex])

      const publicKey = new PublicKey(restoredWallets[safeIndex])

      const balance = await connection.getBalance(publicKey)

      setSolBalance(
        (balance / LAMPORTS_PER_SOL).toFixed(4)
      )
      const tokenAddress = await getAssociatedTokenAddress(
  USDC_MINT,
  publicKey,
  false,
  TOKEN_PROGRAM_ID
)

try {
  const tokenAccount = await getAccount(
    connection,
    tokenAddress,
    'confirmed',
    TOKEN_PROGRAM_ID
  )

  setUsdcBalance(
    (Number(tokenAccount.amount) / 1_000_000).toFixed(2)
  )
} catch {
  setUsdcBalance('0.00')
}

    } catch (err) {
      console.error('Wallet Restore Error:', err)
      setError(err.message)
    }
  }

  restoreWallet()
}, [])
useEffect(() => {
  if (wallet) {
    refreshDevUsdcBalance()
  }
}, [wallet])

  async function generateWallet() {
    try {
      const newPhrase = generateMnemonic(128)

      const seed = mnemonicToSeedSync(newPhrase)
      const seedHex = Buffer.from(seed).toString('hex')

      const derivedSeed = derivePath(
        "m/44'/501'/0'/0'",
        seedHex
      ).key

     const keypair = await Keypair.fromSeed(derivedSeed)

      setPhrase(newPhrase)
      localStorage.setItem('walletPhrase', newPhrase)
      console.log('Generated keypair:', keypair)
console.log('Public key:', keypair?.publicKey)
      const address = keypair.publicKey.toBase58()
setWallet(address)
setWallets([address])
setWalletCount(1)
localStorage.setItem('walletCount', '1')
      const balance = await connection.getBalance(keypair.publicKey)
setSolBalance((Number(balance) / 1_000_000_000).toFixed(4))
      setError('')
    } catch (err) {
  console.error('Wallet Error:', err)
  setError(err.message)
}
  }
    async function requestAirdrop() {
    try {
      if (!wallet) {
        setError('Generate a wallet first.')
        return
      }

      const publicKey = new PublicKey(wallet)

      const signature = await connection.requestAirdrop(
        publicKey,
        LAMPORTS_PER_SOL
      )

      await connection.confirmTransaction(signature, 'confirmed')

      const balance = await connection.getBalance(publicKey)

      setSolBalance(
        (Number(balance) / LAMPORTS_PER_SOL).toFixed(4)
      )
      setError('')
    } catch (err) {
      console.error('Airdrop Error:', err)
      setError(err.message)
    }
  }
  async function refreshBalance() {
  try {
    const publicKey = new PublicKey(wallet)
    const balance = await connection.getBalance(publicKey)

    setSolBalance(
      (Number(balance) / LAMPORTS_PER_SOL).toFixed(4)
    )
  } catch (err) {
    console.error('Balance Error:', err)
    setError(err.message)
  }
}
async function refreshDevUsdcBalance() {
  if (!wallet) return

  try {
    const owner = new PublicKey(wallet)

    const tokenAccount = await getAssociatedTokenAddress(
      DEV_USDC_MINT,
      owner
    )

    const accountInfo = await connection.getAccountInfo(tokenAccount)

    if (!accountInfo) {
      setDevUsdcBalance('0.00')
      console.log('devUSDC token account does not exist yet.')
      return
    }

    const account = await getAccount(connection, tokenAccount)

    setDevUsdcBalance(
      (Number(account.amount) / 1_000_000).toFixed(2)
    )

    console.log('devUSDC token account exists:', tokenAccount.toBase58())
  } catch (error) {
    console.error('devUSDC Balance Error:', error)
    setDevUsdcBalance('0.00')
  }
}
function getSelectedKeypair() {
  if (!phrase) {
    throw new Error('Wallet recovery phrase not found.')
  }

  const seed = mnemonicToSeedSync(phrase)

  const derivedSeed = derivePath(
    `m/44'/501'/${selectedWalletIndex}'/0'`,
    seed.toString('hex')
  ).key

  return Keypair.fromSeed(derivedSeed)
}
function getOrcaWallet() {
  const keypair = getSelectedKeypair()

  return {
    publicKey: keypair.publicKey,

    signTransaction: async (transaction) => {
      if (transaction instanceof VersionedTransaction) {
        transaction.sign([keypair])
      } else {
        transaction.partialSign(keypair)
      }

      return transaction
    },

    signAllTransactions: async (transactions) => {
      return transactions.map((transaction) => {
        if (transaction instanceof VersionedTransaction) {
          transaction.sign([keypair])
        } else {
          transaction.partialSign(keypair)
        }

        return transaction
      })
    }
  }
}
function getOrcaProvider() {
  const wallet = getOrcaWallet()

  return new AnchorProvider(
    connection,
    wallet,
    {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed'
    }
  )
}
function getOrcaClient() {
  const provider = getOrcaProvider()

  const ctx = WhirlpoolContext.from(
    connection,
    provider.wallet,
    undefined,
    undefined,
    undefined,
    ORCA_PROGRAM_ID
  )

  return buildWhirlpoolClient(ctx)
}
async function getOrcaPool() {
  const client = getOrcaClient()

  const pool = await client.getPool(ORCA_POOL)

  return pool
}
async function checkOrcaPool() {
  try {
    setSwapStatus('Checking Orca pool...')

    const pool = await getOrcaPool()

    console.log('Orca Pool:', pool.getData())
    console.log('Token Mint A:', pool.getData().tokenMintA.toBase58())
console.log('Token Mint B:', pool.getData().tokenMintB.toBase58())

    setSwapStatus('Orca pool fetched successfully!')
  } catch (err) {
    console.error('Orca Pool Error:', err)

    setSwapStatus('Pool Error: ' + err.message)
  }
}
async function getSolToDevUsdcQuote() {
  try {
    setSwapStatus('Getting swap quote...')

    const amountText = swapAmount.trim()

    if (
      !/^\d+(\.\d{1,9})?$/.test(amountText) ||
      Number(amountText) <= 0
    ) {
      throw new Error('Enter a valid SOL amount (maximum 9 decimal places).')
    }

    // Convert SOL into lamports (1 SOL = 1 billion lamports)
    const [whole, fraction = ''] = amountText.split('.')

    const lamports = new BN(whole)
      .mul(new BN(LAMPORTS_PER_SOL))
      .add(new BN((fraction + '000000000').slice(0, 9)))

    const client = getOrcaClient()
    const pool = await client.getPool(ORCA_POOL)

    const quote = await swapQuoteByInputToken(
      pool,
      new PublicKey('So11111111111111111111111111111111111111112'),
      lamports,
      Percentage.fromFraction(1, 100),
      ORCA_PROGRAM_ID,
      client.getFetcher()
    )

    setSwapQuote(quote)

    console.log('SOL to devUSDC Quote:', quote)
    console.log(
      'Estimated output (raw units):',
      quote.estimatedAmountOut.toString()
    )

    setSwapStatus('Swap quote received successfully!')
  } catch (err) {
    console.error('Swap Quote Error:', err)
    setSwapStatus('Quote Error: ' + err.message)
  }
}
async function executeSolToDevUsdcSwap() {
  try {
    if (!wallet || !phrase) {
      throw new Error('Please create or select a wallet first.')
    }

    const amountText = swapAmount.trim()

    if (
      !/^\d+(\.\d{1,9})?$/.test(amountText) ||
      Number(amountText) <= 0
    ) {
      throw new Error('Enter a valid SOL amount.')
    }

    const confirmed = window.confirm(
      `Execute a swap of ${amountText} SOL for devUSDC on Solana Devnet?`
    )

    if (!confirmed) return

    setIsSwapping(true)
    setSwapStatus('Preparing your swap transaction...')

    // Convert SOL to lamports
    const [whole, fraction = ''] = amountText.split('.')

    const lamports = new BN(whole)
      .mul(new BN(LAMPORTS_PER_SOL))
      .add(new BN((fraction + '000000000').slice(0, 9)))

    // Fetch a fresh pool and quote
    const client = getOrcaClient()
    const pool = await client.getPool(ORCA_POOL)

    const quote = await swapQuoteByInputToken(
      pool,
      new PublicKey('So11111111111111111111111111111111111111112'),
      lamports,
      Percentage.fromFraction(1, 100),
      ORCA_PROGRAM_ID,
      client.getFetcher()
    )

    setSwapQuote(quote)

    setSwapStatus('Building and sending swap transaction...')

    // Build the swap transaction
    const txBuilder = await pool.swap(
      quote,
      new PublicKey(wallet)
    )

    // Sign, send and confirm
    const signature = await txBuilder.buildAndExecute()

    console.log('Swap Transaction Signature:', signature)

    setSwapStatus(
      'Swap successful! Transaction: ' + signature
    )

  } catch (err) {
    console.error('Swap Execution Error:', err)

    setSwapStatus('Swap Error: ' + err.message)

  } finally {
    setIsSwapping(false)
  }
}
async function sendSol() {
  try {
    setSendStatus('Sending transaction...')

    if (!phrase || !recipientAddress || !sendAmount) {
      throw new Error('Please fill in all fields.')
    }

    const amount = Number(sendAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Enter a valid SOL amount.')
    }

    const recipientPublicKey = new PublicKey(recipientAddress)

    const seed = mnemonicToSeedSync(phrase)
    const seedHex = Buffer.from(seed).toString('hex')

    const path = `m/44'/501'/${selectedWalletIndex}'/0'`

const derivedSeed = derivePath(
  path,
  seedHex
).key

    const senderKeypair = await Keypair.fromSeed(derivedSeed)

    const balance = await connection.getBalance(senderKeypair.publicKey)
    const lamports = Math.round(amount * LAMPORTS_PER_SOL)

    if (lamports > balance) {
      throw new Error('Insufficient SOL balance for this transfer.')
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: recipientPublicKey,
        lamports
      })
    )

    const signature = await connection.sendTransaction(
      transaction,
      [senderKeypair]
    )

    await connection.confirmTransaction(signature, 'confirmed')

    setSendStatus('SOL sent successfully! Transaction: ' + signature)
    setSendAmount('')
    await refreshBalance()

  } catch (err) {
    console.error('Send SOL Error:', err)
    setSendStatus('Error: ' + err.message)
  }
}
async function refreshUsdcBalance() {
  try {
    if (!wallet) return

    const publicKey = new PublicKey(wallet)

    const tokenAddress = await getAssociatedTokenAddress(
      USDC_MINT,
      publicKey,
      false,
      TOKEN_PROGRAM_ID
    )

    try {
      const tokenAccount = await getAccount(
        connection,
        tokenAddress,
        'confirmed',
        TOKEN_PROGRAM_ID
      )

      setUsdcBalance(
        (Number(tokenAccount.amount) / 1_000_000).toFixed(2)
      )
    } catch {
      setUsdcBalance('0.00')
    }
  } catch (err) {
    console.error('USDC Balance Error:', err)
    setError(err.message)
  }
}
async function addWallet() {
  try {
    const seed = mnemonicToSeedSync(phrase)
    const seedHex = Buffer.from(seed).toString('hex')

    const path = `m/44'/501'/${walletCount}'/0'`

    const derivedSeed = derivePath(path, seedHex).key
    const keypair = await Keypair.fromSeed(derivedSeed)

    const newAddress = keypair.publicKey.toBase58()

    setWallets(prev => {
  const updatedWallets = [...prev, newAddress]

  localStorage.setItem('walletCount', updatedWallets.length)

  return updatedWallets
})

setWalletCount(prev => prev + 1)
    setError('')
  } catch (err) {
    console.error('Add Wallet Error:', err)
    setError(err.message)
  }
}
async function selectWallet(index) {
  try {
    const selectedAddress = wallets[index]

    setSelectedWalletIndex(index)
    localStorage.setItem('selectedWalletIndex', String(index))
    setWallet(selectedAddress)
    setError('')

    const publicKey = new PublicKey(selectedAddress)

    const balance = await connection.getBalance(publicKey)

    setSolBalance(
      (balance / LAMPORTS_PER_SOL).toFixed(4)
    )

    const tokenAddress = await getAssociatedTokenAddress(
      USDC_MINT,
      publicKey,
      false,
      TOKEN_PROGRAM_ID
    )

    try {
      const tokenAccount = await getAccount(
        connection,
        tokenAddress,
        'confirmed',
        TOKEN_PROGRAM_ID
      )

      setUsdcBalance(
        (Number(tokenAccount.amount) / 1_000_000).toFixed(2)
      )
    } catch {
      setUsdcBalance('0.00')
    }

  } catch (err) {
    setError(err.message)
  }
}
  return (
    <div className="app">
      <nav className="navbar">
        <h2>◎ Solana Wallet</h2>
        <span className="network">Devnet</span>
      </nav>

      <main className="dashboard">
        <h1>Welcome to Your Wallet</h1>
        <p className="subtitle">
          Manage your Solana assets in one place.
        </p>

        <section className="balance-card">
          <p>Total SOL Balance</p>
          <h1>{solBalance} SOL</h1>
          <span>≈ $0.00 USD</span>
        </section>

        <div className="token-grid">
          <section className="token-card">
            <h3>◎ Solana</h3>
            <h2>{solBalance} SOL</h2>
            <p>Your SOL balance</p>
          </section>

          <section className="token-card">
            <h3>💵 USDC</h3>
            <h2>{usdcBalance} USDC</h2>
            <p>Your USDC balance</p>
          </section>
          <section className="token-card">
  <h3>💵 devUSDC</h3>
  <h2>{devUsdcBalance} devUSDC</h2>
  <p>Your Orca Devnet token balance</p>
</section>
        </div>

        <section className="wallet-card">
          <h3>Your Wallet</h3>

          {wallet ? (
            <>
              <p>Wallet generated successfully!</p>
              <p className="address">{wallet}</p>

              <h3>Recovery Phrase</h3>
              <p className="phrase">{phrase}</p>
              <p className="warning">
                Keep this phrase private. Anyone who has it
                can access your wallet.
              </p>
            </>
          ) : (
            <p>No wallet generated yet.</p>
          )}

          <button onClick={generateWallet}>
            Generate Wallet
          </button>
          <button onClick={addWallet} disabled={!phrase}>
  Generate Another Wallet
</button>
          <button onClick={requestAirdrop} disabled={!wallet}>
  Request 1 Test SOL
</button>
<button onClick={refreshBalance} disabled={!wallet}>
  Refresh Balance
</button>
<button onClick={refreshUsdcBalance} disabled={!wallet}>
  Refresh USDC Balance
</button>
<button onClick={refreshDevUsdcBalance} disabled={!wallet}>
  Refresh devUSDC Balance
</button>

          {error && <p className="warning">{error}</p>}
          <h3>All Your Wallets</h3>

{wallets.map((address, index) => (
  <div
    className="address"
    key={index}
    onClick={() => selectWallet(index)}
    style={{
      cursor: 'pointer',
      border: selectedWalletIndex === index
        ? '2px solid #9945ff'
        : '1px solid #475569',
      padding: '12px',
      marginBottom: '10px',
      borderRadius: '10px'
    }}
  >
    <p>Wallet {index + 1}</p>
    <p>{address}</p>

    {selectedWalletIndex === index && (
      <p>✓ Selected Wallet</p>
    )}
  </div>
))}
        </section>
      </main>
      <div className="send-section">
  <h2>Send SOL</h2>

  <input
    type="text"
    placeholder="Recipient Wallet Address"
    value={recipientAddress}
    onChange={(e) => setRecipientAddress(e.target.value)}
  />

  <input
    type="number"
    placeholder="Amount in SOL"
    value={sendAmount}
    onChange={(e) => setSendAmount(e.target.value)}
  />

  <button onClick={sendSol}>
    Send SOL
  </button>

  {sendStatus && <p>{sendStatus}</p>}
</div>
<section className="send-section">
  <h2>Orca SOL to devUSDC Swap</h2>

  <button onClick={checkOrcaPool}>
    Check Orca Pool
  </button>

  <input
    type="number"
    placeholder="Enter SOL amount"
    value={swapAmount}
    onChange={(e) => setSwapAmount(e.target.value)}
    min="0"
    step="0.000000001"
  />

  <button onClick={getSolToDevUsdcQuote}>
    Get Swap Quote
  </button>
  <button
  onClick={executeSolToDevUsdcSwap}
  disabled={isSwapping || !swapAmount}
>
  {isSwapping ? 'Swapping...' : 'Swap SOL for devUSDC'}
</button>

  {swapStatus && <p>{swapStatus}</p>}

  {swapQuote && (
  <p>
    Estimated devUSDC:{' '}
    {(Number(swapQuote.estimatedAmountOut.toString()) / 1000000).toFixed(6)}
  </p>
)}
</section>
    </div>
  )
}

export default App
