"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Phone, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw
} from "lucide-react";
import CheckAdminAuth from "@/lib/CheckAdminAuth";
import { auth } from "@/lib/firebase";

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState({
    totalStudents: 0,
    newJoiners: [],
    totalRevenue: 0,
    pendingPayments: 0,
    enquiries: [],
    demoSessions: [],
    paymentStats: [],
    attendanceStats: [],
    courseStats: {},
    enquiryStats: {},
    demoStats: {}
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAnalyticsData(result.analytics);
          setLastUpdated(new Date());
        }
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
    setLoading(false);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, subtitle }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-xl shadow-sm border"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 ${color} rounded-full`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          {trend === 'up' ? (
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
          )}
          <span className={trend === 'up' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {trendValue}
          </span>
          <span className="text-gray-500 ml-1">from last period</span>
        </div>
      )}
    </motion.div>
  );

  return (
    <CheckAdminAuth>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600 mt-1">Comprehensive insights and reports</p>
              </div>
              <div className="flex items-center space-x-4">
                <select 
                  value={selectedPeriod} 
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
                <button
                  onClick={fetchAnalytics}
                  disabled={loading}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={exportData}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Students"
                  value={analyticsData.totalStudents}
                  icon={Users}
                  color="bg-blue-500"
                  trend="up"
                  trendValue={`+${analyticsData.newJoiners?.length || 0}`}
                  subtitle="new this period"
                />
                
                <StatCard
                  title="Total Revenue"
                  value={`₹${analyticsData.totalRevenue?.toLocaleString() || 0}`}
                  icon={DollarSign}
                  color="bg-green-500"
                  trend="up"
                  trendValue="+12.5%"
                />
                
                <StatCard
                  title="Pending Payments"
                  value={`₹${analyticsData.pendingPayments?.toLocaleString() || 0}`}
                  icon={TrendingUp}
                  color="bg-orange-500"
                  trend="down"
                  trendValue="-5.2%"
                />
                
                <StatCard
                  title="New Enquiries"
                  value={analyticsData.enquiries?.length || 0}
                  icon={Phone}
                  color="bg-purple-500"
                  trend="up"
                  trendValue={`+${analyticsData.enquiries?.length || 0}`}
                  subtitle="this period"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Analytics */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white p-6 rounded-xl shadow-sm border"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Payment Analytics</h3>
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="space-y-4">
                    {analyticsData.paymentStats?.slice(-7).map((stat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">{stat.date}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">₹{stat.amount?.toLocaleString() || 0}</p>
                          <p className="text-xs text-gray-500">{stat.transactions || 0} transactions</p>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No payment data available</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Demo Session Attendance */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white p-6 rounded-xl shadow-sm border"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Demo Attendance</h3>
                    <div className="flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">{analyticsData.demoStats?.attendance || 0}%</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {analyticsData.attendanceStats?.slice(-7).map((stat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">{stat.date}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{stat.attendance || 0}%</p>
                          <p className="text-xs text-gray-500">{stat.totalSessions || 0} sessions</p>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No attendance data available</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Course Statistics */}
              {analyticsData.courseStats && Object.keys(analyticsData.courseStats).length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-xl shadow-sm border"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Course Statistics</h3>
                    <PieChart className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(analyticsData.courseStats).map(([course, stats]) => (
                      <div key={course} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900">{course}</h4>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">Enrolled: {stats.enrolled}</p>
                          <p className="text-sm text-gray-600">Revenue: ₹{stats.revenue?.toLocaleString() || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Enquiry Statistics */}
              {analyticsData.enquiryStats && Object.keys(analyticsData.enquiryStats).length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-xl shadow-sm border"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Enquiry Statistics</h3>
                    <Phone className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(analyticsData.enquiryStats).map(([status, count]) => (
                      <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{count}</p>
                        <p className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </CheckAdminAuth>
  );
}
