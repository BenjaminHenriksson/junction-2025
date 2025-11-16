import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Save, TrendingUp, Users, Bot, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Separator } from './ui/separator';

// Mock data for statistics
const weeklyData = [
  { week: 'Week 1', agents: 45, humans: 12, noAction: 8 },
  { week: 'Week 2', agents: 52, humans: 15, noAction: 10 },
  { week: 'Week 3', agents: 48, humans: 10, noAction: 6 },
  { week: 'Week 4', agents: 61, humans: 14, noAction: 9 },
  { week: 'Week 5', agents: 58, humans: 11, noAction: 7 },
  { week: 'Week 6', agents: 67, humans: 13, noAction: 5 },
];

const monthlyData = [
  { month: 'Jan', agents: 180, humans: 45, noAction: 28 },
  { month: 'Feb', agents: 195, humans: 52, noAction: 31 },
  { month: 'Mar', agents: 210, humans: 48, noAction: 25 },
  { month: 'Apr', agents: 225, humans: 42, noAction: 22 },
  { month: 'May', agents: 242, humans: 40, noAction: 20 },
  { month: 'Jun', agents: 258, humans: 38, noAction: 18 },
];

const resolutionData = [
  { name: 'Agentic Handling', value: 1178, color: '#3b82f6' },
  { name: 'Human Support', value: 265, color: '#f59e0b' },
  { name: 'No Action', value: 149, color: '#10b981' },
];

const avgResolutionTime = [
  { category: 'Agentic', time: 12.5 },
  { category: 'Human', time: 45.3 },
];

export function Dashboard() {
  const [agentThreshold, setAgentThreshold] = useState([85]);
  const [manualThreshold, setManualThreshold] = useState([65]);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const totalCases = resolutionData.reduce((sum, item) => sum + item.value, 0);
  const agentResolutionRate = ((resolutionData[0].value / totalCases) * 100).toFixed(1);

  return (
    <div className="h-full overflow-auto bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-[#0D6672]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0D6672]" />
                Total Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{totalCases.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">Last 6 months</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                Agent Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl text-blue-600">{agentResolutionRate}%</div>
              <p className="text-xs text-slate-500 mt-1">{resolutionData[0].value} cases</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                Human Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl text-amber-600">{resolutionData[1].value}</div>
              <p className="text-xs text-slate-500 mt-1">Cases escalated</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Avg. Resolution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl text-emerald-600">{avgResolutionTime[0].time}m</div>
              <p className="text-xs text-slate-500 mt-1">Agentic handling</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Threshold Settings */}
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

          {/* Resolution Distribution */}
          <Card className="border-2 border-[#0D6672]/20">
            <CardHeader>
              <CardTitle>Resolution Distribution</CardTitle>
              <CardDescription>How cases are being handled across the system</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={resolutionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {resolutionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {resolutionData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Trend */}
        <Card className="border-2 border-[#0D6672]/20">
          <CardHeader>
            <CardTitle>Weekly Resolution Trends</CardTitle>
            <CardDescription>Case resolution breakdown over the last 6 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="agents" name="Agentic Handling" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="humans" name="Human Support" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="noAction" name="No Action" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="border-2 border-[#0D6672]/20">
          <CardHeader>
            <CardTitle>Monthly Resolution Trends</CardTitle>
            <CardDescription>6-month overview showing automation efficiency improvements</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="agents" 
                  name="Agentic Handling" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="humans" 
                  name="Human Support" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="noAction" 
                  name="No Action" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average Resolution Time Comparison */}
        <Card className="border-2 border-[#0D6672]/20">
          <CardHeader>
            <CardTitle>Average Resolution Time</CardTitle>
            <CardDescription>Comparison of resolution efficiency between agentic and human handling</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={avgResolutionTime} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" label={{ value: 'Minutes', position: 'insideBottom', offset: -5 }} />
                <YAxis type="category" dataKey="category" />
                <Tooltip />
                <Bar dataKey="time" fill="#0D6672" radius={[0, 4, 4, 0]}>
                  {avgResolutionTime.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">💡 Insight:</span> Agentic handling is{' '}
                <span className="font-semibold">{(avgResolutionTime[1].time / avgResolutionTime[0].time).toFixed(1)}x faster</span> than human support on average
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}