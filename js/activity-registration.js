// js/activity-registration.js

// --- Mock Data (This would come from your database/Firebase) ---
// In your real app, you would fetch this based on the activityId from the URL.
const mockActivities = {
    'act_001': {
        id: 'act_001',
        name: 'Global Youth Sustainability Summit',
        type: 'Conference & Workshop',
        mainDeadline: 'October 31, 2026',
        registrationRequirements: [
            {
                id: 'req_1',
                title: 'Personal Statement Draft',
                description: 'Keep it under 250 words. Focus on why this activity aligns with your goals.',
                dueDate: 'October 15, 2026',
            },
            {
                id: 'req_2',
                title: 'Teacher Recommendation Request',
                description: 'Request a recommendation from a science or humanities teacher.',
                dueDate: 'October 20, 2026',
            },
            {
                id: 'req_3',
                title: 'Parent Permission Form',
                description: 'Download, sign, and upload the parental consent form.',
                dueDate: 'October 25, 2026',
            },
            {
                id: 'req_4',
                title: 'Registration Fee Payment',
                description: 'Pay the registration fee online. Scholarships are available.',
                dueDate: 'October 28, 2026',
            },
        ]
    },
    // Add more activities here as needed
};

// --- DOM Elements ---
const activityNameEl = document.getElementById('activity-name');
const activityTypeEl = document.getElementById('activity-type');
const mainDeadlineEl = document.getElementById('main-deadline');
const readinessTextEl = document.getElementById('readiness-text');
const checklistContainer = document.getElementById('checklist-container');
const markRegisteredBtn = document.getElementById('mark-registered-btn');

// --- Helper Functions ---

/** Gets the activityId from the URL query parameters. */
function getActivityIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

/** Simulates fetching activity data based on an ID. */
function fetchActivityData(activityId) {
    // In your real app, this would be a Firebase call:
    // return getDoc(doc(db, 'activities', activityId));
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockActivities[activityId] || null);
        }, 300);
    });
}

// --- Core Functions ---

/** Displays the activity summary on the page. */
function displayActivitySummary(activity) {
    activityNameEl.textContent = activity.name;
    activityTypeEl.textContent = activity.type;
    mainDeadlineEl.textContent = activity.mainDeadline;
    // Personalised readiness summary (based on spec)
    readinessTextEl.textContent = `You have a strong interest in Environment & Leadership, as shown by your profile. The ${activity.name} is a perfect match to build your leadership skills. Here is your personalized checklist to guide you through registration.`;
}

/** Generates and renders the checklist from the activity's requirements. */
function renderChecklist(requirements) {
    checklistContainer.innerHTML = ''; // Clear previous list
    if (!requirements || requirements.length === 0) {
        checklistContainer.innerHTML = '<li>No specific requirements for this activity.</li>';
        return;
    }

    requirements.forEach((req, index) => {
        const listItem = document.createElement('li');
        listItem.id = `checklist-item-${req.id}`;
        listItem.dataset.completed = 'false';

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checklist-item-checkbox';
        checkbox.id = `checkbox-${req.id}`;
        checkbox.addEventListener('change', (e) => handleChecklistChange(e, listItem));

        // Content Div
        const contentDiv = document.createElement('div');
        contentDiv.className = 'checklist-item-content';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'checklist-item-title';
        titleSpan.textContent = `${index + 1}. ${req.title}`;

        const descSpan = document.createElement('span');
        descSpan.className = 'checklist-item-desc';
        descSpan.textContent = req.description;

        const dueSpan = document.createElement('span');
        dueSpan.className = 'checklist-item-due';
        dueSpan.textContent = `Due: ${req.dueDate}`;

        // Assemble the list item
        contentDiv.appendChild(titleSpan);
        contentDiv.appendChild(descSpan);
        contentDiv.appendChild(dueSpan);

        listItem.appendChild(checkbox);
        listItem.appendChild(contentDiv);
        checklistContainer.appendChild(listItem);
    });
}

/** Handles a change in a checklist item's checkbox state. */
function handleChecklistChange(event, listItem) {
    if (event.target.checked) {
        listItem.dataset.completed = 'true';
        listItem.classList.add('completed');
    } else {
        listItem.dataset.completed = 'false';
        listItem.classList.remove('completed');
    }
    updateRegistrationButtonState();
}

/** Enables or disables the "Mark as Registered" button based on checklist completion. */
function updateRegistrationButtonState() {
    const allItems = document.querySelectorAll('#checklist-container li');
    let allCompleted = true;
    allItems.forEach(item => {
        if (item.dataset.completed === 'false') {
            allCompleted = false;
        }
    });

    markRegisteredBtn.disabled = !allCompleted;
    markRegisteredBtn.textContent = allCompleted ? '✅ Mark as Registered' : 'Complete all steps to register';
}

/** Handles the final registration action. */
function handleRegistrationComplete(activityId) {
    if (markRegisteredBtn.disabled) return;

    // --- Save registration status ---
    // In your real app, you would update Firestore here.
    // Example: await updateDoc(doc(db, 'users', userId), { registeredActivities: arrayUnion(activityId) });
    
    // Using localStorage as a simple simulation for the prototype
    const registeredActivities = JSON.parse(localStorage.getItem('registeredActivities') || '[]');
    if (!registeredActivities.includes(activityId)) {
        registeredActivities.push(activityId);
        localStorage.setItem('registeredActivities', JSON.stringify(registeredActivities));
    }

    alert(`🎉 Congratulations! You have successfully registered for this activity!`);
    // Redirect to portfolio page after successful registration
    window.location.href = 'portfolio.html';
}

// --- Initialize Phase 3 ---
async function initPhase3() {
    const activityId = getActivityIdFromURL();
    if (!activityId) {
        alert('No activity selected. Please choose an activity first.');
        window.location.href = 'activities.html';
        return;
    }

    const activity = await fetchActivityData(activityId);
    if (!activity) {
        alert('Activity not found. Please try again.');
        window.location.href = 'activities.html';
        return;
    }

    displayActivitySummary(activity);
    renderChecklist(activity.registrationRequirements);
    updateRegistrationButtonState(); // Ensure button is disabled initially

    // Add event listener for the final registration button
    markRegisteredBtn.addEventListener('click', () => handleRegistrationComplete(activityId));
}

// Run the script when the page is ready
document.addEventListener('DOMContentLoaded', initPhase3);
