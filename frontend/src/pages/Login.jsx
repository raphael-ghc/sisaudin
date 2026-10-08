import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import { useAppContext } from "../contexts/AppContext";
import { loginUser } from "../api/authApi";
import { Mail, Lock, ShieldCheck, Search, User } from 'lucide-react';

const Login = () => {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setAccessToken, setRefreshToken, setJwtPayload } = useAppContext();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!username || !password) {
      toast.error("Username and password are required.");
      setLoading(false);
      return;
    }

    try {
      const res = await loginUser({ username, password });

      if (res.data.success) {
        const { accessToken, refreshToken } = res.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);

        const decoded = jwtDecode(accessToken);
        setJwtPayload(decoded);
        // console.log(decoded);

        toast.success("Login successful!");

        // Redirect based on role
        navigate(decoded.role === "ADMIN" ? "/dashboard" : "/profile");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
        
        {/*<div className="flex flex-col items-center mb-8 topo" >
          <img src="https://www.ghc.com.br/img/logo_original.png" alt="Logo Grupo Hospitalar Conceição" />
          <h1 
            className="text-3xl font-bold tracking-tight text-white py-2 rounded-lg topo"
          >
            SisAudin
          </h1>
        </div>*/}

        <div className="flex flex-col items-center mb-8">
          <img className="bg-white p-6" src="https://web-app.ghc.com.br/cdn/app-logos/logo_completo_dark.svg" alt="Logo Grupo Hospitalar Conceição" />

          {/* Logo Placeholder (Escudo e Lupa) - Substitua pela sua tag <img> com a imagem real 
          <div className="relative w-24 h-24 mb-4 flex items-center justify-center rounded-full bg-slate-50 border-2 border-slate-100 shadow-inner">
            <ShieldCheck size={48} color='#00695C' strokeWidth={1.5} className="absolute" />
            <Search size={24} color="#1F2937" strokeWidth={2.5} className="absolute translate-x-3 translate-y-3 bg-slate-50 rounded-full p-0.5" />
          </div>*/}
          
          <h1 
            className="text-2xl font-bold tracking-tight"
          >
            SisAudin
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Campo de E-username */}
          <div className="space-y-1">
            <label htmlFor="username" className="block text-sm font-semibold text-slate-700">
             Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {/*<Mail className="h-5 w-5 text-slate-400" />*/}
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                placeholder="Seu Nome de Usuário"
              />
            </div>
          </div>


          {/* <div>
            <label
              htmlFor="username"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>*/}

          {/* Campo de Senha */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                placeholder="Sua senha"
              />
              {/* Botão de Mostrar/Esconder Senha */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/*<div>
            <label
              htmlFor="password"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
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
          </div>*/}

          <button
            type="submit"
            className="w-full bg-indigo-500 text-white py-2 rounded-lg botao-verde-escuro  hover:bg-indigo-600 transition"
            disabled={loading}             
          >
            {loading ? "Acessando ..." : "Acessar"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
