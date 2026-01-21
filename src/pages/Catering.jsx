import React from "react";
import { Utensils } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Catering() {
  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Catering</h1>
          <p className="text-gray-600">Manage catering services for bookings</p>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-20 text-center">
            <Utensils className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Catering Module</h3>
            <p className="text-gray-500">Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}