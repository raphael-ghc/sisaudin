import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4 min-h-[100vh] bg-gradient-to-br from-yellow-100 via-red-100 to-pink-100 rounded-lg">
      <h1 className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-pink-500 animate-bounce mb-4">
        403
      </h1>
      <p className="text-2xl font-semibold text-gray-800 mb-2">
        Hold on! You’re not allowed here.
      </p>
      <p className="text-gray-600 mb-6 max-w-md">
        Você não tem permissão para acessar esta página. 
      </p>
      <Link
        to="/profile"
        className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-red-500 text-white font-medium rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-transform duration-300"
      >
        🏠 Voltar para a Página Inicial
      </Link>
    </div>
  );
};

export default Unauthorized;
