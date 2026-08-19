'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const TECHNICIANS = [{"id":"617fa439-da3a-49c6-9467-a21a3ad035d7","name":"Aarav Sharma"},{"id":"f895a6dc-afe0-4e4e-afe2-faad4904e49f","name":"Vivaan Patel"},{"id":"a00b5e4c-d48c-4764-b518-81f6142c756e","name":"Aditya Singh"},{"id":"68c75f35-9821-4532-8a78-91e0232b5f5a","name":"Vihaan Kumar"},{"id":"a2e99e14-2131-48a0-90e5-8bebc49d79e3","name":"Arjun Gupta"},{"id":"cc3fb04e-0b46-4842-8f7f-dd3f653cf6a6","name":"Sai Reddy"},{"id":"b2dd93a0-497f-4163-8340-d5ddb78fb607","name":"Ananya Desai"},{"id":"37b41c4b-4992-41d2-a075-159bad527317","name":"Diya Joshi"},{"id":"13065762-f520-49cd-a811-86b92c9586aa","name":"Isha Mehta"},{"id":"9c9e3b6c-aa7f-4d82-947e-72f54cda57dc","name":"Riya Verma"}];

export default function Dashboard() {
  const [token, setToken] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  useEffect(() => {
    const savedToken = localStorage.getItem('nova_token');
    const savedRole = localStorage.getItem('nova_role');
    if (savedToken && savedRole) {
      setToken(savedToken);
      setRole(savedRole);
      if (savedRole === 'ADMIN') fetchTechnicians(savedToken);
    }
  }, []);

  const log = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const login = async () => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setRole(data.user.role);
        localStorage.setItem('nova_token', data.token);
        localStorage.setItem('nova_role', data.user.role);
        log(`Logged in successfully as ${data.user.role}`);
        // clear fields
        setEmail('');
        setPassword('');
        if (data.user.role === 'ADMIN') fetchTechnicians(data.token);
      } else {
        log(`Login failed: ${data.error}`);
      }
    } catch (e: any) {
      log(`Error: ${e.message}`);
    }
  };

  const fetchTechnicians = async (currentToken: string) => {
    try {
      const res = await fetch('/api/v1/technicians', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      const data = await res.json();
      if (res.ok) setTechnicians(data.technicians || []);
    } catch (e) {
      console.error(e);
    }
  };

  const createTechnician = async () => {
    if (!token) return log('Error: Please login first');
    try {
      log('Creating a demo technician...');
      const rand = Math.floor(Math.random() * 10000);
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: `tech${rand}@novaiot.com`, 
          password: 'Password123!', 
          name: `Demo Tech ${rand}`, 
          role: 'TECHNICIAN' 
        })
      });
      const data = await res.json();
      if (res.ok) {
        log(`Success: Created Technician ${data.user.email} / Password123!`);
        toast.success(`Created Tech: ${data.user.email}`);
        fetchTechnicians(token);
      } else {
        log(`Create tech failed: ${data.error}`);
        toast.error(`Failed: ${data.error}`);
      }
    } catch (e: any) {
      log(`Error: ${e.message}`);
    }
  };

  const fetchTickets = async () => {
    if (!token) return log('Error: Please login first');
    try {
      log('Fetching tickets...');
      const res = await fetch('/api/v1/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(data.data);
        log(`Successfully fetched ${data.data.length} tickets`);
      } else {
        log(`Fetch failed: ${data.error}`);
      }
    } catch (e: any) {
      log(`Error: ${e.message}`);
    }
  };

  const runEscalations = async () => {
    if (!token) return log('Error: Please login first');
    try {
      log('Triggering manual escalation check...');
      const res = await fetch('/api/v1/tickets/run-escalations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        log(`Escalation success: ${data.message}`);
        fetchTickets(); // Refresh the list
      } else {
        log(`Escalation failed: ${data.error}`);
      }
    } catch (e: any) {
      log(`Error: ${e.message}`);
    }
  };

  const simulateFault = async () => {
    if (!token) return log('Error: Please login first');
    try {
      log('Simulating 5 device faults automatically...');
      
      for (let i = 0; i < 5; i++) {
        const devRes = await fetch('/api/v1/devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: `Demo Sensor ${Math.floor(Math.random() * 1000)}`, deviceType: 'Temp Sensor', siteLocation: '19.0760,72.8777' })
        });
        const devData = await devRes.json();
        
        if (devRes.ok) {
          const faultRes = await fetch(`/api/v1/devices/${devData.device.id}/fault`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ description: 'Automated system failure simulation', priority_hint: 'HIGH' })
          });
          if (faultRes.ok) log(`Success: Ticket ${i + 1}/5 created!`);
        }
      }
      fetchTickets();
    } catch (e: any) {
      log(`Error: ${e.message}`);
    }
  };

  const assignToTech = async (ticketId: string, techId: string) => {
    if (!token) return log('Error: Please login first');
    if (!techId) return;
    try {
      const techName = technicians.find(t => t.id === techId)?.name || 'Technician';
      log(`Assigning ticket to ${techName}...`);
      
      const res = await fetch(`/api/v1/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ technician_id: techId })
      });
      const data = await res.json();
      
      if (res.ok) {
        log(`Success: Ticket assigned to ${techName}!`);
        toast.success(`Ticket successfully assigned to ${techName}!`);
        fetchTickets();
      } else {
        log(`Assignment failed: ${data.error}`);
        toast.error(`${data.error}`);
      }
    } catch (e: any) {
      log(`Error: ${e.message}`);
      toast.error(`Error: ${e.message}`);
    }
  };

  const resetData = async () => {
    if (!token) return log('Error: Please login first');
    try {
      log('Resetting all tickets for testing...');
      const res = await fetch('/api/v1/demo/reset', { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('All tickets have been wiped clean!');
        fetchTickets();
      } else {
        const data = await res.json();
        toast.error(`Reset failed: ${data.error}`);
      }
    } catch (e: any) {
      toast.error('Failed to reset data');
    }
  };

  const getTechTaskCount = (techId: string) => {
    return tickets.filter(t => t.assignedTechnicianId === techId && t.status !== 'RESOLVED').length;
  };

  // Helper for priority colors
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'CRITICAL': return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
      case 'HIGH': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'MEDIUM': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'LOW': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  // Helper for status colors
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ESCALATED': return 'text-rose-400 font-semibold';
      case 'RESOLVED': return 'text-emerald-400';
      case 'OPEN': return 'text-sky-400';
      case 'ASSIGNED': return 'text-indigo-400';
      case 'IN_PROGRESS': return 'text-amber-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 font-sans relative overflow-hidden">
      
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10 pb-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
              <span className="text-xl font-black text-white">N</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              Nova FieldOps
            </h1>
          </div>
          
          {token && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-400">Authenticated as</p>
                <p className="font-semibold text-indigo-400">{role}</p>
              </div>
              <button 
                onClick={() => { 
                  setToken(''); 
                  setRole(''); 
                  setTickets([]); 
                  localStorage.removeItem('nova_token');
                  localStorage.removeItem('nova_role');
                  log('Logged out.'); 
                }} 
                className="bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all border border-slate-600 px-4 py-2 rounded-lg text-sm"
              >
                Sign Out
              </button>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Action Hub & Logs */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {!token ? (
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 shadow-xl p-8 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
                <p className="text-slate-400 mb-6 text-sm">Sign in to manage field tickets and escalations.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="admin@novaiot.com" 
                      className="bg-slate-950/50 border border-slate-700/50 text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500 w-full px-4 py-3 rounded-lg"
                      value={email} onChange={e => setEmail(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="bg-slate-950/50 border border-slate-700/50 text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500 w-full px-4 py-3 rounded-lg pr-12"
                        value={password} onChange={e => setPassword(e.target.value)} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <button onClick={login} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all w-full py-3 rounded-lg mt-2">
                    Authenticate
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 shadow-xl p-6 rounded-2xl">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Control Center
                </h2>
                <div className="flex flex-col gap-3">
                  <button onClick={fetchTickets} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all py-3 rounded-lg flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    Refresh Tickets
                  </button>
                  {role === 'ADMIN' && (
                    <>
                      <button onClick={simulateFault} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all py-3 rounded-lg flex items-center justify-center gap-2 mt-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        Simulate Device Fault
                      </button>
                      <button onClick={runEscalations} className="bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:shadow-[0_0_20px_rgba(225,29,72,0.5)] transition-all py-3 rounded-lg flex items-center justify-center gap-2 mt-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        Force Escalation Check
                      </button>
                      <button onClick={createTechnician} className="bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all py-3 rounded-lg flex items-center justify-center gap-2 mt-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                        Create Demo Technician
                      </button>
                      <button onClick={resetData} className="bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all py-3 rounded-lg flex items-center justify-center gap-2 mt-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Reset All Tickets
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Terminal Log */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 shadow-xl rounded-2xl flex flex-col overflow-hidden h-96 flex-grow">
              <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-700/50 flex justify-between items-center">
                <span className="text-xs font-mono text-slate-400">system.log</span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                </div>
              </div>
              <div className="p-4 overflow-y-auto font-mono text-xs flex-grow flex flex-col gap-1 text-slate-300">
                {logs.length === 0 && <span className="text-slate-600 italic">Waiting for activity...</span>}
                {logs.map((l, i) => (
                  <div key={i} className="break-words">
                    <span className="text-emerald-400 mr-2">➜</span>
                    <span dangerouslySetInnerHTML={{ __html: l.replace(/(Error:)/g, '<span class="text-rose-400">$1</span>') }} />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Ticket Grid */}
          <div className="lg:col-span-8">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold">Active Tickets</h2>
                <p className="text-slate-400 mt-1">
                  {tickets.length} {tickets.length === 1 ? 'record' : 'records'} found in the database.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.length === 0 ? (
                <div className="col-span-full bg-slate-900/40 backdrop-blur-md border border-slate-700/50 shadow-xl p-12 rounded-2xl flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-700/50">
                  <svg className="w-12 h-12 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <p className="text-slate-400 text-lg">No tickets to display.</p>
                  {token && <p className="text-slate-500 text-sm mt-2">Click "Refresh Tickets" to load data.</p>}
                </div>
              ) : (
                tickets.map(t => (
                  <div key={t.id} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 shadow-xl p-5 rounded-2xl hover:border-indigo-500/30 transition-colors group relative overflow-hidden">
                    
                    {/* Status accent line */}
                    {t.status === 'ESCALATED' && <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.8)]"></div>}

                    <div className="flex justify-between items-start mb-3">
                      <div className={`px-2.5 py-1 rounded text-xs font-bold border ${getPriorityColor(t.priority)}`}>
                        {t.priority}
                      </div>
                      <span className={`text-sm tracking-wide ${getStatusColor(t.status)}`}>
                        {t.status}
                      </span>
                    </div>
                    
                    <h3 className="font-medium text-lg leading-tight mb-4 group-hover:text-indigo-300 transition-colors">
                      {t.description}
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center border-t border-slate-700/50 pt-2">
                        <span className="text-slate-500">Weather Risk</span>
                        <span className={`font-mono text-xs ${t.weatherRiskFlag === 'SEVERE' ? 'text-rose-400' : t.weatherRiskFlag === 'CAUTION' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {t.weatherRiskFlag}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-700/50 pt-2">
                        <span className="text-slate-500">Assignee</span>
                        <span className="text-slate-300 text-xs truncate max-w-[150px]">
                          {t.assignedTechnicianId ? t.assignedTechnicianId.split('-')[0] + '...' : 'Unassigned'}
                        </span>
                      </div>
                      
                      {!t.assignedTechnicianId && role === 'ADMIN' && (
                        <div className="pt-3 border-t border-slate-700/50">
                          <select 
                            onChange={(e) => assignToTech(t.id, e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-300 py-1.5 px-2 rounded text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                            defaultValue=""
                          >
                            <option value="" disabled>Select Technician to Assign</option>
                            {technicians.map(tech => {
                              const count = getTechTaskCount(tech.id);
                              const isFull = count >= 5;
                              return (
                                <option key={tech.id} value={tech.id}>
                                  {tech.name} {isFull ? '(FULL)' : `(${count}/5 tasks)`}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center border-t border-slate-700/50 pt-2">
                        <span className="text-slate-500">SLA Due</span>
                        <span className={`text-xs ${new Date(t.slaDueAt) < new Date() && t.status !== 'RESOLVED' ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                          {new Date(t.slaDueAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
