import { Request, Response } from 'express';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { marketplaceOrders, transactionLedger } from '@shared/schema';
import { paymentService } from '../services/paymentService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-10-28.acacia',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    return res.status(400).send('No signature');
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body, // Raw body
      sig,
      endpointSecret
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Log the event
  console.log('Stripe webhook received:', event.type);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer);
        break;

      case 'transfer.failed':
        await handleTransferFailed(event.data.object as Stripe.Transfer);
        break;

      case 'payout.paid':
        await handlePayoutPaid(event.data.object as Stripe.Payout);
        break;

      case 'payout.failed':
        await handlePayoutFailed(event.data.object as Stripe.Payout);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Return 200 to acknowledge receipt even if processing fails
    // This prevents Stripe from retrying
    res.json({ received: true, error: 'Processing failed' });
  }
}

// Handle successful payment
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  
  if (!orderId) {
    console.error('No orderId in payment intent metadata');
    return;
  }

  // Process order completion
  const result = await paymentService.processOrderCompletion(orderId, paymentIntent.id);
  
  if (!result.success) {
    console.error('Failed to process order completion:', result.error);
  } else {
    console.log('Order processed successfully:', orderId);
  }
}

// Handle failed payment
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  
  if (!orderId) {
    return;
  }

  // Update order status to failed
  await db
    .update(marketplaceOrders)
    .set({ status: 'failed' })
    .where(eq(marketplaceOrders.id, orderId));

  console.log('Order marked as failed:', orderId);
}

// Handle transfer creation
async function handleTransferCreated(transfer: Stripe.Transfer) {
  const orderId = transfer.metadata?.orderId;
  
  if (!orderId) {
    return;
  }

  // Update transaction ledger with transfer status
  await db
    .update(transactionLedger)
    .set({
      stripeTransferId: transfer.id,
      status: 'processing',
      processedAt: new Date(),
    })
    .where(eq(transactionLedger.orderId, orderId));

  console.log('Transfer created for order:', orderId);
}

// Handle transfer failure
async function handleTransferFailed(transfer: Stripe.Transfer) {
  const orderId = transfer.metadata?.orderId;
  
  if (!orderId) {
    return;
  }

  // Update transaction ledger with failure
  await db
    .update(transactionLedger)
    .set({
      status: 'failed',
      failureReason: 'Transfer failed',
    })
    .where(
      and(
        eq(transactionLedger.orderId, orderId),
        eq(transactionLedger.stripeTransferId, transfer.id)
      )
    );

  console.log('Transfer failed for order:', orderId);
}

// Handle payout completion
async function handlePayoutPaid(payout: Stripe.Payout) {
  // Update transaction ledger for completed payout
  await db
    .update(transactionLedger)
    .set({
      status: 'completed',
      completedAt: new Date(),
    })
    .where(eq(transactionLedger.stripePayoutId, payout.id));

  console.log('Payout completed:', payout.id);
}

// Handle payout failure
async function handlePayoutFailed(payout: Stripe.Payout) {
  // Update transaction ledger for failed payout
  await db
    .update(transactionLedger)
    .set({
      status: 'failed',
      failureReason: payout.failure_message || 'Payout failed',
    })
    .where(eq(transactionLedger.stripePayoutId, payout.id));

  console.log('Payout failed:', payout.id);
}

// Handle refunds
async function handleChargeRefunded(charge: Stripe.Charge) {
  const orderId = charge.metadata?.orderId;
  
  if (!orderId || !charge.refunded) {
    return;
  }

  // Check if refund already processed
  const [existingRefund] = await db
    .select()
    .from(transactionLedger)
    .where(
      and(
        eq(transactionLedger.orderId, orderId),
        eq(transactionLedger.type, 'refund')
      )
    );

  if (existingRefund) {
    return; // Already processed
  }

  // Process the refund
  await paymentService.processRefund(
    orderId,
    charge.amount_refunded,
    'Refund processed via Stripe'
  );

  console.log('Refund processed for order:', orderId);
}

// Handle Stripe Connect account updates
import { sellerProfiles } from '@shared/schema';
import { and } from 'drizzle-orm';

async function handleAccountUpdated(account: Stripe.Account) {
  // Update seller profile onboarding status
  const onboardingStatus = account.charges_enabled && account.payouts_enabled
    ? 'completed'
    : account.details_submitted
    ? 'pending'
    : 'not_started';

  await db
    .update(sellerProfiles)
    .set({
      onboardingStatus,
      updatedAt: new Date(),
    })
    .where(eq(sellerProfiles.stripeAccountId, account.id));

  console.log('Account updated:', account.id, 'Status:', onboardingStatus);
}