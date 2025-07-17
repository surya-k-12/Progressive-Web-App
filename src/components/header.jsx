import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignIn,
  useUser,
} from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { BriefcaseBusiness, Heart, PenBox, PenBoxIcon } from "lucide-react";
import { syncCandidateDetails } from "@/api/syncUser";

const Header = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();

  useEffect(() => {
    if (search.get("sign-in")) {
      setShowSignIn(true);
    }
  }, [search]);

  useEffect(() => {
    if (user) {
      // Sync user data when user is available
      syncCandidateDetails(user);
      
      // Existing role check navigation
      if (!user.unsafeMetadata?.role) {
        navigate("/onboarding");
      }
    }
  }, [user, navigate]);
  
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowSignIn(false);
      setSearch({});
    }
  };

  return (
    <>
      <nav className="py-4 flex justify-between items-center">
        <Link to="/">
          <img src="/logo.png" className="h-20" alt="Hirrd Logo" />
        </Link>

        <div className="flex gap-8">
          <SignedOut>
            <Button
              className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-all duration-300 shadow-md"
              onClick={() => setShowSignIn(true)}
            >
              Login
            </Button>
          </SignedOut>
          <SignedIn>
            {user?.unsafeMetadata?.role === "recruiter" && (
              <Link to="/post-job">
                <Button
                  variant="destructive"
                  className="bg-red-500 text-white px-6 py-2 rounded-full font-medium hover:bg-red-600 transition-all duration-300 shadow-md flex items-center gap-2"
                >
                  <PenBox size={20} className="mr-2" />
                  Post a Job
                </Button>
              </Link>
            )}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            >
              
              <UserButton.MenuItems>
                <UserButton.Link
                  label={user?.unsafeMetadata?.role === "recruiter" ? "My Jobs" : "My Applications"}
                  labelIcon={<BriefcaseBusiness size={15} />}
                  href="/my-jobs"
                />
                {user?.unsafeMetadata?.role !== "recruiter" && (
                  <UserButton.Link
                    label="WishList"
                    labelIcon={<Heart size={15} />}
                    href="/saved-jobs"
                  />
                )}
                {user?.unsafeMetadata?.role === "recruiter" && (
                  <UserButton.Link
                    label="Applicants"
                    labelIcon={<PenBoxIcon size={15} />}
                    href="/recruiter_applicants_page"
                  />
                )}
                
                <UserButton.Action label="manageAccount" />
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>
        </div>
      </nav>

      {showSignIn && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleOverlayClick}
        >
          <SignIn
            signUpForceRedirectUrl="/onboarding"
            fallbackRedirectUrl="/onboarding"
          />
        </div>
      )}
    </>
  );
};

export default Header;