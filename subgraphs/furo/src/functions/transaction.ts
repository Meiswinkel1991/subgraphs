import { BigInt, ethereum } from '@graphprotocol/graph-ts'
import {
  CancelVesting as CancelVestingEvent,
  CreateVesting as CreateVestingEvent,
  Withdraw as WithdrawVestingEvent
} from '../../generated/FuroVesting/FuroVesting'
import {
  CancelStream as CancelStreamEvent,
  CreateStream as CreateStreamEvent,
  UpdateStream as UpdateStreamEvent,
  Withdraw as WithdrawStreamEvent
} from '../../generated/FuroStream/FuroStream'
import { Stream, Transaction, Vesting } from '../../generated/schema'
import { DEPOSIT, DISBURSEMENT, EXTEND, WITHDRAWAL } from '../constants'
import { increaseTransactionCount } from './global'
import { getOrCreateUser } from './user'

// function getOrCreateTransaction(id: string, event: ethereum.Event): Transaction {
//   let transaction = Transaction.load(id)

//   if (transaction === null) {
//     transaction = new Transaction(id)
//     transaction.save()
//   }

//   return transaction as Transaction
// }

export function createStreamTransaction<T extends ethereum.Event>(stream: Stream, event: T): void {
  if (event instanceof CreateStreamEvent) {
    const id = stream.id.concat(':tx:').concat(stream.transactionCount.toString())
    let transaction = new Transaction(id)
    transaction.type = DEPOSIT
    transaction.stream = stream.id
    transaction.amount = event.params.amount
    transaction.to = event.params.recipient.toHex()
    transaction.token = event.params.token.toHex()
    transaction.toBentoBox = event.params.fromBentoBox
    transaction.createdAtBlock = event.block.number
    transaction.createdAtTimestamp = event.block.timestamp
    transaction.txHash = event.transaction.hash.toHex()
    transaction.save()
    increaseTransactionCount()

    stream.transactionCount = stream.transactionCount.plus(BigInt.fromU32(1))
    stream.save()
  } else if (event instanceof CancelStreamEvent) {
    const senderTransactionId = stream.id.concat(':tx:').concat(stream.transactionCount.toString())
    let senderTransaction = new Transaction(senderTransactionId)
    senderTransaction.type = DISBURSEMENT
    senderTransaction.stream = stream.id
    senderTransaction.amount = event.params.senderBalance
    senderTransaction.to = stream.createdBy
    senderTransaction.token = event.params.token.toHex()
    senderTransaction.toBentoBox = event.params.toBentoBox
    senderTransaction.createdAtBlock = event.block.number
    senderTransaction.createdAtTimestamp = event.block.timestamp
    senderTransaction.txHash = event.transaction.hash.toHex()
    senderTransaction.save()
    increaseTransactionCount()

    stream.transactionCount = stream.transactionCount.plus(BigInt.fromU32(1))

    const recipientTransactionId = stream.id.concat(':tx:').concat(stream.transactionCount.toString())
    let recipientTransaction = new Transaction(recipientTransactionId)
    recipientTransaction.type = DISBURSEMENT
    recipientTransaction.stream = stream.id
    recipientTransaction.amount = event.params.recipientBalance
    recipientTransaction.to = stream.recipient
    recipientTransaction.token = event.params.token.toHex()
    recipientTransaction.toBentoBox = event.params.toBentoBox
    recipientTransaction.createdAtBlock = event.block.number
    recipientTransaction.createdAtTimestamp = event.block.timestamp
    recipientTransaction.txHash = event.transaction.hash.toHex()
    recipientTransaction.save()
    increaseTransactionCount()

    stream.transactionCount = stream.transactionCount.plus(BigInt.fromU32(1))
    stream.save()
  } else if (event instanceof WithdrawStreamEvent) {
    const id = stream.id.concat(':tx:').concat(stream.transactionCount.toString())
    let recipient = getOrCreateUser(event.params.withdrawTo, event)
    let transaction = new Transaction(id)
    transaction.type = WITHDRAWAL
    transaction.stream = stream.id
    transaction.amount = event.params.sharesToWithdraw
    transaction.to = recipient.id
    transaction.token = event.params.token.toHex()
    transaction.toBentoBox = event.params.toBentoBox
    transaction.createdAtBlock = event.block.number
    transaction.createdAtTimestamp = event.block.timestamp
    transaction.txHash = event.transaction.hash.toHex()
    transaction.save()
    increaseTransactionCount()

    stream.transactionCount = stream.transactionCount.plus(BigInt.fromU32(1))
    stream.save()
  } else if (event instanceof UpdateStreamEvent) {
    const id = stream.id.concat(':tx:').concat(stream.transactionCount.toString())
    let transaction = new Transaction(id)
    transaction.type = EXTEND
    transaction.stream = stream.id
    transaction.amount = event.params.topUpAmount
    transaction.to = stream.recipient
    transaction.token = stream.token
    transaction.toBentoBox = event.params.fromBentoBox
    transaction.createdAtBlock = event.block.number
    transaction.createdAtTimestamp = event.block.timestamp
    transaction.txHash = event.transaction.hash.toHex()
    transaction.save()
    increaseTransactionCount()

    stream.transactionCount = stream.transactionCount.plus(BigInt.fromU32(1))
    stream.save()
  }
}

