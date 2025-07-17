import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { BarLoader } from "react-spinners";

const Onboarding = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const navigateUser = (currRole) => {
    if (currRole === "recruiter") {
      navigate("/post-job");
    } else {
      navigate("/jobs");
    }
  };

  const handleRoleSelection = async (role) => {
    await user
      .update({ unsafeMetadata: { role } })
      .then(() => {
        console.log(`Role updated to: ${role}`);
        navigateUser(role);
      })
      .catch((err) => {
        console.error("Error updating role:", err);
      });
  };

  useEffect(() => {
    if (user?.unsafeMetadata?.role) {
      navigateUser(user.unsafeMetadata.role);
    }
  }, [user]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <BarLoader width={"100%"} color="#14b8a6" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 px-6">
      <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300 font-extrabold text-5xl sm:text-6xl tracking-tighter mb-16 text-center drop-shadow-lg">
        I am a...
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl">
        <button
          onClick={() => handleRoleSelection("candidate")}
          className="bg-teal-600 hover:bg-teal-500 text-white text-2xl font-semibold py-8 rounded-2xl shadow-xl transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-400"
        >
          🎯 Candidate
        </button>
        <button
          onClick={() => handleRoleSelection("recruiter")}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-2xl font-semibold py-8 rounded-2xl shadow-xl transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-400"
        >
          🧑‍💼 Recruiter
        </button>
      </div>

      <p className="mt-10 text-gray-400 text-sm text-center max-w-md">
        Choose your role to continue — you can always update your preferences later.
      </p>
    </div>
  );
};

export default Onboarding;
