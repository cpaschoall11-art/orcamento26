import React, { useState, useEffect } from 'react';

// --- CONFIGURAÇÃO ---
// ATENÇÃO: Modo Premium Ativado.
// 1. USE_MOCK_DATA = false: O app vai tentar conectar na internet.
// 2. Cole a URL do seu fluxo Premium (Gatilho 'Request') abaixo.
const USE_MOCK_DATA = false; 
const POWER_AUTOMATE_URL = ""; 

// --- ÍCONES (SVG Nativos) ---
const IconBase = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" viewBox="0 0 24 24" 
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    className={className}
  >
    {children}
  </svg>
);

const Plus = ({ className }: { className?: string }) => <IconBase className={className}><path d="M5 12h14M12 5v14"/></IconBase>;
const Trash2 = ({ className }: { className?: string }) => <IconBase className={className}><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></IconBase>;
const Printer = ({ className }: { className?: string }) => <IconBase className={className}><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/></IconBase>;
const FileText = ({ className }: { className?: string }) => <IconBase className={className}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></IconBase>;
const Briefcase = ({ className }: { className?: string }) => <IconBase className={className}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></IconBase>;
const LayoutTemplate = ({ className }: { className?: string }) => <IconBase className={className}><rect width="18" height="18" x="3" y="3" rx="1"/><path d="M3 9h18M9 21V9"/></IconBase>;
const ChevronLeft = ({ className }: { className?: string }) => <IconBase className={className}><path d="M15 18l-6-6 6-6"/></IconBase>;
const Calendar = ({ className }: { className?: string }) => <IconBase className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><path d="M16 2v4M8 2v4M3 10h18"/></IconBase>;
const List = ({ className }: { className?: string }) => <IconBase className={className}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></IconBase>;
const Search = ({ className }: { className?: string }) => <IconBase className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></IconBase>;

// Link do Logotipo FIXO
const PREMA_LOGO_URL = 'https://prematelhados.com.br/wp-content/uploads/2018/09/TELHADOS1.png';

// Tipos de dados
type ItemType = 'service' | 'material';

