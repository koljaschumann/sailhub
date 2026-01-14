/**
 * ClickUp + GitHub Ticket Service
 * Creates tickets in ClickUp AND GitHub with AI-powered categorization
 */

const CLICKUP_API = 'https://api.clickup.com/api/v2';
const GITHUB_API = 'https://api.github.com';
const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ClickUp Configuration - SailHub Space
const CLICKUP_CONFIG = {
    teamId: '90152104402',
    spaceId: '90158816299',  // SailHub Space
    listId: import.meta.env.VITE_CLICKUP_TSC_LIST_ID || '901518789734',  // SailHub List
};

// GitHub Configuration
const GITHUB_CONFIG = {
    owner: 'koljaschumann',
    repo: 'sailhub',
};

/**
 * Analyze ticket with Gemini AI
 */
async function analyzeTicketWithAI(title, description, type) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('No Gemini API key, skipping AI analysis');
        return {
            category: type || 'feedback',
            priority: 'medium',
            estimatedEffort: 'small',
            summary: description.substring(0, 200)
        };
    }

    const prompt = `Analysiere dieses Feedback/Bug-Report und erstelle eine JSON-Kategorisierung:

Titel: ${title}
Typ: ${type}
Beschreibung: ${description}

Gib NUR valides JSON zurück:
{
  "category": "bug|feature|ux|performance|question|other",
  "priority": "critical|high|medium|low",
  "estimatedEffort": "quick_win|small|medium|large",
  "summary": "Kurze technische Zusammenfassung für Entwickler (max 100 Zeichen)",
  "suggestedSolution": "Optional: Lösungsvorschlag falls offensichtlich"
}`;

    try {
        const response = await fetch(`${GEMINI_API}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 500,
                    responseMimeType: 'application/json'
                }
            })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        return JSON.parse(text);
    } catch (err) {
        console.error('AI analysis failed:', err);
        return {
            category: type || 'feedback',
            priority: 'medium',
            estimatedEffort: 'small',
            summary: description.substring(0, 200)
        };
    }
}

/**
 * Map priority to ClickUp priority (1=urgent, 4=low)
 */
function mapPriorityToClickUp(priority) {
    switch (priority) {
        case 'critical': return 1;
        case 'high': return 2;
        case 'medium': return 3;
        case 'low': return 4;
        default: return 3;
    }
}

/**
 * Map category to GitHub labels
 */
function mapCategoryToGitHubLabels(category, priority) {
    const labels = [];

    // Category labels
    switch (category) {
        case 'bug': labels.push('bug'); break;
        case 'feature': labels.push('enhancement'); break;
        case 'ux': labels.push('ux', 'enhancement'); break;
        case 'performance': labels.push('performance'); break;
        case 'question': labels.push('question'); break;
        default: labels.push('feedback');
    }

    // Priority labels
    if (priority === 'critical') labels.push('priority: critical');
    if (priority === 'high') labels.push('priority: high');

    return labels;
}

/**
 * Create GitHub issue
 */
async function createGitHubIssue(ticketData, aiAnalysis) {
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    if (!token) {
        console.warn('No GitHub token, skipping issue creation');
        return null;
    }

    const issueTitle = `[${aiAnalysis.category.toUpperCase()}] ${ticketData.context || ticketData.type}: ${aiAnalysis.summary}`;

    const issueBody = `## Feedback Details

| Feld | Wert |
|------|------|
| **Typ** | ${ticketData.type} |
| **Kontext** | ${ticketData.context || 'N/A'} |
| **App** | ${ticketData.appName || 'TSC Jugend Plattform'} |
| **URL** | ${ticketData.url || 'N/A'} |
| **Priorität** | ${aiAnalysis.priority} |
| **Aufwand** | ${aiAnalysis.estimatedEffort} |

## Beschreibung

${ticketData.description}

## AI Analyse

> **Zusammenfassung:** ${aiAnalysis.summary}
${aiAnalysis.suggestedSolution ? `\n> **Lösungsvorschlag:** ${aiAnalysis.suggestedSolution}` : ''}

---
*Automatisch erstellt via TSC Feedback Widget*
*User Agent: ${ticketData.userAgent || 'N/A'}*
`;

    try {
        const response = await fetch(`${GITHUB_API}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: issueTitle,
                body: issueBody,
                labels: mapCategoryToGitHubLabels(aiAnalysis.category, aiAnalysis.priority)
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('GitHub API error:', error);
            return null;
        }

        const issue = await response.json();
        return {
            issueNumber: issue.number,
            url: issue.html_url
        };
    } catch (err) {
        console.error('Failed to create GitHub issue:', err);
        return null;
    }
}

/**
 * Create ClickUp task
 */
