import { createAdminClient } from "@/lib/supabase/admin";
import { sendWinnerNotificationEmail } from "@/lib/email";
import { AuctionBankAccount } from "@/lib/database.types";

export type WinnerNotificationRow = {
  bidder_id: string;
  bidder_email: string | null;
  bidder_name: string;
  public_alias: string;
  item_id: string;
  lot_number: string;
  item_name: string;
  last_price: number;
};

export type WinnerEmailRecipient = {
  email: string;
  name: string;
  alias: string;
  items: {
    lotNumber: string;
    itemName: string;
    price: number;
  }[];
};

export function groupWinnerNotifications(
  rows: WinnerNotificationRow[]
): WinnerEmailRecipient[] {
  const map = new Map<string, WinnerEmailRecipient>();

  for (const row of rows) {
    const email = row.bidder_email?.trim().toLowerCase();
    if (!email) continue;

    const item = {
      lotNumber: row.lot_number,
      itemName: row.item_name,
      price: Number(row.last_price),
    };

    const existing = map.get(row.bidder_id);
    if (existing) {
      existing.items.push(item);
      continue;
    }

    map.set(row.bidder_id, {
      email,
      name: row.bidder_name,
      alias: row.public_alias,
      items: [item],
    });
  }

  return Array.from(map.values());
}

export type SendWinnerEmailsResult = {
  sent: number;
  skippedNoEmail: number;
  totalWinners: number;
  alreadySent: boolean;
};

export async function sendWinnerEmailsForPeriod(
  periodId: string,
  options?: { force?: boolean }
): Promise<SendWinnerEmailsResult> {
  const admin = createAdminClient();

  const { data: period, error: periodError } = await admin
    .from("auction_periods")
    .select("id, code, title, status, winner_emails_sent_at, company_id")
    .eq("id", periodId)
    .maybeSingle();

  if (periodError || !period) {
    throw new Error("Periode tidak ditemukan");
  }

  if (period.status !== "finished") {
    throw new Error("Email pemenang hanya dapat dikirim saat periode berstatus Finished");
  }

  if (period.winner_emails_sent_at && !options?.force) {
    return {
      sent: 0,
      skippedNoEmail: 0,
      totalWinners: 0,
      alreadySent: true,
    };
  }

  const { data: rows, error: rowsError } = await admin.rpc(
    "get_period_winner_notifications",
    { p_period_id: periodId }
  );

  if (rowsError) {
    throw new Error(rowsError.message);
  }

  const recipients = groupWinnerNotifications(rows ?? []);

  const uniqueBiddersWithoutEmail = new Set(
    (rows ?? []).filter((row) => !row.bidder_email).map((row) => row.bidder_id)
  ).size;

  const { data: bankAccounts } = await admin
    .from("auction_bank_accounts")
    .select("*")
    .eq("company_id", period.company_id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const activeAccounts = (bankAccounts ?? []) as AuctionBankAccount[];

  let sent = 0;
  for (const recipient of recipients) {
    const totalAmount = recipient.items.reduce((sum, item) => sum + item.price, 0);
    await sendWinnerNotificationEmail({
      to: recipient.email,
      recipientName: recipient.name,
      periodCode: period.code,
      periodTitle: period.title,
      items: recipient.items,
      totalAmount,
      bankAccounts: activeAccounts.map((account) => ({
        accountNumber: account.account_number,
        accountHolder: account.account_holder,
        notes: account.notes,
      })),
    });
    sent += 1;
  }

  if (sent > 0 || recipients.length === 0) {
    await admin
      .from("auction_periods")
      .update({ winner_emails_sent_at: new Date().toISOString() })
      .eq("id", periodId);
  }

  return {
    sent,
    skippedNoEmail: uniqueBiddersWithoutEmail,
    totalWinners: recipients.length,
    alreadySent: false,
  };
}
