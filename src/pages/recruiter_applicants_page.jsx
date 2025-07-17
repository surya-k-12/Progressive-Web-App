import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useSession } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyJobs } from "@/api/apiJobs";
import useFetch from "@/hooks/use-fetch";
import { Navigate } from "react-router-dom";
import ApplicationCard from "@/components/application-card";
import { parseResume } from "@/utils/resumeParser";
import { updateApplicationStatus } from "@/api/apiApplications";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

const RecruiterApplicantsPage = () => {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [parsingResults, setParsingResults] = useState({});
  const [parsingAll, setParsingAll] = useState(false);
  const [updatingAll, setUpdatingAll] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const {
    loading: loadingJobs,
    data: jobs,
    fn: fnJobs,
    setData: setJobs,
  } = useFetch(getMyJobs, { recruiter_id: user?.id });

  useEffect(() => {
    if (user?.id) {
      fnJobs();
    }
  }, [user?.id]);

  const handleParseResume = async (application) => {
    try {
      setLoading(true);
      // Get the selected job's requirements
      const selectedJobData = jobs?.find(job => job.id === selectedJob);
      if (!selectedJobData) {
        console.error('Job data not found');
        return;
      }

      // Fetch resume content
      const response = await fetch(application.resume);
      const resumeText = await response.text();
      
      // Parse resume with job requirements
      const result = parseResume(resumeText, selectedJobData.requirements);
      
      // Store parsing results
      setParsingResults(prev => ({
        ...prev,
        [application.id]: {
          ...result,
          showResults: true // Add flag to show results
        }
      }));

      // Show success message
      showNotification('success', 'Resume parsed successfully!');
    } catch (error) {
      console.error('Error parsing resume:', error);
      showNotification('error', 'Failed to parse resume');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId, status) => {
    try {
      setLoading(true);
      const application = jobs
        ?.find((job) => job.id === selectedJob)
        ?.applications?.find((app) => app.id === applicationId);

      if (!application) {
        console.error('Application not found');
        return;
      }

      if (!session?.token) {
        console.error('No session token available');
        return;
      }

      // Update in database
      const response = await updateApplicationStatus(session.token, {
        job_id: selectedJob,
        candidate_id: application.candidate_id,
        status: status
      });

      if (response) {
        // Update local state immediately
        setSelectedStatus(prev => ({
          ...prev,
          [applicationId]: status
        }));

        // Update the jobs state to reflect the new status
        setJobs(prevJobs => {
          return prevJobs.map(job => {
            if (job.id === selectedJob) {
              return {
                ...job,
                applications: job.applications.map(app => {
                  if (app.id === applicationId) {
                    return {
                      ...app,
                      status: status
                    };
                  }
                  return app;
                })
              };
            }
            return job;
          });
        });

        // Hide parsing results after successful update
        setParsingResults(prev => ({
          ...prev,
          [applicationId]: {
            ...prev[applicationId],
            showResults: false
          }
        }));

        // Show success message
        showNotification('success', 'Status updated successfully!');

        // Refresh jobs list to get updated data
        await fnJobs();
      } else {
        console.error('Failed to update status in database');
        showNotification('error', 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('error', 'Error updating status');
    } finally {
      setLoading(false);
    }
  };

  const handleParseAllResumes = async () => {
    if (!selectedJob) return;
    
    try {
      setParsingAll(true);
      const selectedJobData = jobs?.find(job => job.id === selectedJob);
      if (!selectedJobData) {
        console.error('Job data not found');
        return;
      }

      const applications = selectedJobData.applications;
      const newParsingResults = {};
      
      for (const application of applications) {
        try {
          const result = await parseResume(application.resume, selectedJobData.requirements);
          newParsingResults[application.id] = result;
        } catch (error) {
          console.error(`Error parsing resume for application ${application.id}:`, error);
        }
      }

      setParsingResults(newParsingResults);
    } catch (error) {
      console.error('Error parsing all resumes:', error);
    } finally {
      setParsingAll(false);
    }
  };

  const handleUpdateAllStatuses = async () => {
    if (!selectedJob) return;
    
    try {
      setUpdatingAll(true);
      const applications = jobs?.find(job => job.id === selectedJob)?.applications || [];
      
      for (const application of applications) {
        if (parsingResults[application.id]) {
          const suggestedStatus = parsingResults[application.id].suggestedStatus;
          await handleUpdateStatus(application.id, suggestedStatus);
        }
      }
    } catch (error) {
      console.error('Error updating all statuses:', error);
    } finally {
      setUpdatingAll(false);
    }
  };

  const getFilteredApplications = (job) => {
    if (!job?.applications) return [];
    return job.applications.filter(app => app.status !== "applied");
  };

  // Show loading state while user data is being fetched
  if (!isLoaded || loadingJobs) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  // Redirect non-recruiters to jobs page
  if (user?.unsafeMetadata?.role !== "recruiter") {
    console.log("User role:", user?.unsafeMetadata?.role);
    return <Navigate to="/jobs" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white px-6 py-10">
      {notification.show && (
        <div className="fixed top-4 right-4 z-50">
          <Alert variant={notification.type === 'success' ? 'default' : 'destructive'}>
            <Info className="h-4 w-4" />
            <AlertTitle>{notification.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        </div>
      )}

      <Button
        onClick={() => navigate("/")}
        className="mb-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
      >
        Back
      </Button>

      <h1 className="text-center text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 pb-6 animate-gradient">
        Job Applications
      </h1>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Jobs List */}
          <div className="col-span-1">
            <Card className="bg-gray-800/50 border border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Your Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {jobs?.map((job) => {
                    const filteredApplications = getFilteredApplications(job);
                    if (filteredApplications.length === 0) return null;
                    
                    return (
                      <Button
                        key={job.id}
                        variant={selectedJob === job.id ? "default" : "outline"}
                        className={`w-full text-left ${
                          selectedJob === job.id
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-gray-700/50 hover:bg-gray-700"
                        }`}
                        onClick={() => setSelectedJob(job.id)}
                      >
                        <div className="flex justify-between items-center">
                          <span>{job.title}</span>
                          <span className="text-sm bg-gray-600 px-2 py-1 rounded-full">
                            {filteredApplications.length} active applicants
                          </span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Applications List */}
          <div className="col-span-2">
            <Card className="bg-gray-800/50 border border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedJob ? (
                  getFilteredApplications(jobs?.find(job => job.id === selectedJob))?.length > 0 ? (
                    <>
                      <div className="flex gap-4 mb-6">
                        <Button
                          onClick={handleParseAllResumes}
                          disabled={parsingAll || loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {parsingAll ? (
                            <div className="flex items-center gap-2">
                              <BarLoader width={20} height={20} color="#ffffff" />
                              Parsing All Resumes...
                            </div>
                          ) : (
                            "Parse All Resumes"
                          )}
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {getFilteredApplications(jobs?.find(job => job.id === selectedJob))?.map((application) => (
                          <div key={application.id}>
                            <ApplicationCard
                              application={application}
                              isCandidate={false}
                              parsingResults={parsingResults}
                              selectedStatus={selectedStatus[application.id]}
                              onStatusChange={(status) => handleUpdateStatus(application.id, status)}
                              onParseResume={() => handleParseResume(application)}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      No active applications for this job
                    </div>
                  )
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    Select a job to view applications
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterApplicantsPage;