// js/activity-data.js
// Complete Activity Database for Futures Abroad

const ACTIVITY_DATABASE = [
    {
        id: 1,
        name: "Community Leadership Workshop",
        type: "workshop",
        interest_tags: ["Leadership", "Community Service", "Social Enterprise"],
        grade_min: 10,
        grade_max: 12,
        country: "Global",
        cost: "Free",
        duration: "2 days",
        deadline: "2026-09-01",
        skills_gained: ["Leadership", "Public Speaking", "Team Management"],
        registration_url: "#",
        description: "Develop essential leadership skills through hands-on workshops and community projects. You'll learn to lead teams, manage conflicts, and inspire others.",
        registration_requirements: {
            documents: ["Parent consent form", "School recommendation letter"],
            essays: ["Why do you want to be a leader? (250 words)"],
            fees: false,
            recommendations: 1
        },
        ai_rationale: "Develops leadership skills essential for university applications and future careers."
    },
    {
        id: 2,
        name: "Global Entrepreneurship Challenge",
        type: "competition",
        interest_tags: ["Business", "Entrepreneurship", "Finance"],
        grade_min: 10,
        grade_max: 12,
        country: "Global",
        cost: "Free",
        duration: "2 months",
        deadline: "2026-10-01",
        skills_gained: ["Business Planning", "Pitching", "Financial Literacy"],
        registration_url: "#",
        description: "Create a business plan and pitch to international judges in this global competition. Winners get mentorship and funding opportunities.",
        registration_requirements: {
            documents: ["Business plan draft", "Team member list"],
            essays: ["What problem does your business solve? (300 words)"],
            fees: false,
            recommendations: 0
        },
        ai_rationale: "Perfect if you're interested in business and entrepreneurship."
    },
    {
        id: 3,
        name: "Dubai Youth Sustainability Summit",
        type: "summit",
        interest_tags: ["Sustainability", "Environment", "Leadership"],
        grade_min: 10,
        grade_max: 12,
        country: "UAE",
        cost: "Free",
        duration: "3 days",
        deadline: "2026-08-15",
        skills_gained: ["Environmental Policy", "Networking", "Public Speaking"],
        registration_url: "#",
        description: "Join young leaders from across the UAE to discuss climate action and sustainability solutions. Network with industry experts and policymakers.",
        registration_requirements: {
            documents: ["Parent permission", "School approval"],
            essays: ["Your sustainability pledge (150 words)"],
            fees: false,
            recommendations: 0
        },
        ai_rationale: "Great for students passionate about the environment and leadership."
    },
    {
        id: 4,
        name: "AI & Robotics Summer Camp",
        type: "course",
        interest_tags: ["Computer Science", "AI & Machine Learning", "Robotics"],
        grade_min: 10,
        grade_max: 11,
        country: "UAE",
        cost: "Paid",
        duration: "4 weeks",
        deadline: "2026-07-01",
        skills_gained: ["Python Programming", "Machine Learning", "Robotics"],
        registration_url: "#",
        description: "Build your first AI model and program robots in this intensive summer program. No prior coding experience needed.",
        registration_requirements: {
            documents: ["School transcript", "Parent consent"],
            essays: ["Why AI interests you (200 words)"],
            fees: true,
            fee_amount: "AED 2,500",
            recommendations: 1
        },
        ai_rationale: "Builds strong technical skills that top universities look for."
    },
    {
        id: 5,
        name: "Medical Research Internship",
        type: "internship",
        interest_tags: ["Medicine", "Biology", "Public Health"],
        grade_min: 11,
        grade_max: 12,
        country: "UAE",
        cost: "Scholarship available",
        duration: "3 months",
        deadline: "2026-09-15",
        skills_gained: ["Lab Research", "Data Analysis", "Medical Ethics"],
        registration_url: "#",
        description: "Work alongside medical researchers on real clinical studies. Gain hands-on experience in a hospital research setting.",
        registration_requirements: {
            documents: ["CV", "School report", "Parent consent"],
            essays: ["Why medical research matters to you (300 words)"],
            fees: false,
            recommendations: 2
        },
        ai_rationale: "Great preparation for medical school applications."
    },
    {
        id: 6,
        name: "Digital Art & Design Bootcamp",
        type: "course",
        interest_tags: ["Visual Art", "Graphic Design", "Technology"],
        grade_min: 10,
        grade_max: 12,
        country: "Global",
        cost: "Paid",
        duration: "2 weeks",
        deadline: "2026-08-01",
        skills_gained: ["Adobe Creative Suite", "UI/UX Design", "Creative Thinking"],
        registration_url: "#",
        description: "Learn digital art and design from industry professionals. Build a portfolio that stands out for university applications.",
        registration_requirements: {
            documents: ["Portfolio (optional)"],
            essays: ["What inspires your art? (200 words)"],
            fees: true,
            fee_amount: "AED 1,200",
            recommendations: 0
        },
        ai_rationale: "Develops creative skills that are highly valued by universities."
    },
    {
        id: 7,
        name: "Model United Nations Conference",
        type: "competition",
        interest_tags: ["International Relations", "Political Science", "Public Speaking"],
        grade_min: 10,
        grade_max: 12,
        country: "UAE",
        cost: "Free",
        duration: "3 days",
        deadline: "2026-11-01",
        skills_gained: ["Diplomacy", "Negotiation", "Policy Writing"],
        registration_url: "#",
        description: "Represent a country and debate global issues at this prestigious MUN conference. Develops critical thinking and public speaking skills.",
        registration_requirements: {
            documents: ["School approval"],
            essays: ["Your stance on a global issue (250 words)"],
            fees: false,
            recommendations: 0
        },
        ai_rationale: "Shows your commitment to making a difference — universities love this!"
    },
    {
        id: 8,
        name: "Youth Coding Olympiad",
        type: "competition",
        interest_tags: ["Computer Science", "Mathematics", "Data Science"],
        grade_min: 10,
        grade_max: 12,
        country: "Global",
        cost: "Free",
        duration: "1 week",
        deadline: "2026-10-15",
        skills_gained: ["Algorithm Design", "Problem Solving", "Python"],
        registration_url: "#",
        description: "Test your coding skills against students from around the world. Solve complex problems and win recognition for your school.",
        registration_requirements: {
            documents: ["School enrollment proof"],
            essays: [],
            fees: false,
            recommendations: 0
        },
        ai_rationale: "Develops future-ready tech skills in high demand."
    },
    {
        id: 9,
        name: "Social Entrepreneurship Incubator",
        type: "workshop",
        interest_tags: ["Entrepreneurship", "Social Enterprise", "Community Service"],
        grade_min: 10,
        grade_max: 12,
        country: "UAE",
        cost: "Free",
        duration: "6 weeks",
        deadline: "2026-09-30",
        skills_gained: ["Business Planning", "Social Impact", "Grant Writing"],
        registration_url: "#",
        description: "Launch a social enterprise that solves a real community problem. Get mentorship and funding support for your idea.",
        registration_requirements: {
            documents: ["Team member list", "Problem statement"],
            essays: ["What social issue matters to you most? (250 words)"],
            fees: false,
            recommendations: 0
        },
        ai_rationale: "Shows your commitment to making a difference — universities love this!"
    },
    {
        id: 10,
        name: "Summer Law & Justice Program",
        type: "course",
        interest_tags: ["Law", "Political Science", "Linguistics"],
        grade_min: 11,
        grade_max: 12,
        country: "UAE",
        cost: "Paid",
        duration: "3 weeks",
        deadline: "2026-06-15",
        skills_gained: ["Legal Research", "Argumentation", "Critical Thinking"],
        registration_url: "#",
        description: "Explore legal concepts and participate in mock trials. Learn from law professionals and university professors.",
        registration_requirements: {
            documents: ["School transcript", "Parent consent"],
            essays: ["Why law interests you (300 words)"],
            fees: true,
            fee_amount: "AED 3,000",
            recommendations: 1
        },
        ai_rationale: "Builds strong analytical skills for university applications."
    }
];

// Helper function to get activities by interests
function getActivitiesByInterests(interestTags, grade, filters = {}) {
    if (!interestTags || interestTags.length === 0) {
        return [];
    }
    
    let results = ACTIVITY_DATABASE.filter(activity => {
        // Grade check
        const gradeNum = parseInt(grade) || 10;
        if (gradeNum < activity.grade_min || gradeNum > activity.grade_max) return false;
        
        // Interest tag match (at least one matching tag)
        const hasMatchingTag = activity.interest_tags.some(tag => 
            interestTags.some(studentTag => 
                tag.toLowerCase().includes(studentTag.toLowerCase()) ||
                studentTag.toLowerCase().includes(tag.toLowerCase())
            )
        );
        if (!hasMatchingTag) return false;
        
        // Filter: type
        if (filters.type && filters.type !== 'All Types' && activity.type !== filters.type) return false;
        
        // Filter: cost
        if (filters.cost && filters.cost !== 'All Costs') {
            if (filters.cost === 'Free' && activity.cost !== 'Free') return false;
            if (filters.cost === 'Paid' && activity.cost !== 'Paid' && activity.cost !== 'Scholarship available') return false;
            if (filters.cost === 'Scholarship' && activity.cost !== 'Scholarship available') return false;
        }
        
        return true;
    });
    
    // Sort by deadline proximity (closest first)
    results.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    return results;
}

// Helper function to get a single activity by ID
function getActivityById(id) {
    return ACTIVITY_DATABASE.find(activity => activity.id === id);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ACTIVITY_DATABASE, getActivitiesByInterests, getActivityById };
}
