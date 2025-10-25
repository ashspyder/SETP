from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    role: str  # 'staff' or 'student'
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    role: str

class Module(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    order: int
    video_url: str
    content: str
    duration: str

class Question(BaseModel):
    id: str
    question: str
    type: str  # 'mcq' or 'true_false'
    options: Optional[List[str]] = None
    correct_answer: str

class Assessment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    module_id: str
    questions: List[Question]

class AssessmentSubmission(BaseModel):
    user_id: str
    answers: Dict[str, str]  # question_id -> answer

class AssessmentResult(BaseModel):
    score: int
    total: int
    percentage: float
    passed: bool

class Progress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    module_id: str
    completed: bool
    score: Optional[int] = None
    total_questions: Optional[int] = None
    completed_at: Optional[datetime] = None

class Feedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    module_id: str
    rating: int
    comments: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeedbackCreate(BaseModel):
    user_id: str
    module_id: str
    rating: int
    comments: str


# Initialize modules data
MODULES_DATA = [
    {
        "id": "module-1",
        "title": "The Human Hacking Mindset: How Social Engineering Works",
        "description": "Understanding the psychology behind social engineering attacks and how attackers exploit human behavior.",
        "order": 1,
        "video_url": "https://www.youtube.com/embed/cuh5oKVyG4w",
        "content": """---

## 📌 What is Social Engineering?

**Social engineering** is the psychological manipulation of people to trick them into:
- Divulging confidential information
- Performing actions that compromise security
- Bypassing normal security procedures

> *"Humans are often the weakest link in cybersecurity"*

---

## 🧠 The Psychology Behind Attacks

### How Attackers Exploit Human Nature:

**1. Trust Building**
- Creating false sense of familiarity
- Impersonating authority figures
- Using emotional manipulation

**2. Cognitive Biases**
- Authority bias (following orders without question)
- Urgency bias (pressure to act quickly)
- Scarcity principle (fear of missing out)

**3. Information Gathering (OSINT)**
- Social media reconnaissance
- Public records research
- Building detailed target profiles

---

## 🎯 Common Attack Vectors

| Attack Type | Description | Example |
|------------|-------------|---------|
| **Pretexting** | Creating a fabricated scenario | "I'm from IT, need your password" |
| **Baiting** | Offering something enticing | Free USB drives with malware |
| **Quid Pro Quo** | Promising benefits for information | "Survey" that steals data |

---

## 🛡️ Defense Strategies

### Individual Level:
✅ **Verify, verify, verify** - Always confirm requests through separate channels  
✅ **Question authority** - Even senior requests need verification  
✅ **Slow down** - Urgency is a red flag  
✅ **Protect information** - Don't overshare on social media

### Organizational Level:
✅ Security awareness training  
✅ Clear verification protocols  
✅ Incident reporting procedures  
✅ Regular security audits

---

## 📊 Real-World Impact

**Famous Cases:**
- Kevin Mitnick: Master social engineer who breached major corporations
- Target Breach (2013): 40M+ credit cards stolen via HVAC vendor
- Twitter Hack (2020): High-profile accounts compromised via employee manipulation

**Statistics:**
- 98% of cyber attacks rely on social engineering
- Average cost of breach: $4.24 million
- Human error causes 95% of security incidents

---

## 🎓 Key Takeaways

1. Social engineering targets **human psychology**, not technology
2. Attackers exploit **trust, authority, and urgency**
3. **Anyone can be a target** - stay vigilant
4. **Verification protocols** are your best defense
5. **Report suspicious activity** immediately""",
        "duration": "45 mins"
    },
    {
        "id": "module-2",
        "title": "Email and Digital Deception (Phishing & Spear Phishing)",
        "description": "Learn to identify and defend against phishing attacks, spear phishing, and email-based social engineering.",
        "order": 2,
        "video_url": "https://www.youtube.com/embed/PWVN3Rq4gzw",
        "content": """---

## 📧 Understanding Phishing Attacks

**Phishing** is the fraudulent practice of sending emails pretending to be from reputable companies to steal sensitive information.

### Why Phishing Works:
- ✉️ Emails appear legitimate
- 🎭 Uses social engineering tactics
- ⚡ Creates sense of urgency
- 🎣 Exploits human trust

---

## 🎯 Types of Phishing

### 1. **Generic Phishing** (Mass Attacks)
- Sent to thousands of users
- Generic messages
- Low success rate, high volume
- Example: "Your account will be closed!"

### 2. **Spear Phishing** (Targeted Attacks)
- Personalized for specific individuals
- Research-based approach
- Higher success rate
- Example: Email mentioning your recent purchase

### 3. **Whaling** (Executive Targeting)
- Targets C-level executives
- High-value information sought
- Often impersonates board members
- Example: "CEO requesting urgent wire transfer"

### 4. **Clone Phishing**
- Duplicates legitimate email
- Replaces links with malicious ones
- Appears from trusted source
- Example: "Resending invoice with updated link"

---

## 🚨 Red Flags Checklist

**Always Check For:**

| Warning Sign | What to Look For |
|-------------|------------------|
| ❌ Sender Address | Slight misspellings (paypa1.com vs paypal.com) |
| ❌ Generic Greeting | "Dear Customer" instead of your name |
| ❌ Urgency/Threats | "Act now or account suspended!" |
| ❌ Suspicious Links | Hover to reveal actual destination |
| ❌ Attachments | Unexpected files (.exe, .zip) |
| ❌ Grammar Errors | Poor spelling and grammar |
| ❌ Information Requests | Asking for passwords, SSN, credit cards |

---

## 🔍 Link Inspection Technique

**Before Clicking ANY Link:**

1. **Hover** your mouse over the link (don't click!)
2. **Check** the actual URL in bottom-left corner
3. **Verify** it matches the claimed destination
4. **Look for** HTTPS and correct domain

**Example:**
```
Display Text: "Click here to verify your PayPal account"
Actual Link: http://paypa1-security.tk/login
              ↑ Wrong domain!
```

---

## 🛡️ Defense Mechanisms

### Technical Defenses:
✅ **Email Authentication** (SPF, DKIM, DMARC)  
✅ **Spam Filters** and AI detection  
✅ **Link Protection** services  
✅ **Sandboxing** attachments

### Human Defenses:
✅ **Think before you click**  
✅ **Verify through separate channel** (call the company)  
✅ **Enable MFA** everywhere possible  
✅ **Keep software updated**  
✅ **Report suspicious emails** to IT

---

## 💡 What to Do If You Clicked

**If you suspect you clicked a phishing link:**

1. **🔌 Disconnect** from internet immediately
2. **📸 Document** the email and website
3. **🚨 Report** to IT security NOW
4. **🔐 Change** passwords (from a different device)
5. **👁️ Monitor** accounts for suspicious activity

> **Remember:** It's better to report a false alarm than ignore a real threat!

---

## 📊 Phishing Statistics

- **91%** of cyberattacks start with a phishing email
- **1 in 99** emails is a phishing attempt
- **30%** of phishing emails are opened
- **12%** of users click malicious links
- **Average cost** of successful phishing: $1.6M

---

## 🎓 Key Takeaways

1. **Verify before you trust** - Even if it looks legitimate
2. **Hover before you click** - Check where links really go
3. **Slow down** - Urgency is a manipulation tactic
4. **When in doubt, throw it out** - Delete suspicious emails
5. **Report everything** - Help protect others""",
        "duration": "40 mins"
    },
    {
        "id": "module-3",
        "title": "Voice and Physical Threats (Vishing & Tailgating)",
        "description": "Understanding vishing (voice phishing) and physical security threats like tailgating and pretexting.",
        "order": 3,
        "video_url": "https://www.youtube.com/embed/lc7scxvKQOo",
        "content": """# Voice and Physical Social Engineering

Attacks aren't limited to digital channels. This module explores:

## Vishing (Voice Phishing):
- Impersonation of IT support or authority figures
- Creating urgency over phone calls
- Caller ID spoofing techniques
- Voice manipulation and deepfakes

## Physical Security Threats:
- **Tailgating**: Following authorized personnel through secure doors
- **Pretexting**: Creating false scenarios to gain access
- **Shoulder Surfing**: Observing sensitive information entry
- **Dumpster Diving**: Retrieving information from trash

## Warning Signs:
- Unsolicited calls requesting credentials
- Pressure to act immediately
- Requests to bypass normal procedures
- Unknown persons in restricted areas

## Prevention Measures:
- Challenge unfamiliar people politely
- Use badge systems and access controls
- Shred sensitive documents
- Be aware of your surroundings
- Verify caller identity through callback procedures
- Never share passwords or credentials over phone

## Scenario Training:
Role-playing exercises to practice responding to vishing attempts.""",
        "duration": "35 mins"
    },
    {
        "id": "module-4",
        "title": "Data Protection & Reporting Protocol",
        "description": "Best practices for protecting sensitive data and proper procedures for reporting security incidents.",
        "order": 4,
        "video_url": "https://www.youtube.com/embed/inWWhr5tnEA",
        "content": """# Data Protection & Incident Response

Learn how to protect data and respond to security incidents effectively.

## Data Protection Principles:
- **Least Privilege**: Access only what's necessary
- **Data Classification**: Understanding sensitivity levels
- **Encryption**: Protecting data at rest and in transit
- **Secure Storage**: Physical and digital safeguards
- **Clean Desk Policy**: Securing physical workspaces

## Password Security:
- Use strong, unique passwords
- Enable multi-factor authentication (MFA)
- Use password managers
- Never share credentials
- Regular password updates for sensitive accounts

## Incident Reporting Protocol:
1. **Recognize** the potential security incident
2. **Stop** interacting with suspicious content
3. **Document** what happened (screenshots, details)
4. **Report** immediately to IT security team
5. **Follow up** as instructed by security team

## What to Report:
- Suspicious emails or messages
- Lost or stolen devices
- Unauthorized access attempts
- Accidental data disclosure
- Any security policy violations

## Response Time Matters:
Early reporting can prevent or minimize damage. Never delay reporting due to embarrassment or fear.

## University Resources:
- IT Security Hotline
- Security Incident Response Team (SIRT)
- Regular security training sessions
- Security awareness campaigns""",
        "duration": "30 mins"
    }
]

ASSESSMENTS_DATA = [
    {
        "id": "assessment-1",
        "module_id": "module-1",
        "questions": [
            {
                "id": "q1-1",
                "question": "What is social engineering primarily based on?",
                "type": "mcq",
                "options": [
                    "Exploiting software vulnerabilities",
                    "Manipulating human psychology and behavior",
                    "Breaking encryption algorithms",
                    "Installing malware on systems"
                ],
                "correct_answer": "Manipulating human psychology and behavior"
            },
            {
                "id": "q1-2",
                "question": "Social engineers often create a sense of urgency to bypass critical thinking.",
                "type": "true_false",
                "options": ["True", "False"],
                "correct_answer": "True"
            },
            {
                "id": "q1-3",
                "question": "Which technique involves gathering information about targets from public sources?",
                "type": "mcq",
                "options": [
                    "Phishing",
                    "OSINT (Open Source Intelligence)",
                    "Malware installation",
                    "SQL Injection"
                ],
                "correct_answer": "OSINT (Open Source Intelligence)"
            },
            {
                "id": "q1-4",
                "question": "Building rapport and trust is not important in social engineering attacks.",
                "type": "true_false",
                "options": ["True", "False"],
                "correct_answer": "False"
            },
            {
                "id": "q1-5",
                "question": "What should you do when receiving an unusual request from someone claiming to be an authority figure?",
                "type": "mcq",
                "options": [
                    "Comply immediately to avoid trouble",
                    "Ignore the request completely",
                    "Verify through a separate, trusted channel",
                    "Forward the request to colleagues"
                ],
                "correct_answer": "Verify through a separate, trusted channel"
            }
        ]
    },
    {
        "id": "assessment-2",
        "module_id": "module-2",
        "questions": [
            {
                "id": "q2-1",
                "question": "What is the difference between phishing and spear phishing?",
                "type": "mcq",
                "options": [
                    "There is no difference",
                    "Spear phishing targets specific individuals, phishing is mass-targeted",
                    "Phishing uses email, spear phishing uses phone",
                    "Spear phishing is less dangerous"
                ],
                "correct_answer": "Spear phishing targets specific individuals, phishing is mass-targeted"
            },
            {
                "id": "q2-2",
                "question": "Hovering over a link before clicking can help reveal the actual destination URL.",
                "type": "true_false",
                "options": ["True", "False"],
                "correct_answer": "True"
            },
            {
                "id": "q2-3",
                "question": "Which of the following is NOT a typical red flag in phishing emails?",
                "type": "mcq",
                "options": [
                    "Urgent language demanding immediate action",
                    "Professional formatting and correct grammar",
                    "Requests for sensitive information",
                    "Suspicious sender email address"
                ],
                "correct_answer": "Professional formatting and correct grammar"
            },
            {
                "id": "q2-4",
                "question": "You should always report suspicious emails to your IT security team, even if you're not sure.",
                "type": "true_false",
                "options": ["True", "False"],
                "correct_answer": "True"
            },
            {
                "id": "q2-5",
                "question": "What does 'whaling' refer to in the context of phishing?",
                "type": "mcq",
                "options": [
                    "Phishing attacks using whale images",
                    "Mass phishing campaigns",
                    "Targeted attacks on senior executives",
                    "Phishing through social media"
                ],
                "correct_answer": "Targeted attacks on senior executives"
            }
        ]
    },
    {
        "id": "assessment-3",
        "module_id": "module-3",
        "questions": [
            {
                "id": "q3-1",
                "question": "What is vishing?",
                "type": "mcq",
                "options": [
                    "Voice phishing - phone-based social engineering",
                    "Video phishing - attacks via video calls",
                    "Virtual phishing - attacks in VR environments",
                    "Visual phishing - image-based attacks"
                ],
                "correct_answer": "Voice phishing - phone-based social engineering"
            },
            {
                "id": "q3-2",
                "question": "Tailgating refers to following someone through a secure door without proper authorization.",
                "type": "true_false",
                "options": ["True", "False"],
                "correct_answer": "True"
            },
            {
                "id": "q3-3",
                "question": "What should you do if someone calls claiming to be from IT and asks for your password?",
                "type": "mcq",
                "options": [
                    "Provide the password immediately",
                    "Ask them to send an email first",
                    "Never provide your password; verify their identity through official channels",
                    "Change your password and then tell them"
                ],
                "correct_answer": "Never provide your password; verify their identity through official channels"
            },
            {
                "id": "q3-4",
                "question": "It's rude to challenge unfamiliar people in restricted areas, so you should avoid doing so.",
                "type": "true_false",
                "options": ["True", "False"],
                "correct_answer": "False"
            },
            {
                "id": "q3-5",
                "question": "What is 'pretexting' in social engineering?",
                "type": "mcq",
                "options": [
                    "Sending text messages with malicious links",
                    "Creating a fabricated scenario to manipulate targets",
                    "Writing fake news articles",
                    "Preparing text-based phishing emails"
                ],
                "correct_answer": "Creating a fabricated scenario to manipulate targets"
            }
        ]
    },
    {
        "id": "assessment-4",
        "module_id": "module-4",
        "questions": [
            {
                "id": "q4-1",
                "question": "What does the 'Least Privilege' principle mean?",
                "type": "mcq",
                "options": [
                    "Everyone should have minimal system access",
                    "Users should only have access to information necessary for their role",
                    "Only senior staff should have privileges",
                    "Privileges should be changed frequently"
                ],
                "correct_answer": "Users should only have access to information necessary for their role"
            },
            {
                "id": "q4-2",
                "question": "Multi-factor authentication (MFA) adds an extra layer of security beyond just passwords.",
                "type": "true_false",
                "options": ["True", "False"],
                "correct_answer": "True"
            },
            {
                "id": "q4-3",
                "question": "When should you report a security incident?",
                "type": "mcq",
                "options": [
                    "Only if you're certain it's a real threat",
                    "After trying to fix it yourself",
                    "Immediately, even if you're unsure",
                    "At the end of the work day"
                ],
                "correct_answer": "Immediately, even if you're unsure"
            },
            {
                "id": "q4-4",
                "question": "You should delay reporting security incidents if you're embarrassed about falling for an attack.",
                "type": "true_false",
                "options": ["True", "False"],
                "correct_answer": "False"
            },
            {
                "id": "q4-5",
                "question": "What is the first step when you suspect a security incident?",
                "type": "mcq",
                "options": [
                    "Delete all suspicious emails",
                    "Recognize and stop interacting with suspicious content",
                    "Share the incident on social media",
                    "Restart your computer"
                ],
                "correct_answer": "Recognize and stop interacting with suspicious content"
            }
        ]
    }
]


async def initialize_data():
    """Initialize modules and assessments data if not exists"""
    # Check if modules exist
    existing_modules = await db.modules.count_documents({})
    if existing_modules == 0:
        await db.modules.insert_many(MODULES_DATA)
        logger.info("Initialized modules data")
    
    # Check if assessments exist
    existing_assessments = await db.assessments.count_documents({})
    if existing_assessments == 0:
        await db.assessments.insert_many(ASSESSMENTS_DATA)
        logger.info("Initialized assessments data")


# Routes
@api_router.post("/users", response_model=User)
async def create_user(input: UserCreate):
    """Create a new user with role selection"""
    user = User(name=input.name, role=input.role)
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    return user


@api_router.get("/modules", response_model=List[Module])
async def get_modules():
    """Get all training modules"""
    modules = await db.modules.find({}, {"_id": 0}).to_list(100)
    return modules


@api_router.get("/modules/{module_id}", response_model=Module)
async def get_module(module_id: str):
    """Get a specific module by ID"""
    module = await db.modules.find_one({"id": module_id}, {"_id": 0})
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module


@api_router.get("/assessments/{module_id}")
async def get_assessment(module_id: str):
    """Get assessment for a module (without correct answers)"""
    assessment = await db.assessments.find_one({"module_id": module_id}, {"_id": 0})
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Remove correct answers before sending to client
    questions = []
    for q in assessment['questions']:
        question_copy = q.copy()
        question_copy.pop('correct_answer', None)
        questions.append(question_copy)
    
    return {
        "id": assessment['id'],
        "module_id": assessment['module_id'],
        "questions": questions
    }


@api_router.post("/assessments/{module_id}/submit", response_model=AssessmentResult)
async def submit_assessment(module_id: str, submission: AssessmentSubmission):
    """Submit assessment answers and get results"""
    assessment = await db.assessments.find_one({"module_id": module_id})
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Calculate score
    correct = 0
    total = len(assessment['questions'])
    
    for question in assessment['questions']:
        user_answer = submission.answers.get(question['id'])
        if user_answer == question['correct_answer']:
            correct += 1
    
    percentage = (correct / total) * 100 if total > 0 else 0
    passed = percentage >= 70  # 70% passing grade
    
    # Save or update progress
    existing_progress = await db.progress.find_one({
        "user_id": submission.user_id,
        "module_id": module_id
    })
    
    progress_doc = {
        "user_id": submission.user_id,
        "module_id": module_id,
        "completed": passed,
        "score": correct,
        "total_questions": total,
        "completed_at": datetime.now(timezone.utc).isoformat()
    }
    
    if existing_progress:
        # Update only if new score is better
        if correct > existing_progress.get('score', 0):
            await db.progress.update_one(
                {"user_id": submission.user_id, "module_id": module_id},
                {"$set": progress_doc}
            )
    else:
        progress_doc['id'] = str(uuid.uuid4())
        await db.progress.insert_one(progress_doc)
    
    return AssessmentResult(
        score=correct,
        total=total,
        percentage=round(percentage, 1),
        passed=passed
    )


@api_router.post("/feedback", response_model=Feedback)
async def submit_feedback(input: FeedbackCreate):
    """Submit feedback for a module"""
    feedback = Feedback(**input.model_dump())
    doc = feedback.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.feedback.insert_one(doc)
    return feedback


@api_router.get("/progress/{user_id}")
async def get_user_progress(user_id: str):
    """Get progress for a user across all modules"""
    progress_list = await db.progress.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(100)
    return progress_list


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    await initialize_data()
    logger.info("Application started and data initialized")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()