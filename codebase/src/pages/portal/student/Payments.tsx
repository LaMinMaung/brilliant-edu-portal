import React, { useState } from "react";
import { DollarSign, CreditCard, Clock, CheckCircle, Download } from "lucide-react";
import PortalLayout from "../../../components/PortalLayout";
import pb from "../../../lib/pocketbase";

interface Payment {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  paymentDate?: string;
  semester: string;
}

const StudentPayments: React.FC = () => {
  const [payments] = useState<Payment[]>([
    {
      id: "1",
      description: "Tuition Fee - Fall 2024",
      amount: 1500,
      dueDate: "2024-09-15",
      status: "paid",
      paymentDate: "2024-09-10",
      semester: "Fall 2024",
    },
    {
      id: "2",
      description: "Registration Fee - Fall 2024",
      amount: 100,
      dueDate: "2024-09-01",
      status: "paid",
      paymentDate: "2024-08-28",
      semester: "Fall 2024",
    },
    {
      id: "3",
      description: "Tuition Fee - Spring 2025",
      amount: 1500,
      dueDate: "2025-01-15",
      status: "pending",
      semester: "Spring 2025",
    },
    {
      id: "4",
      description: "Laboratory Fee - Spring 2025",
      amount: 200,
      dueDate: "2025-01-20",
      status: "pending",
      semester: "Spring 2025",
    },
  ]);

  const statusStyles: Record<string, { bg: string; icon: JSX.Element }> = {
    paid: {
      bg: "bg-green-100 text-green-800 border-green-300",
      icon: <CheckCircle size={16} />,
    },
    pending: {
      bg: "bg-yellow-100 text-yellow-800 border-yellow-300",
      icon: <Clock size={16} />,
    },
    overdue: {
      bg: "bg-red-100 text-red-800 border-red-300",
      icon: <Clock size={16} />,
    },
  };

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments
    .filter((p) => p.status === "overdue")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <PortalLayout role="student">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="font-heading font-bold text-2xl text-primary mb-2">
            Payments & Billing
          </h2>
          <p className="text-text-muted">View your payment history and upcoming dues</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="border border-border rounded-lg p-6 bg-surface">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-md bg-green-100 text-green-600 flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
              <span className="text-xs text-text-muted">Paid</span>
            </div>
            <p className="font-heading font-bold text-2xl text-primary">
              ${totalPaid.toFixed(2)}
            </p>
          </div>

          <div className="border border-border rounded-lg p-6 bg-surface">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-md bg-yellow-100 text-yellow-600 flex items-center justify-center">
                <Clock size={24} />
              </div>
              <span className="text-xs text-text-muted">Pending</span>
            </div>
            <p className="font-heading font-bold text-2xl text-primary">
              ${totalPending.toFixed(2)}
            </p>
          </div>

          <div className="border border-border rounded-lg p-6 bg-surface">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-md bg-red-100 text-red-600 flex items-center justify-center">
                <DollarSign size={24} />
              </div>
              <span className="text-xs text-text-muted">Overdue</span>
            </div>
            <p className="font-heading font-bold text-2xl text-primary">
              ${totalOverdue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Payment History */}
        <div className="border border-border rounded-lg bg-surface mb-6">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-heading font-semibold text-lg text-primary">
              Payment History
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="text-left px-6 py-3 font-semibold text-sm">Description</th>
                  <th className="text-left px-6 py-3 font-semibold text-sm">Semester</th>
                  <th className="text-center px-6 py-3 font-semibold text-sm">Amount</th>
                  <th className="text-center px-6 py-3 font-semibold text-sm">
                    Due Date
                  </th>
                  <th className="text-center px-6 py-3 font-semibold text-sm">Status</th>
                  <th className="text-center px-6 py-3 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-border last:border-0 hover:bg-bg transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-primary">{payment.description}</p>
                      {payment.paymentDate && (
                        <p className="text-xs text-text-muted mt-1">
                          Paid on: {new Date(payment.paymentDate).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {payment.semester}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-lg text-primary">
                        ${payment.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-text-muted">
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          statusStyles[payment.status].bg
                        }`}
                      >
                        {statusStyles[payment.status].icon}
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {payment.status === "paid" ? (
                        <button className="p-2 text-secondary hover:text-primary transition-colors">
                          <Download size={16} />
                        </button>
                      ) : (
                        <button className="px-4 py-2 bg-accent hover:bg-accent-light text-primary text-sm font-semibold rounded-md transition-colors">
                          Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Method */}
        <div className="border border-border rounded-lg bg-surface p-6">
          <h3 className="font-heading font-semibold text-lg text-primary mb-4">
            Payment Method
          </h3>
          <div className="flex items-center gap-4 p-4 bg-bg border border-border rounded-md">
            <div className="w-12 h-12 rounded-md bg-sky/10 text-sky flex items-center justify-center">
              <CreditCard size={24} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-primary">Visa •••• 4242</p>
              <p className="text-sm text-text-muted">Expires 12/2025</p>
            </div>
            <button className="px-4 py-2 border border-border text-text-muted hover:border-primary hover:text-primary rounded-md text-sm font-medium transition-colors">
              Update
            </button>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default StudentPayments;