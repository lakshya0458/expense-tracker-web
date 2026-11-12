import { useEffect, useMemo, useState } from 'react'
import {
  Wallet, Plus, Trash2, Pencil, X, Search, Download, PiggyBank,
  Receipt, TrendingUp, UtensilsCrossed, Bus, ShoppingBag, Film,
  BookOpen, HeartPulse, Home, MoreHorizontal, Sparkles,
} from 'lucide-react'

const CATEGORIES = [
  { name: 'Food', icon: UtensilsCrossed, color: '#f97316' },
  { name: 'Transport', icon: Bus, color: '#0ea5e9' },
  { name: 'Shopping', icon: ShoppingBag, color: '#a855f7' },
  { name: 'Entertainment', icon: Film, color: '#ec4899' },
  { name: 'Education', icon: BookOpen, color: '#14b8a6' },
  { name: 'Health', icon: HeartPulse, color: '#ef4444' },
  { name: 'Bills & Rent', icon: Home, color: '#eab308' },
  { name: 'Other', icon: MoreHorizontal, color: '#64748b' },
]
const catInfo = (name) => CATEGORIES.find((c) => c.name === name) ?? CATEGORIES.at(-1)

const STORAGE_KEY = 'expense-tracker:v1'
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const thisMonth = () => today().slice(0, 7)
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const money = (n) => inr.format(n || 0)

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { expenses: parsed.expenses ?? [], budget: parsed.budget ?? 0 }
    }
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return { expenses: [], budget: 0 }
}

function sampleExpenses() {
  const m = thisMonth()
  const rows = [
    ['Mess extras', 180, 'Food', '02'], ['Auto to station', 120, 'Transport', '03'],
    ['Data structures book', 650, 'Education', '05'], ['Movie night', 300, 'Entertainment', '07'],
    ['Groceries', 540, 'Food', '09'], ['Phone recharge', 299, 'Bills & Rent', '10'],
    ['Hoodie', 899, 'Shopping', '11'], ['Pharmacy', 160, 'Health', '12'],
  ]
  return rows.map(([title, amount, category, d], i) => ({
    id: crypto.randomUUID?.() ?? String(Date.now() + i), title, amount, category, date: `${m}-${d}`,
  }))
}

const emptyForm = () => ({ title: '', amount: '', category: 'Food', date: today() })

