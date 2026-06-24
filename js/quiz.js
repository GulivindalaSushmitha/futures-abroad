// ============================================
// QUIZ DATA - 10 Questions Based on Interest Areas
// ============================================
const quizQuestions = [
    {
        id: 1,
        question: "What subject do you look forward to most at school?",
        subtext: "This helps us understand your academic interests",
        type: "radio",
        options: [
            "Mathematics & Sciences",
            "English & Literature",
            "History & Social Studies",
            "Art & Design",
            "Business & Economics",
            "Computer Science & Technology"
        ]
    },
    {
        id: 2,
        question: "If you had a free weekend, what would you build or explore?",
        subtext: "Tell us about your creative and curious side",
        type: "text",
        placeholder: "Describe what you'd do..."
    },
    {
        id: 3,
        question: "What kind of change do you want to see in the world?",
        subtext: "Your answer helps us find activities that match your values",
        type: "textarea",
        placeholder: "Share your vision..."
    },
    {
        id: 4,
        question: "Which of these activities excites you the most?",
        subtext: "Select all that apply to your interests",
        type: "checkbox",
        options: [
            "Conducting scientific research",
            "Creating art or design",
            "Leading a team or project",
            "Starting a business",
            "Volunteering for a cause",
            "Learning to code",
            "Writing or journalism",
            "Working with people"
        ]
    },
    {
        id: 5,
        question: "What career path interests you the most?",
        subtext: "This helps us match you with relevant experiences",
        type: "radio",
        options: [
            "Engineering & Technology",
            "Medicine & Healthcare",
            "Business & Entrepreneurship",
            "Law & Politics",
            "Education & Research",
            "Creative Arts & Design",
            "Environmental Science",
            "Data & Analytics"
        ]
    },
    {
        id: 6,
        question: "Describe a problem you'd love to solve.",
        subtext: "Your passion for solving problems drives your future path",
        type: "textarea",
        placeholder: "What problem matters most to you..."
    },
    {
        id: 7,
        question: "What type of learning environment suits you best?",
        subtext: "This helps us recommend activities and programs",
        type: "radio",
        options: [
            "Independent research",
            "Team projects & collaboration",
            "Hands-on practical work",
            "Lecture & academic study",
            "Creative exploration",
            "Competitive challenges"
        ]
    },
    {
        id: 8,
        question: "Which of these skills would you like to develop?",
        subtext: "Select the skills you want to build",
        type: "checkbox",
        options: [
            "Leadership",
            "Communication",
            "Critical Thinking",
            "Creativity",
            "Problem Solving",
            "Teamwork",
            "Technical Skills",
            "Project Management"
        ]
    },
    {
        id: 9,
        question: "What motivates you to succeed?",
        subtext: "Understanding your motivation helps us guide you",
        type: "radio",
        options: [
            "Making a positive impact",
            "Achieving personal goals",
            "Building a successful career",
            "Helping others",
            "Creating something new",
            "Gaining knowledge"
        ]
    },
    {
        id: 10,
        question: "Where do you see yourself in 10 years?",
        subtext: "This helps us create your personalized university pathway",
        type: "textarea",
        placeholder: "Share your vision for the future..."
    }
];

// ============================================
// QUIZ STATE
// ============================================
let currentQuestion = 0;
let quizAnswers = {};