export function createVestingTransaction<T extends ethereum.Event>(vesting: Vesting, event: T): void {
  if (event instanceof CreateVestingEvent) {
    const id = vesting.id.concat(':tx:').concat(vesting.transactionCount.toString())
    let transaction = new Transaction(id)
    transaction.type = DEPOSIT
    transaction.vesting = vesting.id
    transaction.amount = vesting.totalAmount
    transaction.to = vesting.recipient
    transaction.token = vesting.token
    transaction.toBentoBox = true
    transaction.createdAtBlock = event.block.number
    transaction.createdAtTimestamp = event.block.timestamp
    transaction.txHash = event.transaction.hash.toHex()
    transaction.save()
    increaseTransactionCount()

    vesting.transactionCount = vesting.transactionCount.plus(BigInt.fromU32(1))
    vesting.save()
  } else if (event instanceof CancelVestingEvent) {
    const senderTransactionId = vesting.id.concat(':tx:').concat(vesting.transactionCount.toString())
    let senderTransaction = new Transaction(senderTransactionId)
    senderTransaction.type = DISBURSEMENT
    senderTransaction.vesting = vesting.id
    senderTransaction.amount = event.params.recipientAmount
    senderTransaction.to = vesting.recipient
    senderTransaction.token = vesting.token
    senderTransaction.toBentoBox = event.params.toBentoBox
    senderTransaction.createdAtBlock = event.block.number
    senderTransaction.createdAtTimestamp = event.block.timestamp
    senderTransaction.txHash = event.transaction.hash.toHex()
    senderTransaction.save()
    increaseTransactionCount()

    vesting.transactionCount = vesting.transactionCount.plus(BigInt.fromU32(1))

    const recipientTransactionId = vesting.id.concat(':tx:').concat(vesting.transactionCount.toString())
    let recipientTransaction = new Transaction(recipientTransactionId)
    recipientTransaction.type = DISBURSEMENT
    recipientTransaction.vesting = vesting.id
    recipientTransaction.amount = event.params.ownerAmount
    recipientTransaction.to = vesting.createdBy
    recipientTransaction.token = vesting.token
    recipientTransaction.toBentoBox = event.params.toBentoBox
    recipientTransaction.createdAtBlock = event.block.number
    recipientTransaction.createdAtTimestamp = event.block.timestamp
    recipientTransaction.txHash = event.transaction.hash.toHex()
    recipientTransaction.save()
    increaseTransactionCount()

    vesting.transactionCount = vesting.transactionCount.plus(BigInt.fromU32(1))
    vesting.save()
  } else if (event instanceof WithdrawVestingEvent) {
    const id = vesting.id.concat(':tx:').concat(vesting.transactionCount.toString())
    let transaction =  new Transaction(id)
    transaction.type = WITHDRAWAL
    transaction.vesting = vesting.id
    transaction.amount = event.params.amount
    transaction.to = vesting.recipient
    transaction.token = vesting.token
    transaction.toBentoBox = event.params.toBentoBox
    transaction.createdAtBlock = event.block.number
    transaction.createdAtTimestamp = event.block.timestamp
    transaction.txHash = event.transaction.hash.toHex()
    transaction.save()
    increaseTransactionCount()
    
    vesting.transactionCount = vesting.transactionCount.plus(BigInt.fromU32(1))
    vesting.save()
  }
}
