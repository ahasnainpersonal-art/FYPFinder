import { useEffect, useState } from 'react'
import axios from 'axios'
import jsPDF from 'jspdf'

import { API_BASE } from '../config/api'

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'))
  return { headers: { Authorization: `Bearer ${user?.token}` } }
}

export default function CashFlow() {
  const [records, setRecords] = useState([])
  const [form, setForm] = useState({ type: 'credit', amount: '', description: '', month: '' })

  useEffect(() => {
    axios.get(`${API_BASE}/api/admin/cashflow`, getAuthHeader())
      .then(res => setRecords(res.data))
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    const res = await axios.post(`${API_BASE}/api/admin/cashflow`, form, getAuthHeader())
    setRecords([res.data, ...records])
    setForm({ type: 'credit', amount: '', description: '', month: '' })
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('FYPFinder — Cash Flow Statement', 20, 20)
    let y = 35
    records.forEach((r) => {
      doc.setFontSize(11)
      doc.text(`${r.month} | ${r.type.toUpperCase()} | Rs. ${r.amount} | ${r.description}`, 20, y)
      y += 10
    })
    doc.save('cashflow.pdf')
  }

  const total = records.reduce((acc, r) => r.type === 'credit' ? acc + r.amount : acc - r.amount, 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cash Flow</h1>
      <form onSubmit={handleAdd} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition flex gap-2 mb-6 flex-wrap">
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
        <input placeholder="Amount" type="number" value={form.amount}
          onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" required />
        <input placeholder="Description" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1" required />
        <input placeholder="Month (e.g. Jan 2026)" value={form.month}
          onChange={e => setForm({ ...form, month: e.target.value })}
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36" required />
        <button type="submit" className="rounded-md px-4 py-2 bg-blue-700 text-white hover:bg-blue-800">
          Add
        </button>
      </form>

      <div className="mb-4">
        {records.map((r) => (
          <div key={r._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition mb-2 flex justify-between">
            <span className="text-sm">{r.month} — {r.description}</span>
            <span className={`font-semibold text-sm ${r.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
              {r.type === 'credit' ? '+' : '-'} Rs. {r.amount}
            </span>
          </div>
        ))}
      </div>

      <p className="font-bold mb-4">Balance: Rs. {total}</p>

      <button onClick={exportPDF}
        className="rounded-md px-4 py-2 bg-gray-800 text-white hover:bg-gray-900">
        Export as PDF
      </button>
    </div>
  )
}