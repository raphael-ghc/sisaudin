import { Navigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";

const PublicRoute = ({ children }) => {
  const { accessToken } = useAppContext();

  if (accessToken && accessToken !== "null" && accessToken !== "undefined") {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default PublicRoute;
