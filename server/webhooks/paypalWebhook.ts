import { Request, Response } from 'express';
import { paypalService } from '../services/paypalService';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { payoutBatches, transactionLedger } from '@shared/schema';

// PayPal webhook handler
export async function handlePayPalWebhook(req: Request, res: Response) {
  try {
    // PayPal sends webhooks as JSON with event type
    const webhookData = req.body;
    
    if (!webhookData || !webhookData.event_type) {
      console.error('[PayPal Webhook] Invalid webhook data');
      return res.status(400).json({ message: 'Invalid webhook data' });
    }

    console.log(`[PayPal Webhook] Received event: ${webhookData.event_type}`);

    // Handle different webhook events
    switch (webhookData.event_type) {
      case 'PAYMENT.PAYOUTS-BATCH.SUCCESS':
        await handlePayoutSuccess(webhookData);
        break;
        
      case 'PAYMENT.PAYOUTS-BATCH.DENIED':
      case 'PAYMENT.PAYOUTS-BATCH.FAILED':
        await handlePayoutFailed(webhookData);
        break;
        
      case 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED':
        await handlePayoutItemSuccess(webhookData);
        break;
        
      case 'PAYMENT.PAYOUTS-ITEM.FAILED':
      case 'PAYMENT.PAYOUTS-ITEM.UNCLAIMED':
      case 'PAYMENT.PAYOUTS-ITEM.RETURNED':
      case 'PAYMENT.PAYOUTS-ITEM.BLOCKED':
        await handlePayoutItemFailed(webhookData);
        break;
        
      default:
        console.log(`[PayPal Webhook] Unhandled event type: ${webhookData.event_type}`);
    }

    // Always respond with 200 OK to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[PayPal Webhook] Error processing webhook:', error);
    // Still return 200 to prevent PayPal from retrying
    res.status(200).json({ received: true, error: error.message });
  }
}

// Handle successful batch payout
async function handlePayoutSuccess(webhookData: any) {
  try {
    const resource = webhookData.resource;
    if (!resource || !resource.batch_header) {
      console.error('[PayPal Webhook] Missing batch header in success event');
      return;
    }

    const paypalBatchId = resource.batch_header.payout_batch_id;
    const batchStatus = resource.batch_header.batch_status;
    
    console.log(`[PayPal Webhook] Batch ${paypalBatchId} succeeded`);

    // Find our batch record
    const [batch] = await db
      .select()
      .from(payoutBatches)
      .where(eq(payoutBatches.paypalBatchId, paypalBatchId));

    if (!batch) {
      console.error(`[PayPal Webhook] Batch not found: ${paypalBatchId}`);
      return;
    }

    // Update batch status to completed
    await db
      .update(payoutBatches)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payoutBatches.id, batch.id));

    // Update related payout transactions to completed
    await db
      .update(transactionLedger)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(transactionLedger.payoutBatchId, batch.id));

    console.log(`[PayPal Webhook] Batch ${paypalBatchId} marked as completed`);
  } catch (error: any) {
    console.error('[PayPal Webhook] Error handling payout success:', error);
  }
}

// Handle failed batch payout
async function handlePayoutFailed(webhookData: any) {
  try {
    const resource = webhookData.resource;
    if (!resource || !resource.batch_header) {
      console.error('[PayPal Webhook] Missing batch header in failed event');
      return;
    }

    const paypalBatchId = resource.batch_header.payout_batch_id;
    const batchStatus = resource.batch_header.batch_status;
    
    console.log(`[PayPal Webhook] Batch ${paypalBatchId} failed with status: ${batchStatus}`);

    // Find our batch record
    const [batch] = await db
      .select()
      .from(payoutBatches)
      .where(eq(payoutBatches.paypalBatchId, paypalBatchId));

    if (!batch) {
      console.error(`[PayPal Webhook] Batch not found: ${paypalBatchId}`);
      return;
    }

    // Update batch status to failed
    await db
      .update(payoutBatches)
      .set({
        status: 'failed',
        errorLog: [`PayPal batch failed: ${batchStatus}`],
        updatedAt: new Date(),
      })
      .where(eq(payoutBatches.id, batch.id));

    // Update related payout transactions to failed
    await db
      .update(transactionLedger)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(transactionLedger.payoutBatchId, batch.id));

    console.log(`[PayPal Webhook] Batch ${paypalBatchId} marked as failed`);
  } catch (error: any) {
    console.error('[PayPal Webhook] Error handling payout failure:', error);
  }
}

// Handle successful individual payout item
async function handlePayoutItemSuccess(webhookData: any) {
  try {
    const resource = webhookData.resource;
    if (!resource) {
      console.error('[PayPal Webhook] Missing resource in item success event');
      return;
    }

    const payoutItemId = resource.payout_item_id;
    const paypalBatchId = resource.payout_batch_id;
    const transactionStatus = resource.transaction_status;
    
    console.log(`[PayPal Webhook] Payout item ${payoutItemId} succeeded in batch ${paypalBatchId}`);

    // Update the specific transaction if we can identify it
    // This would require storing the payout_item_id in our transaction ledger
    // For now, we rely on batch-level updates
  } catch (error: any) {
    console.error('[PayPal Webhook] Error handling item success:', error);
  }
}

// Handle failed individual payout item
async function handlePayoutItemFailed(webhookData: any) {
  try {
    const resource = webhookData.resource;
    if (!resource) {
      console.error('[PayPal Webhook] Missing resource in item failed event');
      return;
    }

    const payoutItemId = resource.payout_item_id;
    const paypalBatchId = resource.payout_batch_id;
    const transactionStatus = resource.transaction_status;
    
    console.log(`[PayPal Webhook] Payout item ${payoutItemId} failed in batch ${paypalBatchId}: ${transactionStatus}`);

    // Find our batch record
    const [batch] = await db
      .select()
      .from(payoutBatches)
      .where(eq(payoutBatches.paypalBatchId, paypalBatchId));

    if (!batch) {
      console.error(`[PayPal Webhook] Batch not found: ${paypalBatchId}`);
      return;
    }

    // Increment failed payout count
    await db
      .update(payoutBatches)
      .set({
        failedPayouts: (batch.failedPayouts || 0) + 1,
        status: 'partial', // Mark as partial since some items failed
        updatedAt: new Date(),
      })
      .where(eq(payoutBatches.id, batch.id));

    console.log(`[PayPal Webhook] Item failure recorded for batch ${paypalBatchId}`);
  } catch (error: any) {
    console.error('[PayPal Webhook] Error handling item failure:', error);
  }
}