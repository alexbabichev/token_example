window.onload = () => {
  init();
}

const contractAddress = '0x523a7fe78f3b11eff51441e3fcc95cb94a37d25c';
const crowdsaleAddress = '0xc1b0b78699957fb56a42df9da44938ea051b959e';

const maxAmount = 40000000;
const minPrice = 0.0003;
const maxPrice = 0.0006;

let account = null;
let provider = null;
let signer = null;
let daiContract = null;
let balanceETH = 0;

async function init() {
  if (typeof window.ethereum === 'undefined') {
    console.log('No MetaMask!')
  }

  // If you'd like to be notified when the address changes, we have an event you can subscribe to:
  ethereum.on('accountsChanged', function (accounts) {
    // Time to reload your interface with accounts[0]!
    if (!!account && (account !== accounts[0]))
      window.location.reload();
  });

  console.info('MetaMask is installed!');

  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  account = accounts[0];

  provider = new ethers.providers.Web3Provider(window.ethereum);

  // The Metamask plugin also allows signing transactions to
  // send ether and pay to change state within the blockchain.
  // For this, you need the account signer...
  signer = provider.getSigner();

  // get ETH balance
  ethBalance = await getBalance();

  print('ethBalance', ethBalance);

  // connect to contract
  daiContract = new ethers.Contract(contractAddress, daiAbi, provider);
  // listening to contract events
  listenContract();

  const tokenInfo = await getTokenInfo();

  print('tokenName', tokenInfo.name);
  print('tokenSymbol', tokenInfo.symbol);

  const tokenBalance = await getTokenBalance(account);

  print('tokenBalance', tokenBalance);

  const { soldAmount, currentTokenPrice } = await getTokenPrice();

  print('tokenPrice', currentTokenPrice);
  print('tokenSold', maxAmount - soldAmount + ' of ' + maxAmount);
}

async function getBalance() {
  const result = await provider.getBalance("ethers.eth");
  const formated = ethers.utils.formatEther(result);

  return formated;
}

async function getTokenInfo() {
  // Get the ERC-20 token name
  const name = await daiContract.name();

  // Get the ERC-20 token synbol (for tickers and UIs)
  const symbol = await daiContract.symbol();

  return { name, symbol }
}

async function getTokenBalance(account) {
  const result = await daiContract.balanceOf(account);
  const formated = ethers.utils.formatEther(result);

  return formated;
}

async function getTokenPrice() {
  const soldAmount = await getTokenBalance(crowdsaleAddress);
  const currentTokenPrice = minPrice + minPrice * (1 - soldAmount / maxAmount);

  return { soldAmount, currentTokenPrice };
}

async function sendEth(amount) {
  const tx = await signer.sendTransaction({
    to: crowdsaleAddress,
    value: ethers.utils.parseEther(amount.toString())
  });

  console.log(tx);
}

// ----------------------------------------------------------------------------------------

function listenContract() {
  // A filter for when a specific address receives tokens
  filter = daiContract.filters.Transfer(null, account);
  daiContract.on(filter, (from, to, amount, event) => {
    // The to will always be "address"
    alert(`I got ${ethers.utils.formatEther(amount)} from ${from}.`);
  });
}

// ----------------------------------------------------------------------------------------

function onBuy() {
  const value = document.querySelector('#inputAmount').value;
  sendEth(value);
}

// ----------------------------------------------------------------------------------------

function print(id, text) {
  document.querySelector('#' + id + ' span').innerText = text;
}

// ----------------------------------------------------------------------------------------
// The ERC-20 Contract ABI, which is a common contract interface
// for tokens (this is the Human-Readable ABI format)
const daiAbi = [
  // Some details about the token
  "function name() view returns (string)",
  "function symbol() view returns (string)",

  // Get the account balance
  "function balanceOf(address) view returns (uint)",

  // Send some of your tokens to someone else
  "function transfer(address to, uint amount)",

  // An event triggered whenever anyone transfers to someone else
  "event Transfer(address indexed from, address indexed to, uint amount)"
];