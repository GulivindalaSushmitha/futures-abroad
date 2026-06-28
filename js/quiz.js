// ============================================================
// js/quiz.js - AI Interest Quiz Logic
// ============================================================

const db = firebase.firestore();
let currentQuestion = 0;
let userResponses = [];
let userId = '';
let conversationHistory = [];
let questionCount = 0;
const MAX_QUESTIONS = 8;

// Question Bank
const QUESTION_BANK = {
    opening: [
        {
            id: 'q1',
            text: 'What subject do you look forward to most at school? 🏫',
            followUp: {
                'biology': 'health', 'chemistry': 'health', 'physics': 'stem',
                'mathematics': 'stem', 'computer science': 'stem', 'history': 'humanities',
                'philosophy': 'humanities', 'business': 'business', 'economics': 'business',
                'art': 'arts', 'music': 'arts', 'design': 'arts', 'sustainability': 'environment',
                'psychology': 'social_sciences'
            }
        },
        {
            id: 'q2',
            text: 'If you had a free weekend, what would you build or explore? 🛠️',
            followUp: {
                'app': 'tech', 'website': 'tech', 'robot': 'tech', 'art': 'arts',
                'music': 'arts', 'experiment': 'stem', 'code': 'tech', 'business': 'business',
                'volunteer': 'leadership', 'nature': 'environment'
            }
        }
    ],
    deep: {
        health: [
            { id: 'health_1', text: "That's fascinating! 🩺 Are you more drawn to clinical medicine, medical research, or public health?", options: ['Clinical Medicine', 'Medical Research', 'Public Health', 'Pharmacy', 'Mental Health'] },
            { id: 'health_2', text: 'What kind of healthcare impact excites you most?', options: ['Helping patients directly', 'Finding new cures', 'Preventing disease', 'Mental wellbeing'] }
        ],
        stem: [
            { id: 'stem_1', text: "Science! 🧪 What area of science sparks your curiosity the most?", options: ['Physics & Astronomy', 'Chemistry', 'Biology', 'Mathematics', 'Engineering', 'Data Science'] },
            { id: 'stem_2', text: 'Do you enjoy solving problems through:', options: ['Experiments & Lab Work', 'Mathematical Models', 'Building & Creating', 'Computer Programming'] }
        ],
        tech: [
            { id: 'tech_1', text: "Tech is the future! 💻 What technology area interests you?", options: ['AI & Machine Learning', 'App Development', 'Cybersecurity', 'Game Design', 'Robotics', 'Blockchain'] },
            { id: 'tech_2', text: 'What excites you most about technology?', options: ['Creating new tools', 'Solving complex problems', 'Innovating for good', 'Building businesses'] }
        ],
        business: [
            { id: 'business_1', text: "Business mind! 💼 Which business area appeals to you?", options: ['Entrepreneurship', 'Finance & Investing', 'Marketing', 'Consulting', 'Management', 'Real Estate'] },
            { id: 'business_2', text: 'What would you like to achieve in business?', options: ['Build a company', 'Lead a team', 'Make smart investments', 'Create impactful campaigns'] }
        ],
        arts: [
            { id: 'arts_1', text: "Creative soul! 🎨 What's your creative passion?", options: ['Visual Art', 'Graphic Design', 'Architecture', 'Fashion', 'Photography', 'Film', 'Music'] },
            { id: 'arts_2', text: 'What kind of creative projects do you enjoy?', options: ['Personal expression', 'Commercial projects', 'Social impact', 'Digital creation'] }
        ],
        humanities: [
            { id: 'humanities_1', text: "Deep thinker! 📚 Which humanities subject calls to you?", options: ['History', 'Philosophy', 'Political Science', 'Law', 'Linguistics', 'Classical Studies'] },
            { id: 'humanities_2', text: 'What drives your interest in this area?', options: ['Understanding the past', 'Shaping the future', 'Justice & Fairness', 'Human expression'] }
        ],
        environment: [
            { id: 'env_1', text: "Earth's champion! 🌍 What environmental focus intrigues you?", options: ['Climate Change', 'Marine Biology', 'Environmental Policy', 'Renewable Energy', 'Conservation'] },
            { id: 'env_2', text: 'How would you like to make an environmental impact?', options: ['Research', 'Policy & Advocacy', 'Sustainable Business', 'Community Education'] }
        ],
        leadership: [
            { id: 'leadership_1', text: "Natural leader! 👥 What kind of leadership role fits you?", options: ['Student Government', 'Community Organizer', 'Team Captain', 'Social Enterprise', 'Non-Profit Lead'] },
            { id: 'leadership_2', text: 'What change do you want to lead?', options: ['School/Community Change', 'Social Justice', 'Environmental Action', 'Youth Empowerment'] }
        ],
        social_sciences: [
            { id: 'social_1', text: "Understanding people! 🧠 What social science area interests you?", options: ['Psychology', 'Sociology', 'Anthropology', 'Economics', 'International Relations'] },
            { id: 'social_2', text: 'What would you like to understand better about society?', options: ['Human Behavior', 'Social Structures', 'Global Relations', 'Economic Systems'] }
        ]
    },
    closing: [
        { id: 'closing_1', text: 'What kind of change do you want to see in the world? 🌟', context: true },
        { id: 'closing_2', text: 'What do you hope to achieve in the next 5 years? 🎯', context: true }
    ]
};

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    userId = urlParams.get('uid');
    
    if (!userId) {
        firebase.auth().onAuthStateChanged(user => {
            if (user) { userId = user.uid; startQuiz(); }
            else window.location.href = 'signup.html';
        });
    } else startQuiz();
    
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });
    document.getElementById('skip-quiz').addEventListener('click', skipQuiz);
});

