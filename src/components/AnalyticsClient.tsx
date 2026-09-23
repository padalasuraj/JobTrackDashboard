"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AnalyticsClient() {
  const [data, setData] = useState<Record<string, never> | null>(null);
  useEffect(() => { fetch("/api/analytics").then((r) => r.json()).then(setData); }, []);
  if (!data) return <div className="panel">Loading analytics...</div>;
  return (
    <div className="grid">
      <div className="topbar"><h1>Analytics</h1></div>
      <div className="grid cards"><div className="card"><span className="muted">Total</span><div className="stat">{data.total}</div></div><div className="card"><span className="muted">Interview conversion</span><div className="stat">{data.interviewConversion}%</div></div><div className="card"><span className="muted">Offers</span><div className="stat">{data.offers}</div></div><div className="card"><span className="muted">Rejected</span><div className="stat">{data.rejected}</div></div></div>
      <section className="panel" style={{ height: 320 }}><h2>Status distribution</h2><ResponsiveContainer><PieChart><Pie data={data.byStatus} dataKey="value" nameKey="name" fill="#3dd6b4" label /><Tooltip /></PieChart></ResponsiveContainer></section>
      <section className="panel" style={{ height: 320 }}><h2>Applications by month</h2><ResponsiveContainer><BarChart data={data.byMonth}><CartesianGrid stroke="#223047" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="value" fill="#7c9cff" /></BarChart></ResponsiveContainer></section>
      <section className="panel" style={{ height: 320 }}><h2>Applications by company</h2><ResponsiveContainer><BarChart data={data.byCompany}><CartesianGrid stroke="#223047" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#3dd6b4" /></BarChart></ResponsiveContainer></section>
    </div>
  );
}
