const NATIVE_ADDRESS = '0x49febbF9626B2D39aBa11C01d83Ef59b3D56d2A4'
const VAN_ADDRESS = '0x870c765f8aF9b189C324BE88B99884e5bAe4514b'
const WETH_ADDRESS = '0xff00000000000000000000000000000000000001'
const WBTC_ADDRESS = '0xff00000000000000000000000000000000000002'
const USDC_ADDRESS = '0xFF0000000000000000000000000000000000000d'
const JAV_ADDRESS = '0x66F3Cf265D2D146A0348F6fC67E3Da0835e0968E'
const USDT_ADDRESS = '0xFF00000000000000000000000000000000000003'
const MUSD_ADDRESS = '0x80b6897Ba629d6C42584eC162CCA29F1E34783bE'
const DUSD_ADDRESS = '0xFf0000000000000000000000000000000000000F'
// const FRAX_ADDRESS = '0x17fc002b466eec40dae837fc4be5c67993ddbd6f'
// const ARBY_ADDRESS = '0x09ad12552ec45f82be90b38dfe7b06332a680864'
// const DPX_ADDRESS = '0x6c2c06790b3e3e3c38e12ee22f8183b37a13ee55'
// const GOHM_ADDRESS = '0x8d9ba570d6cb60c7e3e0f31343efe75ab8e65fb1'
// const MAGIC_ADDRESS = '0x539bde0d7dbd336b79148aa742883198bbf60342'
// const ARB_ADDRESS = '0x912ce59144191c1204e64559fe8253a0e49e6548'