async function createClickUpTask(ticketData, aiAnalysis, githubIssue) {
    const apiToken = import.meta.env.VITE_CLICKUP_API_TOKEN;
    if (!apiToken) {
        console.warn('No ClickUp API token, skipping task creation');
        return null;
    }

    const taskName = `[${aiAnalysis.category.toUpperCase()}] ${ticketData.context || ticketData.type}`;

    const taskDescription = `
## Feedback Details

**Typ:** ${ticketData.type}
**Kontext:** ${ticketData.context || 'N/A'}
**App:** ${ticketData.appName || 'TSC Jugend Plattform'}
**URL:** ${ticketData.url || 'N/A'}

---

## Beschreibung

${ticketData.description}

---

## AI Analyse

- **Kategorie:** ${aiAnalysis.category}
- **Priorität:** ${aiAnalysis.priority}
- **Aufwand:** ${aiAnalysis.estimatedEffort}
- **Zusammenfassung:** ${aiAnalysis.summary}
${aiAnalysis.suggestedSolution ? `- **Lösungsvorschlag:** ${aiAnalysis.suggestedSolution}` : ''}

${githubIssue ? `---\n\n🔗 **GitHub Issue:** [#${githubIssue.issueNumber}](${githubIssue.url})` : ''}

---

*Erstellt: ${new Date().toLocaleString('de-DE')}*
`;

    try {
        const response = await fetch(`${CLICKUP_API}/list/${CLICKUP_CONFIG.listId}/task`, {
            method: 'POST',
            headers: {
                'Authorization': apiToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: taskName,
                markdown_description: taskDescription,
                priority: mapPriorityToClickUp(aiAnalysis.priority),
                tags: [aiAnalysis.category, ticketData.appName || 'tsc'],
                status: 'to do'
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('ClickUp API error:', error);
            return null;
        }

        const task = await response.json();
        return {
            taskId: task.id,
            url: task.url
        };
    } catch (err) {
        console.error('Failed to create ClickUp task:', err);
        return null;
    }
}

/**
 * Submit ticket - main entry point
 * Creates tickets in both ClickUp AND GitHub with AI analysis
 * 
 * @param {Object} feedbackData - { type, context, description, email, appName, url, userAgent }
 * @returns {Promise<Object>} - { success, ticketId, category, priority, clickupUrl, githubUrl }
 */
/**
 * Submit account deletion notice - GDPR compliance
 * Creates tickets in both ClickUp AND GitHub for data deletion tracking
 *
 * @param {Object} userData - { userId, email, fullName, role, deletionReason }
 * @returns {Promise<Object>} - { success, ticketId, clickupUrl, githubUrl }
 */
export async function submitDeletionNotice(userData) {
    const ticketCounter = parseInt(localStorage.getItem('sh_ticket_counter') || '0') + 1;
    localStorage.setItem('sh_ticket_counter', ticketCounter.toString());
    const ticketId = `DEL-${ticketCounter.toString().padStart(3, '0')}`;

    const deletionData = {
        type: 'account_deletion',
        context: 'DSGVO Löschantrag',
        description: `Ein Benutzer hat seinen Account gelöscht.

**Benutzer-ID:** ${userData.userId}
**E-Mail:** ${userData.email}
**Name:** ${userData.fullName || 'Nicht angegeben'}
**Rolle:** ${userData.role || 'Nicht angegeben'}
**Löschgrund:** ${userData.deletionReason || 'Nicht angegeben'}
**Zeitpunkt:** ${new Date().toLocaleString('de-DE')}

## DSGVO Anforderungen

Gemäß Art. 17 DSGVO müssen folgende Daten innerhalb von 30 Tagen gelöscht werden:
- [ ] Profildaten in der Datenbank
- [ ] Bankdaten (falls vorhanden)
- [ ] Hochgeladene Dateien (Fotos, Belege)
- [ ] Event-Anmeldungen
- [ ] Erstattungsanträge
- [ ] Schadensmeldungen
- [ ] Charterbuchungen
- [ ] Förderanträge

**Hinweis:** Buchhaltungsrelevante Daten müssen gemäß §§ 147 AO, 257 HGB 10 Jahre aufbewahrt werden.`,
        appName: 'TSC Jugend Plattform',
        url: 'https://sailhub.aitema.de'
    };

    // Fixed analysis for deletion notices (no AI needed)
    const aiAnalysis = {
        category: 'gdpr',
        priority: 'high',
        estimatedEffort: 'medium',
        summary: `Account-Löschung: ${userData.email}`
    };

    // Create GitHub Issue
    const githubIssue = await createGitHubIssueDeletion(deletionData, aiAnalysis, ticketId);

    // Create ClickUp Task
    const clickupTask = await createClickUpTaskDeletion(deletionData, aiAnalysis, githubIssue, ticketId);

    return {
        success: true,
        ticketId,
        clickupUrl: clickupTask?.url,
        githubUrl: githubIssue?.url
    };
}

/**
 * Create GitHub issue for account deletion
 */
async function createGitHubIssueDeletion(deletionData, aiAnalysis, ticketId) {
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    if (!token) {
        console.warn('No GitHub token, skipping deletion issue creation');
        return null;
    }

    const issueTitle = `[DSGVO] ${ticketId}: ${aiAnalysis.summary}`;
    const issueBody = `## Account-Löschung - DSGVO Compliance

${deletionData.description}

---
*Automatisch erstellt via TSC Account Deletion Handler*
*Ticket-ID: ${ticketId}*
`;

    try {
        const response = await fetch(`${GITHUB_API}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: issueTitle,
                body: issueBody,
                labels: ['gdpr', 'account-deletion', 'priority: high']
            })
        });

        if (!response.ok) {
            console.error('GitHub API error:', await response.text());
            return null;
        }

        const issue = await response.json();
        return { issueNumber: issue.number, url: issue.html_url };
    } catch (err) {
        console.error('Failed to create GitHub deletion issue:', err);
        return null;
    }
}

