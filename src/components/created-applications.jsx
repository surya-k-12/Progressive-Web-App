import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";
import ApplicationCard from "./application-card";
import { getAppliedApplications } from "@/api/apiApplications";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const CreatedApplications = () => {
  const { user } = useUser();
  const [applications, setApplications] = useState([]);

  const {
    loading: loadingApplications,
    data: appliedJobs,
    fn: fnApplications,
  } = useFetch(getAppliedApplications, {
    user_id: user?.id,
  });

  useEffect(() => {
    if (user?.id) {
      fnApplications();
    }
  }, [user?.id]);

  useEffect(() => {
    if (appliedJobs?.length) {
      const formattedApplications = appliedJobs.map(app => ({
        ...app,
        name: app.user_name || user?.fullName || user?.firstName || "Anonymous",
        experience: app.experience || "Not specified",
        education: app.education || "Not specified",
        skills: app.skills || "Not specified",
        resume: app.resume,
        created_at: app.created_at,
        status: app.status || "applied"
      }));
      console.log("Formatted applications:", formattedApplications);
      setApplications(formattedApplications);
    }
  }, [appliedJobs, user]);

  if (loadingApplications) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">
            My Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {applications?.length > 0 ? (
              applications.map((application) => (
                <ApplicationCard
                  key={application.job_id}
                  application={application}
                  isCandidate={true}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No applications found. Start applying to jobs to see them here!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatedApplications;