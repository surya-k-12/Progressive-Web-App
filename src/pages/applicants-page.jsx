import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "@clerk/clerk-react";
import useFetch from "@/hooks/use-fetch";
import { getSingleJob } from "@/api/apiJobs";
import ApplicationCard from "@/components/application-card";
import { BarLoader } from "react-spinners";

const ApplicantsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { session, isLoaded: isSessionLoaded } = useSession();
  
  const {
    loading,
    data: job,
    fn: fetchJob,
  } = useFetch(getSingleJob, {
    job_id: jobId,
  });

  // Wait for both session to be loaded AND jobId to be available
  useEffect(() => {
    if (isSessionLoaded && jobId && session) {
      fetchJob();
    }
  }, [isSessionLoaded, jobId, session]);

  // Combined loading state
  const isLoading = loading || !isSessionLoaded;

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div>
        <button
          onClick={() => navigate("/my-jobs")}
          className="self-start px-4 py-2 bg-red-600 text-white rounded hover:bg-blue-700 transition duration-200"
        >
          Back
        </button>
      </div>
      <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
        Applicants
      </h1>
      {isLoading ? (
        <BarLoader width={"100%"} color="#36d7b7" />
      ) : job && Array.isArray(job?.applications) && job.applications.length > 0 ? (
        <div className="space-y-4">
          {job.applications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      ) : (
        <p className="text-gray-700 dark:text-gray-300">
          No applications yet.
        </p>
      )}
    </div>
  );
};

export default ApplicantsPage;