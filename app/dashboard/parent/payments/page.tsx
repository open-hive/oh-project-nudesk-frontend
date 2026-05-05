"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, CreditCard, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { parentApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import type { ParentTransaction, ChildSummary } from "@/lib/types";

const STATUS_VARIANT: Record<
  ParentTransaction["status"],
  "amber" | "green" | "red" | "neutral"
> = {
  pending: "amber",
  completed: "green",
  failed: "red",
  refunded: "neutral",
};

const TYPE_LABELS: Record<string, string> = {
  course: "Course",
  study_guide: "Study Guide",
  live_class: "Live Class",
};

export default function ParentPaymentsPage() {
  const { tokens } = useAuth();

  const [transactions, setTransactions] = useState<ParentTransaction[]>([]);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<number | "all">("all");

  const load = useCallback(async () => {
    if (!tokens) return;
    setLoading(true);
    try {
      const childId =
        selectedChildId === "all" ? undefined : selectedChildId;
      const [txData, childrenData] = await Promise.all([
        parentApi.getTransactions(tokens.access, childId),
        parentApi.getChildren(tokens.access),
      ]);
      setTransactions(txData.results ?? []);
      setChildren(childrenData);
    } finally {
      setLoading(false);
    }
  }, [tokens, selectedChildId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalSpent = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">
          Payments
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Review all purchases made for your children.
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-white border-[1.5px] border-neutral-200 rounded-[20px] p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-neutral-500">Total Spent</p>
            <p className="text-xl font-bold text-neutral-900">
              BWP{" "}
              {totalSpent.toLocaleString("en-BW", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        {/* Child filter */}
        <div className="relative">
          <select
            value={selectedChildId}
            onChange={(e) =>
              setSelectedChildId(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
            className="appearance-none pl-3.5 pr-9 py-2 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/60 cursor-pointer"
          >
            <option value="all">All Children</option>
            {children.map((c) => (
              <option key={c.child_id} value={c.child_id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white border-[1.5px] border-neutral-200 rounded-[20px] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No transactions yet.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Child
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, idx) => (
                    <tr
                      key={tx.id}
                      className={`border-b border-neutral-50 last:border-0 ${
                        idx % 2 === 0 ? "" : "bg-neutral-50/50"
                      }`}
                    >
                      <td className="px-5 py-3.5 text-neutral-600 whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[.65rem] font-bold flex-shrink-0">
                            {tx.child_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <span className="text-neutral-800 whitespace-nowrap">
                            {tx.child_name || tx.child_email}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-800 max-w-[200px]">
                        <p className="truncate">{tx.content_title}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-neutral-500">
                          {TYPE_LABELS[tx.content_type] ?? tx.content_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-neutral-900 whitespace-nowrap">
                        BWP{" "}
                        {parseFloat(tx.amount).toLocaleString("en-BW", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={STATUS_VARIANT[tx.status]}>
                          {tx.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-neutral-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-neutral-900 line-clamp-1">
                      {tx.content_title}
                    </span>
                    <Badge variant={STATUS_VARIANT[tx.status]}>
                      {tx.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      {tx.child_name || tx.child_email} ·{" "}
                      {TYPE_LABELS[tx.content_type] ?? tx.content_type}
                    </span>
                    <span className="font-semibold text-neutral-900">
                      BWP{" "}
                      {parseFloat(tx.amount).toLocaleString("en-BW", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {new Date(tx.created_at).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
