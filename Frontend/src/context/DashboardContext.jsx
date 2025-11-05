import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "../utils/axiosConfig";
import { useAuth } from "./AuthContext.jsx";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const { user, logout } = useAuth();

  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState("all");
  const [period, setPeriod] = useState("lifetime");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [avatarOpen, setAvatarOpen] = useState(false);

  // Load shops on mount / when user changes
  useEffect(() => {
    let ignore = false;
    async function loadShops() {
      try {
        const { data } = await axios.get("/api/shops", {
          headers: {
            Authorization: `Bearer ${
              user ? localStorage.getItem("auth_token") : ""
            }`,
          },
        });
        const list = Array.isArray(data?.data?.shops)
          ? data.data.shops
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        if (!ignore) {
          setShops(list);
          // Keep 'all' as default; only set if currently empty
          if (!selectedShop) setSelectedShop("all");
        }
      } catch (e) {
        if (!ignore) setShops([]);
      }
    }
    loadShops();
    return () => {
      ignore = true;
    };
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      logout,
      shops,
      selectedShop,
      setSelectedShop,
      period,
      setPeriod,
      startDate,
      setStartDate,
      endDate,
      setEndDate,
      avatarOpen,
      setAvatarOpen,
    }),
    [user, logout, shops, selectedShop, period, startDate, endDate, avatarOpen]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx)
    throw new Error("useDashboard must be used within a DashboardProvider");
  return ctx;
}
