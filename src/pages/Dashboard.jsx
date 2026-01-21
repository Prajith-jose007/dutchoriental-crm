
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Ship,
  ShoppingCart,
  UserCog,
  Coffee,
  DollarSign,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import logo from "@/assets/logo.png";
import { useAuth } from "@/lib/AuthContext";

export default function Dashboard() {
  const modules = [
    {
      title: "CRM",
      icon: Ship,
      bgColor: "from-blue-500 to-blue-600",
      url: "CRMDashboard"
    },
    {
      title: "Purchase",
      icon: ShoppingCart,
      bgColor: "from-green-500 to-green-600",
      url: "PurchaseDashboard"
    },
    {
      title: "HRMS",
      icon: UserCog,
      bgColor: "from-purple-500 to-purple-600",
      url: "HRMDashboard"
    },
    {
      title: "POS",
      icon: Coffee,
      bgColor: "from-orange-500 to-orange-600",
      url: "POSDashboard"
    },
    {
      title: "Accounts",
      icon: DollarSign,
      bgColor: "from-indigo-500 to-indigo-600",
      url: "AccountsDashboard"
    },
    {
      title: "Admin",
      icon: Shield,
      bgColor: "from-red-500 to-red-600",
      url: "Users"
    }
  ];

  const { user } = useAuth();

  const filteredModules = modules.filter(module => {
    if (user?.role === 'admin') return true;
    const access = user?.app_access || [];

    if (module.title === "CRM" && access.includes('crm')) return true;
    if (module.title === "Purchase" && access.includes('purchase')) return true;
    if (module.title === "HRMS" && access.includes('hrms')) return true;
    if (module.title === "POS" && access.includes('pos')) return true;
    if (module.title === "Accounts" && access.includes('accounts')) return true;
    if (module.title === "Admin") return false;

    return false;
  });

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen flex items-center justify-center">
      <div className="max-w-5xl mx-auto w-full">
        <div className="text-center mb-16">
          <img src={logo} alt="DutchOriental" className="h-24 mx-auto mb-6" />
          {/* <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            DutchOriental
          </h1> */}
          <p className="text-xl text-gray-600">Select an application</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {filteredModules.map((module, index) => (
            <Link key={index} to={createPageUrl(module.url)}>
              <Card className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-white cursor-pointer group">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${module.bgColor} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <module.icon className="w-10 h-10 text-white" />
                  </div>

                  <h2 className="text-lg font-bold text-gray-900">
                    {module.title}
                  </h2>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
