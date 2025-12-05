import React, { useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Star, 
  Activity 
} from 'lucide-react';
import { ALUNOS_DATA, PROGRESS_DATA, FREQUENCY_BY_DATE } from './data';

// Ordem dos níveis na metodologia Passaporte
const NIVEL_ORDER = [
  'Bebê',
  'Golfinho',
  'Foca',
  'Peixe Dourado',
  'Estrela-do-mar'
];

// Processar dados para gráfico de distribuição por nível
const getNivelDistribution = () => {
  const distribution = {};
  ALUNOS_DATA.forEach(aluno => {
    distribution[aluno.Nivel] = (distribution[aluno.Nivel] || 0) + 1;
  });
  
  // Ordenar pelos níveis na ordem da metodologia (mantém níveis com quantidade 0)
  return NIVEL_ORDER.map(nivel => ({
    nivel,
    quantidade: distribution[nivel] || 0
  }));
};

// Processar dados de frequência
const getFrequencyData = () => {
  return FREQUENCY_BY_DATE.map(item => {
    const date = new Date(item.Data_Aula);
    return {
      data: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      dataCompleta: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      frequencia: item.Taxa_Frequencia_Dia
    };
  });
};

// Dados para comparativo de eficiência
const efficiencyData = [
  { processo: 'Matrícula', Antes: 15, Agora: 5 },
  { processo: 'Chamada', Antes: 10, Agora: 1 },
  { processo: 'Busca de Dados', Antes: 20, Agora: 2 }
];

// Componente de Tooltip customizado para frequência
const FrequencyTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-slate-900 mb-1">
          {data.dataCompleta}
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-medium text-blue-600">{data.frequencia}%</span> de frequência
        </p>
      </div>
    );
  }
  return null;
};

function KPICard({ title, value, label, trend, icon: Icon, trendColor = "text-green-600" }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-slate-600">{title}</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
        <div className={`${trendColor} flex items-center gap-1`}>
          {trend === 'up' && <TrendingUp className="w-5 h-5" />}
          {trend === 'down' && <TrendingDown className="w-5 h-5" />}
          {trend === 'neutral' && <CheckCircle className="w-5 h-5" />}
          {trend === 'star' && <Star className="w-5 h-5 fill-current" />}
        </div>
      </div>
    </div>
  );
}

// Calcula indicadores financeiros a partir dos dados de alunos
function computeFinancials(alunos) {
  const totalExpected = alunos.reduce((sum, a) => {
    // Alunos Gympass não pagam mensalidade direta
    if (a.Tipo_Contrato === 'Gympass') return sum;
    return sum + (Number(a.Mensalidade) || 0);
  }, 0);
  
  const totalCollected = alunos.reduce((sum, a) => {
    if (a.Tipo_Contrato === 'Gympass') return sum;
    return sum + ((a.Em_Dia ? Number(a.Mensalidade) : 0) || 0);
  }, 0);
  
  const totalInadimplente = alunos.reduce((sum, a) => {
    if (a.Tipo_Contrato === 'Gympass' || a.Em_Dia) return sum;
    return sum + (Number(a.Mensalidade) || 0);
  }, 0);
  
  const inadimplenciaPercent = totalExpected > 0 
    ? ((totalExpected - totalCollected) / totalExpected) * 100 
    : 0;
  
  const alunosComMatricula = alunos.filter(a => a.Tipo_Contrato === 'Matrícula').length;
  const alunosInadimplentes = alunos.filter(a => a.Tipo_Contrato === 'Matrícula' && !a.Em_Dia).length;
  
  return {
    totalExpected,
    totalCollected,
    totalInadimplente,
    inadimplenciaPercent,
    alunosComMatricula,
    alunosInadimplentes
  };
}

