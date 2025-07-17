import { useState, useEffect } from "react";
import { Boxes, BriefcaseBusiness, Download, School } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { BarLoader } from "react-spinners";
import { updateApplicationStatus } from "@/api/apiApplications";
import { useSession } from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ApplicationCard = ({ 
  application, 
  isCandidate = false, 
  parsingResults, 
  selectedStatus,
  onStatusChange 
}) => {
  const { session } = useSession();
  const [currentStatus, setCurrentStatus] = useState(application.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCurrentStatus(selectedStatus || application.status);
  }, [selectedStatus, application.status]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = application?.resume;
    link.target = "_blank";
    link.download = "resume.pdf";
    link.click();
  };

  const handleStatusChange = async (status) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!session) {
        throw new Error("No session available");
      }

      const token = await session.getToken({ template: "supabase" });
      if (!token) {
        throw new Error("Failed to get session token");
      }

      const response = await updateApplicationStatus(token, {
        job_id: application.job_id,
        candidate_id: application.candidate_id,
        status: status
      });

      if (!response) {
        throw new Error("Failed to update status");
      }

      setCurrentStatus(status);
      if (onStatusChange) {
        await onStatusChange(application.id, status);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateToSuggestedStatus = async () => {
    if (parsingResults && parsingResults[application.id]) {
      const suggestedStatus = parsingResults[application.id].suggestedStatus;
      await handleStatusChange(suggestedStatus);
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
      {loading && (
        <div className="p-2">
          <BarLoader width={"100%"} color="#36d7b7" />
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="m-2">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <CardHeader className="flex justify-between items-start">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white flex justify-between items-center w-full">
          {isCandidate
            ? `${application?.job?.title} at ${application?.job?.company?.name}`
            : application?.name}
          <Download
            size={20}
            className="bg-gray-100 hover:bg-gray-200 text-black rounded-full h-8 w-8 p-1.5 cursor-pointer ml-4"
            onClick={handleDownload}
            title="Download Resume"
          />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness size={16} />
            {application?.experience} years of experience
          </div>
          <div className="flex items-center gap-2">
            <School size={16} />
            {application?.education}
          </div>
          <div className="flex items-center gap-2">
            <Boxes size={16} />
            Skills: {application?.skills}
          </div>
        </div>

        {parsingResults && parsingResults[application.id] && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Resume Analysis Results
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Match Score:</span>
                <span className="font-medium text-primary">
                  {parsingResults[application.id].score}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Suggested Status:</span>
                <span className="font-medium capitalize">
                  {parsingResults[application.id].suggestedStatus}
                </span>
              </div>
              {parsingResults[application.id].matchedSkills && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Matched Skills:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {parsingResults[application.id].matchedSkills.map((skill, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {parsingResults[application.id].missingSkills && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Missing Skills:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {parsingResults[application.id].missingSkills.map((skill, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <hr className="border-t dark:border-gray-700" />
      </CardContent>

      <CardFooter className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0 text-sm text-gray-600 dark:text-gray-400 px-4 pb-4">
        <span>
          Applied on:{" "}
          <span className="font-medium text-gray-800 dark:text-gray-300">
            {new Date(application?.created_at).toLocaleString()}
          </span>
        </span>
        {isCandidate ? (
          <span className="capitalize font-semibold text-primary">
            Status: {currentStatus}
          </span>
        ) : (
          <div className="flex flex-col gap-2">
            {parsingResults && parsingResults[application.id] && (
              <Button
                onClick={handleUpdateToSuggestedStatus}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Update to Suggested Status
              </Button>
            )}
            <Select
              onValueChange={handleStatusChange}
              value={currentStatus}
              disabled={loading}
            >
              <SelectTrigger className="w-52 border-gray-300 dark:border-gray-700">
                <SelectValue placeholder="Application Status" />
              </SelectTrigger>
              <SelectContent className="text-white">
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="interviewing">Interviewing</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ApplicationCard;
