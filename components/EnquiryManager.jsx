"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, Download, RefreshCw } from "lucide-react";

export default function EnquiryManager({ onSubmit, onExportEmails, onDownloadCSV }) {
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    qualification: "",
    college: "",
    yearOfPassing: "",
    workExp: "",
    company: "",
    course: "",
    timingsPreferred: "",
    reference: "",
    remarks: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmittingEnquiry(true);

    try {
      await onSubmit(enquiryForm);
      
      // Reset form on success
      setEnquiryForm({
        name: "",
        email: "",
        phone: "",
        gender: "",
        qualification: "",
        college: "",
        yearOfPassing: "",
        workExp: "",
        company: "",
        course: "",
        timingsPreferred: "",
        reference: "",
        remarks: ""
      });
      setShowEnquiryForm(false);
    } catch (error) {
      console.error("Error submitting enquiry:", error);
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-md mb-8"
    >
      <div className="p-4 sm:p-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Enquiries</h3>
          <div className="flex items-center space-x-2">
            <button 
              onClick={onExportEmails}
              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center"
              title="Copy all email addresses"
            >
              <Mail className="w-3 h-3 mr-1" />
              Copy Emails
            </button>
            <button 
              onClick={onDownloadCSV}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              title="Download as CSV"
            >
              <Download className="w-3 h-3 mr-1" />
              CSV
            </button>
            <button 
              onClick={() => setShowEnquiryForm(!showEnquiryForm)}
              className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              {showEnquiryForm ? 'Cancel' : '+ Add Enquiry'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6">
        {/* Enquiry Form */}
        {showEnquiryForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-6 bg-purple-50 rounded-lg border border-purple-200 max-h-[600px] overflow-y-auto">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">New Enquiry Form</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Student Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                <input
                  type="text"
                  value={enquiryForm.name}
                  onChange={(e) => setEnquiryForm({...enquiryForm, name: e.target.value})}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Full name"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={enquiryForm.gender === "Male"}
                      onChange={(e) => setEnquiryForm({...enquiryForm, gender: e.target.value})}
                      required
                      className="mr-2"
                    />
                    <span className="text-sm">Male</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={enquiryForm.gender === "Female"}
                      onChange={(e) => setEnquiryForm({...enquiryForm, gender: e.target.value})}
                      className="mr-2"
                    />
                    <span className="text-sm">Female</span>
                  </label>
                </div>
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qualification *</label>
                <input
                  type="text"
                  value={enquiryForm.qualification}
                  onChange={(e) => setEnquiryForm({...enquiryForm, qualification: e.target.value})}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="B.Tech, MCA, etc."
                />
              </div>

              {/* College */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">College *</label>
                <input
                  type="text"
                  value={enquiryForm.college}
                  onChange={(e) => setEnquiryForm({...enquiryForm, college: e.target.value})}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="College name"
                />
              </div>

              {/* Year of Passing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year of Passing *</label>
                <input
                  type="text"
                  value={enquiryForm.yearOfPassing}
                  onChange={(e) => setEnquiryForm({...enquiryForm, yearOfPassing: e.target.value})}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="2024"
                />
              </div>

              {/* Work Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Experience</label>
                <input
                  type="text"
                  value={enquiryForm.workExp}
                  onChange={(e) => setEnquiryForm({...enquiryForm, workExp: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="2 years / Fresher"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={enquiryForm.company}
                  onChange={(e) => setEnquiryForm({...enquiryForm, company: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Company name"
                />
              </div>

              {/* Mobile No */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No. *</label>
                <input
                  type="tel"
                  value={enquiryForm.phone}
                  onChange={(e) => setEnquiryForm({...enquiryForm, phone: e.target.value})}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+91 9876543210"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail ID *</label>
                <input
                  type="email"
                  value={enquiryForm.email}
                  onChange={(e) => setEnquiryForm({...enquiryForm, email: e.target.value})}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>

              {/* Course Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Required *</label>
                <select
                  value={enquiryForm.course}
                  onChange={(e) => setEnquiryForm({...enquiryForm, course: e.target.value})}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select course</option>
                  <option value="React JS">React JS</option>
                  <option value="Python">Python</option>
                  <option value="Full Stack Development">Full Stack Development</option>
                  <option value="Java">Java</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Web Development">Web Development</option>
                </select>
              </div>

              {/* Timings Preferred */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timings Preferred</label>
                <input
                  type="text"
                  value={enquiryForm.timingsPreferred}
                  onChange={(e) => setEnquiryForm({...enquiryForm, timingsPreferred: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Morning / Evening / Weekends"
                />
              </div>

              {/* Reference */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="reference"
                      value="Friends"
                      checked={enquiryForm.reference === "Friends"}
                      onChange={(e) => setEnquiryForm({...enquiryForm, reference: e.target.value})}
                      className="mr-2"
                    />
                    <span className="text-sm">Friends</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="reference"
                      value="News Paper"
                      checked={enquiryForm.reference === "News Paper"}
                      onChange={(e) => setEnquiryForm({...enquiryForm, reference: e.target.value})}
                      className="mr-2"
                    />
                    <span className="text-sm">News Paper</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="reference"
                      value="Flyers"
                      checked={enquiryForm.reference === "Flyers"}
                      onChange={(e) => setEnquiryForm({...enquiryForm, reference: e.target.value})}
                      className="mr-2"
                    />
                    <span className="text-sm">Flyers</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="reference"
                      value="TV"
                      checked={enquiryForm.reference === "TV"}
                      onChange={(e) => setEnquiryForm({...enquiryForm, reference: e.target.value})}
                      className="mr-2"
                    />
                    <span className="text-sm">TV</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="reference"
                      value="Online"
                      checked={enquiryForm.reference === "Online"}
                      onChange={(e) => setEnquiryForm({...enquiryForm, reference: e.target.value})}
                      className="mr-2"
                    />
                    <span className="text-sm">Online</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="reference"
                      value="Others"
                      checked={enquiryForm.reference === "Others"}
                      onChange={(e) => setEnquiryForm({...enquiryForm, reference: e.target.value})}
                      className="mr-2"
                    />
                    <span className="text-sm">Others</span>
                  </label>
                </div>
              </div>

              {/* Remarks */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={enquiryForm.remarks}
                  onChange={(e) => setEnquiryForm({...enquiryForm, remarks: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Additional remarks or notes..."
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowEnquiryForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingEnquiry}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submittingEnquiry ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Enquiry'
                )}
              </button>
            </div>
          </form>
        )}

        {/* No enquiries message when form is not shown */}
        {!showEnquiryForm && (
          <div className="text-center py-8 text-gray-500">
            <Phone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="mb-4">Click &quot;+ Add Enquiry&quot; to record new student enquiries</p>
            <p className="text-xs text-gray-400">You can also export enquiry data using the buttons above</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

