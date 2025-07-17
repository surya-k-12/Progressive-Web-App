export const parseResume = (resumeText, jobRequirements) => {
  try {
    // Convert both to lowercase for case-insensitive matching
    const resumeContent = resumeText.toLowerCase();
    const requirements = jobRequirements.toLowerCase();

    // Extract skills from job requirements
    const requiredSkills = requirements
      .split(/[,.\n]/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);

    // Extract skills from resume
    const resumeSkills = resumeContent
      .split(/[,.\n]/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);

    // Calculate skill matches
    const matchedSkills = [];
    const missingSkills = [];

    requiredSkills.forEach(skill => {
      if (resumeSkills.some(resumeSkill => resumeSkill.includes(skill) || skill.includes(resumeSkill))) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    // Calculate match score based on skills
    const skillMatchScore = (matchedSkills.length / requiredSkills.length) * 100;

    // Analyze experience
    const experienceMatch = analyzeExperience(resumeContent, requirements);
    
    // Analyze education
    const educationMatch = analyzeEducation(resumeContent, requirements);

    // Calculate overall match score
    const overallScore = (skillMatchScore * 0.6 + experienceMatch * 0.2 + educationMatch * 0.2);

    // Determine suggested status based on match score
    let suggestedStatus;
    if (overallScore >= 80) {
      suggestedStatus = "Hired";
    } else if (overallScore >= 30) {
      suggestedStatus = "interviewing";
    } else {
      suggestedStatus = "rejected";
    }

    return {
      score: overallScore.toFixed(2),
      suggestedStatus,
      matchedSkills,
      missingSkills,
      experienceMatch: experienceMatch.toFixed(2),
      educationMatch: educationMatch.toFixed(2)
    };
  } catch (error) {
    console.error('Error parsing resume:', error);
    return {
      score: 0,
      suggestedStatus: "rejected",
      matchedSkills: [],
      missingSkills: [],
      experienceMatch: 0,
      educationMatch: 0
    };
  }
};

const analyzeExperience = (resumeContent, requirements) => {
  // Extract years of experience from requirements
  const expMatch = requirements.match(/(\d+)\s*(?:years|yrs|yr)\s*experience/i);
  const requiredExp = expMatch ? parseInt(expMatch[1]) : 0;

  // Extract years of experience from resume
  const resumeExpMatch = resumeContent.match(/(\d+)\s*(?:years|yrs|yr)\s*experience/i);
  const resumeExp = resumeExpMatch ? parseInt(resumeExpMatch[1]) : 0;

  if (requiredExp === 0) return 100; // No experience requirement
  if (resumeExp >= requiredExp) return 100;
  return (resumeExp / requiredExp) * 100;
};

const analyzeEducation = (resumeContent, requirements) => {
  const educationLevels = {
    'phd': 100,
    'doctorate': 100,
    'master': 80,
    'bachelor': 60,
    'associate': 40,
    'diploma': 30,
    'certificate': 20
  };

  // Check for education requirements
  const requiredEducation = Object.keys(educationLevels).find(level => 
    requirements.includes(level)
  );

  // Check for education in resume
  const resumeEducation = Object.keys(educationLevels).find(level => 
    resumeContent.includes(level)
  );

  if (!requiredEducation) return 100; // No education requirement
  if (!resumeEducation) return 0;

  const requiredScore = educationLevels[requiredEducation];
  const resumeScore = educationLevels[resumeEducation];

  return (resumeScore / requiredScore) * 100;
}; 