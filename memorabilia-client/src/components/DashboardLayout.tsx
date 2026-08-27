import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/", label: "Inventory", end: true },
  { to: "/sales", label: "Sales" },
  { to: "/purchases", label: "Purchases" },
  { to: "/reports", label: "Reports" },
  { to: "/grading", label: "Grading" },
];

export default function DashboardLayout() {
  return (
    <div className="dashboardShell">
      <header className="dashboardHeader">
        <div>
          <p className="sellerEyebrow">MemorabiliaDB</p>
          <h1>Card Seller Dashboard</h1>
        </div>
        <nav className="dashboardTabs" aria-label="Dashboard sections">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `dashboardTab ${isActive ? "active" : ""}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
