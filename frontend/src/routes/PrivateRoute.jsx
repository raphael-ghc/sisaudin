import { Navigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import Unauthorized from "../pages/Unauthorized";

const PrivateRoute = ({ children, role }) => {
  const { accessToken, jwtPayload } = useAppContext();

  if (!accessToken || accessToken === "null" || accessToken === "undefined") {
    return <Navigate to="/login" />;
  }

  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(jwtPayload?.role)) {
      return <Unauthorized />;
    }
  }

  return children;
};

export default PrivateRoute;