module.exports = {
  network: 'mainnet',
  sushi: { address: VAN_ADDRESS },
  weth: { address: WETH_ADDRESS },
  wbtc: { address: WBTC_ADDRESS },
  minichef: {
    address: '0xf4d73326c13a4fc5fd7a064217e12780e9bd62c3',
    startBlock: 226981,
    rewarder: {
      complex: {
        address: '0x0000000000000000000000000000000000000000',
        rewardToken: { address: '0x0000000000000000000000000000000000000000' },
      },
    },
  },
  bentobox: {
    address: '0x74c764d41b77dbbb4fe771dab1939b00b146894a',
    // base: '',
    startBlock: 229409,
  },
  kashi: {
    medium: '0xa010ee0226cd071bebd8919a1f675cae1f1f5d3e',

    mediumRiskMasterContractAddresses: ['0xa010ee0226cd071bebd8919a1f675cae1f1f5d3e'],
  },
  miso: {
    accessControls: { address: '0x1be211d8da40bc0ae8719c6663307bfc987b1d6c', startBlock: 9930886 },
    market: { address: '0x351447fc9bd20a917783e159e61e86edda0b0187', startBlock: 9931078 },
  },
  legacy: {
    base: 'QmfKgxN71Bc7TKzQi8yccRunpiWupFdWA4638yZRxve3q1',
    startBlock: 16548328,
    native: { address: NATIVE_ADDRESS },
    whitelistedTokenAddresses: [
      // IMPORTANT! Native should be included here
      NATIVE_ADDRESS,
      WBTC_ADDRESS,
      USDC_ADDRESS,
      JAV_ADDRESS,
      USDT_ADDRESS,
      MUSD_ADDRESS,
      DUSD_ADDRESS,
    ],
    stableTokenAddresses: [USDC_ADDRESS, USDT_ADDRESS, MUSD_ADDRESS],
    minimumNativeLiquidity: 3,
    factory: {
      address: '0x79Ea1b897deeF37e3e42cDB66ca35DaA799E93a3',
      initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
      startBlock: 3010,
    },
  },
  trident: {
    masterDeployer: { address: '0xf0e1f962e3e6d8e2af8190b2798c1b4f018fe48d', startBlock: 43756724 },
    concentratedLiquidityPoolFactory: { address: '0x0000000000000000000000000000000000000000' },
    constantProductPoolFactory: {
      address: '0xc79ae87e9f55761c08e346b98dddf070c9872787',
      initCodeHash: '0x3172d82413be467c1130709f7479a07def9b99caf8e0059f248c131081e4ea09',
    },
    stablePoolFactory: { address: '0xc2fb256aba36852dccea92181ec6b355f09a0288' },
    hybridPoolFactory: { address: '0x0000000000000000000000000000000000000000' },
    indexPoolFactory: { address: '0x0000000000000000000000000000000000000000' },
    native: { address: NATIVE_ADDRESS },
    whitelistedTokenAddresses: [
      // IMPORTANT! Native should be included here
      NATIVE_ADDRESS,
      VAN_ADDRESS,
      WETH_ADDRESS,
      WBTC_ADDRESS,
      USDC_ADDRESS,
      JAV_ADDRESS,
      USDT_ADDRESS,
      MUSD_ADDRESS,
      DUSD_ADDRESS,
    ],
    stableTokenAddresses: [USDC_ADDRESS, USDT_ADDRESS, MUSD_ADDRESS],
    tokensToPriceOffNative: [
      // These tokens will be priced off the NATIVE token.
      USDC_ADDRESS,
    ],
    minimumNativeLiquidity: '1.2',
  },
  v2: {
    nativeAddress: NATIVE_ADDRESS,
    whitelistAddresses: [
      // IMPORTANT! Native should be included here
      NATIVE_ADDRESS,
      VAN_ADDRESS,
      WETH_ADDRESS,
      WBTC_ADDRESS,
      USDC_ADDRESS,
      JAV_ADDRESS,
      USDT_ADDRESS,
      MUSD_ADDRESS,
      DUSD_ADDRESS,
    ],
    stable0: USDC_ADDRESS,
    stable1: USDT_ADDRESS,
    stable2: MUSD_ADDRESS,
    minimumNativeLiquidity: 3,
    factory: {
      address: '0x79Ea1b897deeF37e3e42cDB66ca35DaA799E93a3',
      initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
      startBlock: 3010,
    },
  },
  v3: {
    factory: {
      // 0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6
      address: '0x9C444DD15Fb0Ac0bA8E9fbB9dA7b9015F43b4Dc1',
      startBlock: 147204,
    },
    positionManager: {
      address: '0x274567C3B27F3981C4Ae7C951ECDe1C2aE70e6d0',
      startBlock: 147230,
    },
    native: { address: NATIVE_ADDRESS },
    whitelistedTokenAddresses: [
      NATIVE_ADDRESS,
      VAN_ADDRESS,
      WETH_ADDRESS,
      WBTC_ADDRESS,
      USDC_ADDRESS,
      JAV_ADDRESS,
      USDT_ADDRESS,
      MUSD_ADDRESS,
      DUSD_ADDRESS,
    ],
    stableTokenAddresses: [USDC_ADDRESS, USDT_ADDRESS, MUSD_ADDRESS],
    nativePricePool: '0x014ef9468bde169d55e234631602a7664cd1501f',
    minimumEthLocked: 1,
  },
  blacklistedTokenAddresses: [
    '0xeba61eb686b515fae79a96118f140924a634ab23', // ArbFloki
  ],
  furo: {
    stream: { address: '0x4ab2fc6e258a0ca7175d05ff10c5cf798a672cae', startBlock: 13964139 },
    vesting: { address: '0x0689640d190b10765f09310fcfe9c670ede4e25b', startBlock: 13964169 },
  },
  auctionMaker: { address: '0x0000000000000000000000000000000000000000', startBlock: 0 },
  staking: { address: '0x8db6749c9e8f28a4a9bbc02facb9ba9c58e3c9c5', startBlock: 13883265 },
  blocks: {
    address: '0xc35dadb65012ec5796536bd9864ed8773abc74c4',
    startBlock: 0,
  },
  xswap: {
    address: '0x53b08dbd70327b7ba3b7886fc9987bc985d27262',
    startBlock: 18221456,
  },
  stargate: {
    address: '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
    startBlock: 7920342,
    usdcPool: { address: '0x892785f33cdee22a30aef750f285e18c18040c3e', startBlock: 8041115 },
    usdtPool: { address: '0xb6cfcf89a7b22988bfc96632ac2a9d6dab60d641', startBlock: 8041122 },
  },
  router: {
    address: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506',
    startBlock: 29527181,
  },
  routeprocessor: {
    address: '0x544ba588efd839d2692fc31ea991cd39993c135f',
    startBlock: 184266045,
  },
}
