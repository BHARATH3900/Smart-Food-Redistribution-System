import React, { useState, useEffect } from 'react';
import { Users, Utensils, Sparkles, Heart, Truck, BarChart3, Plus, Trash2, CheckCircle, LogOut, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function App() {
  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('chef@ecoharvest.org');
  const [loginPassword, setLoginPassword] = useState('123');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('demand');
  const [guestCount, setGuestCount] = useState(450);
  const [mealType, setMealType] = useState('Lunch');
  const [aiPrediction, setAiPrediction] = useState({ predicted_food_needed_kg: 171, recommended_prep_kg: 185 });

  const [inventory, setInventory] = useState([]);
  const [surplus, setSurplus] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', category: 'Produce', quantity: 10, unit: 'kg', expiry_date: '2026-09-30', status: 'Fresh' });

  // Load Inventory & Surplus from Backend Database on start/login
  useEffect(() => {
    if (user) {
      fetchInventory();
      fetchSurplus();
    }
  }, [user]);

  // Recalculate AI Demand prediction via Backend API
  useEffect(() => {
    fetch('/api/predict-demand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guest_count: guestCount, meal_type: mealType }),
    })
      .then(res => res.json())
      .then(data => setAiPrediction(data))
      .catch(err => console.error('Demand API error:', err));
  }, [guestCount, mealType]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Invalid credentials');
        return res.json();
      })
      .then(data => {
        setUser(data.user);
        if (data.user.role === 'NGO Coordinator') setActiveTab('surplus');
        else if (data.user.role === 'Delivery Staff') setActiveTab('route');
        else setActiveTab('demand');
      })
      .catch(err => setLoginError(err.message));
  };

  const fetchInventory = () => {
    fetch('/api/inventory')
      .then(res => res.json())
      .then(data => setInventory(data));
  };

  const fetchSurplus = () => {
    fetch('/api/surplus')
      .then(res => res.json())
      .then(data => setSurplus(data));
  };

  const addInventoryItem = (e) => {
    e.preventDefault();
    fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    })
      .then(res => res.json())
      .then(() => {
        fetchInventory();
        setNewItem({ name: '', category: 'Produce', quantity: 10, unit: 'kg', expiry_date: '2026-09-30', status: 'Fresh' });
      });
  };

  const deleteInventoryItem = (id) => {
    fetch(`/api/inventory/${id}`, { method: 'DELETE' })
      .then(() => fetchInventory());
  };

  const claimSurplusItem = (id) => {
    fetch(`/api/surplus/${id}/claim`, { method: 'POST' })
      .then(() => fetchSurplus());
  };

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold text-2xl flex items-center justify-center mx-auto border border-emerald-500/30">
              🌱
            </div>
            <h1 className="text-2xl font-bold text-white">EcoHarvest AI</h1>
            <p className="text-xs text-slate-400">Role-Based Access Control Portal</p>
          </div>

          {loginError && <div className="bg-rose-500/20 border border-rose-500 text-rose-300 text-xs p-3 rounded-xl text-center">{loginError}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Select Demo User Account</label>
              <select
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              >
                <option value="chef@ecoharvest.org">Dharnish (Kitchen Manager)</option>
                <option value="ngo@ecoharvest.org">Giri (NGO Coordinator)</option>
                <option value="driver@ecoharvest.org">Akash (Delivery Staff)</option>
                <option value="admin@ecoharvest.org">Bharath (System Admin)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                required
              />
            </div>

            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition">
              Authenticate & Login
            </button>
          </form>

          <div className="text-[11px] text-slate-500 text-center border-t border-slate-800 pt-4">
            Password for all demo accounts: <code className="text-emerald-400">123</code>
          </div>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD (Authenticated)
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-900 text-slate-100">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30">
            🌱
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">EcoHarvest AI</h1>
            <p className="text-xs text-slate-400">Authenticated Portal • {user.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs font-bold text-white block">{user.name}</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">{user.role}</span>
          </div>
          <button onClick={() => setUser(null)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 bg-slate-800/40 border-r border-slate-700 p-4 flex flex-col gap-2">
          {[
            { id: 'demand', label: 'AI Demand Forecast', icon: Sparkles, roles: ['Kitchen Manager', 'Admin'] },
            { id: 'inventory', label: 'Inventory & Expiry', icon: Utensils, roles: ['Kitchen Manager', 'Admin'] },
            { id: 'surplus', label: 'Surplus & NGO Match', icon: Heart, roles: ['Kitchen Manager', 'NGO Coordinator', 'Admin'] },
            { id: 'route', label: 'Delivery Route', icon: Truck, roles: ['Delivery Staff', 'Admin'] },
            { id: 'analytics', label: 'Waste Analytics', icon: BarChart3, roles: ['Admin', 'Kitchen Manager'] },
          ].map(tab => {
            const Icon = tab.icon;
            const isAllowed = tab.roles.includes(user.role);
            return (
              <button
                key={tab.id}
                disabled={!isAllowed}
                onClick={() => isAllowed && setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isAllowed
                    ? 'text-slate-400 hover:bg-slate-800'
                    : 'text-slate-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{tab.label}</span>
                {!isAllowed && <Lock className="w-3 h-3 text-slate-600" />}
              </button>
            );
          })}
        </aside>

        <main className="flex-1 p-6 bg-slate-950">
          {activeTab === 'demand' && (
            <div className="space-y-6 max-w-4xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-emerald-400" /> AI Food Demand Forecast Engine
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-4">
                  <h3 className="font-semibold text-slate-200 text-sm uppercase">Input Parameters</h3>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Meal Service Type</label>
                    <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Expected Guests: <span className="text-emerald-400 font-bold">{guestCount}</span></label>
                    <input type="range" min="50" max="1200" step="10" value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} className="w-full accent-emerald-500" />
                  </div>
                </div>

                <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase text-emerald-400">FastAPI Live Calculation</span>
                    <div className="text-4xl font-extrabold text-white mt-2">{aiPrediction.predicted_food_needed_kg} <span className="text-lg text-emerald-400">kg</span></div>
                    <p className="text-xs text-slate-300 mt-1">Returned directly from backend `/api/predict-demand`.</p>
                  </div>
                  <div className="pt-4 border-t border-emerald-500/20">
                    <span className="text-xs text-slate-400">Recommended Prep Buffer: </span>
                    <span className="text-sm font-bold text-emerald-300">{aiPrediction.recommended_prep_kg} kg</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6 max-w-4xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Utensils className="w-6 h-6 text-emerald-400" /> Kitchen Inventory (Database Linked)
              </h2>

              <form onSubmit={addInventoryItem} className="bg-slate-800/40 border border-slate-700 p-4 rounded-2xl grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
                <div>
                  <label className="text-xs text-slate-400">Item Name</label>
                  <input type="text" placeholder="e.g. Potatoes" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white" required />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Category</label>
                  <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
                    <option>Produce</option><option>Grains</option><option>Dairy</option><option>Meat</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Quantity</label>
                  <input type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white" required />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Expiry Date</label>
                  <input type="date" value={newItem.expiry_date} onChange={e => setNewItem({...newItem, expiry_date: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white" required />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Status</label>
                  <select value={newItem.status} onChange={e => setNewItem({...newItem, status: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
                    <option>Fresh</option><option>Expiring Soon</option><option>Critical</option>
                  </select>
                </div>
                <button type="submit" className="bg-emerald-500 text-slate-950 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1">
                  <Plus className="w-4 h-4" /> Save to DB
                </button>
              </form>

              <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-400 uppercase border-b border-slate-700">
                    <tr>
                      <th className="p-3">Item</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Expiry Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Delete from DB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {inventory.map(item => (
                      <tr key={item.id}>
                        <td className="p-3 font-semibold text-white">{item.name}</td>
                        <td className="p-3 text-slate-300">{item.category}</td>
                        <td className="p-3 text-slate-300">{item.quantity} {item.unit}</td>
                        <td className="p-3 text-slate-300">{item.expiry_date}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Fresh' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => deleteInventoryItem(item.id)} className="text-rose-400 hover:text-rose-300 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'surplus' && (
            <div className="space-y-6 max-w-4xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Heart className="w-6 h-6 text-emerald-400" /> Surplus Food NGO Matching (Backend Linked)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {surplus.map(item => (
                  <div key={item.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-white">{item.food_title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>{item.status}</span>
                    </div>
                    <p className="text-xs text-slate-400">Matched NGO: <span className="text-emerald-400 font-semibold">{item.matched_ngo}</span> ({item.distance_km} km)</p>
                    {item.status === 'Available' ? (
                      <button onClick={() => claimSurplusItem(item.id)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs">
                        Claim Food (Update Database)
                      </button>
                    ) : (
                      <button disabled className="w-full bg-slate-800 text-slate-500 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Claimed in Database
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'route' && (
            <div className="space-y-6 max-w-4xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Truck className="w-6 h-6 text-emerald-400" /> Delivery Route Optimization
              </h2>
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">1</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">Pickup: Central Kitchen</h4>
                    <p className="text-[11px] text-slate-400">25kg Biryani</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">2</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">Dropoff: Hope Feeding Center</h4>
                    <p className="text-[11px] text-slate-400">2.4 km away</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6 max-w-4xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-emerald-400" /> Waste Analytics Dashboard
              </h2>
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { day: 'Mon', prepared: 210, consumed: 195, waste: 15 },
                    { day: 'Tue', prepared: 240, consumed: 228, waste: 12 },
                    { day: 'Wed', prepared: 200, consumed: 192, waste: 8 },
                    { day: 'Thu', prepared: 280, consumed: 260, waste: 20 },
                    { day: 'Fri', prepared: 310, consumed: 298, waste: 12 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="day" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Bar dataKey="prepared" fill="#3b82f6" name="Prepared (kg)" />
                    <Bar dataKey="consumed" fill="#10b981" name="Consumed (kg)" />
                    <Bar dataKey="waste" fill="#f43f5e" name="Waste (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}