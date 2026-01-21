import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Users, Eye } from "lucide-react";

const stageConfig = {
  new: { label: "New", color: "bg-gray-100 text-gray-700", borderColor: "border-gray-300" },
  contacted: { label: "Contacted", color: "bg-blue-100 text-blue-700", borderColor: "border-blue-300" },
  quoted: { label: "Quoted", color: "bg-purple-100 text-purple-700", borderColor: "border-purple-300" },
  negotiation: { label: "Negotiation", color: "bg-yellow-100 text-yellow-700", borderColor: "border-yellow-300" },
  followup: { label: "Follow-up", color: "bg-orange-100 text-orange-700", borderColor: "border-orange-300" },
  won: { label: "Won", color: "bg-green-100 text-green-700", borderColor: "border-green-300" },
  lost: { label: "Lost", color: "bg-red-100 text-red-700", borderColor: "border-red-300" }
};

export default function OpportunityPipeline({ opportunities, clients, yachts, onViewOpportunity }) {
  const stages = Object.keys(stageConfig);

  const getOpportunitiesByStage = (stage) => {
    return opportunities.filter(opp => opp.stage === stage);
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.client_name || 'Unknown';
  };

  const getYachtName = (yachtId) => {
    const yacht = yachts.find(y => y.id === yachtId);
    return yacht?.yacht_name || 'N/A';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stages.map(stage => {
        const stageOpps = getOpportunitiesByStage(stage);
        const stageTotal = stageOpps.reduce((sum, opp) => sum + (parseFloat(opp.total_amount) || 0), 0);
        const config = stageConfig[stage];

        return (
          <div key={stage}>
            <Card className={`border-t-4 ${config.borderColor}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-semibold">{config.label}</CardTitle>
                  <Badge className={config.color}>{stageOpps.length}</Badge>
                </div>
                <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                  {stageTotal.toLocaleString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {stageOpps.map(opp => (
                  <Card key={opp.id} className="border hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{opp.opportunity_code}</p>
                            <p className="text-xs text-gray-600">{getClientName(opp.client_id)}</p>
                          </div>
                          <Badge className="text-xs capitalize">{opp.opportunity_type}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {opp.date_of_charter || 'Not set'}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Users className="w-3 h-3" />
                          {getYachtName(opp.yacht_id)}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-bold text-sm flex items-center gap-1">
                              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                              {opp.total_amount}
                            </span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => onViewOpportunity(opp)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="text-xs text-gray-500">
                          Probability: {opp.probability_percentage}%
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {stageOpps.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No opportunities
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}