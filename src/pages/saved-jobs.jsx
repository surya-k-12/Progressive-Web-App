import { getSavedJobs } from '@/api/apiJobs';
import JobCard from '@/components/job-card';
import { Button } from '@/components/ui/button';
import useFetch from '@/hooks/use-fetch';
import { useUser } from '@clerk/clerk-react';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarLoader } from 'react-spinners';

const SavedJobs = () => {
  const { isLoaded } = useUser();
  const navigate = useNavigate();

  const {
    loading: loadingSavedJobs,
    data: savedJobs,
    fn: fnSavedJobs,
  } = useFetch(getSavedJobs);

  useEffect(() => {
    if (isLoaded) {
      fnSavedJobs();
    }
  }, [isLoaded]);

  if (!isLoaded || loadingSavedJobs) {
    return (
      <div className="flex justify-center items-center h-96">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start px-4 py-8 min-h-screen bg-gray-900">
      <div className="w-full max-w-5xl flex flex-col items-center">
        <div className="flex justify-between items-center w-full mb-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-gray-900 dark:text-white">
            Saved Jobs
          </h1>
          <Button
            onClick={() => navigate("/jobs")}
            className="bg-red-700 hover:bg-blue-600 text-white transition duration-300"
          >
            Back
          </Button>
        </div>

        {savedJobs?.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
            {savedJobs.map((saved) => (
              <JobCard
                key={saved.id}
                job={saved?.job}
                onJobAction={fnSavedJobs}
                savedInit={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-lg text-gray-600 dark:text-gray-300 mt-20">
            No Saved Jobs 👀
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;