function App() {
  const nivelData = getNivelDistribution();
  useEffect(() => {
    // Log para depuração: ver quais níveis estão chegando ao componente
    console.log('Nivel distribution (nivelData):', JSON.stringify(nivelData, null, 2));
  }, [nivelData]);
  const frequencyData = getFrequencyData();
  const { 
    totalExpected, 
    totalCollected, 
    totalInadimplente,
    inadimplenciaPercent,
    alunosComMatricula,
    alunosInadimplentes
  } = computeFinancials(ALUNOS_DATA);
  
  // Taxa de inadimplência (redução é positiva)
  const taxaInadimplencia = alunosComMatricula > 0 
    ? ((alunosInadimplentes / alunosComMatricula) * 100).toFixed(1)
    : 0;
  
  const financeTrend = inadimplenciaPercent > 15 ? 'down' : inadimplenciaPercent > 5 ? 'neutral' : 'up';
  const financeTrendColor = inadimplenciaPercent > 15 ? 'text-red-600' : inadimplenciaPercent > 5 ? 'text-yellow-600' : 'text-green-600';
  
  // Label do KPI financeiro
  const financeLabel = inadimplenciaPercent > 0 
    ? `${taxaInadimplencia}% inadimplentes — R$ ${totalCollected.toLocaleString('pt-BR', {minimumFractionDigits:2})} de R$ ${totalExpected.toLocaleString('pt-BR', {minimumFractionDigits:2})}`
    : `100% em dia — R$ ${totalCollected.toLocaleString('pt-BR', {minimumFractionDigits:2})} recebidos`;

  return (
    <div className="min-h-screen bg-sky-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Painel de Controle - SwimJourney
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Gestão Estratégica - Escola de Natação Clóvis
              </p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Sistema Online • SLA 99.9%
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Eficiência Operacional"
            value="60%"
            label="Redução de Retrabalho"
            trend="up"
            icon={Activity}
            trendColor="text-green-600"
          />
          <KPICard
            title="Controle Pedagógico"
            value="100%"
            label="Alunos Mapeados"
            trend="neutral"
            icon={CheckCircle}
            trendColor="text-blue-600"
          />
          <KPICard
            title="Saúde Financeira"
            value={inadimplenciaPercent > 0 ? `${inadimplenciaPercent.toFixed(1)}%` : "0%"}
            label={financeLabel}
            trend={financeTrend}
            icon={inadimplenciaPercent > 15 ? TrendingDown : TrendingUp}
            trendColor={financeTrendColor}
          />
          <KPICard
            title="Satisfação"
            value="4.8/5.0"
            label="Avaliação da Equipe"
            trend="star"
            icon={Star}
            trendColor="text-yellow-500"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Chart 1: Distribuição por Nível */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Alunos por Nível (Metodologia Passaporte)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={nivelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="nivel" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  label={{ value: 'Quantidade', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="quantidade" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Tendência de Frequência */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Frequência Diária Geral (%)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={frequencyData}>
                <defs>
                  <linearGradient id="colorFrequencia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="data" 
                  stroke="#64748b"
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  domain={[0, 100]}
                  label={{ value: 'Frequência (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
                />
                <Tooltip content={<FrequencyTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="frequencia" 
                  stroke="#2563eb" 
                  fillOpacity={1} 
                  fill="url(#colorFrequencia)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Comparativo de Eficiência */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Tempo de Processos: Manual vs Sistema
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={efficiencyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="processo" 
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                label={{ value: 'Tempo (minutos)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
                formatter={(value) => [`${value} min`, '']}
              />
              <Legend />
              <Bar dataKey="Antes" fill="#94a3b8" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Agora" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Últimas Evoluções de Nível
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Aluno</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Fase Anterior</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Nova Fase</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Data</th>
                </tr>
              </thead>
              <tbody>
                {PROGRESS_DATA.map((item, index) => (
                  <tr 
                    key={index} 
                    className="border-b border-slate-100 hover:bg-sky-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-slate-900">{item["Aluno(a)"]}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{item.Fase_Anterior}</td>
                    <td className="py-3 px-4 text-sm text-blue-600 font-medium">{item.Nova_Fase}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {new Date(item.Data_Fase).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

