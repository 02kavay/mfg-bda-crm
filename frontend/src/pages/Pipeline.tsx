import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, 
  useSensor, useSensors, DragEndEvent 
} from '@dnd-kit/core';
import { 
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, Search, LogOut, LayoutGrid, KanbanSquare, Sun, Moon, 
  Briefcase, X, Calendar, Phone, Mail, User, IndianRupee 
} from 'lucide-react';
import LeadModal from '../components/LeadModal';
import { socket, connectSocket, disconnectSocket } from '../services/socket';

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

const STAGES = [
  { id: 'NEW', title: 'New Lead', color: 'bg-blue-500' },
  { id: 'CONTACTED', title: 'Contacted', color: 'bg-purple-500' },
  { id: 'PROPOSAL', title: 'Proposal Sent', color: 'bg-indigo-500' },
  { id: 'NEGOTIATION', title: 'Negotiation', color: 'bg-amber-500' },
  { id: 'WON', title: 'Deal Won', color: 'bg-emerald-500' },
  { id: 'LOST', title: 'Deal Lost', color: 'bg-rose-500' }
];

const SortableLeadItem = ({ lead, onClick }: { lead: Lead; onClick: (lead: Lead) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lead._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(lead)}
      className="mb-3 cursor-grab rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{lead.companyName}</h4>
        <span className={`text-[10px] rounded px-1.5 py-0.5 font-semibold ${
          lead.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
          lead.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
        }`}>
          {lead.priority}
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{lead.title}</p>
      
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800 text-[11px]">
        <span className="font-bold text-teal-700 dark:text-teal-400">₹{lead.dealValue.toLocaleString('en-IN')}</span>
        <span className="text-slate-400 font-semibold">{lead.productType}</span>
      </div>
    </div>
  );
};