interface OrcamentoItem {
  id: string;
  type: ItemType;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface ClientInfo {
  company: string;
  name: string;
  document: string; // CPF/CNPJ
  address: string;
  phone: string;
  email: string;
}

interface CompanyInfo {
  name: string;
  contact: string;
  terms: string;
}

// --- DADOS DO CATÁLOGO (MOCK) ---
// Adicione ou edite seus itens padrão aqui:
const MOCK_SHAREPOINT_CATALOG: OrcamentoItem[] = [
    { id: 'sp-1', type: 'service', description: 'Consultoria de Projetos', quantity: 1, unit: 'un', unitPrice: 2500 },
    { id: 'sp-2', type: 'material', description: 'Telhas Metálicas Termoacústicas', quantity: 1, unit: 'm²', unitPrice: 180.50 },
    { id: 'sp-3', type: 'service', description: 'Visita Técnica e Orçamento', quantity: 1, unit: 'un', unitPrice: 350.00 },
    { id: 'sp-4', type: 'material', description: 'Parafusos de Fixação (Cento)', quantity: 1, unit: 'ct', unitPrice: 45.00 },
    { id: 'sp-5', type: 'service', description: 'Mão de Obra de Instalação', quantity: 1, unit: 'm²', unitPrice: 80.00 },
];
let currentCatalog = [...MOCK_SHAREPOINT_CATALOG];

// --- FUNÇÃO DE BUSCA ---
const fetchCatalog = async (): Promise<OrcamentoItem[]> => {
    // Se estiver em modo MOCK ou sem URL, carrega localmente e não dá erro.
    if (USE_MOCK_DATA || !POWER_AUTOMATE_URL) {
        console.log("Modo Offline (ou URL vazia): Carregando catálogo local.");
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(currentCatalog);
            }, 500);
        });
    }

    try {
        console.log("Tentando conectar ao SharePoint...");
        const response = await fetch(POWER_AUTOMATE_URL);
        
        if (!response.ok) {
            throw new Error(`Status ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.value) {
            const itemsDoSharePoint = data.value.map((item: any) => ({
                id: String(item.ID),
                type: (item.Item && item.Item.Value ? item.Item.Value.toLowerCase() : (typeof item.Item === 'string' ? item.Item.toLowerCase() : 'service')),
                description: item.Title || 'Item sem descrição',
                quantity: 1,
                unit: item.Unidade || 'un',
                unitPrice: Number(item.Preco) || 0
            }));
            return itemsDoSharePoint;
        }
        return [];
    } catch (error) {
        console.warn("API indisponível (Erro de conexão ou licença). Usando dados locais como backup.", error);
        return currentCatalog; // Fallback silencioso para não quebrar a tela
    }
};

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  // --- Estados ---
  const [view, setView] = useState<'editor' | 'preview'>('editor');
  const [discount, setDiscount] = useState<number>(0);
  const [validityDays, setValidityDays] = useState<number>(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [catalogItems, setCatalogItems] = useState<OrcamentoItem[]>([]);
  const [isSharePointReady, setIsSharePointReady] = useState(false);
  
  const [company, setCompany] = useState<CompanyInfo>({
    name: 'Prema Telhados Arquitetura e Projetos LTDA',
    contact: '(11) 4858-04759 | atendimento@prematelhados.com.br',
    terms: 'Pagamento: 50% na entrada e 50% na conclusão.'
  });

  const [client, setClient] = useState<ClientInfo>({
    company: '',
    name: '',
    document: '',
    address: '',
    phone: '',
    email: ''
  });

  const [items, setItems] = useState<OrcamentoItem[]>([
    { id: '1', type: 'service', description: 'Instalação Elétrica', quantity: 8, unit: 'horas', unitPrice: 150 },
    { id: '2', type: 'material', description: 'Fios 10mm', quantity: 50, unit: 'm', unitPrice: 12.50 },
  ]);

  const [newItem, setNewItem] = useState<Partial<OrcamentoItem>>({
    type: 'service',
    description: '',
    quantity: 1,
    unit: 'un',
    unitPrice: 0
  });

  // --- AUTO-INJEÇÃO DE ESTILOS ---
  useEffect(() => {
    const scriptId = 'tailwind-cdn-script';
    if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = "https://cdn.tailwindcss.com";
        document.head.appendChild(script);
    }
  }, []);
  
  // --- Carregamento ---
  useEffect(() => {
    setIsSharePointReady(false);
    fetchCatalog()
      .then(data => {
        setCatalogItems(data);
        setIsSharePointReady(true);
      })
      .catch(e => {
        console.error("ERRO GERAL:", e);
        setIsSharePointReady(true);
      });
  }, []); 

  // --- Cálculos ---
  const getEffectiveUnitPrice = (item: OrcamentoItem) => {
    if (item.type === 'material') {
      return item.unitPrice * 1.5;
    }
    return item.unitPrice;
  };

  const filteredCatalogItems = catalogItems.filter(item => 
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotal = (item: OrcamentoItem) => {
    return item.quantity * getEffectiveUnitPrice(item);
  };

  const totalServices = items
    .filter(i => i.type === 'service')
    .reduce((acc, curr) => acc + calculateTotal(curr), 0);

  const totalMaterials = items
    .filter(i => i.type === 'material')
    .reduce((acc, curr) => acc + calculateTotal(curr), 0);

  const subTotal = totalServices + totalMaterials;
  const finalTotal = subTotal - discount;

  const getExpirationDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + validityDays);
    return date.toLocaleDateString('pt-BR');
  };

  // --- Ações ---
  const addItem = () => {
    if (!newItem.description || !newItem.unitPrice) return;
    
    // Cria item LOCAL para este orçamento apenas
    const item: OrcamentoItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: newItem.type as ItemType || 'service',
      description: newItem.description,
      quantity: Number(newItem.quantity),
      unit: newItem.unit || 'un',
      unitPrice: Number(newItem.unitPrice)
    };

    setItems([...items, item]);
    setNewItem({ type: 'service', description: '', quantity: 1, unit: 'un', unitPrice: 0 });
  };

  const addFromCatalog = (catalogItem: OrcamentoItem) => {
    const newItemCopy: OrcamentoItem = {
        ...catalogItem,
        id: Math.random().toString(36).substr(2, 9),
        quantity: 1,
    };
    setItems(prevItems => [...prevItems, newItemCopy]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Renderização ---

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Estilos específicos para impressão */}
      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { background: white; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .page-break { page-break-inside: avoid; }
          .A4-container { 
            box-shadow: none !important; 
            margin: 0 !important; 
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
          }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>

      {/* --- MENU SUPERIOR --- */}
      <nav className="bg-blue-700 text-white p-4 shadow-md no-print sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6" />
            <h1 className="text-xl font-bold">Orçamentos Prema</h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setView('editor')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${view === 'editor' ? 'bg-white text-blue-700 font-bold' : 'hover:bg-blue-600'}`}
            >
              <Briefcase className="w-4 h-4" /> Editor
            </button>
            <button 
              onClick={() => setView('preview')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${view === 'preview' ? 'bg-white text-blue-700 font-bold' : 'hover:bg-blue-600'}`}
            >
              <FileText className="w-4 h-4" /> Visualizar Proposta
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        
        {/* --- VIEW: EDITOR --- */}
        {view === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Coluna Esquerda */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="px-2">
                <p className="font-bold text-slate-800 text-lg">{company.name}</p>
                <p className="text-sm text-slate-500 mt-1">{company.contact}</p>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-center">
                    <img src={PREMA_LOGO_URL} alt="Prévia do Logo Fixo" className="max-h-20 w-auto object-contain" />
                </div>
              </div>

              {/* Card Cliente */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-slate-700">
                  <LayoutTemplate className="w-5 h-5 text-green-600" /> Cliente
                </h2>
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Nome da Empresa / Razão Social"
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm font-semibold"
                    value={client.company}
                    onChange={e => setClient({...client, company: e.target.value})}
                  />
                  <input 
                    type="text" 
                    placeholder="Nome do Responsável / Contato"
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm"
                    value={client.name}
                    onChange={e => setClient({...client, name: e.target.value})}
                  />
                  <input 
                    type="text" 
                    placeholder="Endereço"
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm"
                    value={client.address}
                    onChange={e => setClient({...client, address: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Telefone"
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm"
                      value={client.phone}
                      onChange={e => setClient({...client, phone: e.target.value})}
                    />
                      <input 
                      type="text" 
                      placeholder="CPF/CNPJ"
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm"
                      value={client.document}
                      onChange={e => setClient({...client, document: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              {/* Card Adicionar Item */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 sticky top-24">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-slate-700">
                  <Plus className="w-5 h-5 text-indigo-600" /> Item Único (Avulso)
                </h2>
                <p className="text-xs text-slate-500 mb-4">Adicione um item avulso a este orçamento (não salva no catálogo).</p>
                
                <div className="space-y-3">
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                    <button 
                      onClick={() => setNewItem({...newItem, type: 'service'})}
                      className={`flex-1 py-1 text-sm rounded-md font-medium transition ${newItem.type === 'service' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Serviço
                    </button>
                    <button 
                      onClick={() => setNewItem({...newItem, type: 'material'})}
                      className={`flex-1 py-1 text-sm rounded-md font-medium transition ${newItem.type === 'material' ? 'bg-white shadow text-orange-600' : 'text-slate-500'}`}
                    >
                      Material
                    </button>
                  </div>

                  <input 
                    type="text" 
                    placeholder="Descrição do item"
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={newItem.description}
                    onChange={e => setNewItem({...newItem, description: e.target.value})}
                  />
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="text-xs text-slate-500">Qtd</label>
                      <input 
                        type="number"
                        step="any"
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        value={newItem.quantity}
                        onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-xs text-slate-500">Unidade</label>
                      <input 
                        type="text" 
                        placeholder="un, m, h"
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        value={newItem.unit}
                        onChange={e => setNewItem({...newItem, unit: e.target.value})}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-xs text-slate-500">Preço Unit.</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        value={newItem.unitPrice}
                        onChange={e => setNewItem({...newItem, unitPrice: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={addItem}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold flex justify-center items-center gap-2 transition"
                    >
                      <Plus className="w-4 h-4" /> Adicionar ao Orçamento
                    </button>
                  </div>
                </div>
              </div>
              
            </div>

            {/* Coluna Direita: Planilha e Catálogo */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* --- Catálogo --- */}
              <div className="bg-white p-5 rounded-xl shadow-md border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-700">
                        <List className="w-5 h-5 text-gray-600" /> Catálogo
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">Fonte: {USE_MOCK_DATA ? 'Interna' : 'SharePoint'}</span>
                </div>

                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Pesquisar itens..."
                        className="w-full pl-9 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {!isSharePointReady ? (
                    <div className="text-center p-4 bg-slate-100 rounded-lg">
                        <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent text-slate-400 rounded-full mr-2" role="status"></div>
                        <span className="text-sm text-slate-500">Carregando itens do catálogo...</span>
                    </div>
                ) : catalogItems.length === 0 ? (
                    <p className="text-sm text-slate-500 p-3 bg-slate-50 rounded-lg text-center">
                        Seu catálogo está vazio.
                    </p>
                ) : (
                    <div className="max-h-36 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {filteredCatalogItems.length > 0 ? (
                            filteredCatalogItems.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 hover:bg-slate-100 transition">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.type === 'service' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {item.type === 'service' ? 'S' : 'M'}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{item.description}</p>
                                            <p className="text-xs text-slate-500">{formatCurrency(item.unitPrice)} / {item.unit}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => addFromCatalog(item)}
                                            title="Adicionar ao Orçamento"
                                            className="p-1 bg-green-500 hover:bg-green-600 text-white rounded-full transition"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-4">
                                Nenhum item encontrado para "{searchTerm}"
                            </p>
                        )}
                    </div>
                )}
              </div>
              
              {/* Resumo Financeiro e Tabela (Mantidos iguais) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium">Serviços</p>
                  <p className="text-lg font-bold text-blue-800">{formatCurrency(totalServices)}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <p className="text-sm text-orange-600 font-medium">Materiais</p>
                  <p className="text-lg font-bold text-orange-800">{formatCurrency(totalMaterials)}</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 relative">
                  <label className="text-sm text-red-600 font-medium flex items-center gap-1">
                      Desconto (R$)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full bg-transparent text-lg font-bold text-red-800 outline-none border-b border-red-200 focus:border-red-400 mt-1 placeholder-red-300"
                    placeholder="0,00"
                    value={discount === 0 ? '' : discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <p className="text-sm text-green-600 font-medium">Total Final</p>
                  <p className="text-lg font-bold text-green-800">{formatCurrency(finalTotal)}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-4">Tipo</th>
                        <th className="p-4">Descrição</th>
                        <th className="p-4 text-center">Qtd</th>
                        <th className="p-4 text-right">Unitário</th>
                        <th className="p-4 text-right">Total</th>
                        <th className="p-4 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            Nenhum item adicionado ainda. Use o formulário à esquerda.
                          </td>
                        </tr>
                      ) : items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 group">
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.type === 'service' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              {item.type === 'service' ? 'Serviço' : 'Material'}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-slate-700">{item.description}</td>
                          <td className="p-4 text-center text-slate-500">{item.quantity} {item.unit}</td>
                          <td className="p-4 text-right text-slate-500">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="p-4 text-right font-semibold text-slate-700">
                            {formatCurrency(calculateTotal(item))}
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="p-1 text-slate-400 hover:text-red-500 transition rounded hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="mb-4 pb-4 border-b border-slate-100">
                    <h2 className="text-sm font-bold mb-2 text-slate-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" /> Validade do Orçamento
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <input 
                                type="number"
                                className="w-20 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-bold text-center"
                                value={validityDays}
                                onChange={(e) => setValidityDays(Number(e.target.value))}
                            />
                            <span className="text-xs text-slate-500 absolute right-[-30px] top-3">dias</span>
                        </div>
                        <p className="text-sm text-slate-500 ml-6">
                            Vencimento calculado: <span className="font-bold text-blue-700">{getExpirationDate()}</span>
                        </p>
                    </div>
                </div>

                <h2 className="text-sm font-bold mb-2 text-slate-700">Termos e Observações Adicionais</h2>
                <textarea 
                  className="w-full p-3 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  value={company.terms}
                  onChange={e => setCompany({...company, terms: e.target.value})}
                  placeholder="Digite as condições de pagamento, prazos de entrega, etc."
                />
              </div>

            </div>
          </div>
        )}

        {/* --- VIEW: PREVIEW --- */}
        {view === 'preview' && (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
            
            <div className="no-print w-full flex justify-between items-center mb-6 bg-slate-200 p-4 rounded-lg">
              <button onClick={() => setView('editor')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2 font-medium">
                <ChevronLeft className="w-4 h-4" /> Voltar para Edição
              </button>
              <div className="text-slate-600 text-sm">
                Esta é uma prévia. Clique em imprimir para gerar o PDF.
              </div>
              <button 
                onClick={handlePrint}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition transform hover:scale-105"
              >
                <Printer className="w-5 h-5" /> Imprimir / Salvar PDF
              </button>
            </div>

            <div className="A4-container bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl mx-auto relative text-slate-900 leading-normal">
              
              <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between">
                
                <div className="flex flex-col items-start max-w-[65%]">
                  <div className="w-36 h-18 mb-1 overflow-hidden flex items-center justify-start">
                    <img 
                      src={PREMA_LOGO_URL} 
                      alt="Logo da Empresa" 
                      className="w-full h-full object-contain" 
                      onError={(e) => {
                          e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  
                  <div className="text-left mt-0 pt-0"> 
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{company.contact}</p>
                  </div>
                </div>
                
                <div className="text-right mt-[-40px]"> 
                  <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-800 mb-2">ORÇAMENTO</h1>
                  <p className="text-sm text-slate-500">Nº {Math.floor(Math.random() * 10000)}</p>
                  
                  <div className="mt-2 justify-end">
                     <div className="text-right">
                        <p className="text-[10px] text-green-600 uppercase font-bold">Válido Até</p>
                        <p className="text-sm font-bold text-green-800">{getExpirationDate()}</p>
                     </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded border border-slate-200 mb-8 page-break">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Preparado para</h3>
                <div className="text-sm">
                  {client.company ? (
                    <>
                      <p className="font-bold text-lg text-slate-800">{client.company}</p>
                      {client.name && <p className="text-slate-600 mt-1">A/C: {client.name}</p>}
                    </>
                  ) : (
                    <p className="font-bold text-lg text-slate-800">{client.name || 'Cliente Não Informado'}</p>
                  )}
                  
                  {client.document && <p className="text-slate-600 mt-1">CPF/CNPJ: {client.document}</p>}
                  {client.address && <p className="text-slate-600">{client.address}</p>}
                  {(client.phone || client.email) && (
                    <p className="text-slate-600 mt-1">{client.phone} • {client.email}</p>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-800 text-slate-800">
                      <th className="text-left py-2">Descrição</th>
                      <th className="text-center py-2 w-24">Qtd</th>
                      <th className="text-right py-2 w-32">Preço Unit.</th>
                      <th className="text-right py-2 w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.some(i => i.type === 'service') && (
                       <>
                        <tr className="bg-slate-100 font-bold text-xs uppercase text-slate-500">
                          <td colSpan={4} className="py-2 px-2 mt-2">Mão de Obra / Serviços</td>
                        </tr>
                        {items.filter(i => i.type === 'service').map(item => (
                          <tr key={item.id}>
                            <td className="py-3 pr-2 align-top">{item.description}</td>
                            <td className="py-3 text-center align-top">{item.quantity} {item.unit}</td>
                            <td className="py-3 text-right align-top">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-3 text-right font-medium align-top">{formatCurrency(calculateTotal(item))}</td>
                          </tr>
                        ))}
                       </>
                    )}

                    {items.some(i => i.type === 'material') && (
                       <>
                        <tr className="bg-slate-100 font-bold text-xs uppercase text-slate-500">
                          <td colSpan={4} className="py-2 px-2 mt-4">Materiais / Insumos</td>
                        </tr>
                        {items.filter(i => i.type === 'material').map(item => (
                          <tr key={item.id}>
                            <td className="py-3 pr-2 align-top">{item.description}</td>
                            <td className="py-3 text-center align-top">{item.quantity} {item.unit}</td>
                            <td className="py-3 text-right align-top">{formatCurrency(getEffectiveUnitPrice(item))}</td>
                            <td className="py-3 text-right font-medium align-top">{formatCurrency(calculateTotal(item))}</td>
                          </tr>
                        ))}
                       </>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mb-12 page-break">
                <div className="w-64 space-y-2">
                  
                  {discount > 0 ? (
                    <>
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-red-600 border-b border-slate-300 pb-2">
                        <span>Desconto:</span>
                        <span>- {formatCurrency(discount)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold text-slate-900 pt-1">
                        <span>Total Geral:</span>
                        <span>{formatCurrency(finalTotal)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Serviços:</span>
                        <span>{formatCurrency(totalServices)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-600 border-b border-slate-300 pb-2">
                        <span>Materiais:</span>
                        <span>{formatCurrency(totalMaterials)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold text-slate-900 pt-1">
                        <span>Total Geral:</span>
                        <span>{formatCurrency(subTotal)}</span>
                      </div>
                    </>
                  )}

                </div>
              </div>

              <div className="mt-auto page-break">
                {company.terms && (
                  <div className="mb-12">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Termos e Condições</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-line border-l-4 border-slate-300 pl-4">
                      {company.terms}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-12 mt-20">
                  <div className="text-center">
                    <div className="border-t border-slate-400 w-full mb-2"></div>
                    <p className="text-xs font-bold uppercase text-slate-500">{company.name}</p> 
                  </div>
                  <div className="text-center">
                    <div className="border-t border-slate-400 w-full mb-2"></div>
                    <p className="text-xs font-bold uppercase text-slate-500">{client.company || client.name || 'Cliente'}</p>
                    <p className="text-[10px] text-slate-400">Aceite do Cliente</p>
                  </div>
                </div>

                <div className="flex justify-end mt-16 text-right"> 
                    <div className="w-64">
                        <p className="text-xs text-slate-500 uppercase">Emissão</p>
                        <p className="text-sm text-slate-800">{new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}