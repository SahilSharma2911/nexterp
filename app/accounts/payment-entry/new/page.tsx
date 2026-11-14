import { getAccountOptions } from "@/actions/accounts";
import { getCustomerOptions, getSupplierOptions } from "@/actions/parties";
import { getSalesInvoice } from "@/actions/sales-invoice";
import { getPurchaseInvoice } from "@/actions/purchase-invoice";
import PaymentFormClient from "../PaymentFormClient";
export const dynamic = "force-dynamic";
export default async function NewPaymentPage(props: { searchParams: Promise<{ si?: string; pi?: string }> }) {
  const [{ si, pi }, accounts, customers, suppliers] = await Promise.all([props.searchParams, getAccountOptions(), getCustomerOptions(), getSupplierOptions()]);
  const cashBank = accounts.filter((a) => a.accountType === "Cash" || a.accountType === "Bank");
  let prefill: any = undefined;
  if (si) { const inv = await getSalesInvoice(si); if (inv && inv.status === "SUBMITTED") prefill = { paymentType: "RECEIVE", customerId: inv.customerId, salesInvoiceId: inv.id, amount: inv.outstanding, partyName: inv.customer, invoiceName: inv.name }; }
  else if (pi) { const inv = await getPurchaseInvoice(pi); if (inv && inv.status === "SUBMITTED") prefill = { paymentType: "PAY", supplierId: inv.supplierId, purchaseInvoiceId: inv.id, amount: inv.outstanding, partyName: inv.supplier, invoiceName: inv.name }; }
  return <PaymentFormClient accounts={(cashBank.length ? cashBank : accounts).map((a) => ({ id: a.id, name: a.accountName }))} customers={customers.map((c) => ({ id: c.id, name: c.customerName }))} suppliers={suppliers.map((s) => ({ id: s.id, name: s.supplierName }))} prefill={prefill} />;
}