function startQuiz() {
    db.collection('students').doc(userId).get().then(doc => {
        if (doc.exists && doc.data().profileCompleted) {
            window.location.href = 'dashboard.html';
            return;
        }
        askNextQuestion();
    });
}

function askNextQuestion() {
    const questionData = getNextQuestion();
    if (!questionData || questionCount >= MAX_QUESTIONS) {
        generateProfile();
        return;
    }
    questionCount++;
    updateProgress();
    addMessage('ai', questionData.text);
    conversationHistory.push({ role: 'assistant', content: questionData.text, questionId: questionData.id });
    if (questionData.options && questionData.options.length > 0) {
        setTimeout(() => showQuickReplies(questionData.options), 600);
    }
}

function getNextQuestion() {
    if (currentQuestion === 0) {
        const questions = QUESTION_BANK.opening;
        const selected = questions[Math.floor(Math.random() * questions.length)];
        currentQuestion++;
        return selected;
    }
    const lastResponse = userResponses[userResponses.length - 1];
    if (lastResponse && lastResponse.category) {
        const deepQuestions = QUESTION_BANK.deep[lastResponse.category];
        if (deepQuestions && deepQuestions.length > 0) {
            const askedIds = userResponses.map(r => r.questionId);
            const nextQuestion = deepQuestions.find(q => !askedIds.includes(q.id));
            if (nextQuestion) { currentQuestion++; return nextQuestion; }
        }
    }
    const askedIds = userResponses.map(r => r.questionId);
    const closingQuestions = QUESTION_BANK.closing.filter(q => !askedIds.includes(q.id));
    if (closingQuestions.length > 0 && questionCount < MAX_QUESTIONS - 1) {
        currentQuestion++;
        return closingQuestions[0];
    }
    return null;
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    addMessage('user', text);
    input.value = '';
    const questionId = conversationHistory[conversationHistory.length - 1]?.questionId || '';
    const category = detectCategory(text);
    userResponses.push({ questionId, answer: text, category });
    conversationHistory.push({ role: 'user', content: text });
    setTimeout(() => askNextQuestion(), 800);
}

function showQuickReplies(options) {
    const container = document.querySelector('.chat-input');
    const quickReplies = document.createElement('div');
    quickReplies.className = 'quick-replies';
    quickReplies.innerHTML = options.map(opt => `<button class="quick-reply-btn" data-text="${opt}">${opt}</button>`).join('');
    container.parentNode.insertBefore(quickReplies, container);
    document.querySelectorAll('.quick-reply-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('chat-input').value = this.dataset.text;
            sendMessage();
            this.parentNode.remove();
        });
    });
    setTimeout(() => { if (quickReplies.parentNode) quickReplies.remove(); }, 10000);
}

function detectCategory(text) {
    const keywords = {
        'health': ['medicine', 'doctor', 'health', 'patient', 'hospital', 'clinic', 'medical', 'biology', 'chemistry'],
        'stem': ['science', 'physics', 'math', 'mathematics', 'engineering', 'chemistry', 'biology', 'research'],
        'tech': ['computer', 'code', 'programming', 'ai', 'machine learning', 'cybersecurity', 'app', 'developer'],
        'business': ['business', 'entrepreneur', 'finance', 'marketing', 'startup', 'investment', 'company'],
        'arts': ['art', 'design', 'music', 'drawing', 'creative', 'architecture', 'fashion', 'photography'],
        'humanities': ['history', 'philosophy', 'law', 'politics', 'linguistics', 'literature'],
        'environment': ['climate', 'sustainability', 'environment', 'green', 'renewable', 'conservation', 'nature'],
        'leadership': ['lead', 'leadership', 'manage', 'organize', 'community', 'volunteer', 'social change'],
        'social_sciences': ['psychology', 'sociology', 'anthropology', 'economics', 'international relations']
    };
    const lowerText = text.toLowerCase();
    for (const [category, words] of Object.entries(keywords)) {
        if (words.some(word => lowerText.includes(word))) return category;
    }
    return 'general';
}