/**
 * Create ClickUp task for account deletion
 */
async function createClickUpTaskDeletion(deletionData, aiAnalysis, githubIssue, ticketId) {
    const apiToken = import.meta.env.VITE_CLICKUP_API_TOKEN;
    if (!apiToken) {
        console.warn('No ClickUp API token, skipping deletion task creation');
        return null;
    }

    const taskName = `[DSGVO] ${ticketId}: ${aiAnalysis.summary}`;
    const taskDescription = `
## Account-Löschung - DSGVO Compliance

${deletionData.description}

${githubIssue ? `---\n\n🔗 **GitHub Issue:** [#${githubIssue.issueNumber}](${githubIssue.url})` : ''}

---
*Ticket-ID: ${ticketId}*
*Erstellt: ${new Date().toLocaleString('de-DE')}*
`;

    try {
        const response = await fetch(`${CLICKUP_API}/list/${CLICKUP_CONFIG.listId}/task`, {
            method: 'POST',
            headers: {
                'Authorization': apiToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: taskName,
                markdown_description: taskDescription,
                priority: 2, // High priority
                tags: ['gdpr', 'account-deletion', 'tsc'],
                status: 'to do'
            })
        });

        if (!response.ok) {
            console.error('ClickUp API error:', await response.text());
            return null;
        }

        const task = await response.json();
        return { taskId: task.id, url: task.url };
    } catch (err) {
        console.error('Failed to create ClickUp deletion task:', err);
        return null;
    }
}

/**
 * Submit ticket - main entry point
 * Creates tickets in both ClickUp AND GitHub with AI analysis
 *
 * @param {Object} feedbackData - { type, context, description, email, appName, url, userAgent }
 * @returns {Promise<Object>} - { success, ticketId, category, priority, clickupUrl, githubUrl }
 */
export async function submitTicket(feedbackData) {
    // Generate sequential ticket ID (SH-001, SH-002, etc.)
    const ticketCounter = parseInt(localStorage.getItem('sh_ticket_counter') || '0') + 1;
    localStorage.setItem('sh_ticket_counter', ticketCounter.toString());
    const ticketId = `SH-${ticketCounter.toString().padStart(3, '0')}`;

    // Step 1: AI Analysis
    const aiAnalysis = await analyzeTicketWithAI(
        feedbackData.context || feedbackData.type,
        feedbackData.description,
        feedbackData.type
    );

    // Step 2: Create GitHub Issue first (to link in ClickUp)
    const githubIssue = await createGitHubIssue(feedbackData, aiAnalysis);

    // Step 3: Create ClickUp Task (with GitHub link)
    const clickupTask = await createClickUpTask(feedbackData, aiAnalysis, githubIssue);

    // Step 4: Store locally as backup
    try {
        const existing = JSON.parse(localStorage.getItem('tsc_feedback') || '[]');
        existing.push({
            id: ticketId,
            ...feedbackData,
            aiAnalysis,
            clickupTaskId: clickupTask?.taskId,
            githubIssueNumber: githubIssue?.issueNumber,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('tsc_feedback', JSON.stringify(existing));
    } catch (e) {
        console.warn('Failed to store ticket locally:', e);
    }

    return {
        success: true,
        ticketId,
        category: aiAnalysis.category,
        priority: aiAnalysis.priority,
        estimatedEffort: aiAnalysis.estimatedEffort,
        suggestedSolution: aiAnalysis.suggestedSolution,
        clickupUrl: clickupTask?.url,
        githubUrl: githubIssue?.url,
        githubIssueNumber: githubIssue?.issueNumber
    };
}

export default { submitTicket, submitDeletionNotice };
