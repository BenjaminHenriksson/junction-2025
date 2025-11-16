import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { Save, CheckCircle, AlertTriangle, Bot, User, Shield } from 'lucide-react';

export function Dashboard() {
  // Using range slider: [manualThreshold, agentThreshold]
  const [thresholds, setThresholds] = useState([65, 85]);
  const [saved, setSaved] = useState(false);

  const manualThreshold = thresholds[0];
  const agentThreshold = thresholds[1];

  const handleThresholdsChange = (value: number[]) => {
    // Ensure manual threshold is always less than agent threshold
    // Maintain minimum gap of 1% between thresholds
    if (value[0] >= value[1]) {
      setThresholds([Math.max(0, value[1] - 1), value[1]]);
    } else {
      setThresholds(value);
    }
  };

  const handleSave = () => {
    // TODO: Save to backend
    console.log('Saving thresholds:', { 
      manualThreshold: manualThreshold, 
      agentThreshold: agentThreshold 
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full overflow-auto bg-slate-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Risk Threshold Configuration</h2>
          <p className="text-slate-600 mt-1">Set boundaries for automatic AI handling, manual review, and no action</p>
        </div>

        <Card className="border-2 border-[#0D6672]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#0D6672]" />
              Risk Level Boundaries
            </CardTitle>
            <CardDescription>
              Drag the markers to adjust when each action type is triggered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Visual Risk Scale */}
            <div className="space-y-4">
              <div className="relative">
                {/* Risk Scale Background */}
                <div className="relative h-16 rounded-lg overflow-hidden border-2 border-slate-200">
                  {/* Low Risk Zone */}
                  <div 
                    className="absolute left-0 top-0 h-full bg-emerald-500"
                    style={{ width: `${manualThreshold}%` }}
                  />
                  {/* Medium Risk Zone */}
                  <div 
                    className="absolute top-0 h-full bg-amber-500"
                    style={{ 
                      left: `${manualThreshold}%`, 
                      width: `${agentThreshold - manualThreshold}%` 
                    }}
                  />
                  {/* High Risk Zone */}
                  <div 
                    className="absolute right-0 top-0 h-full bg-blue-600"
                    style={{ width: `${100 - agentThreshold}%` }}
                  />
                  
                  {/* Scale Markers */}
                  <div className="absolute inset-0 flex items-center justify-between px-2">
                    <span className="text-xs font-medium text-white drop-shadow">0%</span>
                    <span className="text-xs font-medium text-white drop-shadow">50%</span>
                    <span className="text-xs font-medium text-white drop-shadow">100%</span>
                  </div>
                </div>

                {/* Threshold Markers */}
                <div className="relative -mt-16 h-16">
                  {/* Manual Threshold Marker */}
                  <div 
                    className="absolute top-0 h-full w-0.5 bg-slate-800 z-10"
                    style={{ left: `${manualThreshold}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <div className="bg-slate-800 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg">
                        {manualThreshold}%
                      </div>
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800 mx-auto"></div>
                    </div>
                  </div>
                  
                  {/* Agent Threshold Marker */}
                  <div 
                    className="absolute top-0 h-full w-0.5 bg-slate-800 z-10"
                    style={{ left: `${agentThreshold}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <div className="bg-slate-800 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg">
                        {agentThreshold}%
                      </div>
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800 mx-auto"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual Handle Slider */}
              <div className="space-y-2">
                <Slider
                  value={thresholds}
                  onValueChange={handleThresholdsChange}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 px-1">
                  <span>Low Risk</span>
                  <span>Medium Risk</span>
                  <span>High Risk</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Risk Zones Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Low Risk Zone */}
              <div className="p-4 rounded-lg border-2 border-emerald-200 bg-emerald-50">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-900">Low Risk</h3>
                </div>
                <p className="text-sm text-emerald-700 mb-3">
                  <span className="font-semibold">&lt; {manualThreshold}%</span>
                </p>
                <p className="text-xs text-emerald-600">
                  No immediate action required. Orders are processed normally.
                </p>
              </div>

              {/* Medium Risk Zone */}
              <div className="p-4 rounded-lg border-2 border-amber-200 bg-amber-50">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">Medium Risk</h3>
                </div>
                <p className="text-sm text-amber-700 mb-3">
                  <span className="font-semibold">{manualThreshold}% - {agentThreshold - 1}%</span>
                </p>
                <p className="text-xs text-amber-600">
                  Requires manual review by operations team before processing.
                </p>
              </div>

              {/* High Risk Zone */}
              <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">High Risk</h3>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  <span className="font-semibold">≥ {agentThreshold}%</span>
                </p>
                <p className="text-xs text-blue-600">
                  AI agent automatically dispatched to resolve the issue.
                </p>
              </div>
            </div>

            <Separator />

            {/* Summary */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#0D6672]" />
                Current Configuration Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-slate-500">•</span>
                  <div>
                    <span className="font-medium text-slate-700">Low Risk (No Action):</span>
                    <span className="text-slate-600 ml-2">0% to {manualThreshold - 1}%</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500">•</span>
                  <div>
                    <span className="font-medium text-slate-700">Medium Risk (Manual Review):</span>
                    <span className="text-slate-600 ml-2">{manualThreshold}% to {agentThreshold - 1}%</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500">•</span>
                  <div>
                    <span className="font-medium text-slate-700">High Risk (AI Agent):</span>
                    <span className="text-slate-600 ml-2">{agentThreshold}% to 100%</span>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full bg-[#0D6672] hover:bg-[#0a5259] h-11 text-base"
            >
              <Save className="w-4 h-4 mr-2" />
              {saved ? 'Settings Saved!' : 'Save Configuration'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
