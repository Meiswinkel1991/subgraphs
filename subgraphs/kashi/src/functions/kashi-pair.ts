import { Address, BigInt, Bytes, ethereum, log, TypedMap } from '@graphprotocol/graph-ts'

import { KashiPair, Token } from '../../generated/schema'
import { KashiPair as KashiPairContract } from '../../generated/BentoBox/KashiPair'
import { getOrCreateBentoBox } from './bentobox'
import { getOrCreateMasterContract } from './master-contract'
import { createKashiPairAccrueInfo } from './kashi-pair-accrue-info'
import { getOrCreateToken } from './token'
import { LogDeploy } from '../../generated/BentoBox/BentoBox'
import { createRebase } from './rebase'
import { DEPRECIATED_ADDRESSES, STARTING_INTEREST_PER_YEAR, ADDRESS_ZERO, CHAIN_ID } from '../constants'
import { getTokenPrice } from './token-price'

// TODO: should add props for specific kashi pair types (collateralization rates, etc.)

// export let oracleLookupTable = new TypedMap<string, string>();

// TODO: Pricing...
export const baseLookupTable = new TypedMap<string, string>()
baseLookupTable.set('0x0000000000000000000000000000000000000001', 'USD')
baseLookupTable.set('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'ETH')
baseLookupTable.set('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', 'BTC')

class PriceFeed {
  from: Bytes
  to: Bytes
  decimals: BigInt
  fromDecimals: BigInt
  toDecimals: BigInt
}

const chainlinkPriceFeedLookupTable = new TypedMap<string, PriceFeed>()

// 1INCH / ETH
chainlinkPriceFeedLookupTable.set('0x72AFAECF99C9d9C8215fF44C77B94B99C28741e8'.toLowerCase(), {
  from: Address.fromString('0x111111111117dC0aa78b770fA6A738034120C302'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// 1INCH / USD
chainlinkPriceFeedLookupTable.set('0xc929ad75B72593967DE83E7F7Cda0493458261D9'.toLowerCase(), {
  from: Address.fromString('0x111111111117dC0aa78b770fA6A738034120C302'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// AAVE / ETH
chainlinkPriceFeedLookupTable.set('0x6Df09E975c830ECae5bd4eD9d90f3A95a4f88012'.toLowerCase(), {
  from: Address.fromString('0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// AAVE / USD
chainlinkPriceFeedLookupTable.set('0x547a514d5e3769680Ce22B2361c10Ea13619e8a9'.toLowerCase(), {
  from: Address.fromString('0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// ADX / USD
chainlinkPriceFeedLookupTable.set('0x231e764B44b2C1b7Ca171fa8021A24ed520Cde10'.toLowerCase(), {
  from: Address.fromString('0xADE00C28244d5CE17D72E40330B1c318cD12B7c3'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// AKRO / USD
chainlinkPriceFeedLookupTable.set('0xB23D105dF4958B4b81757e12f2151B5b5183520B'.toLowerCase(), {
  from: Address.fromString('0x8Ab7404063Ec4DBcfd4598215992DC3F8EC853d7'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// ALPHA / ETH
chainlinkPriceFeedLookupTable.set('0x89c7926c7c15fD5BFDB1edcFf7E7fC8283B578F6'.toLowerCase(), {
  from: Address.fromString('0xa1faa113cbE53436Df28FF0aEe54275c13B40975'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// AMP / USD
chainlinkPriceFeedLookupTable.set('0x8797ABc4641dE76342b8acE9C63e3301DC35e3d8'.toLowerCase(), {
  from: Address.fromString('0xfF20817765cB7f73d4bde2e66e067E58D11095C2'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// AMPL / ETH
chainlinkPriceFeedLookupTable.set('0x492575FDD11a0fCf2C6C719867890a7648d526eB'.toLowerCase(), {
  from: Address.fromString('0xD46bA6D942050d489DBd938a2C909A5d5039A161'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(9),
  toDecimals: BigInt.fromU32(18),
})

// AMPL / USD
chainlinkPriceFeedLookupTable.set('0xe20CA8D7546932360e37E9D72c1a47334af57706'.toLowerCase(), {
  from: Address.fromString('0xD46bA6D942050d489DBd938a2C909A5d5039A161'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(9),
  toDecimals: BigInt.fromU32(8),
})

// ANKR / USD
chainlinkPriceFeedLookupTable.set('0x7eed379bf00005CfeD29feD4009669dE9Bcc21ce'.toLowerCase(), {
  from: Address.fromString('0x8290333ceF9e6D528dD5618Fb97a76f268f3EDD4'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// ANT / ETH
chainlinkPriceFeedLookupTable.set('0x8f83670260F8f7708143b836a2a6F11eF0aBac01'.toLowerCase(), {
  from: Address.fromString('0xa117000000f279D81A1D3cc75430fAA017FA5A2e'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// AUCTION / USD
chainlinkPriceFeedLookupTable.set('0xA6BCac72431A4178f07d016E1D912F56E6D989Ec'.toLowerCase(), {
  from: Address.fromString('0xA9B1Eb5908CfC3cdf91F9B8B3a74108598009096'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// BADGER / ETH
chainlinkPriceFeedLookupTable.set('0x58921Ac140522867bf50b9E009599Da0CA4A2379'.toLowerCase(), {
  from: Address.fromString('0x3472A5A71965499acd81997a54BBA8D852C6E53d'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// BADGER / USD
chainlinkPriceFeedLookupTable.set('0x66a47b7206130e6FF64854EF0E1EDfa237E65339'.toLowerCase(), {
  from: Address.fromString('0x3472A5A71965499acd81997a54BBA8D852C6E53d'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// BAL / ETH
chainlinkPriceFeedLookupTable.set('0xC1438AA3823A6Ba0C159CfA8D98dF5A994bA120b'.toLowerCase(), {
  from: Address.fromString('0xba100000625a3754423978a60c9317c58a424e3D'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// BAND / ETH
chainlinkPriceFeedLookupTable.set('0x0BDb051e10c9718d1C29efbad442E88D38958274'.toLowerCase(), {
  from: Address.fromString('0xBA11D00c5f74255f56a5E366F4F77f5A186d7f55'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// BAND / USD
chainlinkPriceFeedLookupTable.set('0x919C77ACc7373D000b329c1276C76586ed2Dd19F'.toLowerCase(), {
  from: Address.fromString('0xBA11D00c5f74255f56a5E366F4F77f5A186d7f55'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// BAT / ETH
chainlinkPriceFeedLookupTable.set('0x0d16d4528239e9ee52fa531af613AcdB23D88c94'.toLowerCase(), {
  from: Address.fromString('0x0D8775F648430679A709E98d2b0Cb6250d2887EF'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// BAT / USD
chainlinkPriceFeedLookupTable.set('0x9441D7556e7820B5ca42082cfa99487D56AcA958'.toLowerCase(), {
  from: Address.fromString('0x0D8775F648430679A709E98d2b0Cb6250d2887EF'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// BCH / USD
chainlinkPriceFeedLookupTable.set('0x9F0F69428F923D6c95B781F89E165C9b2df9789D'.toLowerCase(), {
  from: Address.fromString('0x9F0F69428F923D6c95B781F89E165C9b2df9789D'),
  to: Address.fromString('0x459086F2376525BdCebA5bDDA135e4E9d3FeF5bf'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(8),
  toDecimals: BigInt.fromU32(8),
})

// BNB / ETH
chainlinkPriceFeedLookupTable.set('0xc546d2d06144F9DD42815b8bA46Ee7B8FcAFa4a2'.toLowerCase(), {
  from: Address.fromString('0xB8c77482e45F1F44dE1745F52C74426C631bDD52'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// BNB / USD
chainlinkPriceFeedLookupTable.set('0x14e613AC84a31f709eadbdF89C6CC390fDc9540A'.toLowerCase(), {
  from: Address.fromString('0xB8c77482e45F1F44dE1745F52C74426C631bDD52'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// BNT / ETH
chainlinkPriceFeedLookupTable.set('0xCf61d1841B178fe82C8895fe60c2EDDa08314416'.toLowerCase(), {
  from: Address.fromString('0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// BNT / USD
chainlinkPriceFeedLookupTable.set('0x1E6cF0D433de4FE882A437ABC654F58E1e78548c'.toLowerCase(), {
  from: Address.fromString('0xB8c77482e45F1F44dE1745F52C74426C631bDD52'),
  to: Address.fromString('0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// BOND / ETH
chainlinkPriceFeedLookupTable.set('0xdd22A54e05410D8d1007c38b5c7A3eD74b855281'.toLowerCase(), {
  from: Address.fromString('0x0391D2021f89DC339F60Fff84546EA23E337750f'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// BTC / ETH
chainlinkPriceFeedLookupTable.set('0xdeb288F737066589598e9214E782fa5A8eD689e8'.toLowerCase(), {
  from: Address.fromString('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(8),
  toDecimals: BigInt.fromU32(18),
})

// BTC / USD
chainlinkPriceFeedLookupTable.set('0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c'.toLowerCase(), {
  from: Address.fromString('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(8),
  toDecimals: BigInt.fromU32(8),
})

// BTM / USD
chainlinkPriceFeedLookupTable.set('0x9fCCF42D21AB278e205e7Bb310D8979F8f4B5751'.toLowerCase(), {
  from: Address.fromString('0xcB97e65F07DA24D46BcDD078EBebd7C6E6E3d750'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(8),
  toDecimals: BigInt.fromU32(8),
})

// bUSD / ETH
chainlinkPriceFeedLookupTable.set('0x614715d2Af89E6EC99A233818275142cE88d1Cfd'.toLowerCase(), {
  from: Address.fromString('0x4Fabb145d64652a948d72533023f6E7A623C7C53'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// bUSD / USD
chainlinkPriceFeedLookupTable.set('0x833D8Eb16D306ed1FbB5D7A2E019e106B960965A'.toLowerCase(), {
  from: Address.fromString('0x4Fabb145d64652a948d72533023f6E7A623C7C53'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// DEPRECIATED
// BZRX / ETH
// '0x8f7C7181Ed1a2BA41cfC3f5d064eF91b67daef66': {
//   from: '0x56d811088235F11C8920698a204A5010a788f4b3',
//   to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
//   decimals: 18,
//   fromDecimals: 18,
//   toDecimals: 18,
// },

// DEPRECIATED???
// CEL / ETH
// '0x75FbD83b4bd51dEe765b2a01e8D3aa1B020F9d33': {
//   from: '0xaaAEBE6Fe48E54f431b0C390CfaF0b017d09D42d',
//   to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
//   decimals: 18,
//   fromDecimals: 4,
//   toDecimals: 18,
// },

// CELO / USD
chainlinkPriceFeedLookupTable.set('0x10D35eFa5C26C3d994C511576641248405465AeF'.toLowerCase(), {
  from: Address.fromString('0xE452E6Ea2dDeB012e20dB73bf5d3863A3Ac8d77a'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// COMP / ETH
chainlinkPriceFeedLookupTable.set('0x1B39Ee86Ec5979ba5C322b826B3ECb8C79991699'.toLowerCase(), {
  from: Address.fromString('0xc00e94Cb662C3520282E6f5717214004A7f26888'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// COMP / USD
chainlinkPriceFeedLookupTable.set('0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5'.toLowerCase(), {
  from: Address.fromString('0xc00e94Cb662C3520282E6f5717214004A7f26888'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// DEPRECIATED???
// CREAM / ETH
// '0x82597CFE6af8baad7c0d441AA82cbC3b51759607': {
//   from: '0x2ba592F78dB6436527729929AAf6c908497cB200',
//   to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
//   decimals: 18,
//   fromDecimals: 18,
//   toDecimals: 18,
// },

// CRO / ETH
chainlinkPriceFeedLookupTable.set('0xcA696a9Eb93b81ADFE6435759A29aB4cf2991A96'.toLowerCase(), {
  from: Address.fromString('0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(8),
  toDecimals: BigInt.fromU32(18),
})

// CRO / USD
chainlinkPriceFeedLookupTable.set('0x00Cb80Cf097D9aA9A3779ad8EE7cF98437eaE050'.toLowerCase(), {
  from: Address.fromString('0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(8),
  toDecimals: BigInt.fromU32(8),
})

// CRV / ETH
chainlinkPriceFeedLookupTable.set('0x8a12Be339B0cD1829b91Adc01977caa5E9ac121e'.toLowerCase(), {
  from: Address.fromString('0xD533a949740bb3306d119CC777fa900bA034cd52'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// CRV / USD
chainlinkPriceFeedLookupTable.set('0xCd627aA160A6fA45Eb793D19Ef54f5062F20f33f'.toLowerCase(), {
  from: Address.fromString('0xD533a949740bb3306d119CC777fa900bA034cd52'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// DAI / ETH
chainlinkPriceFeedLookupTable.set('0x773616E4d11A78F511299002da57A0a94577F1f4'.toLowerCase(), {
  from: Address.fromString('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// DAI / USD
chainlinkPriceFeedLookupTable.set('0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9'.toLowerCase(), {
  from: Address.fromString('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// DIA / USD
chainlinkPriceFeedLookupTable.set('0xeE636E1f7A0A846EEc2385E729CeA7D1b339D40D'.toLowerCase(), {
  from: Address.fromString('0x84cA8bc7997272c7CfB4D0Cd3D55cd942B3c9419'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// // DIGG / USD
// '0x418a6C98CD5B8275955f08F0b8C1c6838c8b1685': {
//   from: '0x798D1bE841a82a273720CE31c822C61a67a601C3',
//   to: '0x0000000000000000000000000000000000000001',
//   decimals: 8,
//   fromDecimals: 9,
//   toDecimals: 8,
// },
// // DNT / ETH
// '0x1F9eB026e549a5f47A6aa834689053117239334A': {
//   from: '0x0AbdAce70D3790235af448C88547603b945604ea',
//   to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
//   decimals: 18,
//   fromDecimals: 18,
//   toDecimals: 18,
// },
// DOGE / USD
chainlinkPriceFeedLookupTable.set('0x2465CefD3b488BE410b941b1d4b2767088e2A028'.toLowerCase(), {
  from: Address.fromString('0x3832d2F059E55934220881F831bE501D180671A7'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(8),
  toDecimals: BigInt.fromU32(8),
})

// DPI / ETH
chainlinkPriceFeedLookupTable.set('0x029849bbc0b1d93b85a8b6190e979fd38F5760E2'.toLowerCase(), {
  from: Address.fromString('0x1494CA1F11D487c2bBe4543E90080AeBa4BA3C2b'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// // DPI / USD
chainlinkPriceFeedLookupTable.set('0xD2A593BF7594aCE1faD597adb697b5645d5edDB2'.toLowerCase(), {
  from: Address.fromString('0x1494CA1F11D487c2bBe4543E90080AeBa4BA3C2b'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// ENJ / ETH
chainlinkPriceFeedLookupTable.set('0x24D9aB51950F3d62E9144fdC2f3135DAA6Ce8D1B'.toLowerCase(), {
  from: Address.fromString('0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// ETH / USD
chainlinkPriceFeedLookupTable.set('0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'.toLowerCase(), {
  from: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// // FEI / ETH
chainlinkPriceFeedLookupTable.set('0x7F0D2c2838c6AC24443d13e23d99490017bDe370'.toLowerCase(), {
  from: Address.fromString('0x956F47F50A910163D8BF957Cf5846D573E7f87CA'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// FIL / ETH
chainlinkPriceFeedLookupTable.set('0x0606Be69451B1C9861Ac6b3626b99093b713E801'.toLowerCase(), {
  from: Address.fromString('0x6e1A19F235bE7ED8E3369eF73b196C07257494DE'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// FIL / USD
chainlinkPriceFeedLookupTable.set('0x1A31D42149e82Eb99777f903C08A2E41A00085d3'.toLowerCase(), {
  from: Address.fromString('0x6e1A19F235bE7ED8E3369eF73b196C07257494DE'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// FRAX / ETH
chainlinkPriceFeedLookupTable.set('0x14d04Fff8D21bd62987a5cE9ce543d2F1edF5D3E'.toLowerCase(), {
  from: Address.fromString('0x853d955aCEf822Db058eb8505911ED77F175b99e'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// FRONT / USD
chainlinkPriceFeedLookupTable.set('0xbf86e7B2565eAc3bFD80634176F31bd186566b06'.toLowerCase(), {
  from: Address.fromString('0xf8C3527CC04340b208C854E985240c02F7B7793f'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// FTM / USD
chainlinkPriceFeedLookupTable.set('0x2DE7E4a9488488e0058B95854CC2f7955B35dC9b'.toLowerCase(), {
  from: Address.fromString('0x4E15361FD6b4BB609Fa63C81A2be19d873717870'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// FTT / ETH
chainlinkPriceFeedLookupTable.set('0xF0985f7E2CaBFf22CecC5a71282a89582c382EFE'.toLowerCase(), {
  from: Address.fromString('0x50D1c9771902476076eCFc8B2A83Ad6b9355a4c9'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// FXS / USD
chainlinkPriceFeedLookupTable.set('0x6Ebc52C8C1089be9eB3945C4350B68B8E4C2233f'.toLowerCase(), {
  from: Address.fromString('0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// GNO / ETH
chainlinkPriceFeedLookupTable.set('0xA614953dF476577E90dcf4e3428960e221EA4727'.toLowerCase(), {
  from: Address.fromString('0x6810e776880C02933D47DB1b9fc05908e5386b96'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// // GRT / ETH
chainlinkPriceFeedLookupTable.set('0x17D054eCac33D91F7340645341eFB5DE9009F1C1'.toLowerCase(), {
  from: Address.fromString('0xc944E90C64B2c07662A292be6244BDf05Cda44a7'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// HEGIC / ETH
chainlinkPriceFeedLookupTable.set('0xAf5E8D9Cd9fC85725A83BF23C52f1C39A71588a6'.toLowerCase(), {
  from: Address.fromString('0x584bC13c7D411c00c01A62e8019472dE68768430'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// HEGIC / USD
chainlinkPriceFeedLookupTable.set('0xBFC189aC214E6A4a35EBC281ad15669619b75534'.toLowerCase(), {
  from: Address.fromString('0x584bC13c7D411c00c01A62e8019472dE68768430'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// HT / USD
chainlinkPriceFeedLookupTable.set('0xE1329B3f6513912CAf589659777b66011AEE5880'.toLowerCase(), {
  from: Address.fromString('0x6f259637dcD74C767781E37Bc6133cd6A68aa161'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// HUSD / ETH
chainlinkPriceFeedLookupTable.set('0x1B61BAD1495161bCb6C03DDB0E41622c0270bB1A'.toLowerCase(), {
  from: Address.fromString('0xdF574c24545E5FfEcb9a659c229253D4111d87e1'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// INJ / USD
chainlinkPriceFeedLookupTable.set('0xaE2EbE3c4D20cE13cE47cbb49b6d7ee631Cd816e'.toLowerCase(), {
  from: Address.fromString('0xe28b3B32B6c345A34Ff64674606124Dd5Aceca30'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// IOST / USD
chainlinkPriceFeedLookupTable.set('0xd0935838935349401c73a06FCde9d63f719e84E5'.toLowerCase(), {
  from: Address.fromString('0xFA1a856Cfa3409CFa145Fa4e20Eb270dF3EB21ab'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// JPY / USD
chainlinkPriceFeedLookupTable.set('0xBcE206caE7f0ec07b545EddE332A47C2F75bbeb3'.toLowerCase(), {
  from: Address.fromString('0x2370f9d504c7a6E775bf6E14B3F12846b594cD53'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// KNC / ETH
chainlinkPriceFeedLookupTable.set('0x656c0544eF4C98A6a98491833A89204Abb045d6b'.toLowerCase(), {
  from: Address.fromString('0xdd974D5C2e2928deA5F71b9825b8b646686BD200'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// KNC / USD
chainlinkPriceFeedLookupTable.set('0xf8fF43E991A81e6eC886a3D281A2C6cC19aE70Fc'.toLowerCase(), {
  from: Address.fromString('0xdd974D5C2e2928deA5F71b9825b8b646686BD200'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// KP3R / ETH
chainlinkPriceFeedLookupTable.set('0xe7015CCb7E5F788B8c1010FC22343473EaaC3741'.toLowerCase(), {
  from: Address.fromString('0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// LDO / ETH
chainlinkPriceFeedLookupTable.set('0x4e844125952D32AcdF339BE976c98E22F6F318dB'.toLowerCase(), {
  from: Address.fromString('0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// LINK / ETH
chainlinkPriceFeedLookupTable.set('0xDC530D9457755926550b59e8ECcdaE7624181557'.toLowerCase(), {
  from: Address.fromString('0x514910771AF9Ca656af840dff83E8264EcF986CA'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// LINK / USD
chainlinkPriceFeedLookupTable.set('0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c'.toLowerCase(), {
  from: Address.fromString('0x514910771AF9Ca656af840dff83E8264EcF986CA'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// LON / ETH
chainlinkPriceFeedLookupTable.set('0x13A8F2cC27ccC2761ca1b21d2F3E762445f201CE'.toLowerCase(), {
  from: Address.fromString('0x0000000000095413afC295d19EDeb1Ad7B71c952'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// LRC / ETH
chainlinkPriceFeedLookupTable.set('0x160AC928A16C93eD4895C2De6f81ECcE9a7eB7b4'.toLowerCase(), {
  from: Address.fromString('0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// LRC / USD
chainlinkPriceFeedLookupTable.set('0xFd33ec6ABAa1Bdc3D9C6C85f1D6299e5a1a5511F'.toLowerCase(), {
  from: Address.fromString('0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// MANA / ETH
chainlinkPriceFeedLookupTable.set('0x82A44D92D6c329826dc557c5E1Be6ebeC5D5FeB9'.toLowerCase(), {
  from: Address.fromString('0x0F5D2fB29fb7d3CFeE444a200298f468908cC942'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// MATIC / USD
chainlinkPriceFeedLookupTable.set('0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676'.toLowerCase(), {
  from: Address.fromString('0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// MKR / ETH
chainlinkPriceFeedLookupTable.set('0x24551a8Fb2A7211A25a17B1481f043A8a8adC7f2'.toLowerCase(), {
  from: Address.fromString('0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// MKR / USD
chainlinkPriceFeedLookupTable.set('0xec1D1B3b0443256cc3860e24a46F108e699484Aa'.toLowerCase(), {
  from: Address.fromString('0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// MLN / ETH
chainlinkPriceFeedLookupTable.set('0xDaeA8386611A157B08829ED4997A8A62B557014C'.toLowerCase(), {
  from: Address.fromString('0xec67005c4E498Ec7f55E092bd1d35cbC47C91892'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// MTA / ETH
chainlinkPriceFeedLookupTable.set('0x98334b85De2A8b998Ba844c5521e73D68AD69C00'.toLowerCase(), {
  from: Address.fromString('0xa3BeD4E1c75D00fa6f4E5E6922DB7261B5E9AcD2'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// MTA / USD
chainlinkPriceFeedLookupTable.set('0xc751E86208F0F8aF2d5CD0e29716cA7AD98B5eF5'.toLowerCase(), {
  from: Address.fromString('0xa3BeD4E1c75D00fa6f4E5E6922DB7261B5E9AcD2'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// NMR / ETH
chainlinkPriceFeedLookupTable.set('0x9cB2A01A7E64992d32A34db7cEea4c919C391f6A'.toLowerCase(), {
  from: Address.fromString('0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// NMR / USD
chainlinkPriceFeedLookupTable.set('0xcC445B35b3636bC7cC7051f4769D8982ED0d449A'.toLowerCase(), {
  from: Address.fromString('0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// NU / ETH
chainlinkPriceFeedLookupTable.set('0xFd93C391f3a81565DaE1f6A66115C26f36A92d6D'.toLowerCase(), {
  from: Address.fromString('0x4fE83213D56308330EC302a8BD641f1d0113A4Cc'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// OCEAN / ETH
chainlinkPriceFeedLookupTable.set('0x9b0FC4bb9981e5333689d69BdBF66351B9861E62'.toLowerCase(), {
  from: Address.fromString('0x967da4048cD07aB37855c090aAF366e4ce1b9F48'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// OCEAN / USD
chainlinkPriceFeedLookupTable.set('0x7ece4e4E206eD913D991a074A19C192142726797'.toLowerCase(), {
  from: Address.fromString('0x967da4048cD07aB37855c090aAF366e4ce1b9F48'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// OGN / ETH
chainlinkPriceFeedLookupTable.set('0x2c881B6f3f6B5ff6C975813F87A4dad0b241C15b'.toLowerCase(), {
  from: Address.fromString('0x8207c1FfC5B6804F6024322CcF34F29c3541Ae26'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// OKB / USD
chainlinkPriceFeedLookupTable.set('0x22134617Ae0f6CA8D89451e5Ae091c94f7D743DC'.toLowerCase(), {
  from: Address.fromString('0x75231F58b43240C9718Dd58B4967c5114342a86c'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// OMG / ETH
chainlinkPriceFeedLookupTable.set('0x57C9aB3e56EE4a83752c181f241120a3DBba06a1'.toLowerCase(), {
  from: Address.fromString('0xd26114cd6EE289AccF82350c8d8487fedB8A0C07'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// OMG / USD
chainlinkPriceFeedLookupTable.set('0x7D476f061F8212A8C9317D5784e72B4212436E93'.toLowerCase(), {
  from: Address.fromString('0xd26114cd6EE289AccF82350c8d8487fedB8A0C07'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// ORN / ETH
chainlinkPriceFeedLookupTable.set('0xbA9B2a360eb8aBdb677d6d7f27E12De11AA052ef'.toLowerCase(), {
  from: Address.fromString('0x0258F474786DdFd37ABCE6df6BBb1Dd5dfC4434a'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// OXT / USD
chainlinkPriceFeedLookupTable.set('0xd75AAaE4AF0c398ca13e2667Be57AF2ccA8B5de6'.toLowerCase(), {
  from: Address.fromString('0x4575f41308EC1483f3d399aa9a2826d74Da13Deb'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// PAX / ETH
chainlinkPriceFeedLookupTable.set('0x3a08ebBaB125224b7b6474384Ee39fBb247D2200'.toLowerCase(), {
  from: Address.fromString('0x8E870D67F660D95d5be530380D0eC0bd388289E1'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// PAXG / ETH
chainlinkPriceFeedLookupTable.set('0x9B97304EA12EFed0FAd976FBeCAad46016bf269e'.toLowerCase(), {
  from: Address.fromString('0x45804880De22913dAFE09f4980848ECE6EcbAf78'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// PERP / ETH
chainlinkPriceFeedLookupTable.set('0x3b41D5571468904D4e53b6a8d93A6BaC43f02dC9'.toLowerCase(), {
  from: Address.fromString('0xbC396689893D065F41bc2C6EcbeE5e0085233447'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// PUNDIX / USD
chainlinkPriceFeedLookupTable.set('0x552dDBEf6f5a1316aec3E30Db6afCD433548dbF3'.toLowerCase(), {
  from: Address.fromString('0x0FD10b9899882a6f2fcb5c371E17e70FdEe00C38'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// QQQ / USD
chainlinkPriceFeedLookupTable.set('0x6b54e83f44047d2168a195ABA5e9b768762167b5'.toLowerCase(), {
  from: Address.fromString('0x13B02c8dE71680e71F0820c996E4bE43c2F57d15'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// RAI / ETH
chainlinkPriceFeedLookupTable.set('0x4ad7B025127e89263242aB68F0f9c4E5C033B489'.toLowerCase(), {
  from: Address.fromString('0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// RAMP / USD
chainlinkPriceFeedLookupTable.set('0x4EA6Ec4C1691C62623122B213572b2be5A618C0d'.toLowerCase(), {
  from: Address.fromString('0x33D0568941C0C64ff7e0FB4fbA0B11BD37deEd9f'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// RARI / ETH
chainlinkPriceFeedLookupTable.set('0x2a784368b1D492f458Bf919389F42c18315765F5'.toLowerCase(), {
  from: Address.fromString('0xFca59Cd816aB1eaD66534D82bc21E7515cE441CF'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// RCN / BTC
chainlinkPriceFeedLookupTable.set('0xEa0b3DCa635f4a4E77D9654C5c18836EE771566e'.toLowerCase(), {
  from: Address.fromString('0xF970b8E36e23F7fC3FD752EeA86f8Be8D83375A6'),
  to: Address.fromString('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// REN / ETH
chainlinkPriceFeedLookupTable.set('0x3147D7203354Dc06D9fd350c7a2437bcA92387a4'.toLowerCase(), {
  from: Address.fromString('0x408e41876cCCDC0F92210600ef50372656052a38'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// REN / USD
chainlinkPriceFeedLookupTable.set('0x0f59666EDE214281e956cb3b2D0d69415AfF4A01'.toLowerCase(), {
  from: Address.fromString('0x408e41876cCCDC0F92210600ef50372656052a38'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// REP / ETH
chainlinkPriceFeedLookupTable.set('0xD4CE430C3b67b3E2F7026D86E7128588629e2455'.toLowerCase(), {
  from: Address.fromString('0x221657776846890989a759BA2973e427DfF5C9bB'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// REP / USD
chainlinkPriceFeedLookupTable.set('0xF9FCC6E1186Acf6529B1c1949453f51B4B6eEE67'.toLowerCase(), {
  from: Address.fromString('0x221657776846890989a759BA2973e427DfF5C9bB'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// RGT / ETH
chainlinkPriceFeedLookupTable.set('0xc16935B445F4BDC172e408433c8f7101bbBbE368'.toLowerCase(), {
  from: Address.fromString('0xD291E7a03283640FDc51b121aC401383A46cC623'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// RLC / ETH
chainlinkPriceFeedLookupTable.set('0x4cba1e1fdc738D0fe8DB3ee07728E2Bc4DA676c6'.toLowerCase(), {
  from: Address.fromString('0x607F4C5BB672230e8672085532f7e901544a7375'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(9),
  toDecimals: BigInt.fromU32(18),
})

// RUNE / ETH
chainlinkPriceFeedLookupTable.set('0x875D60C44cfbC38BaA4Eb2dDB76A767dEB91b97e'.toLowerCase(), {
  from: Address.fromString('0x3155BA85D5F96b2d030a4966AF206230e46849cb'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// RUNE / USD
chainlinkPriceFeedLookupTable.set('0x48731cF7e84dc94C5f84577882c14Be11a5B7456'.toLowerCase(), {
  from: Address.fromString('0x3155BA85D5F96b2d030a4966AF206230e46849cb'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// SAND / USD
chainlinkPriceFeedLookupTable.set('0x35E3f7E558C04cE7eEE1629258EcbbA03B36Ec56'.toLowerCase(), {
  from: Address.fromString('0x3845badAde8e6dFF049820680d1F14bD3903a5d0'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// SFI / ETH
chainlinkPriceFeedLookupTable.set('0xeA286b2584F79Cd4D322Fe107d9683971c890596'.toLowerCase(), {
  from: Address.fromString('0xb753428af26E81097e7fD17f40c88aaA3E04902c'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// SNX / ETH
chainlinkPriceFeedLookupTable.set('0x79291A9d692Df95334B1a0B3B4AE6bC606782f8c'.toLowerCase(), {
  from: Address.fromString('0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// SNX / USD
chainlinkPriceFeedLookupTable.set('0xDC3EA94CD0AC27d9A86C180091e7f78C683d3699'.toLowerCase(), {
  from: Address.fromString('0x476c5E26a75bd202a9683ffD34359C0CC15be0fF'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// SRM / ETH
chainlinkPriceFeedLookupTable.set('0x050c048c9a0CD0e76f166E2539F87ef2acCEC58f'.toLowerCase(), {
  from: Address.fromString('0x476c5E26a75bd202a9683ffD34359C0CC15be0fF'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(6),
  toDecimals: BigInt.fromU32(18),
})

// STAKE / ETH
chainlinkPriceFeedLookupTable.set('0xa1FFC11Eaa62d34C3B3272270AEcF9D879773B32'.toLowerCase(), {
  from: Address.fromString('0x0Ae055097C6d159879521C384F1D2123D1f195e6'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// STMX / USD
chainlinkPriceFeedLookupTable.set('0x00a773bD2cE922F866BB43ab876009fb959d7C29'.toLowerCase(), {
  from: Address.fromString('0xbE9375C6a420D2eEB258962efB95551A5b722803'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// SUSD / ETH
chainlinkPriceFeedLookupTable.set('0x8e0b7e6062272B5eF4524250bFFF8e5Bd3497757'.toLowerCase(), {
  from: Address.fromString('0x57Ab1ec28D129707052df4dF418D58a2D46d5f51'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// SUSHI / ETH
chainlinkPriceFeedLookupTable.set('0xe572CeF69f43c2E488b33924AF04BDacE19079cf'.toLowerCase(), {
  from: Address.fromString('0x6B3595068778DD592e39A122f4f5a5cF09C90fE2'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})
// SWAP / ETH
chainlinkPriceFeedLookupTable.set('0xffa4Bb3a24B60C0262DBAaD60d77a3c3fa6173e8'.toLowerCase(), {
  from: Address.fromString('0xCC4304A31d09258b0029eA7FE63d032f52e44EFe'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// SXP / USD
chainlinkPriceFeedLookupTable.set('0xFb0CfD6c19e25DB4a08D8a204a387cEa48Cc138f'.toLowerCase(), {
  from: Address.fromString('0x8CE9137d39326AD0cD6491fb5CC0CbA0e089b6A9'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// TOMO / USD
chainlinkPriceFeedLookupTable.set('0x3d44925a8E9F9DFd90390E58e92Ec16c996A331b'.toLowerCase(), {
  from: Address.fromString('0x05D3606d5c81EB9b7B18530995eC9B29da05FaBa'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// // TRIBE / ETH
// '0x84a24deCA415Acc0c395872a9e6a63E27D6225c8': {
//   from: '0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B',
//   to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
//   decimals: 18,
//   fromDecimals: 18,
//   toDecimals: 18,
// },

// TRU / USD
chainlinkPriceFeedLookupTable.set('0x26929b85fE284EeAB939831002e1928183a10fb1'.toLowerCase(), {
  from: Address.fromString('0x4C19596f5aAfF459fA38B0f7eD92F11AE6543784'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(8),
  toDecimals: BigInt.fromU32(8),
})

// TRX / USD
chainlinkPriceFeedLookupTable.set('0xacD0D1A29759CC01E8D925371B72cb2b5610EA25'.toLowerCase(), {
  from: Address.fromString('0xE1Be5D3f34e89dE342Ee97E6e90D405884dA6c67'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(6),
  toDecimals: BigInt.fromU32(8),
})

// TRY / USD
chainlinkPriceFeedLookupTable.set('0xB09fC5fD3f11Cf9eb5E1C5Dba43114e3C9f477b5'.toLowerCase(), {
  from: Address.fromString('0xc12eCeE46ed65D970EE5C899FCC7AE133AfF9b03'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// TUSD / ETH
chainlinkPriceFeedLookupTable.set('0x3886BA987236181D98F2401c507Fb8BeA7871dF2'.toLowerCase(), {
  from: Address.fromString('0x0000000000085d4780B73119b644AE5ecd22b376'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// UMA / ETH
chainlinkPriceFeedLookupTable.set('0xf817B69EA583CAFF291E287CaE00Ea329d22765C'.toLowerCase(), {
  from: Address.fromString('0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// UNI / ETH
chainlinkPriceFeedLookupTable.set('0xD6aA3D25116d8dA79Ea0246c4826EB951872e02e'.toLowerCase(), {
  from: Address.fromString('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// UNI / USD
chainlinkPriceFeedLookupTable.set('0x553303d460EE0afB37EdFf9bE42922D8FF63220e'.toLowerCase(), {
  from: Address.fromString('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// USDC / ETH
chainlinkPriceFeedLookupTable.set('0x986b5E1e1755e3C2440e960477f25201B0a8bbD4'.toLowerCase(), {
  from: Address.fromString('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(6),
  toDecimals: BigInt.fromU32(18),
})

// USDC / USD
chainlinkPriceFeedLookupTable.set('0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6'.toLowerCase(), {
  from: Address.fromString('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(6),
  toDecimals: BigInt.fromU32(8),
})

// USDCK / USD
chainlinkPriceFeedLookupTable.set('0xfAC81Ea9Dd29D8E9b212acd6edBEb6dE38Cb43Af'.toLowerCase(), {
  from: Address.fromString('0x1c48f86ae57291F7686349F12601910BD8D470bb'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// USDN / USD
chainlinkPriceFeedLookupTable.set('0x7a8544894F7FD0C69cFcBE2b4b2E277B0b9a4355'.toLowerCase(), {
  from: Address.fromString('0x674C6Ad92Fd080e4004b2312b45f796a192D27a0'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// USDT / ETH
chainlinkPriceFeedLookupTable.set('0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46'.toLowerCase(), {
  from: Address.fromString('0xdAC17F958D2ee523a2206206994597C13D831ec7'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(6),
  toDecimals: BigInt.fromU32(18),
})

// USDT / USD
chainlinkPriceFeedLookupTable.set('0x3E7d1eAB13ad0104d2750B8863b489D65364e32D'.toLowerCase(), {
  from: Address.fromString('0xdAC17F958D2ee523a2206206994597C13D831ec7'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(6),
  toDecimals: BigInt.fromU32(8),
})

// // UST / ETH
// '0xa20623070413d42a5C01Db2c8111640DD7A5A03a': {
//   from: '0xa47c8bf37f92aBed4A126BDA807A7b7498661acD',
//   to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
//   decimals: 18,
//   fromDecimals: 18,
//   toDecimals: 18,
// },

// VSP / ETH
chainlinkPriceFeedLookupTable.set('0x99cd3337Aa0da455845d7aFE7781341fDAE4D2EF'.toLowerCase(), {
  from: Address.fromString('0x1b40183EFB4Dd766f11bDa7A7c3AD8982e998421'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// // WAVES / USD
// '0x9a79fdCd0E326dF6Fa34EA13c05d3106610798E9': {
//   from: '0x1cF4592ebfFd730c7dc92c1bdFFDfc3B9EfCf29a',
//   to: '0x0000000000000000000000000000000000000001',
//   decimals: 8,
//   fromDecimals: 18,
//   toDecimals: 8,
// },

// // WNXM / ETH
// '0xe5Dc0A609Ab8bCF15d3f35cFaa1Ff40f521173Ea': {
//   from: '0x0d438F3b5175Bebc262bF23753C1E53d03432bDE',
//   to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
//   decimals: 18,
//   fromDecimals: 18,
//   toDecimals: 18,
// },

// // WOM / ETH
// '0xcEBD2026d3C99F2a7CE028acf372C154aB4638a9': {
//   from: '0xBd356a39BFf2cAda8E9248532DD879147221Cf76',
//   to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
//   decimals: 18,
//   fromDecimals: 18,
//   toDecimals: 18,
// },

// // WOO / ETH
// '0x926a93B44a887076eDd00257E5D42fafea313363': {
//   from: '0x4691937a7508860F876c9c0a2a617E7d9E945D4B',
//   to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
//   decimals: 18,
//   fromDecimals: 18,
//   toDecimals: 18,
// },

// // XMR / USD
// '0xFA66458Cce7Dd15D8650015c4fce4D278271618F': {
//   from: '0x465e07d6028830124BE2E4aA551fBe12805dB0f5',
//   to: '0x0000000000000000000000000000000000000001',
//   decimals: 8,
//   fromDecimals: 18,
//   toDecimals: 8,
// },

// // XRP / USD
// '0xCed2660c6Dd1Ffd856A5A82C67f3482d88C50b12': {
//   from: '0xa2B0fDe6D710e201d0d608e924A484d1A5fEd57c',
//   to: '0x0000000000000000000000000000000000000001',
//   decimals: 8,
//   fromDecimals: 18,
//   toDecimals: 8,
// },

// YFI / ETH
chainlinkPriceFeedLookupTable.set('0x7c5d4F8345e66f68099581Db340cd65B078C41f4'.toLowerCase(), {
  from: Address.fromString('0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// YFI / USD
chainlinkPriceFeedLookupTable.set('0xA027702dbb89fbd58938e4324ac03B58d812b0E1'.toLowerCase(), {
  from: Address.fromString('0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// YFII / ETH
chainlinkPriceFeedLookupTable.set('0xaaB2f6b45B28E962B3aCd1ee4fC88aEdDf557756'.toLowerCase(), {
  from: Address.fromString('0xa1d0E215a23d7030842FC67cE582a6aFa3CCaB83'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// ZEC / USD
chainlinkPriceFeedLookupTable.set('0xd54B033D48d0475f19c5fccf7484E8A981848501'.toLowerCase(), {
  from: Address.fromString('0x1C5db575E2Ff833E46a2E9864C22F4B22E0B37C2'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(8),
  toDecimals: BigInt.fromU32(8),
})

// ZRX / ETH
chainlinkPriceFeedLookupTable.set('0x2Da4983a622a8498bb1a21FaE9D8F6C664939962'.toLowerCase(), {
  from: Address.fromString('0xE41d2489571d322189246DaFA5ebDe1F4699F498'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// ZRX / USD
chainlinkPriceFeedLookupTable.set('0x2885d15b8Af22648b98B122b22FDF4D2a56c6023'.toLowerCase(), {
  from: Address.fromString('0xE41d2489571d322189246DaFA5ebDe1F4699F498'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// sCEX / USD
chainlinkPriceFeedLookupTable.set('0x283D433435cFCAbf00263beEF6A362b7cc5ed9f2'.toLowerCase(), {
  from: Address.fromString('0xeABACD844A196D7Faf3CE596edeBF9900341B420'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// sDEFI / USD
chainlinkPriceFeedLookupTable.set('0xa8E875F94138B0C5b51d1e1d5dE35bbDdd28EA87'.toLowerCase(), {
  from: Address.fromString('0xe1aFe1Fd76Fd88f78cBf599ea1846231B8bA3B6B'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// SUSD / USD
chainlinkPriceFeedLookupTable.set('0xad35Bd71b9aFE6e4bDc266B345c198eaDEf9Ad94'.toLowerCase(), {
  from: Address.fromString('0x57Ab1ec28D129707052df4dF418D58a2D46d5f51'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// XSUSHI / ETH (Not Chainlink)
chainlinkPriceFeedLookupTable.set('0xAE51d1f913eDB0f80562F270017806f3e9566029'.toLowerCase(), {
  from: Address.fromString('0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

// AMZN / USD
chainlinkPriceFeedLookupTable.set('0x8994115d287207144236c13Be5E2bDbf6357D9Fd'.toLowerCase(), {
  from: Address.fromString('0x0cae9e4d663793c2a2A0b211c1Cf4bBca2B9cAa7'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// GOOGL / USD
chainlinkPriceFeedLookupTable.set('0x36D39936BeA501755921beB5A382a88179070219'.toLowerCase(), {
  from: Address.fromString('0x59A921Db27Dd6d4d974745B7FfC5c33932653442'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// MSFT / USD
chainlinkPriceFeedLookupTable.set('0x021Fb44bfeafA0999C7b07C4791cf4B859C3b431'.toLowerCase(), {
  from: Address.fromString('0x41BbEDd7286dAab5910a1f15d12CBda839852BD7'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// NFLX / USD
chainlinkPriceFeedLookupTable.set('0x67C2e69c5272B94AF3C90683a9947C39Dc605ddE'.toLowerCase(), {
  from: Address.fromString('0xC8d674114bac90148d11D3C1d33C61835a0F9DCD'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// TSLA / USD
chainlinkPriceFeedLookupTable.set('0x1ceDaaB50936881B3e449e47e40A2cDAF5576A4a'.toLowerCase(), {
  from: Address.fromString('0x21cA39943E91d704678F5D00b6616650F066fD63'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// FB / USD
chainlinkPriceFeedLookupTable.set('0xCe1051646393087e706288C1B57Fd26446657A7f'.toLowerCase(), {
  from: Address.fromString('0x0e99cC0535BB6251F6679Fa6E65d6d3b430e840B'),
  to: Address.fromString('0x0000000000000000000000000000000000000001'),
  decimals: BigInt.fromU32(8),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(8),
})

// wOHM / ETH (Not Chainlink)
chainlinkPriceFeedLookupTable.set('0x95655B72D76370e3daE5f60768F2B96AC62ec568'.toLowerCase(), {
  from: Address.fromString('0xCa76543Cf381ebBB277bE79574059e32108e3E65'),
  to: Address.fromString('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: BigInt.fromU32(18),
  fromDecimals: BigInt.fromU32(18),
  toDecimals: BigInt.fromU32(18),
})

export function validateChainlinkOracleData(
  asset: Token,
  collateral: Token,
  decodedOracleData: ethereum.Tuple
): boolean {
  const oracleMultiply = decodedOracleData[0].toAddress()
  const oracleDivide = decodedOracleData[1].toAddress()
  const oracleDecimals = decodedOracleData[2].toBigInt()

  let decimals = BigInt.fromU32(54)
  let from: Bytes | null = null
  let to: Bytes | null = null

  if (oracleMultiply.notEqual(ADDRESS_ZERO)) {
    if (!chainlinkPriceFeedLookupTable.isSet(oracleMultiply.toHex())) {
      log.warning('One of the Chainlink oracles used is not configured in this UI. {}', [oracleMultiply.toHex()])
      return false
    } else {
      const multiplyFeed = chainlinkPriceFeedLookupTable.mustGet(oracleMultiply.toHex())
      decimals = decimals.minus(BigInt.fromU32(18).minus(multiplyFeed.decimals))
      from = multiplyFeed.from
      to = multiplyFeed.to
    }
  }
  if (oracleDivide.notEqual(ADDRESS_ZERO)) {
    if (!chainlinkPriceFeedLookupTable.isSet(oracleDivide.toHex())) {
      log.warning('One of the Chainlink oracles used is not configured in this UI. {}', [oracleDivide.toHex()])
      return false
    } else {
      const divideFeed = chainlinkPriceFeedLookupTable.mustGet(oracleDivide.toHex())
      decimals = decimals.minus(divideFeed.decimals)
      if (to === null) {
        from = divideFeed.to
        to = divideFeed.from
      } else if (to.equals(divideFeed.to)) {
        to = divideFeed.from
      } else {
        log.warning(
          "The Chainlink oracles used don't match up with eachother. If 2 oracles are used, they should have a common token, such as WBTC/ETH and LINK/ETH, where ETH is the common link.",
          []
        )
        return false
      }
    }
  }
  if (from && from.toHex() == asset.id && to && to.toHex() == collateral.id) {
    const needed = collateral.decimals.plus(BigInt.fromU32(18)).minus(asset.decimals)
    const divider = BigInt.fromU32(10).pow(decimals.minus(needed).toU32() as u8)
    if (divider.notEqual(oracleDecimals)) {
      log.warning(
        'The divider parameter {} is misconfigured for this oracle {}, which leads to rates that are order(s) of magnitude.',
        [divider.toString(), oracleDecimals.toString()]
      )
      return false
    } else {
      return true
    }
  } else {
    log.warning("The Chainlink oracles configured don't match the pair tokens.", [])
    return false
  }
}

export function createKashiPair(event: LogDeploy): KashiPair {
  const pairContract = KashiPairContract.bind(event.params.cloneAddress)

  const bentoBox = getOrCreateBentoBox()

  const master = getOrCreateMasterContract(event.params.masterContract)

  const asset = getOrCreateToken(pairContract.asset().toHex())

  const collateral = getOrCreateToken(pairContract.collateral().toHex())

  const accrueInfo = createKashiPairAccrueInfo(event.params.cloneAddress)

  const totalAsset = createRebase(event.params.cloneAddress.toHex().concat('-').concat('asset'))
  const totalBorrow = createRebase(event.params.cloneAddress.toHex().concat('-').concat('borrow'))

  //  const decoded = ethereum.decode('(address,address,uint256,bool)', deployParams.deployData)!.toTuple()
  // return defaultAbiCoder.encode(['address', 'address', 'uint256'], [multiply, divide, e10(decimals)])

  // const decoded = ethereum.decode('(address,address,address,bytes)', event.params.data)!.toTuple()
  // const oracleData = ethereum.decode('(address,address,uint256)', decoded[3].toBytes())!.toTuple()

  // const assetPrice = getTokenPrice(asset.id)
  // const collateralPrice = getTokenPrice(collateral.id)

  const oracleData = pairContract.oracleData()

  const decodedOracleData = ethereum.decode('(address,address,uint256)', oracleData)!.toTuple()

  const oracleValidated = validateChainlinkOracleData(asset, collateral, decodedOracleData)

  const pair = new KashiPair(event.params.cloneAddress.toHex())
  pair.bentoBox = bentoBox.id
  pair.masterContract = master.id
  pair.feeTo = pairContract.feeTo()
  pair.collateral = collateral.id
  pair.asset = asset.id

  pair.oracle = pairContract.oracle()
  pair.oracleData = oracleData
  pair.oracleMultiply = decodedOracleData[0].toAddress()
  pair.oracleDivide = decodedOracleData[1].toAddress()
  pair.oracleDecimals = decodedOracleData[2].toBigInt()
  pair.oracleValidated = oracleValidated

  pair.totalCollateralShare = pairContract.totalCollateralShare()
  pair.totalAsset = totalAsset.id
  pair.totalBorrow = totalBorrow.id
  pair.exchangeRate = pairContract.exchangeRate()
  pair.accrueInfo = accrueInfo.id
  pair.name = pairContract.name()
  pair.symbol = pairContract.symbol()
  pair.decimals = BigInt.fromU32(pairContract.decimals())
  pair.totalSupply = pairContract.totalSupply()

  pair.borrowAPR = BigInt.fromU32(0)
  pair.supplyAPR = STARTING_INTEREST_PER_YEAR
  pair.utilization = BigInt.fromU32(0)
  pair.totalFeesEarnedFraction = BigInt.fromU32(0)

  // AccrueInfo flat
  pair.interestPerSecond = accrueInfo.interestPerSecond
  pair.feesEarnedFraction = accrueInfo.feesEarnedFraction
  pair.lastAccrued = accrueInfo.lastAccrued

  // Total Asset flat
  pair.totalAssetBase = totalAsset.base
  pair.totalAssetElastic = totalAsset.elastic

  // Total Borrow flat
  pair.totalBorrowBase = totalBorrow.base
  pair.totalBorrowElastic = totalBorrow.elastic

  pair.block = event.block.number
  pair.timestamp = event.block.timestamp

  pair.depreciated = DEPRECIATED_ADDRESSES.includes(event.params.masterContract.toHex())

  pair.save()

  return pair as KashiPair
}

export function getKashiPair(address: Address, block: ethereum.Block): KashiPair {
  const id = address.toHex()
  let pair = KashiPair.load(id) as KashiPair

  pair.block = block.number
  pair.timestamp = block.timestamp
  pair.save()

  return pair as KashiPair
}