// ============================================
// RENDER QUIZ
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('quizContainer');
    if (!container) return;

    // Render all questions
    quizQuestions.forEach((q, index) => {
        const div = document.createElement('div');
        div.className = `question-item ${index === 0 ? 'active' : ''}`;
        div.dataset.question = index;
        
        let html = `
            <div class="question-number">Question ${index + 1} of ${quizQuestions.length}</div>
            <h3>${q.question}</h3>
            ${q.subtext ? `<p class="question-sub">${q.subtext}</p>` : ''}
        `;

        if (q.type === 'radio') {
            html += `<div class="options-group">`;
            q.options.forEach(opt => {
                html += `
                    <div class="option-item" onclick="selectOption(this, '${q.id}', '${opt}')">
                        <input type="radio" name="q${q.id}" value="${opt}" />
                        <label>${opt}</label>
                    </div>
                `;
            });
            html += `</div>`;
        } else if (q.type === 'checkbox') {
            html += `<div class="options-group">`;
            q.options.forEach(opt => {
                html += `
                    <div class="option-item" onclick="toggleCheckbox(this, '${q.id}', '${opt}')">
                        <input type="checkbox" name="q${q.id}" value="${opt}" />
                        <label>${opt}</label>
                    </div>
                `;
            });
            html += `</div>`;
        } else if (q.type === 'text') {
            html += `
                <input type="text" class="text-input" placeholder="${q.placeholder || 'Type your answer...'}" 
                       onchange="saveTextAnswer('${q.id}', this.value)" />
            `;
        } else if (q.type === 'textarea') {
            html += `
                <textarea class="textarea-input" placeholder="${q.placeholder || 'Type your answer...'}" 
                          onchange="saveTextAnswer('${q.id}', this.value)"></textarea>
            `;
        }

        div.innerHTML = html;
        container.appendChild(div);
    });

    // Update progress
    updateProgress();

    // Navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    prevBtn.addEventListener('click', () => navigateQuestion(-1));
    nextBtn.addEventListener('click', () => navigateQuestion(1));

    // Form submit
    document.getElementById('quizForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitQuiz();
    });
});

// ============================================
// NAVIGATION FUNCTIONS
// ============================================
function navigateQuestion(direction) {
    const questions = document.querySelectorAll('.question-item');
    const total = questions.length;
    
    // Save current answer before moving
    saveCurrentAnswer(currentQuestion);
    
    // Hide current
    questions[currentQuestion].classList.remove('active');
    
    // Update index
    currentQuestion += direction;
    
    // Clamp
    if (currentQuestion < 0) currentQuestion = 0;
    if (currentQuestion >= total) currentQuestion = total - 1;
    
    // Show new
    questions[currentQuestion].classList.add('active');
    
    // Update buttons
    updateNavigationButtons();
    updateProgress();
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const total = quizQuestions.length;
    
    prevBtn.style.display = currentQuestion === 0 ? 'none' : 'inline-flex';
    
    if (currentQuestion === total - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-flex';
    } else {
        nextBtn.style.display = 'inline-flex';
        submitBtn.style.display = 'none';
    }
}

function updateProgress() {
    const total = quizQuestions.length;
    const progress = ((currentQuestion + 1) / total) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = `Question ${currentQuestion + 1} of ${total}`;
}

// ============================================
// ANSWER HANDLING
// ============================================
function selectOption(element, questionId, value) {
    const parent = element.closest('.options-group');
    parent.querySelectorAll('.option-item').forEach(item => {
        item.classList.remove('selected');
        item.querySelector('input').checked = false;
    });
    element.classList.add('selected');
    element.querySelector('input').checked = true;
    quizAnswers[questionId] = value;
}

function toggleCheckbox(element, questionId, value) {
    element.classList.toggle('selected');
    const checkbox = element.querySelector('input');
    checkbox.checked = !checkbox.checked;
    
    if (!quizAnswers[questionId]) {
        quizAnswers[questionId] = [];
    }
    
    if (checkbox.checked) {
        quizAnswers[questionId].push(value);
    } else {
        quizAnswers[questionId] = quizAnswers[questionId].filter(v => v !== value);
    }
}

function saveTextAnswer(questionId, value) {
    quizAnswers[questionId] = value;
}

