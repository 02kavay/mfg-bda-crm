import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Tag, Phone, Mail, FileText, CheckCircle, Trash2 } from 'lucide-react';
import axios from 'axios';

interface BDA {
  _id: string;
  name: string;
}

interface Lead {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  title: string;
  description?: string;
  stage: 'NEW' | 'CONTACTED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dealValue: number;
  quantity: number;
  productType: string;
  bdaAssignee: BDA | string;
  followUpDate?: string;
}

interface CommLog {
  _id: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';
  content: string;
  bdaId: { name: string };
  createdAt: string;
}

interface LeadModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: (updatedLead: Lead) => void;
  onDelete: (leadId: string) => void;
}

const LeadModal: React.FC<LeadModalProps> = ({ lead, onClose, onUpdate, onDelete }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';

  // Lead State
  const [companyName, setCompanyName] = useState(lead.companyName);
  const [contactPerson, setContactPerson] = useState(lead.contactPerson);
  const [email, setEmail] = useState(lead.email);
  const [phone, setPhone] = useState(lead.phone);
  const [title, setTitle] = useState(lead.title);
  const [description, setDescription] = useState(lead.description || '');
  const [stage, setStage] = useState(lead.stage);
  const [priority, setPriority] = useState(lead.priority);
  const [dealValue, setDealValue] = useState(lead.dealValue);
  const [quantity, setQuantity] = useState(lead.quantity);
  const [productType, setProductType] = useState(lead.productType);
  const [bdaAssignee, setBdaAssignee] = useState(typeof lead.bdaAssignee === 'object' ? lead.bdaAssignee._id : lead.bdaAssignee);
  const [followUpDate, setFollowUpDate] = useState(lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : '');

  // Comm Log States
  const [logs, setLogs] = useState<CommLog[]>([]);
  const [logType, setLogType] = useState<'CALL' | 'EMAIL' | 'MEETING' | 'NOTE'>('NOTE');
  const [logContent, setLogContent] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);
  const [bdas, setBdas] = useState<BDA[]>([]);

  useEffect(() => {
    // Fetch logs and BDAs
    const fetchData = async () => {
      try {
        const [logsRes, bdasRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/leads/communications/${lead._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          isManager ? axios.get('http://localhost:5000/api/auth/bdas', {
            headers: { Authorization: `Bearer ${token}` }
          }) : Promise.resolve({ data: [] })
        ]);
        setLogs(logsRes.data);
        if (isManager) {
          setBdas(bdasRes.data);
        }
      } catch (err) {
        console.error('Failed to load logs or BDAs', err);
      }
    };
    fetchData();
  }, [lead._id, token, isManager]);

  const handleSaveLead = async () => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/leads/${lead._id}`,
        {
          companyName,
          contactPerson,
          email,
          phone,
          title,
          description,
          stage,
          priority,
          dealValue,
          quantity,
          productType,
          bdaAssignee,
          followUpDate: followUpDate ? new Date(followUpDate) : undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate(response.data);
    } catch (err) {
      console.error('Failed to save lead updates', err);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logContent.trim()) return;
    setSubmittingLog(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/leads/communications',
        {
          leadId: lead._id,
          type: logType,
          content: logContent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLogs([response.data, ...logs]);
      setLogContent('');
    } catch (err) {
      console.error('Failed to save interaction log', err);
    } finally {
      setSubmittingLog(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!window.confirm('Are you sure you want to delete this lead? All communication records will be permanently removed.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/leads/${lead._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onDelete(lead._id);
    } catch (err) {
      console.error('Failed to delete lead', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              stage === 'WON' ? 'bg-emerald-100 text-emerald-800' :
              stage === 'LOST' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
            }`}>
              {stage}
            </span>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-600 outline-none px-1 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDeleteLead}
              className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              title="Delete Lead"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Split Area */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Main Info Form & Comments Log */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Sales Details Form */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Company Name</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Contact Person</label>
                <input 
                  type="text" 
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phone</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Product Line</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Industrial Gears">Industrial Gears</option>
                  <option value="Hydraulic Pumps">Hydraulic Pumps</option>
                  <option value="Metal Sheets">Metal Sheets</option>
                  <option value="Turbines">Turbines</option>
                  <option value="Valves">Valves</option>
                  <option value="Custom Castings">Custom Castings</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Follow-up Date</label>
                <input 
                  type="date" 
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Deal Value (₹)</label>
                <input 
                  type="number" 
                  value={dealValue}
                  onChange={(e) => setDealValue(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Quantity</label>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Project Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Details about project manufacturing requirements, blueprints, and materials..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleSaveLead}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
              >
                Save Details
              </button>
            </div>

            {/* Client Communication Workflow Logs */}
            <div className="border-t border-slate-100 pt-6 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Client Communication Logs</h3>
              
              {/* Interaction Form */}
              <form onSubmit={handleAddLog} className="space-y-3 bg-slate-50 p-4 rounded-xl dark:bg-slate-800">
                <div className="flex gap-2">
                  <select
                    value={logType}
                    onChange={(e) => setLogType(e.target.value as any)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="CALL">Call Log</option>
                    <option value="EMAIL">Email Sent/Recv</option>
                    <option value="MEETING">Meeting Notes</option>
                    <option value="NOTE">General Note</option>
                  </select>
                  <span className="text-xs text-slate-400 self-center">Record communications with customer</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Log summary e.g. Amit Sharma approved design blueprints, requested quotation revision..."
                    value={logContent}
                    onChange={(e) => setLogContent(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={submittingLog}
                    className="rounded-lg bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    Add Log
                  </button>
                </div>
              </form>

              {/* Log Timeline */}
              <div className="space-y-3">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log._id} className="flex gap-3 rounded-lg border border-slate-100 p-4 dark:border-slate-800">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                        log.type === 'CALL' ? 'bg-blue-50 text-blue-700' :
                        log.type === 'EMAIL' ? 'bg-purple-50 text-purple-700' :
                        log.type === 'MEETING' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.type.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {log.bdaId?.name || 'Assigned BDA'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{log.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No communication logs recorded for this lead yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Pipeline Settings */}
          <div className="w-80 shrink-0 border-l border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950 space-y-6">
            <div>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Pipeline Status</h3>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Deal Stage</label>
                  <select 
                    value={stage}
                    onChange={(e) => setStage(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="NEW">New Lead</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="PROPOSAL">Proposal Submitted</option>
                    <option value="NEGOTIATION">Under Negotiation</option>
                    <option value="WON">Deal Won (Closed)</option>
                    <option value="LOST">Deal Lost (Closed)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Deal Priority</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {isManager && (
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Assignee BDA</label>
                    <select 
                      value={bdaAssignee}
                      onChange={(e) => setBdaAssignee(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">Unassigned</option>
                      {bdas.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 dark:border-slate-800 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Email:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{email}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Phone:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{phone}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Contact:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{contactPerson}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LeadModal;
