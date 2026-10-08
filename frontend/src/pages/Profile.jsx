import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAppContext } from "../contexts/AppContext";
import { getProfile } from "../api/userApi";
import Spinner from "../components/Spinner";
import { Sparkles, LayoutGrid, GraduationCap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { accessToken } = useAppContext();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getProfile(accessToken);
      if (res.data.success) {
        setProfile(res.data.data);
      }
    } catch (err) {
      toast.error("Erro ao buscar perfil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const firstName = profile?.nome ? profile.nome.split(" ")[0] : "Auditor";
  
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = now.toLocaleString('pt-BR', { month: 'short' });
  const year = now.getFullYear();
  const time = now.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const todayFormatted = `${day} de ${month.charAt(0).toUpperCase() + month.slice(1)}, ${year} às ${time}`;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Banner de boas-vindas */}
      <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 flex flex-col justify-center items-start">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase mb-6">
          <Sparkles size={14} />
          <span>Bem-vindo ao seu ambiente</span>
        </div>

        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-2">
          Olá, <span className="text-indigo-600">{firstName}</span>.<br />
          O que vamos acessar hoje?
        </h1>
        
        <p className="text-gray-500 text-lg mt-4 max-w-2xl">
          Seu centro de controle para governança, auditoria e acompanhamento de
          resultados estratégicos da instituição. Último acesso em {todayFormatted}.
        </p>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Base de Conhecimento */}
        <div 
          onClick={() => navigate('/base-conhecimento')}
          className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow cursor-pointer relative group"
        >
          <div className="absolute top-8 right-8 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
            <ArrowRight size={16} />
          </div>
          
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
            <LayoutGrid size={28} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Base de Conhecimento
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Consulte os tutoriais passo a passo em vídeo, manuais de uso e documentação dos fluxos operacionais do sistema.
          </p>
        </div>

        {/* Card 2: Dashboard Executivo */}
        <div 
          onClick={() => navigate('/dash-auditoria')}
          className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow cursor-pointer relative group"
        >
          <div className="absolute top-8 right-8 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
            <ArrowRight size={16} />
          </div>
          
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
            <GraduationCap size={28} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Dashboard Executivo
          </h2>
          <p className="text-gray-500 leading-relaxed">
             Acesse a visão geral do PAINT, acompanhamento de execução, atrasos e matriz de riscos das recomendações.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Profile;
