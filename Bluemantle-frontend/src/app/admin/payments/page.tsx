import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { DataTable } from "@/components/DataTable";
import { DollarSign, TrendingUp, AlertCircle, Clock, ShieldCheck, Download, Filter, MoreHorizontal, Activity } from "lucide-react";

export default function PaymentOverview() {
  const transactions = [
    { student: "Elena Rodriguez", amount: "$1,200.00", date: "Oct 24, 2024", id: "TX-99021", status: "Completed" },
    { student: "Julian Chen", amount: "$2,400.00", date: "Oct 23, 2024", id: "TX-99015", status: "Pending" },
    { student: "Markus Vance", amount: "$1,200.00", date: "Oct 22, 2024", id: "TX-98992", status: "Completed" },
    { student: "Sarah Jenkins", amount: "$850.00", date: "Oct 20, 2024", id: "TX-98841", status: "Failed" },
    { student: "David Miller", amount: "$3,100.00", date: "Oct 18, 2024", id: "TX-98710", status: "Completed" },
  ];

  const columns = [
    { 
      key: "student", 
      header: "Student / Transaction ID",
      render: (val: string, row: any) => (
        <div>
           <p className="font-bold text-on_surface">{val}</p>
           <p className="text-[10px] text-outline uppercase tracking-wider">{row.id}</p>
        </div>
      )
    },
    { key: "date", header: "Date" },
    { 
      key: "amount", 
      header: "Amount",
      render: (val: string) => <span className="font-bold text-on_surface">{val}</span>
    },
    { 
      key: "status", 
      header: "Status",
      render: (val: string) => (
        <span className={cn(
          "text-[10px] font-bold uppercase px-2 py-1 rounded-sm",
          val === 'Completed' ? 'bg-primary/10 text-primary' : 
          val === 'Pending' ? 'bg-secondary/10 text-secondary' : 
          'bg-error/10 text-error'
        )}>
          {val}
        </span>
      )
    },
    {
       key: "actions",
       header: "",
       render: () => <button className="p-2 hover:bg-surface_container_high rounded-full transition-colors"><MoreHorizontal className="w-4 h-4 text-outline" /></button>
    }
  ];

  return (
    <div className="space-y-8 pb-16">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Azure Academy Payment Ledger</h1>
          <p className="text-on_surface_variant">Monitoring academic tuition, enrollment fees, and fiscal health for Semester II.</p>
        </div>
        <button className="bg-primary text-on_primary px-6 py-2.5 rounded-full font-bold shadow-ambient flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </header>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KnowledgeCard className="p-6">
           <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Total Revenue</p>
           <h3 className="text-2xl font-bold font-manrope">$248,500.00</h3>
           <div className="flex items-center gap-1 text-primary text-[10px] font-bold mt-2">
              <TrendingUp className="w-3 h-3" /> 12% vs last term
           </div>
        </KnowledgeCard>
        <KnowledgeCard className="p-6">
           <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Collected tuition</p>
           <h3 className="text-2xl font-bold font-manrope text-primary">$212,400.00</h3>
        </KnowledgeCard>
        <KnowledgeCard className="p-6">
           <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Pending Approval</p>
           <h3 className="text-2xl font-bold font-manrope text-secondary">$31,200.00</h3>
        </KnowledgeCard>
        <KnowledgeCard className="p-6 border-error/20 bg-error/5">
           <p className="text-[10px] font-bold text-error uppercase tracking-wider mb-1">Overdue Invoices</p>
           <h3 className="text-2xl font-bold font-manrope text-error">$4,900.00</h3>
        </KnowledgeCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ledger */}
        <div className="lg:col-span-2">
           <KnowledgeCard>
              <CardHeader className="flex justify-between items-center border-b border-outline_variant/10 pb-6 mb-0">
                 <CardTitle>Recent Transactions</CardTitle>
                 <div className="flex gap-2">
                    <button className="p-2 border border-outline_variant/30 rounded-lg hover:bg-surface_container_high transition-colors">
                       <Filter className="w-4 h-4 text-on_surface_variant" />
                    </button>
                 </div>
              </CardHeader>
              <CardBody className="p-0">
                 <DataTable columns={columns} data={transactions} />
                 <div className="p-6 flex justify-center border-t border-outline_variant/10">
                    <p className="text-xs text-on_surface_variant font-medium">Showing 5 of 124 transactions</p>
                 </div>
              </CardBody>
           </KnowledgeCard>
        </div>

        {/* Security & Activity */}
        <div className="space-y-6">
           <KnowledgeCard className="bg-surface_container_low border-primary/10">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" /> Revenue Forecast
                 </CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                 <div className="w-full h-32 bg-surface_container_lowest rounded-xl border border-outline_variant/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-outline text-center px-4">Fiscal projection data loading...</span>
                 </div>
              </CardBody>
           </KnowledgeCard>

           <KnowledgeCard>
              <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-secondary" /> Security Log
                 </CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                 {[
                   { title: "Automatic Backup Success", time: "2 hours ago", icon: Clock },
                   { title: "New Admin: L. Foster", time: "Yesterday at 14:30", icon: AlertCircle },
                   { title: "API Key Rotation Pending", time: "Scheduled for Sunday", icon: DollarSign },
                 ].map((log, i) => (
                   <div key={i} className="flex gap-4 items-start p-3 bg-surface_container_low rounded-xl border border-transparent hover:border-outline_variant/30 transition-all cursor-default">
                      <div className="p-2 rounded-lg bg-surface_container_highest text-outline">
                         <log.icon className="w-4 h-4" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-on_surface">{log.title}</p>
                         <p className="text-[10px] text-on_surface_variant font-medium">{log.time}</p>
                      </div>
                   </div>
                 ))}
              </CardBody>
           </KnowledgeCard>
        </div>
      </div>
    </div>
  );
}
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