export default function App() {
  const [{ expenses, budget }, setData] = useState(loadState)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [month, setMonth] = useState(thisMonth)
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ expenses, budget }))
    } catch {
      /* ignore: data just won't persist */
    }
  }, [expenses, budget])

  const setExpenses = (fn) => setData((d) => ({ ...d, expenses: fn(d.expenses) }))
  const setBudget = (b) => setData((d) => ({ ...d, budget: b }))

  const monthExpenses = useMemo(
    () => expenses.filter((e) => !month || e.date.startsWith(month)),
    [expenses, month],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return monthExpenses
      .filter((e) => category === 'All' || e.category === category)
      .filter((e) => !q || e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  }, [monthExpenses, category, query])

  const total = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const byCategory = CATEGORIES.map((c) => ({
    ...c, total: monthExpenses.filter((e) => e.category === c.name).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total)
  const top = byCategory[0]
  const budgetLeft = budget - total
  const budgetPct = budget > 0 ? Math.min(100, (total / budget) * 100) : 0

  const grouped = useMemo(() => {
    const map = new Map()
    visible.forEach((e) => map.set(e.date, [...(map.get(e.date) ?? []), e]))
    return [...map.entries()]
  }, [visible])

  function submit(ev) {
    ev.preventDefault()
    const amount = Number(form.amount)
    if (!form.title.trim()) return setError('Give the expense a name.')
    if (!amount || amount <= 0) return setError('Enter an amount greater than 0.')
    if (!form.date) return setError('Pick a date.')
    const entry = { ...form, title: form.title.trim(), amount: Math.round(amount * 100) / 100 }
    if (editingId) {
      setExpenses((list) => list.map((e) => (e.id === editingId ? { ...entry, id: editingId } : e)))
    } else {
      setExpenses((list) => [...list, { ...entry, id: crypto.randomUUID?.() ?? String(Date.now()) }])
    }
    setError('')
    setEditingId(null)
    setForm(emptyForm())
  }

  function startEdit(e) {
    setEditingId(e.id)
    setForm({ title: e.title, amount: String(e.amount), category: e.category, date: e.date })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm())
    setError('')
  }

  function remove(id) {
    setExpenses((list) => list.filter((e) => e.id !== id))
    if (editingId === id) cancelEdit()
  }

  function exportCsv() {
    const header = 'Date,Title,Category,Amount\n'
    const body = visible
      .map((e) => [e.date, `"${e.title.replace(/"/g, '""')}"`, e.category, e.amount].join(','))
      .join('\n')
    const url = URL.createObjectURL(new Blob([header + body], { type: 'text/csv' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `expenses-${month || 'all'}.csv` })
    a.click()
    URL.revokeObjectURL(url)
  }

  const monthLabel = month
    ? new Date(`${month}-01T00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'All time'

  return (
    <div className="min-h-screen">
      <header className="bg-teal-800 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><Wallet size={22} /></div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Expense Tracker</h1>
              <p className="text-sm text-teal-100">Know where your money goes</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-teal-100">Month</span>
            <input
              type="month" value={month} onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border-0 bg-white/15 px-3 py-1.5 text-white outline-none [color-scheme:dark]"
            />
            {month && (
              <button onClick={() => setMonth('')} className="rounded-lg px-2 py-1.5 text-teal-100 hover:bg-white/10">All time</button>
            )}
          </label>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[360px_1fr]">
        {/* Left column */}
        <div className="space-y-6">
          <form onSubmit={submit} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{editingId ? 'Edit expense' : 'Add expense'}</h2>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
                  <X size={15} /> Cancel
                </button>
              )}
            </div>
            <div className="space-y-3">
              <Field label="What for?">
                <input
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Canteen lunch" className="input"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (₹)">
                  <input
                    type="number" inputMode="decimal" min="0" step="0.01" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" className="input"
                  />
                </Field>
                <Field label="Date">
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
                </Field>
              </div>
              <Field label="Category">
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(({ name, icon: Icon, color }) => {
                    const active = form.category === name
                    return (
                      <button
                        key={name} type="button" onClick={() => setForm({ ...form, category: name })}
                        className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[11px] transition ${active ? 'border-transparent text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                        style={active ? { background: color } : undefined}
                        title={name}
                      >
                        <Icon size={17} />
                        <span className="w-full truncate text-center">{name.split(' ')[0]}</span>
                      </button>
                    )
                  })}
                </div>
              </Field>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 py-2.5 font-medium text-white hover:bg-teal-800">
              {editingId ? <><Pencil size={16} /> Save changes</> : <><Plus size={18} /> Add expense</>}
            </button>
          </form>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><PiggyBank size={18} className="text-teal-700" /> Monthly budget</h2>
            <input
              type="number" min="0" step="100" value={budget || ''} placeholder="Set a budget, e.g. 5000"
              onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))} className="input"
            />
            {budget > 0 && (
              <div className="mt-4">
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${budgetPct >= 100 ? 'bg-red-500' : budgetPct >= 80 ? 'bg-amber-500' : 'bg-teal-600'}`}
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
                <p className={`mt-2 text-sm ${budgetLeft < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                  {budgetLeft >= 0
                    ? <>{money(budgetLeft)} left of {money(budget)}</>
                    : <>{money(-budgetLeft)} over budget</>}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-semibold">Where it went</h2>
            {byCategory.length === 0 ? (
              <p className="text-sm text-slate-500">No spending in {monthLabel} yet.</p>
            ) : (
              <ul className="space-y-3">
                {byCategory.map(({ name, color, total: t, icon: Icon }) => (
                  <li key={name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><Icon size={15} style={{ color }} /> {name}</span>
                      <span className="font-medium tabular-nums">{money(t)} <span className="text-slate-400">· {Math.round((t / total) * 100)}%</span></span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${(t / total) * 100}%`, background: color }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat icon={Wallet} label={`Spent · ${monthLabel}`} value={money(total)} />
            <Stat icon={Receipt} label="Transactions" value={monthExpenses.length} />
            <Stat icon={TrendingUp} label="Top category" value={top ? top.name : '—'} sub={top ? money(top.total) : ''} />
          </div>

          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
              <div className="flex min-w-48 flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
                <Search size={16} className="text-slate-400" />
                <input
                  value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search expenses"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input !w-auto">
                <option>All</option>
                {CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}
              </select>
              <button
                onClick={exportCsv} disabled={!visible.length}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-40"
              >
                <Download size={15} /> CSV
              </button>
            </div>

            {expenses.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <Wallet className="mx-auto mb-3 text-slate-300" size={40} />
                <p className="font-medium">No expenses yet</p>
                <p className="mt-1 text-sm text-slate-500">Add your first one on the left, or try it with some sample data.</p>
                <button
                  onClick={() => setExpenses(() => sampleExpenses())}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800 hover:bg-teal-100"
                >
                  <Sparkles size={15} /> Load sample data
                </button>
              </div>
            ) : grouped.length === 0 ? (
              <p className="px-6 py-14 text-center text-sm text-slate-500">Nothing matches these filters.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {grouped.map(([date, items]) => (
                  <div key={date}>
                    <div className="flex justify-between bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <span>{new Date(`${date}T00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                      <span className="tabular-nums">{money(items.reduce((s, e) => s + e.amount, 0))}</span>
                    </div>
                    <ul>
                      {items.map((e) => {
                        const { icon: Icon, color } = catInfo(e.category)
                        return (
                          <li key={e.id} className={`group flex items-center gap-3 px-4 py-3 ${editingId === e.id ? 'bg-teal-50' : ''}`}>
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: `${color}1f`, color }}>
                              <Icon size={17} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{e.title}</p>
                              <p className="text-xs text-slate-500">{e.category}</p>
                            </div>
                            <span className="font-semibold tabular-nums">{money(e.amount)}</span>
                            <div className="flex gap-1 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                              <button onClick={() => startEdit(e)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Edit">
                                <Pencil size={15} />
                              </button>
                              <button onClick={() => remove(e.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="pb-8 text-center text-xs text-slate-400">Your data stays in this browser (localStorage).</footer>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-2 text-xs text-slate-500"><Icon size={15} /> <span className="truncate">{label}</span></div>
      <p className="mt-2 truncate text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  )
}
