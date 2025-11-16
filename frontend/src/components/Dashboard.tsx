import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { AlertCircle, Save, CheckCircle } from 'lucide-react';

export function Dashboard() {
  const [agentThreshold, setAgentThreshold] = useState([85]);
  const [manualThreshold, setManualThreshold] = useState([65]);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: Save to backend
    console.log('Saving thresholds:', { agentThreshold: agentThreshold[0], manualThreshold: manualThreshold[0] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full overflow-auto bg-slate-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-slate-900">Risk Threshold Configuration</h2>
          <p className="text-slate-600 mt-1">Configure when AI agents are dispatched vs when manual review is required</p>
        </div>

        <Card className="border-2 border-[#0D6672]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#0D6672]" />
              Risk Threshold Configuration
            </CardTitle>
            <CardDescription>
              Adjust thresholds to control when agents are dispatched or manual review is required
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="agent-threshold">Agent Dispatch Threshold (Highest Risk)</Label>
                  <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
                    ≥ {agentThreshold[0]}%
                  </span>
                </div>
                <Slider
                  id="agent-threshold"
                  value={agentThreshold}
                  onValueChange={setAgentThreshold}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-slate-500">
                  Issues with risk score ≥ {agentThreshold[0]}% will automatically dispatch an AI agent
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="manual-threshold">Manual Review Threshold (Medium Risk)</Label>
                  <span className="text-sm px-2 py-1 bg-amber-100 text-amber-700 rounded-md">
                    {manualThreshold[0]}% - {agentThreshold[0] - 5}%
                  </span>
                </div>
                <Slider
                  id="manual-threshold"
                  value={manualThreshold}
                  onValueChange={setManualThreshold}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-slate-500">
                  Issues with risk score {manualThreshold[0]}% - {agentThreshold[0] - 5}% require human review
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>No Action Threshold (Low Risk)</Label>
                  <span className="text-sm px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">
                    &lt; {manualThreshold[0]}%
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Issues with risk score below {manualThreshold[0]}% require no immediate action
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-sm mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#0D6672]" />
                Current Configuration
              </h4>
              <div className="space-y-1 text-xs text-slate-600">
                <p>• Risk ≥ {agentThreshold[0]}%: <span className="text-blue-600">Agentic handling (Highest Risk)</span></p>
                <p>• Risk {manualThreshold[0]}% - {agentThreshold[0] - 5}%: <span className="text-amber-600">Manual review (Medium Risk)</span></p>
                <p>• Risk &lt; {manualThreshold[0]}%: <span className="text-emerald-600">No action (Low Risk)</span></p>
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full bg-[#0D6672] hover:bg-[#0a5259]"
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