import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const StatusDisplay = ({ message }) => (
  <div className="text-center py-20 text-gray-500">{message}</div>
);

const SummaryCard = ({ title, value, icon, formatAsCurrency = false }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
    <div className="absolute -right-5 -bottom-5 text-slate-100 opacity-80">
      {icon}
    </div>
    <p className="text-sm font-medium text-gray-500 relative z-10">{title}</p>
    <p className="mt-1 text-4xl font-bold text-[#202262] relative z-10">
      {formatAsCurrency ? `Rp ${new Intl.NumberFormat('id-ID').format(value)}` : value}
    </p>
  </div>
);

const AnalysisRenderer = ({ questionData }) => {
  const { tipe_jawaban, jawaban } = questionData;
  const pieColors = ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.7)'];

  if (tipe_jawaban === 'ya_tidak') {
    const data = {
      labels: Object.keys(jawaban),
      datasets: [{
        data: Object.values(jawaban),
        backgroundColor: pieColors,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
      }],
    };
    const options = {
        plugins: {
            legend: {
                position: 'top',
                labels: { color: 'white', font: { size: 12 } }
            }
        }
    };
    return <div className="w-full h-64 flex justify-center"><Pie data={data} options={options} /></div>;
  }

  if (tipe_jawaban === 'teks' || tipe_jawaban === 'angka') {
    const sortedData = Object.entries(jawaban).sort(([,a],[,b]) => b-a).slice(0, 10);
    const topLabels = sortedData.map(([key]) => key);
    const topValues = sortedData.map(([,value]) => value);

    const data = {
      labels: topLabels,
      datasets: [{
        label: 'Jumlah Responden',
        data: topValues,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 1)',
        borderWidth: 1,
      }],
    };
    const options = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: 'white', beginAtZero: true } },
        y: { ticks: { color: 'white', fontSize: 10 } }
      }
    };
    return (
        <div className="relative h-64 w-full">
            <Bar options={options} data={data} />
            {Object.keys(jawaban).length > 10 && (
                <p className="text-xs text-center text-white/70 mt-2">
                    Menampilkan 10 jawaban teratas.
                </p>
            )}
        </div>
    );
  }

  return <p className="text-sm text-white/70">Visualisasi untuk tipe data ini belum tersedia.</p>;
};

const getQuestionIcon = (tipe_jawaban) => {
    switch(tipe_jawaban) {
        case 'ya_tidak': return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'angka': return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>;
        case 'teks': return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>;
        default: return null;
    }
}

function HasilAnalisisPage() {
  const { eventId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartCardColors = ['#14BBF0', '#FFAD01', '#A80151', '#EF4444', '#0085CE', '#202262'];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const eventRes = await apiFetch(`/api/events/${eventId}`);
        if (!eventRes.ok) throw new Error('Gagal mengambil detail event.');
        const eventData = await eventRes.json();
        setEvent(eventData);

        const analysisRes = await apiFetch(`/api/events/${eventId}/analisis`);
        if (!analysisRes.ok) {
            const errData = await analysisRes.json();
            throw new Error(errData.message || 'Gagal mengambil data analisis.');
        }
        const analysisData = await analysisRes.json();
        setAnalysis(analysisData);

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [eventId]);

  const getSummaryData = (tipeRespondenData) => {
    const summaries = [];
    if (!tipeRespondenData || !tipeRespondenData.pertanyaan) return summaries;

    for (const [pertanyaan, detail] of Object.entries(tipeRespondenData.pertanyaan)) {
      if (detail.tipe_jawaban === 'nominal') {
        summaries.push({ 
            title: `Total ${pertanyaan}`, 
            value: detail.sum, 
            formatAsCurrency: true,
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        });
      }
      if (detail.tipe_jawaban === 'ya_tidak' && pertanyaan.toLowerCase().includes('puas')) {
        const puasCount = detail.jawaban['Ya'] || 0;
        const total = (detail.jawaban['Ya'] || 0) + (detail.jawaban['Tidak'] || 0);
        const percentage = total > 0 ? ((puasCount / total) * 100).toFixed(0) : 0;
        summaries.push({ 
            title: 'Tingkat Kepuasan', 
            value: `${percentage}%`, 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        });
      }
    }
    return summaries;
  };

  if (isLoading) return <StatusDisplay message="Memuat data analisis..." />;
  if (error) return <StatusDisplay message={`Error: ${error}`} />;
  if (!analysis) return <StatusDisplay message="Tidak ada data untuk ditampilkan." />;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#202262]">{event?.nama_event}</h1>
        <p className="mt-1 text-gray-500">Hasil Analisis Survei</p>
      </div>

      {Object.entries(analysis).map(([tipeResponden, data]) => {
        const summaryCards = getSummaryData(data);
        return (
          <div key={tipeResponden} className="mb-12">
            <h2 className="text-2xl font-bold text-[#14BBF0] border-b-2 border-[#14BBF0] pb-2 mb-6">
              Analisis untuk: {tipeResponden} ({data.total_responden} Responden)
            </h2>
            
            {summaryCards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {summaryCards.map(card => (
                  <SummaryCard key={card.title} {...card} />
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {Object.entries(data.pertanyaan).map(([pertanyaan, detail], index) => {
                if (detail.tipe_jawaban === 'nominal') return null;
                return (
                  <div 
                    key={pertanyaan} 
                    style={{ backgroundColor: chartCardColors[index % chartCardColors.length] }}
                    className="p-6 rounded-2xl shadow-lg min-h-[350px] flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 text-white flex items-center justify-center">
                            {getQuestionIcon(detail.tipe_jawaban)}
                        </div>
                        <h4 className="font-bold text-lg text-white">{pertanyaan}</h4>
                    </div>
                    <div className="flex-grow flex items-center justify-center mt-4">
                      <AnalysisRenderer questionData={detail} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  );
}

export default HasilAnalisisPage;
