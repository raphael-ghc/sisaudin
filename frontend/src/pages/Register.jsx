import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { registerUser } from "../api/authApi";
import { Mail, Lock, ShieldCheck, Search, User } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();


  const handleEmailChange = async (e) => {
    const newEmail = e.target.value.toLowerCase();
    setEmail(newEmail);

    // Verifica se o texto digitado já contém um '@'
    if (newEmail.includes('@')) {
      // Pega tudo antes do @ e define como username
      const usernamePart = newEmail.split('@')[0];
      setUsername(usernamePart);
    } else {
      // Enquanto não tiver '@', o usuário fica igual ao texto que está sendo digitado
      setUsername(newEmail);
    }
  };


  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!username || !email || !password) {
      toast.error("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      const res = await registerUser({ username, email, password });
      if (res.data.success) {
        toast.success("Registration successful! Please login.");
        navigate("/login");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
        
        {/*<h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          Create an Account
        </h2>*/}

        <div className="flex flex-col items-center mb-8">
          <img className="bg-white p-6" src="https://web-app.ghc.com.br/cdn/app-logos/logo_completo_dark.svg" alt="Logo Grupo Hospitalar Conceição" />

          {/* Logo Placeholder (Escudo e Lupa) - Substitua pela sua tag <img> com a imagem real 
          <div className="relative w-24 h-24 mb-4 flex items-center justify-center rounded-full bg-slate-0 border-2 border-slate-100 shadow-inner">
            <ShieldCheck size={48} color='#00695C' strokeWidth={1.5} className="absolute" />
            <Search size={24} color="#1F2937" strokeWidth={2.5} className="absolute translate-x-3 translate-y-3 bg-slate-0 rounded-full p-0.5" />
          </div>*/}
          
          <h1 
            className="text-2xl font-bold tracking-tight "
          >
            SisAudin
          </h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">            
            {/* Campo de Nome 
            <div className="space-y-1">
              <label htmlFor="nome" className="block text-sm font-semibold text-slate-700">Nome Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="nome" type="text" required
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg bg-slate-0 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  placeholder="Digite seu nome completo"
                />
              </div>
            </div>   */}

          {/*<div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>*/}          
           {/* Campo de Username 
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg bg-slate-0 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                placeholder="seu.email@ghc.com.br"
              />
            </div>
          </div>*/}


          {/*<div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>*/}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                value={email}
                onChange= {handleEmailChange}
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg bg-slate-0 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                placeholder="seu.email@ghc.com.br"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">
              Nome do Usuário
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                required readOnly
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-200, text-slate-600 e cursor-not-allowed bg-slate-300 block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg bg-slate-0 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                placeholder="Auto-preenchido"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition botao-verde-escuro"
            disabled={loading} 
          >
            {loading ? "Criando..." : "Criar"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-indigo-500 hover:underline">
            Acessar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