function saveCurrentAnswer(index) {
    const question = quizQuestions[index];
    const container = document.querySelector(`.question-item[data-question="${index}"]`);
    if (!container) return;
    
    if (question.type === 'radio') {
        const selected = container.querySelector('input[type="radio"]:checked');
        if (selected) {
            quizAnswers[question.id] = selected.value;
        }
    } else if (question.type === 'checkbox') {
        const checked = container.querySelectorAll('input[type="checkbox"]:checked');
        quizAnswers[question.id] = Array.from(checked).map(c => c.value);
    } else if (question.type === 'text' || question.type === 'textarea') {
        const input = container.querySelector('input, textarea');
        if (input && input.value) {
            quizAnswers[question.id] = input.value;
        }
    }
}

// ============================================
// SUBMIT QUIZ
// ============================================
function submitQuiz() {
    // Save last answer
    saveCurrentAnswer(currentQuestion);
    
    // Check if all questions answered
    const total = quizQuestions.length;
    let answered = 0;
    
    quizQuestions.forEach(q => {
        if (quizAnswers[q.id] && 
            (typeof quizAnswers[q.id] === 'string' ? quizAnswers[q.id].trim() : quizAnswers[q.id].length > 0)) {
            answered++;
        }
    });
    
    if (answered < total) {
        if (!confirm(`You've answered ${answered} of ${total} questions. Continue anyway?`)) {
            return;
        }
    }
    
    // Get user data
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Create quiz result
    const quizResult = {
        userId: user.id || 'unknown',
        userName: user.name || 'Student',
        userEmail: user.email || '',
        userGrade: user.grade || '',
        userInterests: user.interests || [],
        answers: quizAnswers,
        submittedAt: new Date().toISOString(),
        questionCount: total,
        answeredCount: answered
    };
    
    // Save to localStorage (Database)
    saveQuizResult(quizResult);
    
    // Show completion
    showCompletion(quizResult);
}

function saveQuizResult(result) {
    // Get existing results
    let results = JSON.parse(localStorage.getItem('quizResults') || '[]');
    results.push(result);
    localStorage.setItem('quizResults', JSON.stringify(results));
    
    // Mark user as quiz completed
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.quizCompleted = true;
    user.quizAnswers = result.answers;
    localStorage.setItem('user', JSON.stringify(user));
}

function showCompletion(result) {
    const container = document.getElementById('quizContainer');
    const nav = document.querySelector('.quiz-navigation');
    const header = document.querySelector('.quiz-header');
    
    // Hide navigation
    nav.style.display = 'none';
    
    // Create completion view
    container.innerHTML = `
        <div class="quiz-complete">
            <div class="icon"><i class="fas fa-check-circle"></i></div>
            <h2>🎉 Quiz Complete!</h2>
            <p>Thank you for sharing your interests. We've created your personalized profile.</p>
            
            <div class="summary-box">
                <h4>Your Profile Summary</h4>
                <p><strong>Name:</strong> ${result.userName}</p>
                <p><strong>Grade:</strong> ${result.userGrade}</p>
                <p><strong>Interests:</strong> ${result.userInterests.join(', ') || 'Not specified'}</p>
                <p><strong>Questions Answered:</strong> ${result.answeredCount} of ${result.questionCount}</p>
            </div>
            
            <a href="dashboard.html" class="btn btn-primary btn-large">
                Go to Dashboard <i class="fas fa-arrow-right"></i>
            </a>
        </div>
    `;
    
    // Update header
    header.querySelector('h1').textContent = 'Profile Complete!';
    header.querySelector('p').textContent = 'Your AI-powered journey is ready to begin.';
    document.querySelector('.quiz-progress').style.display = 'none';
}

// ============================================
// ADMIN FUNCTIONS (View Results)
// ============================================
function getAllQuizResults() {
    return JSON.parse(localStorage.getItem('quizResults') || '[]');
}

function getStudentQuizResults(studentId) {
    const results = getAllQuizResults();
    return results.filter(r => r.userId === studentId);
}

// ============================================
// INIT - Check if user is logged in
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) {
        window.location.href = 'login.html';
    }
    
    // Update user badge
    document.getElementById('userBadge').textContent = `Welcome, ${user.name || 'Student'}`;
});