function addMessage(type, content) {
    const container = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type === 'ai' ? 'ai-message' : 'user-message'}`;
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'ai' ? '🤖' : '👤';
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = content.replace(/\n/g, '<br>');
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function updateProgress() {
    const progress = Math.min((questionCount / MAX_QUESTIONS) * 100, 100);
    document.getElementById('progress-fill').style.width = progress + '%';
    document.getElementById('question-counter').textContent = `Question ${Math.min(questionCount, MAX_QUESTIONS)} of ${MAX_QUESTIONS}`;
}

async function generateProfile() {
    addMessage('ai', '✨ Analyzing your answers... I\'m building your interest profile!');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const tags = generateInterestTags(userResponses);
    await db.collection('students').doc(userId).update({
        interestTags: tags,
        profileCompleted: true,
        onboardingPhase: 2,
        quizResponses: userResponses,
        profileStrength: 20
    });
    
    const tagEmojis = {
        'STEM': '🔬', 'Medicine & Health': '⚕️', 'Humanities': '📚',
        'Social Sciences': '🧠', 'Arts & Design': '🎨', 'Business': '💼',
        'Environment': '🌍', 'Leadership & Service': '👥', 'Technology': '💻'
    };
    const tagDescriptions = {
        'STEM': 'You love exploring how things work through science and mathematics.',
        'Medicine & Health': 'You care about human wellbeing and want to make a difference in people\'s lives.',
        'Humanities': 'You\'re fascinated by human culture, history, and ideas.',
        'Social Sciences': 'You\'re interested in understanding human behavior and society.',
        'Arts & Design': 'You have a creative spirit! You express yourself through visual, musical, or design-based mediums.',
        'Business': 'You have an entrepreneurial mindset. You think about how to create value and lead teams.',
        'Environment': 'You care about our planet and want to make a sustainable impact.',
        'Leadership & Service': 'You\'re a natural leader who wants to make a positive change in your community.',
        'Technology': 'You\'re excited by innovation and how technology can solve problems.'
    };
    
    let resultHTML = `<h2>🎉 Your Interest Profile is Ready!</h2><p>Based on your answers, here's what we've discovered:</p><div class="profile-tags">`;
    tags.forEach(tag => {
        const emoji = tagEmojis[tag] || '🌟';
        const desc = tagDescriptions[tag] || 'You showed strong interest in this area.';
        resultHTML += `<div class="tag-card"><span class="tag-emoji">${emoji}</span><span class="tag-name">${tag}</span><p class="tag-desc">${desc}</p></div>`;
    });
    resultHTML += `</div><p>We'll use these interests to find the perfect activities for you! 🎯</p><a href="dashboard.html" class="btn-primary">Continue to Dashboard →</a>`;
    addMessage('ai', resultHTML);
}

function generateInterestTags(responses) {
    const categoryCount = {};
    responses.forEach(r => {
        if (r.category && r.category !== 'general') {
            categoryCount[r.category] = (categoryCount[r.category] || 0) + 1;
        }
    });
    const categoryMap = {
        'health': 'Medicine & Health', 'stem': 'STEM', 'tech': 'Technology',
        'business': 'Business', 'arts': 'Arts & Design', 'humanities': 'Humanities',
        'environment': 'Environment', 'leadership': 'Leadership & Service',
        'social_sciences': 'Social Sciences'
    };
    const sorted = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([key]) => categoryMap[key] || key)
        .filter(Boolean);
    if (sorted.length < 2) {
        const firstCategory = responses[0]?.category;
        if (firstCategory && categoryMap[firstCategory]) sorted.push(categoryMap[firstCategory]);
        sorted.push('Leadership & Service');
    }
    return [...new Set(sorted)];
}

async function skipQuiz() {
    if (confirm('Skip the quiz? We\'ll use your initial interests to get you started.')) {
        const initialInterests = document.querySelector('.interest-btn.selected');
        const tags = initialInterests ? [initialInterests.dataset.tag] : ['Leadership & Service', 'Technology'];
        await db.collection('students').doc(userId).update({
            interestTags: tags,
            profileCompleted: true,
            onboardingPhase: 2,
            quizResponses: [],
            profileStrength: 10
        });
        window.location.href = 'dashboard.html';
    }
}
