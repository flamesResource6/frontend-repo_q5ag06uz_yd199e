import { useEffect, useMemo, useState } from 'react'

function StatusPill({ value = 'applied' }) {
  const map = {
    applied: { bg: 'bg-blue-100', text: 'text-blue-700' },
    interviewing: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    offer: { bg: 'bg-green-100', text: 'text-green-700' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700' },
    ghosted: { bg: 'bg-gray-100', text: 'text-gray-700' },
    saved: { bg: 'bg-purple-100', text: 'text-purple-700' },
  }
  const s = map[value] || map.applied
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {value}
    </span>
  )
}

const defaultForm = {
  company: '',
  position: '',
  location: '',
  job_link: '',
  source: '',
  status: 'applied',
  applied_date: '',
  follow_up_date: '',
  salary_min: '',
  salary_max: '',
  contact_name: '',
  contact_email: '',
  resume_version: '',
  priority: 'medium',
  tags: '', // comma separated for UI
  notes: '',
}

function App() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(defaultForm)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const statuses = ['applied', 'interviewing', 'offer', 'rejected', 'ghosted', 'saved']

  const fetchItems = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (query) params.set('q', query)
      const res = await fetch(`${baseUrl}/api/applications?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setItems(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        ...form,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        tags: form.tags
          ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        applied_date: form.applied_date || null,
        follow_up_date: form.follow_up_date || null,
      }
      const res = await fetch(`${baseUrl}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || 'Failed to save')
      }
      const created = await res.json()
      setItems((prev) => [created, ...prev])
      setForm(defaultForm)
    } catch (e) {
      setError(e.message)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${baseUrl}/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)))
    } catch (e) {
      setError(e.message)
    }
  }

  const removeItem = async (id) => {
    try {
      const res = await fetch(`${baseUrl}/api/applications/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete')
      setItems((prev) => prev.filter((it) => it.id !== id))
    } catch (e) {
      setError(e.message)
    }
  }

  const filteredCount = useMemo(() => items.length, [items])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50">
      <header className="px-6 py-5 bg-white/70 backdrop-blur border-b border-indigo-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Job Application Tracker</h1>
          <a href="/test" className="text-sm text-indigo-600 hover:text-indigo-800">Check backend</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Form */}
        <section className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add a new application</h2>
          {error && (
            <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Company</label>
              <input className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-200" required value={form.company} onChange={(e)=>setForm({...form, company:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Position</label>
              <input className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-200" required value={form.position} onChange={(e)=>setForm({...form, position:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Location</label>
              <input className="w-full border rounded-md p-2" value={form.location} onChange={(e)=>setForm({...form, location:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Job Link</label>
              <input className="w-full border rounded-md p-2" value={form.job_link} onChange={(e)=>setForm({...form, job_link:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Source</label>
              <input className="w-full border rounded-md p-2" value={form.source} onChange={(e)=>setForm({...form, source:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Status</label>
              <select className="w-full border rounded-md p-2" value={form.status} onChange={(e)=>setForm({...form, status:e.target.value})}>
                {statuses.map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Applied Date</label>
              <input type="date" className="w-full border rounded-md p-2" value={form.applied_date} onChange={(e)=>setForm({...form, applied_date:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Follow-up Date</label>
              <input type="date" className="w-full border rounded-md p-2" value={form.follow_up_date} onChange={(e)=>setForm({...form, follow_up_date:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Salary Min</label>
              <input type="number" min="0" className="w-full border rounded-md p-2" value={form.salary_min} onChange={(e)=>setForm({...form, salary_min:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Salary Max</label>
              <input type="number" min="0" className="w-full border rounded-md p-2" value={form.salary_max} onChange={(e)=>setForm({...form, salary_max:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Contact Name</label>
              <input className="w-full border rounded-md p-2" value={form.contact_name} onChange={(e)=>setForm({...form, contact_name:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Contact Email</label>
              <input className="w-full border rounded-md p-2" value={form.contact_email} onChange={(e)=>setForm({...form, contact_email:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Resume Version</label>
              <input className="w-full border rounded-md p-2" value={form.resume_version} onChange={(e)=>setForm({...form, resume_version:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Priority</label>
              <select className="w-full border rounded-md p-2" value={form.priority} onChange={(e)=>setForm({...form, priority:e.target.value})}>
                {['low','medium','high','urgent'].map(p=> <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Tags (comma separated)</label>
              <input className="w-full border rounded-md p-2" value={form.tags} onChange={(e)=>setForm({...form, tags:e.target.value})} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm text-gray-700 mb-1">Notes</label>
              <textarea rows={3} className="w-full border rounded-md p-2" value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3">
              <button type="button" onClick={()=>setForm(defaultForm)} className="px-4 py-2 rounded border text-gray-700 bg-white hover:bg-gray-50">Clear</button>
              <button type="submit" className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white">Add Application</button>
            </div>
          </form>
        </section>

        {/* Filters */}
        <section className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1">
            <input placeholder="Search company, position, notes, tags..." className="w-full border rounded-md p-2" value={query} onChange={(e)=>setQuery(e.target.value)} />
          </div>
          <select className="border rounded-md p-2" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {statuses.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={fetchItems} className="px-4 py-2 rounded bg-white border hover:bg-gray-50">Apply</button>
        </section>

        {/* List */}
        <section className="bg-white rounded-xl shadow-sm border border-indigo-100">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="text-sm text-gray-600">Showing {filteredCount} applications</div>
            {loading && <div className="text-sm text-gray-500">Loading...</div>}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {items.map((it)=> (
                  <tr key={it.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">{it.company}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[260px]">
                        {it.job_link ? (<a className="text-indigo-600 hover:underline" href={it.job_link} target="_blank" rel="noreferrer">Job link</a>) : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-gray-800">{it.position}</div>
                      <div className="text-xs text-gray-500">{it.location || '—'}</div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <StatusPill value={it.status} />
                        <select className="border rounded px-2 py-1 text-xs" value={it.status} onChange={(e)=>updateStatus(it.id, e.target.value)}>
                          {statuses.map(s=> <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">{it.applied_date || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {Array.isArray(it.tags) && it.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {it.tags.map((t, idx)=> (
                            <span key={idx} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">{t}</span>
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={()=>removeItem(it.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">No applications yet. Add your first one above.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