const PipelineColumn = ({ 
  title, id, color, leads, onLeadClick, onAddLead 
}: { 
  title: string; id: string; color: string; leads: Lead[]; 
  onLeadClick: (lead: Lead) => void; onAddLead: (stage: string) => void 
}) => {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl bg-slate-100 p-4 dark:bg-slate-950">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{title}</h3>
        </div>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {leads.length}
        </span>
      </div>
      
      <SortableContext items={leads.map((l) => l._id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {leads.map((lead) => (
            <SortableLeadItem key={lead._id} lead={lead} onClick={onLeadClick} />
          ))}
        </div>
      </SortableContext>
      
      <button 
        onClick={() => onAddLead(id)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/80 transition"
      >
        <Plus className="h-4 w-4" /> Add Lead
      </button>
    </div>
  );
};

const Pipeline = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const navigate = useNavigate();

  const currentUser = userStr ? JSON.parse(userStr) : null;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreatingLead, setIsCreatingLead] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDealValue, setNewDealValue] = useState(0);
  const [newQuantity, setNewQuantity] = useState(1);
  const [newProduct, setNewProduct] = useState('Industrial Gears');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newFollowUp, setNewFollowUp] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Check local storage for token
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchLeads = async () => {
      try {
        const res = await api.get('/leads', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLeads(res.data);
      } catch (err) {
        console.error('Failed to load leads', err);
      }
    };
    fetchLeads();

    // Sockets initialization
    connectSocket();
    
    socket.on('lead_created', (newLead: Lead) => {
      setLeads((prev) => [newLead, ...prev]);
    });

    socket.on('lead_updated', (updatedLead: Lead) => {
      setLeads((prev) => prev.map((l) => (l._id === updatedLead._id ? updatedLead : l)));
      setSelectedLead((prev) => (prev && prev._id === updatedLead._id ? updatedLead : prev));
    });

    socket.on('lead_deleted', (deletedId: string) => {
      setLeads((prev) => prev.filter((l) => l._id !== deletedId));
      setSelectedLead((prev) => (prev && prev._id === deletedId ? null : prev));
    });

    return () => {
      socket.off('lead_created');
      socket.off('lead_updated');
      socket.off('lead_deleted');
      disconnectSocket();
    };
  }, [token, navigate]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    // Find the lead
    const draggedLead = leads.find((l) => l._id === leadId);
    if (!draggedLead) return;

    // Check if dropped onto a column stage
    const overId = over.id as string;
    const isStage = STAGES.some((s) => s.id === overId);
    let newStage = draggedLead.stage;

    if (isStage) {
      newStage = overId as any;
    } else {
      // Find the stage of the lead we dragged over
      const targetLead = leads.find((l) => l._id === overId);
      if (targetLead) {
        newStage = targetLead.stage;
      }
    }

    if (draggedLead.stage !== newStage) {
      // Update local state first (Optimistic update)
      setLeads((prev) =>
        prev.map((l) => (l._id === leadId ? { ...l, stage: newStage } : l))
      );

      try {
        await api.patch(
          `/leads/${leadId}`,
          { stage: newStage },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error('Failed to update stage on drag end', err);
        // Rollback state on error
        setLeads((prev) =>
          prev.map((l) => (l._id === leadId ? { ...l, stage: draggedLead.stage } : l))
        );
      }
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newTitle.trim()) return;

    try {
      const response = await api.post(
        '/leads',
        {
          title: newTitle,
          companyName: newCompany,
          contactPerson: newContact,
          email: newEmail,
          phone: newPhone,
          dealValue: newDealValue,
          quantity: newQuantity,
          productType: newProduct,
          priority: newPriority,
          stage: isCreatingLead,
          followUpDate: newFollowUp ? new Date(newFollowUp) : undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add to state if socket doesn't fire it (preventing double adds by filtering)
      setLeads((prev) => {
        if (prev.some(l => l._id === response.data._id)) return prev;
        return [response.data, ...prev];
      });

      // Clear Form & Close
      setIsCreatingLead(null);
      setNewTitle('');
      setNewCompany('');
      setNewContact('');
      setNewEmail('');
      setNewPhone('');
      setNewDealValue(0);
      setNewQuantity(1);
      setNewProduct('Industrial Gears');
      setNewPriority('MEDIUM');
      setNewFollowUp('');
    } catch (err) {
      console.error('Failed to create lead', err);
    }
  };

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredLeads = leads.filter((l) => {
    const query = searchQuery.toLowerCase();
    return (
      l.companyName.toLowerCase().includes(query) ||
      l.contactPerson.toLowerCase().includes(query) ||
      l.title.toLowerCase().includes(query) ||
      l.productType.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      
      {/* Top Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Briefcase className="h-6 w-6 text-teal-700 dark:text-teal-400" />
          <h1 className="text-xl font-extrabold tracking-tight text-teal-800 dark:text-teal-400">MfgCRM</h1>
          <span className="hidden sm:inline text-xs rounded bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Pipeline Board
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1.5 mr-2">
            <Link to="/" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
              <LayoutGrid className="h-4 w-4" />
              Metrics
            </Link>
            <Link to="/pipeline" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
              <KanbanSquare className="h-4 w-4" />
              Pipeline
            </Link>
          </nav>

          <button 
            onClick={toggleDarkMode}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-4 dark:border-slate-700">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold">{currentUser?.name}</p>
              <p className="text-xs text-slate-400">{currentUser?.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 dark:hover:text-red-400 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Control Actions Panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, contact, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-1.5 text-sm outline-none focus:border-teal-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <button 
          onClick={() => setIsCreatingLead('NEW')}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2 text-sm dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          <Plus className="h-4 w-4" />
          New Lead opportunity
        </button>
      </div>

      {/* Kanban Pipeline Board */}
      <main className="flex-1 overflow-x-auto p-6">
        <div className="flex h-full gap-5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {STAGES.map((col) => (
              <PipelineColumn
                key={col.id}
                title={col.title}
                id={col.id}
                color={col.color}
                leads={filteredLeads.filter((l) => l.stage === col.id)}
                onLeadClick={(lead) => setSelectedLead(lead)}
                onAddLead={(stage) => setIsCreatingLead(stage)}
              />
            ))}
          </DndContext>
        </div>
      </main>

      {/* Selected Lead Modal Viewer */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={(updatedLead) => {
            setLeads((prev) => prev.map((l) => (l._id === updatedLead._id ? updatedLead : l)));
            setSelectedLead(null);
          }}
          onDelete={(id) => {
            setLeads((prev) => prev.filter((l) => l._id !== id));
            setSelectedLead(null);
          }}
        />
      )}

      {/* Create Lead Modal Form */}
      {isCreatingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Record New Lead</h2>
              <button onClick={() => setIsCreatingLead(null)} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Motors"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lead Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Supply of helical gearboxes"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="Amit Sharma"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Product Line</label>
                  <select
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Deal Value (₹)</label>
                  <input
                    type="number"
                    required
                    value={newDealValue}
                    onChange={(e) => setNewDealValue(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Quantity</label>
                  <input
                    type="number"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Follow-up Date</label>
                  <input
                    type="date"
                    value={newFollowUp}
                    onChange={(e) => setNewFollowUp(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Contact Email</label>
                  <input
                    type="email"
                    required
                    placeholder="asharma@tatamotors.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Contact Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+91-98765-43210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsCreatingLead(null)} 
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                >
                  Record Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Pipeline;
