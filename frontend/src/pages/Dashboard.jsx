import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getAllUsers } from "../api/userApi";
import { useAppContext } from "../contexts/AppContext";
import Spinner from "../components/Spinner";
import {
  Users,
  CheckCircle,
  XCircle,
  PauseCircle,
  UserCheck,
  UserX,
  Ban,
} from "lucide-react";

const Dashboard = () => {
  const { accessToken } = useAppContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers(accessToken);
      setUsers((res.data?.data?.content || res.data?.content || (res.data?._embedded ? Object.values(res.data._embedded)[0] : res.data?.data) || []));
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const total = users.length;
  const active = users.filter((u) => u.status === "ACTIVE").length;
  const inactive = users.filter((u) => u.status === "INACTIVE").length;
  const suspended = users.filter((u) => u.status === "SUSPENDED").length;

  const Card = ({ icon, label, value }) => (
    <div className="flex items-center space-x-4 bg-white rounded-xl shadow p-5 border border-gray-100">
      <div>{icon}</div>
      <div>
        <h3 className="text-gray-600 text-sm">{label}</h3>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-10">
      <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          icon={<Users className="w-8 h-8 text-indigo-600" />}
          label="Total Users"
          value={total}
        />
        <Card
          icon={<UserCheck className="w-8 h-8 text-green-500" />}
          label="Active"
          value={active}
        />
        <Card
          icon={<UserX className="w-8 h-8 text-yellow-500" />}
          label="Inactive"
          value={inactive}
        />
        <Card
          icon={<Ban className="w-8 h-8 text-red-500" />}
          label="Suspended"
          value={suspended}
        />
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Recent Users
        </h2>

        {loading ? (
          <Spinner />
        ) : (
          /* Grid Responsivo para os Cards de Usuários */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map((u) => (
              <div
                key={u.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition flex flex-col"
              >
                {/* Cabeçalho do Card: Username e Status */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-gray-800 text-lg truncate pr-2">
                    {u.username}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : u.status === "INACTIVE"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {u.status}
                  </span>
                </div>

                {/* Corpo do Card: Email e Role */}
                <div className="space-y-2 flex-grow">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Email</span>
                    <span className="text-sm text-gray-700 truncate">{u.email}</span>
                  </div>
                  
                  <div className="flex flex-col mt-2">
                    <span className="text-xs text-gray-500 font-semibold uppercase mb-1">Role</span>
                    <span
                      className={`w-max text-xs font-semibold px-3 py-1 rounded-full ${
                        u.role === "ADMIN"
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {users.length === 0 && (
              <div className="col-span-full p-8 text-center text-gray-500 bg-white border border-gray-200 rounded-lg">
                No users found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
