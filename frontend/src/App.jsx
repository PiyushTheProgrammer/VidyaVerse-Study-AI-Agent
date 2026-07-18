import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  Circle, 
  TrendingUp, 
  Flame, 
  Clock, 
  AlertCircle, 
  Award, 
  ArrowRight, 
  RotateCcw, 
  RefreshCw, 
  Check,
  ChevronRight,
  HelpCircle,
  Activity,
  Sliders,
  User,
  Users,
  MessageSquare,
  LogOut,
  Lock,
  Mail,
  Phone,
  Shield,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Brain,
  ClipboardList,
  GraduationCap,
  Compass,
  MapPin
} from 'lucide-react';


const API_BASE = import.meta.env.VITE_API_URL;

const renderFormatting = (text, theme) => {
  if (!text) return "";
  const boldParts = text.split(/(\*\*.*?\*\*)/g);
  return boldParts.map((bPart, bIdx) => {
    if (bPart.startsWith('**') && bPart.endsWith('**')) {
      const innerText = bPart.slice(2, -2);
      const italicParts = innerText.split(/(\*.*?\*|_.*?_)/g);
      const content = italicParts.map((iPart, iIdx) => {
        if ((iPart.startsWith('*') && iPart.endsWith('*')) || (iPart.startsWith('_') && iPart.endsWith('_'))) {
          return <em key={iIdx} className="italic font-extrabold">{iPart.slice(1, -1)}</em>;
        }
        return iPart;
      });
      return (
        <strong 
          key={bIdx} 
          className="font-black px-1.5 py-0.5 rounded text-xs select-all inline-block mx-0.5"
          style={{
            color: theme === 'light' ? '#312e81' : '#22d3ee', // Indigo-900 for light, Cyan-400 for dark
            backgroundColor: theme === 'light' ? '#e0e7ff' : '#070b13', // Indigo-100 for light, Slate-950 for dark
            border: theme === 'light' ? '1px solid #c7d2fe' : '1px solid #1e293b'
          }}
        >
          {content}
        </strong>
      );
    } else {
      const italicParts = bPart.split(/(\*.*?\*|_.*?_)/g);
      return italicParts.map((iPart, iIdx) => {
        if ((iPart.startsWith('*') && iPart.endsWith('*')) || (iPart.startsWith('_') && iPart.endsWith('_'))) {
          return <em key={iIdx} className="italic">{iPart.slice(1, -1)}</em>;
        }
        return iPart;
      });
    }
  });
};

const renderMessageText = (text, theme) => {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(?:(\w+)\n)?([\s\S]*?)```/);
      const language = match ? match[1] || '' : '';
      const code = match ? match[2].trim() : part.slice(3, -3).trim();
      return (
        <pre key={idx} className="my-3 p-4 rounded-xl bg-slate-950 text-emerald-400 overflow-x-auto text-xs font-mono border border-slate-800 leading-relaxed text-left">
          {language && <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{language}</div>}
          <code>{code}</code>
        </pre>
      );
    } else {
      const lines = part.split('\n');
      return lines.map((line, lIdx) => {
        let trimmed = line.trim();
        if (!trimmed) return <div key={`empty-${lIdx}`} className="h-2" />;
        
        if (trimmed.startsWith('#### ')) {
          return <h5 key={lIdx} className="text-xs font-bold text-indigo-550 dark:text-cyan-405 uppercase tracking-wider mt-3 mb-1.5 text-left">{trimmed.slice(5)}</h5>;
        }
        if (trimmed.startsWith('### ')) {
          return <h4 key={lIdx} className="text-sm font-black text-slate-950 dark:text-white mt-4 mb-2 border-b border-slate-100 dark:border-slate-850 pb-1 text-left">{trimmed.slice(4)}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={lIdx} className="text-base font-black text-slate-955 dark:text-white mt-5 mb-2.5 text-left">{trimmed.slice(3)}</h3>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={lIdx} className="flex gap-2 items-start pl-2 text-xs leading-relaxed my-1 text-left text-slate-800 dark:text-slate-205">
              <span className="text-indigo-500 font-bold">•</span>
              <span>{renderFormatting(trimmed.slice(2), theme)}</span>
            </div>
          );
        }
        return (
          <p key={lIdx} className="text-xs leading-relaxed my-1.5 text-left text-slate-800 dark:text-slate-205">
            {renderFormatting(trimmed, theme)}
          </p>
        );
      });
    }
  });
};

const techFlashcards = [
  {
    category: "General Tech GK",
    front: "What does HTTP status code 418 represent?",
    back: "418 I'm a teapot: This code was defined in 1998 as an April Fools' joke in RFC 2324 (Hyper Text Coffee Pot Control Protocol) and is not expected to be implemented by actual HTTP servers."
  },
  {
    category: "Programming Core",
    front: "What is the difference between a list and a tuple in Python?",
    back: "Lists are mutable (can be changed after creation, syntax: `[1, 2]`), whereas tuples are immutable (read-only, syntax: `(1, 2)`). Tuples are faster and consume less memory."
  },
  {
    category: "FastAPI & Web",
    front: "How does FastAPI perform data validation and serialization?",
    back: "FastAPI uses Pydantic under the hood. By declaring types on inputs and parameters, Pydantic validates incoming JSON and serializes outgoing Python objects automatically."
  },
  {
    category: "Database Architecture",
    front: "What is the primary difference between SQL and NoSQL databases?",
    back: "SQL databases are relational, table-based, have a predefined schema, and scale vertically. NoSQL databases (like MongoDB) are non-relational, document-based, schema-less (dynamic schema), and scale horizontally."
  },
  {
    category: "UI/UX Design",
    front: "What is the Gestalt Law of Proximity in UI/UX?",
    back: "It states that objects that are close to one another appear to form groups or be related, even if their shapes or colors differ. Designers use this to group related options or input fields."
  },
  {
    category: "Data Science",
    front: "What is overfitting in Machine Learning models?",
    back: "Overfitting occurs when a model learns the training data too well, including its noise and outliers, causing it to perform poorly on new, unseen testing data. It represents high variance and low bias."
  },
  {
    category: "React Frontend",
    front: "What is the purpose of the dependency array in a React useEffect hook?",
    back: "It controls when the effect runs. If empty `[]`, it runs only once after mount. If it contains variables `[val]`, the effect re-runs whenever any of those variables change. If omitted, it runs on every render."
  },
  {
    category: "General Tech GK",
    front: "What is DNS and what is its default port?",
    back: "Domain Name System (DNS) translates human-readable domain names (like google.com) to IP addresses. It primarily uses UDP port 53."
  },
  {
    category: "Software Engineering",
    front: "What is Git and how does a 'git merge' differ from a 'git rebase'?",
    back: "'git merge' combines changes by creating a new merge commit preserving full branch history. 'git rebase' moves the entire branch's commits to the tip of the target branch, creating a clean linear commit history."
  },
  {
    category: "Security Basics",
    front: "What is SQL Injection (SQLi) and how is it prevented?",
    back: "SQL Injection is a vulnerability where attackers inject malicious SQL statements into input fields. It is prevented by using parameterized queries (prepared statements) instead of string concatenation."
  }
];

function App() {
  // Global Theme State ('light' or 'dark')
  const [theme, setTheme] = useState('light');

  // Synchronize document body background with current theme
  useEffect(() => {
    if (theme === 'light') {
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    } else {
      document.body.style.backgroundColor = '#050811';
      document.body.style.color = '#f8fafc';
    }
  }, [theme]);

  // Global View Controller
  // Values: 'landing', 'signin', 'signup', 'portal' (authenticated dashboard)
  const [currentView, setCurrentView] = useState('landing');
  
  // Authenticated User State
  const [user, setUser] = useState(null);
  
  // Dashboard Sub-Views (inside 'portal')
  // Values: 'tracker', 'chat', 'parental', 'profile', 'smartcards', 'test', 'results'
  const [activeTab, setActiveTab] = useState('tracker');

  // Smartcards Section State
  const [smartcardIndex, setSmartcardIndex] = useState(0);
  const [smartcardFlipped, setSmartcardFlipped] = useState(false);

  // Test Section State
  const [selectedTestWeek, setSelectedTestWeek] = useState(1);
  const [activeTestQuiz, setActiveTestQuiz] = useState(false);
  const [testAnswers, setTestAnswers] = useState({});

  // Fullscreen video overlay play state
  const [showLoginVideo, setShowLoginVideo] = useState(false);

  // Application States (for dashboard)
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [nudge, setNudge] = useState(null);
  
  // Goal Intake Form State
  const [goal, setGoal] = useState('');
  const [domain, setDomain] = useState('programming');
  const [level, setLevel] = useState('Beginner');
  const [timeline, setTimeline] = useState(4);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);
  
  // Practice Quiz State
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizQuestionsList, setQuizQuestionsList] = useState({
    programming: [
      {
        question: "Which of the following is the correct syntax to declare a list in Python?",
        options: ["my_list = (1, 2, 3)", "my_list = [1, 2, 3]", "my_list = {1, 2, 3}", "my_list = <1, 2, 3>"],
        correctAnswer: 1,
        topic: "Python Lists syntax"
      },
      {
        question: "What is the purpose of FastAPI's path parameters?",
        options: ["To format HTML pages", "To capture values from URL path segments", "To set up database tables", "To handle cookies"],
        correctAnswer: 1,
        topic: "FastAPI Routing"
      },
      {
        question: "In Python, what is the default behavior of the 'with' statement?",
        options: ["Loops over lists", "Establishes a context manager for resource clean-up", "Handles multithreading", "Defines class inheritance"],
        correctAnswer: 1,
        topic: "Context Managers"
      }
    ],
    "data science": [
      {
        question: "Which library is primarily used for data manipulation and tabular analysis in Python?",
        options: ["NumPy", "Pandas", "Matplotlib", "SciPy"],
        correctAnswer: 1,
        topic: "Pandas DataFrames"
      },
      {
        question: "What does a high bias typically indicate in a Machine Learning model?",
        options: ["Overfitting", "Underfitting", "Perfect fitting", "Low variance"],
        correctAnswer: 1,
        topic: "Model Fitting"
      },
      {
        question: "What is the objective of running a train-test split?",
        options: ["Speed up training time", "Evaluate model on unseen data to estimate generalization", "Filter outliers", "Save storage"],
        correctAnswer: 1,
        topic: "Model Evaluation"
      }
    ],
    design: [
      {
        question: "Which UI principle states that elements close to each other are perceived as related?",
        options: ["Contrast", "Law of Proximity", "Fitts's Law", "Visual Hierarchy"],
        correctAnswer: 1,
        topic: "Gestalt Principles"
      },
      {
        question: "What is a major advantage of using a dynamic Design System?",
        options: ["Prevents code execution", "Ensures consistency across products and speeds up development", "Replaces developers", "Reduces server load"],
        correctAnswer: 1,
        topic: "Design Systems"
      },
      {
        question: "Which color model is most commonly used for screen/digital designs?",
        options: ["CMYK", "RGB", "RYB", "Pantone"],
        correctAnswer: 1,
        topic: "Digital Color Theory"
      }
    ]
  });

  // Gamified Mascot Bot State
  const [mascotBotData, setMascotBotData] = useState({
    show: false,
    feedback: "",
    score: 0,
    creditsAwarded: 0
  });

  // Voice Speech Audio Toggle
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Parental Control States
  const [parentReport, setParentReport] = useState(null);

  // Chat Coach State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'coach', text: "Hello! I am your AI Study Coach. How can I help you with your learning goals today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Simulator State
  const [simulatedInactivityDays, setSimulatedInactivityDays] = useState(4);

  // Signin/Signup Inputs
  const [authInputs, setAuthInputs] = useState({
    username: '', password: '', full_name: '', dob: '', mobile_no: '', email: '', profile_pic_url: ''
  });

  // Session Check on Load
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setCurrentView('portal');
      fetchDashboard(parsedUser.user_id);
      
      // Auto status check on mount
      setTimeout(() => {
        const fetchCheck = async () => {
          try {
            const res = await fetch(`${API_BASE}/api/check-status?user_id=${parsedUser.user_id}`);
            const data = await res.json();
            if (data.nudge_triggered) {
              setNudge(data.nudge_message);
            }
          } catch (e) {
            console.error(e);
          }
        };
        fetchCheck();
      }, 1200);
    }
  }, []);

  // Scroll Chat to Bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchDashboard = async (userId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/dashboard?user_id=${userId}`);
      const data = await res.json();
      setDashboard(data);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParentReport = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/parent-report?user_id=${user.user_id}`);
      const data = await res.json();
      setParentReport(data);
    } catch (err) {
      console.error("Error fetching parental report:", err);
    }
  };

  // Auth Functions
  const handleAuthChange = (e) => {
    setAuthInputs({ ...authInputs, [e.target.name]: e.target.value });
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authInputs)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Signup failed");
      
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setCurrentView('portal');
      setActiveTab('tracker');
      setShowLoginVideo(true);
      fetchDashboard(data.user.user_id);
    } catch (err) {
      alert("Registration failed: " + err.message + "\n\n(Tip: Ensure the backend FastAPI server is running!)");
    } finally {
      setLoading(false);
    }
  };

  const handleSigninSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authInputs.username,
          password: authInputs.password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setCurrentView('portal');
      setActiveTab('tracker');
      setShowLoginVideo(true);
      fetchDashboard(data.user.user_id);
    } catch (err) {
      alert("Login failed: " + err.message + "\n\n(Tip: Ensure the backend FastAPI server is running!)");
    } finally {
      setLoading(false);
    }
  };

  const handleSignout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setDashboard(null);
    setCurrentView('landing');
    setAuthInputs({
      username: '', password: '', full_name: '', dob: '', mobile_no: '', email: '', profile_pic_url: ''
    });
  };

  // Profile Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          full_name: user.full_name,
          dob: user.dob,
          mobile_no: user.mobile_no,
          email: user.email,
          profile_pic_url: user.profile_pic_url
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Profile update failed");
      
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Learning Plan Builder
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!goal.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/parse-goal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          goal: goal,
          domain: domain,
          current_skill_level: level,
          target_timeline_weeks: parseInt(timeline)
        })
      });
      if (!res.ok) throw new Error("Plan generation failed");
      const data = await res.json();
      fetchDashboard(user.user_id);
      setGoal('');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Checkbox Task Status
  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/toggle-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          task_id: taskId,
          is_completed: !currentStatus
        })
      });
      if (res.ok) {
        fetchDashboard(user.user_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Skip/Unskip Task Status
  const handleSkipTask = async (taskId, currentSkipStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/skip-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          task_id: taskId,
          is_skipped: !currentSkipStatus
        })
      });
      if (res.ok) {
        fetchDashboard(user.user_id);
      }
    } catch (err) {
      console.error("Error skipping task:", err);
    }
  };

  // Handle Judge Demo Trigger
  const handleTriggerDemo = async (demoType) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/demo-trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          demo_type: demoType
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Demo trigger failed");
      }
      const data = await res.json();
      setNudge(data.nudge_message);
      fetchDashboard(user.user_id);
      fetchParentReport();
      
      // Mascot voice feedbacks matching cases
      if (demoType === 'fail_quiz') {
        speakFeedback(`Demo: Activated quiz failure recalculation. Injected remedial review task on VPC and Networking, and delayed subsequent tasks by two days.`);
        setMascotBotData({
          show: true,
          feedback: `Remedial review suggest: VPC & Networking. I've automatically added extra VPC practice tasks to your Week 1 checklist and delayed subsequent tasks.`,
          score: 35,
          creditsAwarded: 50,
          spokenText: `Demo: Activated quiz failure recalculation. Injected remedial review task on VPC and Networking, and delayed subsequent tasks by two days.`
        });
      } else if (demoType === 'pass_quiz') {
        speakFeedback(`Demo: Activated quiz mastery upgrade. Great job, you scored ninety-five percent! Awarded fifty bonus credits to your profile.`);
        setMascotBotData({
          show: true,
          feedback: `Excellent mastery! You passed the benchmark. I've added Core Functions to your Strong Concepts list.`,
          score: 95,
          creditsAwarded: 50,
          spokenText: `Demo: Activated quiz mastery upgrade. Great job, you scored ninety-five percent! Awarded fifty bonus credits to your profile.`
        });
      } else if (demoType === 'case1') {
        speakFeedback(`Demo: Triggered Case 1. You were preparing for AWS. Completing one networking lesson today will keep your exam schedule on track.`);
      } else if (demoType === 'case2') {
        speakFeedback(`Demo: Triggered Case 2. Excellent! At this pace you'll finish one week early.`);
      } else if (demoType === 'case3') {
        speakFeedback(`Demo: Triggered Case 3. Your quizzes are strong, but project work is delayed. Let's complete a small programming application task today.`);
      }
      
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Text-To-Speech Controller
  const speakFeedback = (text) => {
    if (voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Save Quiz Results
  const handleQuizSubmit = async () => {
    let correct = 0;
    const currentQuiz = quizQuestionsList[domain] || quizQuestionsList.programming;
    currentQuiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) {
        correct += 1;
      }
    });

    const finalScore = Math.round((correct / currentQuiz.length) * 100);
    const weakTopic = currentQuiz[correct === currentQuiz.length ? 0 : correct].topic;
    const activeWeek = dashboard?.plan?.milestones?.[0]?.week || 1;

    try {
      const res = await fetch(`${API_BASE}/api/save-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          score: finalScore,
          weak_topic: weakTopic,
          week: activeWeek,
          quiz_type: "quiz"
        })
      });
      if (!res.ok) throw new Error("Failed to save quiz results");
      const data = await res.json();
      
      // Update local credentials points
      const updatedUser = { ...user, credits: data.total_credits };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Construct bot friendly voice description
      let speechText = `Hooray! You completed your domain practice quiz with a score of ${finalScore} percent. `;
      if (finalScore >= 60) {
        speechText += "Amazing job! You have passed the topic. I have awarded fifty bonus credits to your profile. Keep it up!";
      } else {
        speechText += `You scored below sixty percent. Don't worry, learning is a journey! I've added a special remedial review task: ${weakTopic}, to help you study. I've also awarded you fifty credits for trying!`;
      }

      setMascotBotData({
        show: true,
        feedback: finalScore >= 60 
          ? "Excellent mastery! You passed the benchmark. Keep up the high standard!"
          : `Remedial topic suggested: ${weakTopic}. I've generated a review session to help you get on track.`,
        score: finalScore,
        creditsAwarded: data.credits_awarded,
        spokenText: speechText
      });

      setShowQuiz(false);
      setQuizAnswers({});
      fetchDashboard(user.user_id);
    } catch (err) {
      alert("Error submitting quiz: " + err.message);
    }
  };

  // Inactivity Recalculator Simulator
  const handleSimulateInactivity = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/recalculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.user_id,
          days: parseInt(simulatedInactivityDays) 
        })
      });
      if (!response.ok) throw new Error("Simulation failure");
      fetchDashboard(user.user_id);
      alert(`Simulation completed. Remaining task deadlines shifted by ${simulatedInactivityDays} days.`);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Status Coach Check
  const triggerStatusCheck = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/check-status?user_id=${user.user_id}`);
      const data = await res.json();
      if (data.nudge_triggered) {
        setNudge(data.nudge_message);
        if (data.recalculation_done) {
          fetchDashboard(user.user_id);
          alert("Nudge triggered! Your deadlines were automatically shifted forward due to inactivity.");
        }
      } else {
        setNudge(null);
        alert("Coach Status: You are on track! No inactive triggers detected.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Chat Messaging Submit
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { sender: 'student', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          message: chatInput
        })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { sender: 'coach', text: data.reply }]);
      
      // Voice feedback speaks chatbot replies
      if (voiceEnabled) {
        speakFeedback(data.reply);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  // Tab change trigger reports
  useEffect(() => {
    if (activeTab === 'parental' || activeTab === 'results' || activeTab === 'digital-twin') {
      fetchParentReport();
    }
  }, [activeTab]);

  // Style Class Helpers dynamically mapped to theme
  const getThemeClass = (lightClass, darkClass) => {
    return theme === 'light' ? lightClass : darkClass;
  };

  const faqs = [
    {
      q: "What is Vidya Verse?",
      a: "Vidya Verse is an AI-powered personal learning portal. By utilizing advanced LLMs and multi-agent systems, it structures custom schedules, creates adaptively generated review materials, and logs comprehensive statistics."
    },
    {
      q: "How does the AI dynamic reschedule work?",
      a: "If you take a break and remain inactive for more than 3 days, our coach agent automatically shifts the deadlines of your remaining tasks forward by 3 days, ensuring you can resume without pressure."
    },
    {
      q: "What are Study Credits?",
      a: "Credits are our gamified scoring system. Completing tasks and taking quizzes awards you points (+50 Credits per quiz). These are logged in MongoDB and help you track your study velocity."
    },
    {
      q: "How do parents view progress reports?",
      a: "Parents can access the Parental Portal tab directly in the dashboard, showing secure logs of child quiz averages, total tasks completed, time spent, and automatic concept gap analysis."
    }
  ];

  return (
    <div className={`min-h-screen font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-300 ${
      getThemeClass('bg-slate-50 text-slate-800', 'bg-[#050811] text-slate-100')
    }`}>
      
      {/* LANDING PAGE VIEW */}
      {currentView === 'landing' && (
        <div>
          {/* Header Navbar */}
          <nav className={`sticky top-0 z-50 transition-colors border-b px-6 py-4 backdrop-blur-md ${
            getThemeClass('bg-white/85 border-slate-200', 'bg-[#050811]/85 border-slate-900')
          }`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between py-2">
              <div className="flex items-center gap-5 group cursor-default">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <img 
                    src="/vidyaverse.png" 
                    alt="Vidya Verse Logo" 
                    className="w-24 h-24 object-contain logo-glow animate-mascot-float relative z-10" 
                  />
                </div>
                <div className="flex flex-col">
                  <span className={`font-black text-3xl md:text-4.5xl tracking-tight leading-none title-glow bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent`}>
                    Vidya Verse
                  </span>
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 tracking-[0.25em] uppercase mt-1">
                    AI Personal Learning Agent
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <a href="#about" className={`text-sm font-semibold transition ${getThemeClass('text-slate-600 hover:text-slate-900', 'text-slate-450 hover:text-slate-250')}`}>About</a>
                <a href="#features" className={`text-sm font-semibold transition ${getThemeClass('text-slate-600 hover:text-slate-900', 'text-slate-450 hover:text-slate-250')}`}>Features</a>
                <a href="#how-it-works" className={`text-sm font-semibold transition ${getThemeClass('text-slate-600 hover:text-slate-900', 'text-slate-450 hover:text-slate-250')}`}>How It Works</a>
                <a href="#faq" className={`text-sm font-semibold transition ${getThemeClass('text-slate-600 hover:text-slate-900', 'text-slate-450 hover:text-slate-250')}`}>FAQ</a>
                
                {/* Light/Dark Mode Switcher */}
                <button 
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className={`p-2 rounded-lg border transition ${
                    getThemeClass('bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700', 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300')
                  }`}
                  title="Toggle Light/Dark Theme"
                >
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

                <button 
                  onClick={() => setCurrentView('signin')}
                  className={`text-sm font-semibold transition ${getThemeClass('text-slate-700 hover:text-slate-900', 'text-slate-300 hover:text-white')}`}
                >
                  Login
                </button>
                <button 
                  onClick={() => setCurrentView('signup')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4.5 py-2 rounded-xl text-sm transition shadow-lg shadow-blue-500/10"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </nav>

          {/* Hero Section */}
          <header className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center space-y-8">
            <div className={`inline-flex items-center gap-2 border px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase ${
              getThemeClass('bg-blue-50 border-blue-200 text-blue-600', 'bg-blue-500/10 border-blue-500/20 text-cyan-400')
            }`}>
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Dynamic Curriculum & Gamified Mascot voice
            </div>
            <h1 className={`text-5xl md:text-6.5xl font-black tracking-tight leading-none max-w-4xl mx-auto ${
              getThemeClass('text-slate-900', 'text-white')
            }`}>
              Master Any Subject with{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                Vidya Verse
              </span>
            </h1>
            <p className={`text-lg max-w-2xl mx-auto leading-relaxed ${getThemeClass('text-slate-600', 'text-slate-400')}`}>
              Unleash structured schedules generated by CrewAI agents. Check off tasks, interact with our speaking mascot helper, and monitor progress charts.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <button 
                onClick={() => setCurrentView('signup')}
                className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold py-3.5 px-8 rounded-xl shadow-xl transition flex items-center gap-2 text-base"
              >
                Start Learning Now
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentView('signin')}
                className={`border font-semibold py-3.5 px-8 rounded-xl transition text-base ${
                  getThemeClass('bg-white hover:bg-slate-50 border-slate-305 text-slate-700', 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-200')
                }`}
              >
                Student Log In
              </button>
            </div>
          </header>

          {/* Section: About Us */}
          <section id="about" className={`py-20 border-t ${getThemeClass('border-slate-200 bg-white', 'border-slate-900 bg-slate-950/20')}`}>
            <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4 text-left">
                <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest">ABOUT THE PROJECT</h3>
                <h2 className={`text-3xl font-black ${getThemeClass('text-slate-950', 'text-white')}`}>Empowering self-paced learning via AI Agents</h2>
                <p className={`text-sm leading-relaxed ${getThemeClass('text-slate-600', 'text-slate-400')}`}>
                  Vidya Verse represents a massive leap in modern educational technology. Our mission is to convert complex objectives (e.g. learning Figma layouts, building database APIs) into easily digestible, week-by-week milestones.
                </p>
                <p className={`text-sm leading-relaxed ${getThemeClass('text-slate-600', 'text-slate-400')}`}>
                  By combining CrewAI's planning execution with gamified audio triggers and custom charts, we support both students aiming to master concepts and parents wishing to check their study metrics.
                </p>
              </div>
              <div className="flex justify-center">
                <div className={`p-8 rounded-3xl border animate-mascot-float shadow-xl max-w-sm w-full ${
                  getThemeClass('bg-slate-50 border-slate-200', 'bg-slate-900/50 border-slate-800')
                }`}>
                  <img src="/study_mascot.png" alt="Mascot character" className="w-48 h-48 object-contain mx-auto" />
                  <p className="text-xs text-center text-slate-500 font-bold uppercase tracking-wider mt-4">Meet your study assistant!</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Features Grid */}
          <section id="features" className={`py-20 border-t ${getThemeClass('border-slate-200', 'border-slate-900')}`}>
            <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
              <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest">ECOSYSTEM OVERVIEW</h3>
              <h2 className={`text-3xl font-black ${getThemeClass('text-slate-950', 'text-white')}`}>Optimized Study Systems</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
                
                <div className={`border p-8 rounded-2xl transition duration-300 text-left space-y-4 ${
                  getThemeClass('bg-white border-slate-200 hover:border-slate-350 shadow-sm', 'bg-slate-900/40 border-slate-850 hover:border-slate-700/60')
                }`}>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-xl w-fit">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h3 className={`text-lg font-bold ${getThemeClass('text-slate-900', 'text-white')}`}>Resilient Schedules</h3>
                  <p className={`text-xs leading-relaxed ${getThemeClass('text-slate-600', 'text-slate-400')}`}>
                    CrewAI compiles topics into structured checklists. Deadlines auto-shift forward by 3 days during study breaks to minimize stress.
                  </p>
                </div>

                <div className={`border p-8 rounded-2xl transition duration-300 text-left space-y-4 ${
                  getThemeClass('bg-white border-slate-200 hover:border-slate-350 shadow-sm', 'bg-slate-900/40 border-slate-850 hover:border-slate-700/60')
                }`}>
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 rounded-xl w-fit">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className={`text-lg font-bold ${getThemeClass('text-slate-900', 'text-white')}`}>Gamified Mascot Voice</h3>
                  <p className={`text-xs leading-relaxed ${getThemeClass('text-slate-600', 'text-slate-400')}`}>
                    Submit adaptive tests, view cute animations, listen to spoken AI feedback via native Web Speech synthesis, and earn Study Credits.
                  </p>
                </div>

                <div className={`border p-8 rounded-2xl transition duration-300 text-left space-y-4 ${
                  getThemeClass('bg-white border-slate-200 hover:border-slate-350 shadow-sm', 'bg-slate-900/40 border-slate-850 hover:border-slate-700/60')
                }`}>
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-xl w-fit">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className={`text-lg font-bold ${getThemeClass('text-slate-900', 'text-white')}`}>Parental Portal</h3>
                  <p className={`text-xs leading-relaxed ${getThemeClass('text-slate-600', 'text-slate-400')}`}>
                    Parents can log in to check quiz scores, task lists, study time allocations, and identified topic gaps in real-time.
                  </p>
                </div>

              </div>
            </div>
          </section>

          {/* Section: How It Works */}
          <section id="how-it-works" className={`py-20 border-t ${getThemeClass('border-slate-200 bg-white', 'border-slate-900 bg-slate-950/20')}`}>
            <div className="max-w-6xl mx-auto px-6 text-center space-y-4">
              <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest">THE PIPELINE</h3>
              <h2 className={`text-3xl font-black ${getThemeClass('text-slate-950', 'text-white')}`}>Four Simple Steps</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-12 text-left">
                {[
                  { step: "1", title: "State Your Goal", desc: "Type what you want to study (e.g. build Python REST APIs) and select your target timeline." },
                  { step: "2", title: "AI Plan Scaffold", desc: "Our CrewAI engine generates custom weekly milestones, timelines, and study checklist tasks." },
                  { step: "3", title: "Complete & Practice", desc: "Log in to check off tasks, and take domain-specific quizzes to test your knowledge." },
                  { step: "4", title: "Mascot & Points", desc: "Listen as our mascot reads quiz reviews out loud and awards points directly to your profile." }
                ].map((item, idx) => (
                  <div key={idx} className={`p-6 rounded-2xl border ${getThemeClass('bg-slate-50 border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm mb-4">
                      {item.step}
                    </div>
                    <h4 className={`font-bold text-base mb-1 ${getThemeClass('text-slate-900', 'text-white')}`}>{item.title}</h4>
                    <p className={`text-xs leading-relaxed ${getThemeClass('text-slate-655', 'text-slate-400')}`}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section: FAQ */}
          <section id="faq" className={`py-20 border-t ${getThemeClass('border-slate-200', 'border-slate-900')}`}>
            <div className="max-w-3xl mx-auto px-6 space-y-6 text-center">
              <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest font-mono">COMMON INQUIRIES</h3>
              <h2 className={`text-3xl font-black ${getThemeClass('text-slate-950', 'text-white')}`}>Frequently Asked Questions</h2>
              
              <div className="pt-8 space-y-4 text-left">
                {faqs.map((faq, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-2xl p-5 cursor-pointer transition ${
                      getThemeClass('bg-white border-slate-200 hover:border-slate-300', 'bg-slate-900/40 border-slate-850 hover:border-slate-800')
                    }`}
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className={`font-bold text-sm ${getThemeClass('text-slate-900', 'text-slate-250')}`}>{faq.q}</h4>
                      <span className="text-slate-500 text-sm font-bold">
                        {openFaq === index ? '−' : '+'}
                      </span>
                    </div>
                    {openFaq === index && (
                      <p className={`text-xs leading-relaxed mt-3 border-t pt-3 border-slate-200 dark:border-slate-800 ${getThemeClass('text-slate-600', 'text-slate-400')}`}>
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className={`border-t py-12 px-6 text-center text-xs ${
            getThemeClass('bg-slate-100 border-slate-200 text-slate-500', 'bg-slate-950 border-slate-900 text-slate-600')
          }`}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <img src="/vidyaverse.png" alt="Vidya Verse Logo" className="w-12 h-12 object-contain logo-glow" />
                <div className="text-left">
                  <span className="font-black text-lg tracking-tight bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent block">Vidya Verse</span>
                  <span className="text-[9px] font-bold text-slate-550 dark:text-slate-400 tracking-wider block">AI Personal Learning Agent</span>
                </div>
              </div>
              <p className="font-medium">
                © {new Date().getFullYear()} Vidya Verse. Built with React + Tailwind CSS + FastAPI + MongoDB.
              </p>
              <div className="flex gap-4">
                <a href="#about" className="hover:underline">About</a>
                <a href="#features" className="hover:underline">Features</a>
                <a href="#faq" className="hover:underline">FAQ</a>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* SIGN IN VIEW */}
      {currentView === 'signin' && (
        <div className="min-h-screen flex items-center justify-center p-6 relative">
          
          {/* Back button */}
          <button 
            onClick={() => setCurrentView('landing')}
            className={`absolute top-6 left-6 text-xs font-bold transition flex items-center gap-1.5 px-3.5 py-2 rounded-xl border ${
              getThemeClass('bg-white hover:bg-slate-100 border-slate-200 text-slate-700', 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300')
            }`}
          >
            ← Back to Home
          </button>

          <div className={`border rounded-2xl p-8 max-w-md w-full shadow-2xl backdrop-blur-xl space-y-6 ${
            getThemeClass('bg-white border-slate-200', 'bg-slate-900/50 border-slate-800')
          }`}>
            <div className="text-center space-y-3 flex flex-col items-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img 
                  src="/vidyaverse.png" 
                  alt="Vidya Verse Logo" 
                  className="w-20 h-20 object-contain logo-glow animate-mascot-float relative z-10" 
                />
              </div>
              <div>
                <h2 className={`text-3xl font-black bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent title-glow`}>Vidya Verse</h2>
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase mt-0.5">Welcome Back</p>
              </div>
              <p className="text-xs text-slate-400 font-medium">Log in to resume your active learning path.</p>
            </div>
            <form onSubmit={handleSigninSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    name="username" 
                    required 
                    value={authInputs.username}
                    onChange={handleAuthChange}
                    className={`w-full rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none transition ${
                      getThemeClass('bg-slate-100 border border-slate-250 text-slate-900 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-200 focus:border-blue-500')
                    }`} 
                    placeholder="Enter your username" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input 
                    type="password" 
                    name="password" 
                    required 
                    value={authInputs.password}
                    onChange={handleAuthChange}
                    className={`w-full rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none transition ${
                      getThemeClass('bg-slate-100 border border-slate-250 text-slate-900 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-200 focus:border-blue-500')
                    }`} 
                    placeholder="Enter your password" 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Sign In"}
              </button>
            </form>
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Don't have an account?{" "}
                <button 
                  onClick={() => setCurrentView('signup')}
                  className="text-blue-600 dark:text-cyan-400 font-bold hover:underline"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SIGN UP VIEW */}
      {currentView === 'signup' && (
        <div className="min-h-screen flex items-center justify-center p-6 relative">
          
          {/* Back button */}
          <button 
            onClick={() => setCurrentView('landing')}
            className={`absolute top-6 left-6 text-xs font-bold transition flex items-center gap-1.5 px-3.5 py-2 rounded-xl border ${
              getThemeClass('bg-white hover:bg-slate-100 border-slate-200 text-slate-700', 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300')
            }`}
          >
            ← Back to Home
          </button>

          <div className={`border rounded-2xl p-8 max-w-lg w-full shadow-2xl backdrop-blur-xl space-y-6 ${
            getThemeClass('bg-white border-slate-200', 'bg-slate-900/50 border-slate-800')
          }`}>
            <div className="text-center space-y-3 flex flex-col items-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img 
                  src="/vidyaverse.png" 
                  alt="Vidya Verse Logo" 
                  className="w-20 h-20 object-contain logo-glow animate-mascot-float relative z-10" 
                />
              </div>
              <div>
                <h2 className={`text-3xl font-black bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent title-glow`}>Vidya Verse</h2>
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase mt-0.5">Create Account</p>
              </div>
              <p className="text-xs text-slate-400 font-medium">Join us to setup your personal AI-driven path.</p>
            </div>
            <form onSubmit={handleSignupSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Username</label>
                <input 
                  type="text" 
                  name="username" 
                  required 
                  value={authInputs.username}
                  onChange={handleAuthChange}
                  className={`w-full rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition ${
                    getThemeClass('bg-slate-100 border border-slate-250 text-slate-900 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-200 focus:border-blue-500')
                  }`}
                  placeholder="e.g. jdoe" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  required 
                  value={authInputs.password}
                  onChange={handleAuthChange}
                  className={`w-full rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition ${
                    getThemeClass('bg-slate-100 border border-slate-250 text-slate-900 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-200 focus:border-blue-500')
                  }`}
                  placeholder="Password" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Full Name</label>
                <input 
                  type="text" 
                  name="full_name" 
                  required 
                  value={authInputs.full_name}
                  onChange={handleAuthChange}
                  className={`w-full rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition ${
                    getThemeClass('bg-slate-100 border border-slate-250 text-slate-900 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-200 focus:border-blue-500')
                  }`}
                  placeholder="First Last" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Date of Birth</label>
                <input 
                  type="date" 
                  name="dob" 
                  required 
                  value={authInputs.dob}
                  onChange={handleAuthChange}
                  className={`w-full rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition ${
                    getThemeClass('bg-slate-100 border border-slate-250 text-slate-950 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-200 focus:border-blue-500')
                  }`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Mobile No</label>
                <input 
                  type="tel" 
                  name="mobile_no" 
                  required 
                  value={authInputs.mobile_no}
                  onChange={handleAuthChange}
                  className={`w-full rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition ${
                    getThemeClass('bg-slate-100 border border-slate-250 text-slate-900 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-200 focus:border-blue-500')
                  }`}
                  placeholder="10-digit number" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  value={authInputs.email}
                  onChange={handleAuthChange}
                  className={`w-full rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition ${
                    getThemeClass('bg-slate-100 border border-slate-250 text-slate-900 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-200 focus:border-blue-500')
                  }`}
                  placeholder="jdoe@example.com" 
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Profile Pic URL (Optional)</label>
                <input 
                  type="url" 
                  name="profile_pic_url" 
                  value={authInputs.profile_pic_url}
                  onChange={handleAuthChange}
                  className={`w-full rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition ${
                    getThemeClass('bg-slate-100 border border-slate-250 text-slate-900 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-200 focus:border-blue-500')
                  }`}
                  placeholder="https://images.unsplash.com/... (optional)" 
                />
              </div>
              <div className="md:col-span-2 pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Complete Registration"}
                </button>
              </div>
            </form>
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Already registered?{" "}
                <button 
                  onClick={() => setCurrentView('signin')}
                  className="text-blue-600 dark:text-cyan-400 font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PORTAL CORE DASHBOARD */}
      {currentView === 'portal' && user && (
        <div className="min-h-screen flex">
          
          {/* Dashboard Left Sidebar */}
          <aside className={`w-64 border-r flex flex-col justify-between p-4 flex-shrink-0 transition-colors ${
            getThemeClass('bg-white border-slate-200', 'bg-[#070b13] border-slate-900')
          }`}>
            <div className="space-y-8">
              {/* Branding Section */}
              <div className="flex flex-col items-center text-center gap-4 px-2 pt-5 pb-4 border-b border-slate-200 dark:border-slate-900/80 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/15 blur-xl rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <img 
                    src="/vidyaverse.png" 
                    alt="Vidya Verse Logo" 
                    className="w-32 h-32 object-contain logo-glow animate-mascot-float relative z-10" 
                  />
                </div>
                <div className="flex flex-col items-center">
                  <h3 className="font-black text-2xl tracking-tight leading-none bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent title-glow">
                    Vidya Verse
                  </h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">
                    AI Smart Coach
                  </span>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1">
                <button 
                  onClick={() => setActiveTab('tracker')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    activeTab === 'tracker' 
                      ? getThemeClass('bg-blue-50 border border-blue-200 text-blue-600', 'bg-blue-600/10 border border-blue-500/25 text-blue-400') 
                      : getThemeClass('text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent', 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/35 border border-transparent')
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Study Tracker
                </button>
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    activeTab === 'chat' 
                      ? getThemeClass('bg-blue-50 border border-blue-200 text-blue-600', 'bg-blue-600/10 border border-blue-500/25 text-blue-400') 
                      : getThemeClass('text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent', 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/35 border border-transparent')
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  AI Study Coach
                </button>
                <button 
                  onClick={() => setActiveTab('smartcards')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    activeTab === 'smartcards' 
                      ? getThemeClass('bg-blue-50 border border-blue-200 text-blue-600', 'bg-blue-600/10 border border-blue-500/25 text-blue-400') 
                      : getThemeClass('text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent', 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/35 border border-transparent')
                  }`}
                >
                  <Brain className="w-4 h-4" />
                  Smartcards
                </button>
                <button 
                  onClick={() => setActiveTab('test')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    activeTab === 'test' 
                      ? getThemeClass('bg-blue-50 border border-blue-200 text-blue-600', 'bg-blue-600/10 border border-blue-500/25 text-blue-400') 
                      : getThemeClass('text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent', 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/35 border border-transparent')
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Weekly Test
                </button>
                <button 
                  onClick={() => setActiveTab('results')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    activeTab === 'results' 
                      ? getThemeClass('bg-blue-50 border border-blue-200 text-blue-600', 'bg-blue-600/10 border border-blue-500/25 text-blue-400') 
                      : getThemeClass('text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent', 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/35 border border-transparent')
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Test Results
                </button>
                <button 
                  onClick={() => setActiveTab('digital-twin')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    activeTab === 'digital-twin' 
                      ? getThemeClass('bg-blue-50 border border-blue-200 text-blue-600', 'bg-blue-600/10 border border-blue-500/25 text-blue-400') 
                      : getThemeClass('text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent', 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/35 border border-transparent')
                  }`}
                >
                  <Compass className="w-4 h-4 animate-[spin_12s_linear_infinite]" />
                  Learner Digital Twin
                </button>
                <button 
                  onClick={() => setActiveTab('parental')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    activeTab === 'parental' 
                      ? getThemeClass('bg-blue-50 border border-blue-200 text-blue-600', 'bg-blue-600/10 border border-blue-500/25 text-blue-400') 
                      : getThemeClass('text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent', 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/35 border border-transparent')
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Parental Portal
                </button>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    activeTab === 'profile' 
                      ? getThemeClass('bg-blue-50 border border-blue-200 text-blue-600', 'bg-blue-600/10 border border-blue-500/25 text-blue-400') 
                      : getThemeClass('text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent', 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/35 border border-transparent')
                  }`}
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button>
              </nav>
            </div>

            {/* Profile Summary / Theme Switcher / Logout Button */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-900/80">
              
              {/* Theme Toggle option inside Portal */}
              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-slate-400 font-semibold">Change Theme</span>
                <button 
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className={`p-1.5 rounded-lg border transition ${
                    getThemeClass('bg-slate-105 border-slate-200 text-slate-700 hover:bg-slate-200', 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850')
                  }`}
                >
                  {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-3 px-2">
                <img 
                  src={user.profile_pic_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"} 
                  alt="avatar" 
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800" 
                />
                <div className="overflow-hidden">
                  <h4 className={`font-bold text-xs truncate ${getThemeClass('text-slate-900', 'text-slate-200')}`}>{user.full_name}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                    <span className="text-blue-600 dark:text-cyan-400 font-bold">{user.credits || 0} pts</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleSignout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-450 hover:bg-rose-500/10 transition border border-transparent"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>

          {/* Main Dashboard Screen Area */}
          <main className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
            
            {/* VIEW TAB 1: STUDY TRACKER */}
            {activeTab === 'tracker' && (
              <div className="space-y-8">
                
                {/* Tracker Sub-header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-3xl font-black tracking-tight ${getThemeClass('text-slate-900', 'text-white')}`}>Study Tracker</h2>
                    <p className="text-sm text-slate-500 font-medium">Manage your active plans, checklist tasks, and coach checkups.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className={`p-2.5 rounded-lg border transition ${
                        voiceEnabled 
                          ? getThemeClass('bg-blue-50 border-blue-200 text-blue-600', 'bg-blue-600/10 border-blue-500/20 text-blue-400') 
                          : getThemeClass('bg-slate-100 border-slate-200 text-slate-400', 'bg-slate-900 border-slate-800 text-slate-500')
                      }`}
                      title={voiceEnabled ? "Voice enabled" : "Voice disabled"}
                    >
                      {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={triggerStatusCheck}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition text-xs font-bold ${
                        getThemeClass('bg-white hover:bg-slate-50 border-slate-250 text-slate-700', 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-350')
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5 text-cyan-500" />
                      Check Coach Status
                    </button>
                  </div>
                </div>

                {/* Dashboard Stats */}
                {dashboard?.has_plan && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Completion Progress Card */}
                    <div className={`border p-5 rounded-2xl shadow-sm space-y-4 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Progress</span>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <span className={`text-3xl font-black ${getThemeClass('text-slate-900', 'text-white')}`}>{dashboard.completion_percentage}%</span>
                        <p className="text-[10px] text-slate-550 font-bold uppercase mt-0.5">Tasks Completed</p>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden border ${getThemeClass('bg-slate-100 border-slate-200', 'bg-slate-950 border-slate-900')}`}>
                        <div 
                          className="bg-gradient-to-r from-blue-600 to-cyan-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${dashboard.completion_percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Streak Card */}
                    <div className={`border p-5 rounded-2xl shadow-sm space-y-4 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Streak</span>
                        <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                      </div>
                      <div>
                        <span className={`text-3xl font-black ${getThemeClass('text-slate-900', 'text-white')}`}>{dashboard.streak} Days</span>
                        <p className="text-[10px] text-slate-550 font-bold uppercase mt-0.5">Study Consistency</p>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">Complete tasks daily to keep the streak hot.</p>
                    </div>

                    {/* XP Credits Card */}
                    <div className={`border p-5 rounded-2xl shadow-sm space-y-4 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">XP Credits Points</span>
                        <Award className="w-4 h-4 text-cyan-500" />
                      </div>
                      <div>
                        <span className={`text-3xl font-black ${getThemeClass('text-slate-900', 'text-white')}`}>{user.credits || 0} pts</span>
                        <p className="text-[10px] text-slate-550 font-bold uppercase mt-0.5">Total Accumulated</p>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">Credits are awarded after answering practice tests.</p>
                    </div>

                  </div>
                )}

                {/* Active Nudge Feedback Banner */}
                {nudge && (
                  <div className={`border rounded-2xl p-5 shadow-sm flex gap-4 items-start relative overflow-hidden ${
                    getThemeClass('bg-blue-50/50 border-blue-200', 'bg-gradient-to-r from-blue-950/40 to-cyan-950/30 border-cyan-800/25')
                  }`}>
                    <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20 mt-0.5">
                      <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-extrabold text-blue-550 dark:text-cyan-400 uppercase tracking-widest">AI Coach Intervention</h4>
                      <p className={`text-sm font-semibold leading-relaxed ${getThemeClass('text-slate-805', 'text-slate-200')}`}>{nudge}</p>
                    </div>
                    <button onClick={() => setNudge(null)} className="text-xs text-slate-500 hover:text-slate-350 absolute top-4 right-4">✕</button>
                  </div>
                )}

                {/* Goal Intake Card (Form appears if no active plan exists) */}
                {!dashboard?.has_plan && (
                  <div className={`border rounded-2xl p-8 max-w-xl mx-auto shadow-sm space-y-6 ${
                    getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')
                  }`}>
                    <div className="text-center space-y-2">
                      <div className="bg-blue-600/10 border border-blue-500/20 text-blue-600 p-4 rounded-full w-fit mx-auto">
                        <BookOpen className="w-8 h-8" />
                      </div>
                      <h3 className={`text-2xl font-bold ${getThemeClass('text-slate-905', 'text-slate-100')}`}>Setup Your Learning Goal</h3>
                      <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                        Enter your topic goal, domain choice, and timing constraints to trigger CrewAI generating your plan.
                      </p>
                    </div>
                    <form onSubmit={handleCreatePlan} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">What do you want to master?</label>
                        <input 
                          type="text" 
                          required
                          value={goal}
                          onChange={(e) => setGoal(e.target.value)}
                          className={`w-full rounded-xl py-3 px-4 text-sm focus:outline-none transition ${
                            getThemeClass('bg-slate-100 border border-slate-250 text-slate-900 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-200 focus:border-blue-500')
                          }`}
                          placeholder="e.g. FastAPI REST Services, Tailwind layouts, NumPy matrices" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Domain</label>
                          <select 
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className={`w-full rounded-xl py-3 px-3.5 text-sm focus:outline-none transition ${
                              getThemeClass('bg-slate-100 border border-slate-250 text-slate-800 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-350 focus:border-blue-500')
                            }`}
                          >
                            <option value="programming">Programming</option>
                            <option value="data science">Data Science</option>
                            <option value="design">UI/UX Design</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Timeline (Weeks)</label>
                          <input 
                            type="number" 
                            min="1" 
                            max="12" 
                            required
                            value={timeline}
                            onChange={(e) => setTimeline(e.target.value)}
                            className={`w-full rounded-xl py-3 px-3.5 text-sm focus:outline-none transition ${
                              getThemeClass('bg-slate-100 border border-slate-250 text-slate-800 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-350 focus:border-blue-500')
                            }`}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Current Skill Level</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setLevel(lvl)}
                              className={`py-2.5 rounded-xl text-xs font-bold transition border ${
                                level === lvl 
                                  ? 'bg-blue-600/10 border-blue-500 text-blue-605 shadow-sm' 
                                  : getThemeClass('bg-slate-100 border-slate-250 hover:border-slate-300 text-slate-600', 'bg-slate-950/50 border-slate-850 hover:border-slate-800 text-slate-400')
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-550 hover:to-indigo-450 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-4 disabled:opacity-50 text-sm"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Analyzing & Scaffolding Plan...
                          </>
                        ) : (
                          <>
                            Generate Smart Schedule
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* Dashboard Grid */}
                {dashboard?.has_plan && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left: Timeline Schedule Checklists */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className={`border rounded-2xl p-6 shadow-sm space-y-6 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-4">
                          <div>
                            <h3 className={`text-xl font-bold ${getThemeClass('text-slate-900', 'text-slate-200')}`}>Curriculum Schedule</h3>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-0.5 capitalize">Goal: {dashboard.plan.goal} • {dashboard.plan.current_skill_level}</p>
                          </div>
                          <span className={`text-xs font-bold border px-3 py-1.5 rounded-lg ${getThemeClass('bg-slate-50 border-slate-200 text-slate-600', 'bg-slate-950 border-slate-855 text-slate-400')}`}>
                            {dashboard.plan.target_timeline_weeks} Weeks Total
                          </span>
                        </div>

                        {/* Schedule Timeline Flow */}
                        <div className="space-y-8">
                          {dashboard.plan.milestones.map((milestone) => {
                            const milestoneTasks = dashboard.plan.tasks.filter(t => t.week === milestone.week);
                            return (
                              <div key={milestone.week} className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-850 last:border-l-0">
                                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-900 dark:bg-slate-950 border-2 border-blue-500 shadow-sm" />
                                
                                <div className="space-y-4">
                                  <div className={`p-4 rounded-xl border space-y-2 ${getThemeClass('bg-slate-50 border-slate-200', 'bg-slate-950/40 border-slate-850')}`}>
                                    <span className="text-[9px] font-extrabold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      Week {milestone.week}
                                    </span>
                                    <h4 className={`text-sm font-bold ${getThemeClass('text-slate-900', 'text-slate-200')}`}>{milestone.title}</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">{milestone.focus || milestone.description}</p>
                                    {milestone.topics && (
                                      <div className="flex flex-wrap gap-1.5 pt-1">
                                        {milestone.topics.map((t, idx) => (
                                          <span key={idx} className={`text-[9px] font-bold border px-2 py-0.5 rounded-md ${getThemeClass('bg-white border-slate-200 text-slate-600', 'bg-slate-900 border-slate-850 text-slate-400')}`}>
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Task Checklist Items */}
                                  <div className="space-y-2">
                                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Daily checklists</h5>
                                    <div className="grid grid-cols-1 gap-2">
                                      {milestoneTasks.map((task) => (
                                        <div 
                                          key={task.id}
                                          onClick={() => {
                                            if (!task.is_skipped) {
                                              handleToggleTask(task.id, task.is_completed);
                                            }
                                          }}
                                          className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between group ${
                                            task.is_completed 
                                              ? 'bg-slate-105/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-900/50 opacity-60' 
                                              : task.is_skipped
                                                ? 'bg-rose-100/10 dark:bg-rose-950/5 border-rose-200/55 dark:border-rose-900/15 opacity-60'
                                                : getThemeClass('bg-white border-slate-200 hover:border-slate-300', 'bg-slate-950/60 border-slate-855 hover:border-slate-800')
                                          }`}
                                        >
                                          <div className="flex items-center gap-3.5 flex-1 pr-4">
                                            {task.is_completed ? (
                                              <CheckCircle className="w-4.5 h-4.5 text-emerald-500 fill-emerald-500/10 flex-shrink-0" />
                                            ) : task.is_skipped ? (
                                              <AlertCircle className="w-4.5 h-4.5 text-rose-500/60 flex-shrink-0" />
                                            ) : (
                                              <Circle className="w-4.5 h-4.5 text-slate-400 dark:text-slate-600 group-hover:text-blue-500 transition flex-shrink-0" />
                                            )}
                                            <div>
                                              <p className={`text-xs font-semibold ${task.is_completed ? 'line-through text-slate-500' : task.is_skipped ? 'line-through text-slate-500' : getThemeClass('text-slate-800', 'text-slate-305')}`}>
                                                {task.title}
                                              </p>
                                              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">{task.description}</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-md ${getThemeClass('bg-slate-100 border-slate-200 text-slate-600', 'bg-slate-900 border-slate-850 text-slate-500')}`}>
                                              {task.estimated_minutes} min
                                            </span>
                                            {task.id.startsWith("remedial") && (
                                              <span className="text-[9px] font-bold bg-indigo-500/15 text-indigo-500 border border-indigo-500/25 px-2 py-0.5 rounded-md">
                                                Remedial
                                              </span>
                                            )}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleSkipTask(task.id, task.is_skipped || false);
                                              }}
                                              className={`text-[9px] font-black px-2 py-0.5 rounded-md border transition ${
                                                task.is_skipped
                                                  ? 'bg-rose-500/15 border-rose-500/25 text-rose-600 dark:text-rose-400'
                                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                              }`}
                                              title={task.is_skipped ? "Unskip this task" : "Skip this task"}
                                            >
                                              {task.is_skipped ? "Skipped" : "Skip"}
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right: Side Widgets (Practice Quiz & Simulator) */}
                    <div className="space-y-6">
                      
                      {/* Active Practice Quiz Panel */}
                      <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                        <div className="flex justify-between items-center">
                          <h4 className={`text-base font-bold flex items-center gap-2 ${getThemeClass('text-slate-900', 'text-slate-200')}`}>
                            <Award className="w-4.5 h-4.5 text-indigo-500" />
                            Domain Test Arena
                          </h4>
                          {!showQuiz && (
                            <button 
                              onClick={() => {
                                setShowQuiz(true);
                                setQuizAnswers({});
                              }}
                              className="text-[10px] font-extrabold bg-indigo-650/15 hover:bg-indigo-600/30 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition"
                            >
                              Launch Quiz
                            </button>
                          )}
                        </div>

                        {showQuiz ? (
                          <div className="space-y-4">
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Answer the questions to test your skills in <span className="font-bold capitalize">{domain}</span>.
                            </p>
                            
                            {(quizQuestionsList[domain] || quizQuestionsList.programming).map((q, idx) => (
                              <div key={idx} className={`p-3.5 rounded-xl border space-y-2 ${getThemeClass('bg-slate-50 border-slate-200', 'bg-slate-950/60 border-slate-850')}`}>
                                <span className="text-[9px] font-bold text-slate-500 block">QUESTION {idx + 1}</span>
                                <h4 className={`text-xs font-semibold leading-normal ${getThemeClass('text-slate-900', 'text-slate-300')}`}>{q.question}</h4>
                                <div className="space-y-1.5">
                                  {q.options.map((opt, optIdx) => (
                                    <button 
                                      key={optIdx}
                                      onClick={() => setQuizAnswers({ ...quizAnswers, [idx]: optIdx })}
                                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition border ${
                                        quizAnswers[idx] === optIdx 
                                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-455 font-semibold' 
                                          : getThemeClass('bg-white border-slate-200 text-slate-700 hover:border-slate-300', 'bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-800')
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}

                            <div className="flex gap-2">
                              <button 
                                onClick={handleQuizSubmit}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-550 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md"
                              >
                                Submit Quiz
                              </button>
                              <button 
                                onClick={() => setShowQuiz(false)}
                                className={`border font-bold px-4 py-2.5 rounded-xl text-xs transition ${
                                  getThemeClass('bg-white border-slate-250 text-slate-505 hover:bg-slate-50', 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-400')
                                }`}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={`text-center py-8 border border-dashed rounded-xl space-y-2 ${getThemeClass('bg-slate-50 border-slate-250', 'bg-slate-950/40 border-slate-850')}`}>
                            <HelpCircle className="w-8 h-8 text-slate-400 dark:text-slate-700 mx-auto" />
                            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                              Quizzes automatically adapt to focus on topics from your active plan.
                            </p>
                          </div>
                        )}
                                       {/* Developer Simulation Toolkit Widget */}
                      <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-indigo-500" />
                          Judge Demo Toolkit
                        </h4>
                        <p className="text-[10px] text-slate-500">Run quick presets to demonstrate core agent features to the judges.</p>
                        
                        <div className="space-y-2.5">
                          <button 
                            onClick={() => handleTriggerDemo('case1')}
                            className="w-full text-left p-2.5 rounded-xl border text-[10px] font-bold transition flex items-center justify-between bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-400"
                          >
                            <span>Trigger Case 1: Inactivity Nudge</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          
                          <button 
                            onClick={() => handleTriggerDemo('case2')}
                            className="w-full text-left p-2.5 rounded-xl border text-[10px] font-bold transition flex items-center justify-between bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                          >
                            <span>Trigger Case 2: Daily Study Streak</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => handleTriggerDemo('case3')}
                            className="w-full text-left p-2.5 rounded-xl border text-[10px] font-bold transition flex items-center justify-between bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                          >
                            <span>Trigger Case 3: Project Postponed</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => handleTriggerDemo('fail_quiz')}
                            className="w-full text-left p-2.5 rounded-xl border text-[10px] font-bold transition flex items-center justify-between bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400"
                          >
                            <span>Simulate Failed Quiz (Feedback Loop)</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => handleTriggerDemo('pass_quiz')}
                            className="w-full text-left p-2.5 rounded-xl border text-[10px] font-bold transition flex items-center justify-between bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-400"
                          >
                            <span>Simulate Passed Quiz (Mastery)</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className={`p-4 rounded-xl border space-y-3 ${getThemeClass('bg-slate-50 border-slate-200', 'bg-slate-950/80 border-slate-850')}`}>
                          <label className="text-[10px] font-bold text-slate-550 block uppercase tracking-wider">Manual Inactivity (Days)</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={simulatedInactivityDays}
                              onChange={(e) => setSimulatedInactivityDays(e.target.value)}
                              className={`w-16 rounded-lg px-2 text-xs focus:outline-none font-mono ${
                                getThemeClass('bg-white border-slate-300 text-slate-800', 'bg-slate-900 border-slate-855 text-slate-300')
                              }`} 
                            />
                            <button 
                              onClick={handleSimulateInactivity}
                              className={`flex-1 font-bold py-2 px-3 rounded-lg text-[10px] transition flex items-center justify-center gap-1.5 border ${
                                getThemeClass('bg-white hover:bg-slate-105 border-slate-300 text-slate-700', 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-350')
                              }`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Shift Deadlines
                            </button>
                          </div>
                        </div>
                      </div>       </div>

                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW TAB 2: AI STUDY COACH CHAT */}
            {activeTab === 'chat' && (
              <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col justify-between">
                <div>
                  <h2 className={`text-3xl font-black ${getThemeClass('text-slate-900', 'text-white')}`}>AI Study Coach</h2>
                  <p className="text-sm text-slate-500 font-medium">Have concepts explained, check topics, and stay motivated with simple audio voice replies.</p>
                </div>

                {/* Chat Message Logs Area */}
                <div className={`flex-1 border rounded-2xl p-6 overflow-y-auto space-y-4 my-4 flex flex-col ${
                  getThemeClass('bg-white border-slate-200', 'bg-slate-900/30 border-slate-850')
                }`}>
                  {chatMessages.map((msg, index) => (
                    <div 
                      key={index}
                      className={`flex gap-3.5 max-w-xl items-start ${
                        msg.sender === 'student' ? 'ml-auto flex-row-reverse' : ''
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
                        msg.sender === 'student' 
                          ? getThemeClass('bg-blue-50 border-blue-200 text-blue-600', 'bg-blue-600/10 border-blue-500/25 text-blue-400') 
                          : getThemeClass('bg-indigo-50 border-indigo-200 text-indigo-650', 'bg-indigo-600/10 border-indigo-500/25 text-indigo-400')
                      }`}>
                        {msg.sender === 'student' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      </div>
                      <div className={`p-4 rounded-2xl border text-sm leading-relaxed ${
                        msg.sender === 'student' 
                          ? getThemeClass('bg-slate-50 border-slate-200 text-slate-800', 'bg-slate-900/60 border-slate-850 text-slate-200') 
                          : getThemeClass('bg-indigo-50/30 border-indigo-100 text-slate-800', 'bg-indigo-950/20 border-indigo-900/30 text-indigo-100')
                      }`}>
                        {renderMessageText(msg.text, theme)}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-3.5 items-center">
                      <div className={`p-2.5 rounded-xl animate-pulse border ${
                        getThemeClass('bg-indigo-50 border-indigo-200 text-indigo-600', 'bg-indigo-600/10 border-indigo-500/25 text-indigo-400')
                      }`}>
                        <Sparkles className="w-4 h-4 animate-spin" />
                      </div>
                      <span className="text-xs text-slate-500 italic">Coach is formulating explanation...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input form */}
                <form onSubmit={handleChatSubmit} className="flex gap-3 items-center">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about lists syntax, model metrics, or study motivation..."
                    className={`flex-1 rounded-xl py-3.5 px-4 text-sm focus:outline-none transition ${
                      getThemeClass('bg-white border border-slate-250 text-slate-900 focus:border-blue-600', 'bg-slate-950 border border-slate-855 text-slate-200 focus:border-blue-500')
                    }`} 
                  />
                  <button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-550 hover:to-indigo-455 text-white font-bold p-3.5 rounded-xl transition shadow-md"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </div>
            )}

            {/* VIEW TAB 8: LEARNER DIGITAL TWIN */}
            {activeTab === 'digital-twin' && parentReport && (
              <div className="space-y-8 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className={`text-3xl font-black ${getThemeClass('text-slate-900', 'text-white')}`}>Learner Digital Twin</h2>
                    <p className="text-sm text-slate-500 font-medium">Your live virtual persona. AI continuously recalculates the best learning path.</p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold ${
                    getThemeClass('bg-indigo-50/50 border-indigo-150 text-indigo-750', 'bg-indigo-950/20 border-indigo-900/40 text-indigo-300')
                  }`}>
                    <Compass className="w-4 h-4 animate-spin-slow text-indigo-500" />
                    Google Maps Mode: Recalculating Active Path
                  </div>
                </div>

                {/* Google Maps Route Recalculator Animation Card */}
                <div className={`border rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 ${
                  getThemeClass('bg-white border-slate-205 shadow-sm', 'bg-slate-900/35 border-slate-855')
                }`}>
                  <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Dynamic Route Optimization Active
                    </div>
                    <h3 className={`text-2xl font-black ${getThemeClass('text-slate-955', 'text-white')}`}>
                      Adaptive Learning Route
                    </h3>
                    <p className={`text-xs leading-relaxed ${getThemeClass('text-slate-600', 'text-slate-400')}`}>
                      "Think of it as a Google Maps for learning. Just as Google Maps recalculates your route when you take a wrong turn, our AI continuously updates your Learner Digital Twin and recalculates the best learning path based on your progress and challenges."
                    </p>
                    
                    {/* Live Decision Recalculator Log */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">AI Decision Timeline</h4>
                      <div className="space-y-3.5 max-h-56 overflow-y-auto pr-2">
                        {parentReport.decision_log && parentReport.decision_log.map((log, idx) => (
                          <div key={idx} className="flex gap-3 items-start text-xs text-left">
                            <div className="p-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 mt-0.5">
                              <MapPin className="w-3 h-3" />
                            </div>
                            <p className={`${getThemeClass('text-slate-655', 'text-slate-350')} font-medium leading-relaxed`}>{log}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Route Visualizer Map Graphic */}
                  <div className={`p-6 rounded-2xl border flex flex-col justify-center items-center text-center shadow-inner max-w-sm w-full h-80 relative overflow-hidden ${
                    getThemeClass('bg-slate-50 border-slate-200', 'bg-slate-950/60 border-slate-900')
                  }`}>
                    {/* Map Grid Background pattern */}
                    <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] pointer-events-none" style={{
                      backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                      backgroundSize: '16px 16px'
                    }} />
                    
                    {/* Interactive Recalculation Node */}
                    <div className="space-y-4 z-10">
                      <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/5 rounded-full animate-ping" />
                        <div className="absolute inset-4 bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full animate-pulse" />
                        <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg relative">
                          <Compass className="w-8 h-8 animate-[spin_8s_linear_infinite]" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className={`text-[10px] font-bold tracking-[0.15em] uppercase ${getThemeClass('text-indigo-650', 'text-indigo-400')}`}>
                          Route Recalculated
                        </span>
                        <h4 className={`text-base font-extrabold ${getThemeClass('text-slate-900', 'text-white')}`}>
                          {parentReport.quiz_history.length} Runs Evaluated
                        </h4>
                        <p className="text-[10px] text-slate-500">Milestone tasks shifting dynamically based on weak topics</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Digital Twin Profile Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Persona Card */}
                  <div className={`border rounded-2xl p-6 space-y-4 shadow-sm text-left ${getThemeClass('bg-white border-slate-205', 'bg-slate-900/35 border-slate-855')}`}>
                    <div className="flex items-center gap-3 border-b pb-4 dark:border-slate-850">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                        <img src={user.profile_pic_url || "/study_mascot.png"} alt="Student Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className={`font-black text-sm ${getThemeClass('text-slate-900', 'text-white')}`}>{parentReport.full_name}</h4>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Study Profile</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-900/40">
                        <span className="text-slate-455 font-medium">Primary Goal</span>
                        <span className={`font-bold capitalize text-right max-w-[150px] truncate ${getThemeClass('text-slate-805', 'text-slate-205')}`}>{parentReport.goal || "Not set"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-900/40">
                        <span className="text-slate-455 font-medium">Domain Area</span>
                        <span className={`font-bold capitalize ${getThemeClass('text-slate-805', 'text-slate-205')}`}>{parentReport.domain || "Programming"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-900/40">
                        <span className="text-slate-455 font-medium">Skill Level</span>
                        <span className={`font-bold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded text-[9px]`}>
                          {parentReport.current_skill_level || "Beginner"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-455 font-medium">Time Commit</span>
                        <span className={`font-bold ${getThemeClass('text-slate-805', 'text-slate-205')}`}>
                          {parentReport.study_time_preference || "8-10 PM Preference"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Tracker Dashboard Metrics */}
                  <div className={`border rounded-2xl p-6 space-y-4 shadow-sm text-left md:col-span-2 ${getThemeClass('bg-white border-slate-205', 'bg-slate-900/35 border-slate-855')}`}>
                    <h3 className={`text-base font-black border-b pb-4 dark:border-slate-850 ${getThemeClass('text-slate-900', 'text-white')}`}>
                      Progress Tracker
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      
                      {/* Study hours */}
                      <div className={`p-4 rounded-xl border space-y-1 ${getThemeClass('bg-slate-50 border-slate-200', 'bg-slate-950/40 border-slate-850')}`}>
                        <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wide block">Study Time</span>
                        <h4 className={`text-lg font-black ${getThemeClass('text-slate-900', 'text-white')}`}>
                          {parentReport.study_hours !== undefined ? parentReport.study_hours : (parentReport.time_spent ? (parentReport.time_spent / 60).toFixed(1) : "0.0")} hrs
                        </h4>
                        <span className="text-[9px] text-slate-400 block">Actual logged study hours</span>
                      </div>

                      {/* Consistency score */}
                      <div className={`p-4 rounded-xl border space-y-1 ${getThemeClass('bg-slate-50 border-slate-200', 'bg-slate-950/40 border-slate-850')}`}>
                        <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wide block">Consistency</span>
                        <h4 className={`text-lg font-black ${getThemeClass('text-slate-900', 'text-white')}`}>
                          {parentReport.consistency !== undefined ? parentReport.consistency : "100.0"}%
                        </h4>
                        <span className="text-[9px] text-slate-400 block">Completed vs missed tasks</span>
                      </div>

                      {/* Completed tasks */}
                      <div className={`p-4 rounded-xl border space-y-1 ${getThemeClass('bg-slate-50 border-slate-200', 'bg-slate-950/40 border-slate-850')}`}>
                        <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wide block">Completed Tasks</span>
                        <h4 className="text-lg font-black text-green-600 dark:text-green-400">
                          {parentReport.completed_tasks !== undefined ? parentReport.completed_tasks : parentReport.tasks_completed}
                        </h4>
                        <span className="text-[9px] text-slate-400 block">Tasks successfully checked</span>
                      </div>

                      {/* Skipped tasks */}
                      <div className={`p-4 rounded-xl border space-y-1 ${getThemeClass('bg-slate-50 border-slate-200', 'bg-slate-950/40 border-slate-850')}`}>
                        <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wide block">Skipped Tasks</span>
                        <h4 className="text-lg font-black text-rose-600 dark:text-rose-400">
                          {parentReport.skipped_tasks !== undefined ? parentReport.skipped_tasks : 0}
                        </h4>
                        <span className="text-[9px] text-slate-400 block">Tasks skipped deliberately</span>
                      </div>

                      {/* Missed deadlines */}
                      <div className={`p-4 rounded-xl border space-y-1 ${getThemeClass('bg-slate-50 border-slate-200', 'bg-slate-950/40 border-slate-850')}`}>
                        <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wide block">Missed Deadlines</span>
                        <h4 className="text-lg font-black text-orange-600 dark:text-orange-400">
                          {parentReport.missed_deadlines !== undefined ? parentReport.missed_deadlines : 0}
                        </h4>
                        <span className="text-[9px] text-slate-400 block">Tasks past due without checking</span>
                      </div>

                      {/* Current Streak */}
                      <div className={`p-4 rounded-xl border space-y-1 ${getThemeClass('bg-slate-50 border-slate-200', 'bg-slate-950/40 border-slate-850')}`}>
                        <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wide block">Learning Streak</span>
                        <h4 className="text-lg font-black text-amber-500">
                          {parentReport.streak} days
                        </h4>
                        <span className="text-[9px] text-slate-400 block">Consecutive study days</span>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Adaptive Learning Style topics split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Strong Topics List */}
                  <div className={`border rounded-2xl p-6 space-y-4 shadow-sm text-left ${getThemeClass('bg-white border-slate-205', 'bg-slate-900/35 border-slate-855')}`}>
                    <h4 className={`text-sm font-bold flex items-center gap-2 ${getThemeClass('text-slate-900', 'text-slate-200')}`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                      Strong Concepts (Mastered)
                    </h4>
                    <p className="text-xs text-slate-500">These topics scored above 60% in checks. No remedial action is active.</p>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      {parentReport.strong_topics && parentReport.strong_topics.length > 0 ? (
                        parentReport.strong_topics.map((topic, idx) => (
                          <span key={idx} className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-xs font-bold px-3 py-1 rounded-xl">
                            {topic}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-slate-550 italic">No mastered topics logged yet. Complete quizzes to populate profile.</p>
                      )}
                    </div>
                  </div>

                  {/* Weak Topics List */}
                  <div className={`border rounded-2xl p-6 space-y-4 shadow-sm text-left ${getThemeClass('bg-white border-slate-205', 'bg-slate-900/35 border-slate-855')}`}>
                    <h4 className={`text-sm font-bold flex items-center gap-2 ${getThemeClass('text-slate-900', 'text-slate-200')}`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Weak Concepts (Remediation Active)
                    </h4>
                    <p className="text-xs text-slate-500">These topics scored below 60%. Extra practice tasks and videos have been injected.</p>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      {parentReport.weak_topics && parentReport.weak_topics.length > 0 ? (
                        parentReport.weak_topics.map((topic, idx) => (
                          <span key={idx} className="bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-bold px-3 py-1 rounded-xl">
                            {topic}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-slate-550 italic">No weak topics detected. High consistency path verified.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* VIEW TAB 3: PARENTAL PORTAL */}
            {activeTab === 'parental' && (
              <div className="space-y-8">
                <div>
                  <h2 className={`text-3xl font-black ${getThemeClass('text-slate-900', 'text-white')}`}>Parental Portal</h2>
                  <p className="text-sm text-slate-500 font-medium">Securely view detailed logs, quiz history, and progress trackers.</p>
                </div>

                {parentReport ? (
                  <div className="space-y-8">
                    
                    {/* Parental Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className={`border p-4.5 rounded-xl space-y-1 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                        <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wide block">Student Name</span>
                        <h4 className={`text-lg font-bold truncate ${getThemeClass('text-slate-800', 'text-slate-100')}`}>{parentReport.full_name}</h4>
                      </div>
                      <div className={`border p-4.5 rounded-xl space-y-1 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                        <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wide block">Quiz Average</span>
                        <h4 className="text-lg font-bold text-indigo-650 dark:text-indigo-400">{parentReport.average_score}%</h4>
                      </div>
                      <div className={`border p-4.5 rounded-xl space-y-1 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                        <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wide block">Completion Rate</span>
                        <h4 className="text-lg font-bold text-emerald-650 dark:text-emerald-400">
                          {parentReport.total_tasks > 0 
                            ? Math.round((parentReport.tasks_completed / parentReport.total_tasks) * 100)
                            : 0}%
                        </h4>
                      </div>
                      <div className={`border p-4.5 rounded-xl space-y-1 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                        <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wide block">Time Invested</span>
                        <h4 className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{parentReport.time_spent} mins</h4>
                      </div>
                    </div>

                    {/* Progress Visual Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      
                      {/* SVG Line chart for quiz scores */}
                      <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                        <h4 className={`text-sm font-bold ${getThemeClass('text-slate-800', 'text-slate-200')}`}>Practice Exam Performance History</h4>
                        {parentReport.quiz_history.length > 0 ? (
                          <div>
                            <svg className="w-full h-48 text-indigo-500 overflow-visible" viewBox="0 0 500 200">
                              <line x1="30" y1="30" x2="470" y2="30" stroke={theme === 'light' ? '#e2e8f0' : '#1e293b'} strokeWidth="1" strokeDasharray="4" />
                              <line x1="30" y1="100" x2="470" y2="100" stroke={theme === 'light' ? '#e2e8f0' : '#1e293b'} strokeWidth="1" strokeDasharray="4" />
                              <line x1="30" y1="170" x2="470" y2="170" stroke={theme === 'light' ? '#e2e8f0' : '#1e293b'} strokeWidth="1" strokeDasharray="4" />
                              
                              <text x="5" y="34" fill="#64748b" className="text-[10px] font-bold font-mono">100</text>
                              <text x="5" y="104" fill="#64748b" className="text-[10px] font-bold font-mono">50</text>
                              <text x="10" y="174" fill="#64748b" className="text-[10px] font-bold font-mono">0</text>

                              <path 
                                fill="none"
                                stroke="url(#indigo-grad)"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d={parentReport.quiz_history.map((q, idx) => {
                                  const x = 30 + (idx / Math.max(1, parentReport.quiz_history.length - 1)) * 440;
                                  const y = 170 - (q.score / 100) * 140;
                                  return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                                }).join(' ')}
                              />
                              
                              <defs>
                                <linearGradient id="indigo-grad" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#4f46e5" />
                                  <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                              </defs>

                              {parentReport.quiz_history.map((q, idx) => {
                                const x = 30 + (idx / Math.max(1, parentReport.quiz_history.length - 1)) * 440;
                                const y = 170 - (q.score / 100) * 140;
                                return (
                                  <g key={idx}>
                                    <circle cx={x} cy={y} r="5" className="fill-indigo-500 stroke-white dark:stroke-[#050811] stroke-2" />
                                    <text x={x} y={y - 10} fill={theme === 'light' ? '#334155' : '#f1f5f9'} className="text-[9px] font-extrabold font-mono text-center" textAnchor="middle">{q.score}%</text>
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                        ) : (
                          <div className={`h-48 flex items-center justify-center border border-dashed rounded-xl ${getThemeClass('bg-slate-50 border-slate-205', 'bg-slate-950/40 border-slate-850')}`}>
                            <p className="text-xs text-slate-500 italic">No exams recorded yet.</p>
                          </div>
                        )}
                      </div>

                      {/* Analysis: Study hours allocation & weak areas */}
                      <div className={`border rounded-2xl p-6 shadow-sm space-y-5 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                        <h4 className={`text-sm font-bold ${getThemeClass('text-slate-800', 'text-slate-200')}`}>Learning Insights & Analysis</h4>
                        
                        {/* Weekly study time progress bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-[11px] font-bold text-slate-400">
                            <span>TOTAL TIMELINE PROGRESS</span>
                            <span className="text-blue-600 dark:text-cyan-400 font-bold">{parentReport.time_spent} / {parentReport.planned_time} mins</span>
                          </div>
                          <div className={`w-full h-3 rounded-full border overflow-hidden relative ${getThemeClass('bg-slate-100 border-slate-200', 'bg-slate-950 border-slate-900')}`}>
                            <div 
                              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (parentReport.time_spent / (parentReport.planned_time || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Weak Areas list */}
                        <div className="space-y-2 pt-2">
                          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wide block">Identified Concept Gaps</span>
                          {parentReport.weak_topics.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {parentReport.weak_topics.map((topic, index) => (
                                <span key={index} className="text-xs font-bold text-rose-500 dark:text-rose-450 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-green-650 bg-green-500/10 border border-green-500/20 p-3.5 rounded-xl font-semibold">
                              All topics currently scoring above the passing mark! No concept gaps detected.
                            </p>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Quiz History Detailed Table */}
                    <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                      <h4 className={`text-sm font-bold ${getThemeClass('text-slate-800', 'text-slate-200')}`}>Practice Test Records</h4>
                      {parentReport.quiz_history.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-855 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="pb-3.5">Topic</th>
                                <th className="pb-3.5">Week No</th>
                                <th className="pb-3.5">Test Date</th>
                                <th className="pb-3.5">Session Type</th>
                                <th className="pb-3.5 text-right">Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parentReport.quiz_history.map((q, idx) => (
                                <tr key={idx} className="border-b border-slate-100 dark:border-slate-900/60 last:border-b-0 text-xs text-slate-500">
                                  <td className={`py-3.5 font-bold capitalize ${getThemeClass('text-slate-800', 'text-slate-200')}`}>{q.topic}</td>
                                  <td className="py-3.5">Week {q.week}</td>
                                  <td className="py-3.5">{q.date}</td>
                                  <td className="py-3.5">
                                    <span className={`font-bold px-2 py-0.5 rounded text-[9px] ${
                                      q.quiz_type === 'test' 
                                        ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' 
                                        : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                    }`}>
                                      {q.quiz_type === 'test' ? 'Weekly Test' : 'Practice Quiz'}
                                    </span>
                                  </td>
                                  <td className={`py-3.5 text-right font-black ${
                                    q.score >= 60 ? 'text-green-500' : 'text-rose-500'
                                  }`}>{q.score}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic py-2">No test instances logged.</p>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className={`text-center py-16 border rounded-2xl ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/20 border-slate-850')}`}>
                    <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Loading aggregated dashboard statistics...</p>
                  </div>
                )}
              </div>
            )}

            {/* VIEW TAB 4: MY PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-8 max-w-xl">
                <div>
                  <h2 className={`text-3xl font-black ${getThemeClass('text-slate-900', 'text-white')}`}>Student Profile</h2>
                  <p className="text-sm text-slate-500 font-medium">View and update your personal information and see study credits.</p>
                </div>

                <div className={`border rounded-2xl p-8 shadow-sm space-y-6 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                  {/* Credits tracker */}
                  <div className="flex justify-between items-center bg-blue-600/10 border border-blue-500/20 p-5 rounded-2xl">
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-blue-650 dark:text-blue-400 uppercase tracking-wider">Active Credits Tracker</h4>
                      <p className="text-xs text-slate-500">Awarded for study task performance and quiz consistency.</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-3xl font-black ${getThemeClass('text-slate-900', 'text-white')}`}>{user.credits || 0}</span>
                      <span className="text-xs text-slate-500 font-bold block mt-0.5">credits</span>
                    </div>
                  </div>

                  {/* Profile Edit form */}
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={user.full_name || ''}
                          onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                          className={`w-full rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition ${
                            getThemeClass('bg-slate-100 border border-slate-250 text-slate-900 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-200 focus:border-blue-500')
                          }`} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Date of Birth</label>
                        <input 
                          type="date" 
                          required
                          value={user.dob || ''}
                          onChange={(e) => setUser({ ...user, dob: e.target.value })}
                          className={`w-full rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition text-slate-500 ${
                            getThemeClass('bg-slate-105 border border-slate-250 text-slate-850 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-200 focus:border-blue-500')
                          }`} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Mobile No</label>
                        <input 
                          type="tel" 
                          required
                          value={user.mobile_no || ''}
                          onChange={(e) => setUser({ ...user, mobile_no: e.target.value })}
                          className={`w-full rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition ${
                            getThemeClass('bg-slate-100 border border-slate-250 text-slate-900 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-200 focus:border-blue-500')
                          }`} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={user.email || ''}
                          onChange={(e) => setUser({ ...user, email: e.target.value })}
                          className={`w-full rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition ${
                            getThemeClass('bg-slate-100 border border-slate-250 text-slate-900 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-200 focus:border-blue-500')
                          }`} 
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Profile Pic URL</label>
                      <input 
                        type="url" 
                        value={user.profile_pic_url || ''}
                        onChange={(e) => setUser({ ...user, profile_pic_url: e.target.value })}
                        className={`w-full rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition ${
                          getThemeClass('bg-slate-100 border border-slate-250 text-slate-900 focus:border-blue-600', 'bg-slate-950/80 border border-slate-850 text-slate-200 focus:border-blue-500')
                        }`} 
                        placeholder="https://images.unsplash.com/..." 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition disabled:opacity-50 mt-4 text-xs"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : "Save Profile Details"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* VIEW TAB 5: SMARTCARDS */}
            {activeTab === 'smartcards' && (
              <div className="space-y-8 max-w-xl mx-auto">
                <div className="text-center space-y-2">
                  <h2 className={`text-3xl font-black ${getThemeClass('text-slate-900', 'text-white')}`}>Smartcards</h2>
                  <p className="text-sm text-slate-500 font-medium">Memorize core tech general knowledge and syllabus topics.</p>
                </div>

                {/* Flashcard container */}
                <div 
                  onClick={() => setSmartcardFlipped(!smartcardFlipped)}
                  className={`w-full h-80 rounded-3xl border shadow-xl cursor-pointer select-none transition-all duration-500 transform relative overflow-hidden flex flex-col items-center justify-center p-8 text-center border-dashed ${
                    smartcardFlipped 
                      ? getThemeClass('bg-indigo-50 border-indigo-350', 'bg-indigo-950/20 border-indigo-900/60 shadow-indigo-500/5') 
                      : getThemeClass('bg-white border-slate-200 hover:border-slate-350', 'bg-slate-900/40 border-slate-855 hover:border-slate-800')
                  }`}
                >
                  <span className="absolute top-5 left-6 text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                    {techFlashcards[smartcardIndex].category}
                  </span>
                  
                  <span className="absolute top-5 right-6 text-[10px] font-bold text-slate-400">
                    {smartcardFlipped ? "Showing Answer (Click to Flip back)" : "Showing Concept (Click to Flip)"}
                  </span>

                  <div className="space-y-4">
                    {smartcardFlipped ? (
                      <div className="space-y-3">
                        <p className={`text-sm font-semibold leading-relaxed ${getThemeClass('text-slate-700', 'text-slate-250')}`}>
                          {techFlashcards[smartcardIndex].back}
                        </p>
                      </div>
                    ) : (
                      <h3 className={`text-xl font-bold leading-snug tracking-tight max-w-sm ${getThemeClass('text-slate-900', 'text-white')}`}>
                        {techFlashcards[smartcardIndex].front}
                      </h3>
                    )}
                  </div>

                  <span className="absolute bottom-5 text-[10px] font-semibold text-slate-550 uppercase tracking-widest">
                    Click card to flip
                  </span>
                </div>

                {/* Card controls */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-slate-450">
                    Card {smartcardIndex + 1} of {techFlashcards.length}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSmartcardFlipped(false);
                      const nextIdx = Math.floor(Math.random() * techFlashcards.length);
                      setSmartcardIndex(nextIdx === smartcardIndex ? (nextIdx + 1) % techFlashcards.length : nextIdx);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-550 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-md flex items-center gap-2"
                  >
                    Random Next Card
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* VIEW TAB 6: WEEKLY TEST */}
            {activeTab === 'test' && (
              <div className="space-y-8 max-w-xl mx-auto">
                <div>
                  <h2 className={`text-3xl font-black ${getThemeClass('text-slate-900', 'text-white')}`}>Weekly Exam Arena</h2>
                  <p className="text-sm text-slate-500 font-medium">Attend exams on a weekly basis to test your retention and syllabus mastery.</p>
                </div>

                {!dashboard?.has_plan ? (
                  <div className={`text-center py-12 border border-dashed rounded-2xl space-y-3 ${getThemeClass('bg-slate-50 border-slate-250', 'bg-slate-950/40 border-slate-850')}`}>
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm text-slate-550">Please configure your learning plan first to generate custom domain exams.</p>
                  </div>
                ) : !activeTestQuiz ? (
                  <div className={`border rounded-2xl p-6 shadow-sm space-y-6 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                        {domain} domain
                      </span>
                      <h3 className={`text-lg font-bold ${getThemeClass('text-slate-900', 'text-white')}`}>Start Weekly Test</h3>
                      <p className="text-xs text-slate-505">Select which syllabus week you wish to test your retention on.</p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Choose syllabus week</label>
                      <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: dashboard.plan.target_timeline_weeks }, (_, i) => i + 1).map((wk) => (
                          <button
                            key={wk}
                            type="button"
                            onClick={() => setSelectedTestWeek(wk)}
                            className={`py-2.5 rounded-xl text-xs font-bold transition border ${
                              selectedTestWeek === wk
                                ? 'bg-indigo-650/10 border-indigo-500 text-indigo-650 dark:text-indigo-400'
                                : getThemeClass('bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300', 'bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-800')
                            }`}
                          >
                            Week {wk}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setActiveTestQuiz(true);
                        setTestAnswers({});
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-550 hover:from-blue-500 hover:to-indigo-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition text-xs flex items-center justify-center gap-2"
                    >
                      Launch Week {selectedTestWeek} Quiz
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className={`border rounded-2xl p-6 shadow-sm space-y-6 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="text-[9px] font-black uppercase text-indigo-550 block">WEEK {selectedTestWeek} TEST</span>
                        <h3 className={`text-base font-bold ${getThemeClass('text-slate-900', 'text-white')}`}>Adaptively Generated Quiz</h3>
                      </div>
                      <button 
                        onClick={() => setActiveTestQuiz(false)}
                        className="text-xs text-slate-500 hover:text-slate-300"
                      >
                        Quit test
                      </button>
                    </div>

                    <div className="space-y-5">
                      {(quizQuestionsList[domain] || quizQuestionsList.programming).map((q, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border space-y-3.5 ${getThemeClass('bg-slate-50 border-slate-200', 'bg-slate-950/80 border-slate-850')}`}>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">QUESTION {idx + 1}</span>
                          <h4 className={`text-xs font-semibold leading-relaxed ${getThemeClass('text-slate-900', 'text-slate-200')}`}>{q.question}</h4>
                          <div className="space-y-1.5">
                            {q.options.map((opt, optIdx) => (
                              <button 
                                key={optIdx}
                                onClick={() => setTestAnswers({ ...testAnswers, [idx]: optIdx })}
                                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs transition border ${
                                  testAnswers[idx] === optIdx 
                                    ? 'bg-indigo-650/10 border-indigo-500 text-indigo-650 dark:text-indigo-400 font-semibold' 
                                    : getThemeClass('bg-white border-slate-200 text-slate-700 hover:border-slate-300', 'bg-slate-900 border-slate-850 text-slate-455 hover:border-slate-800')
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={async () => {
                        let correct = 0;
                        const currentQuiz = quizQuestionsList[domain] || quizQuestionsList.programming;
                        currentQuiz.forEach((q, idx) => {
                          if (testAnswers[idx] === q.correctAnswer) correct += 1;
                        });
                        const finalScore = Math.round((correct / currentQuiz.length) * 100);
                        const weakTopic = currentQuiz[correct === currentQuiz.length ? 0 : correct].topic;

                        try {
                          const res = await fetch(`${API_BASE}/api/save-quiz`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              user_id: user.user_id,
                              score: finalScore,
                              weak_topic: weakTopic,
                              week: selectedTestWeek,
                              quiz_type: "test"
                            })
                          });
                          if (!res.ok) throw new Error("Quiz submission failed");
                          const data = await res.json();
                          
                          const updatedUser = { ...user, credits: data.total_credits };
                          setUser(updatedUser);
                          localStorage.setItem("user", JSON.stringify(updatedUser));

                          let speechText = `You completed your Week ${selectedTestWeek} exam with a score of ${finalScore} percent. `;
                          if (finalScore >= 60) {
                            speechText += "Great job! Keep up the effort.";
                          } else {
                            speechText += `You scored below passing. Let's study the remedial topic: ${weakTopic}.`;
                          }
                          speakFeedback(speechText);

                          setMascotBotData({
                            show: true,
                            feedback: finalScore >= 60 
                              ? `Amazing work! You passed the Week ${selectedTestWeek} exam.`
                              : `Remedial review suggested: ${weakTopic}. We have generated a review block in your tracker.`,
                            score: finalScore,
                            creditsAwarded: data.credits_awarded,
                            spokenText: speechText
                          });

                          setActiveTestQuiz(false);
                          setTestAnswers({});
                          fetchDashboard(user.user_id);
                          fetchParentReport();
                        } catch (err) {
                          alert(err.message);
                        }
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-550 text-white font-bold py-3 rounded-xl text-xs transition shadow-md"
                    >
                      Submit Exam Answers
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VIEW TAB 7: TEST RESULTS */}
            {activeTab === 'results' && (
              <div className="space-y-8">
                <div>
                  <h2 className={`text-3xl font-black ${getThemeClass('text-slate-900', 'text-white')}`}>Test Results</h2>
                  <p className="text-sm text-slate-500 font-medium">Detailed historical scores and visual statistics from your weekly exams.</p>
                </div>

                {parentReport ? (
                  <div className="space-y-8">
                    
                    {/* Performance Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className={`border p-5 rounded-2xl shadow-sm space-y-2 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Average Exam Score</span>
                        <h4 className="text-3xl font-black text-indigo-605 dark:text-indigo-400">{parentReport.average_score}%</h4>
                        <p className="text-[10px] text-slate-500">Benchmark pass percentage: 60%</p>
                      </div>
                      <div className={`border p-5 rounded-2xl shadow-sm space-y-2 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Exams Completed</span>
                        <h4 className={`text-3xl font-black ${getThemeClass('text-slate-900', 'text-white')}`}>{parentReport.quiz_history.length}</h4>
                        <p className="text-[10px] text-slate-500">Across all milestones</p>
                      </div>
                      <div className={`border p-5 rounded-2xl shadow-sm space-y-2 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Credits Awarded</span>
                        <h4 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">+{parentReport.quiz_history.length * 50} pts</h4>
                        <p className="text-[10px] text-slate-500">50 credits awarded per test session</p>
                      </div>
                    </div>

                    {/* SVG Line Chart & Gaps */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* SVG Line chart for quiz scores */}
                      <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                        <h4 className={`text-sm font-bold ${getThemeClass('text-slate-800', 'text-slate-200')}`}>Performance Tracking Chart</h4>
                        {parentReport.quiz_history.length > 0 ? (
                          <div>
                            <svg className="w-full h-48 text-indigo-500 overflow-visible" viewBox="0 0 500 200">
                              <line x1="30" y1="30" x2="470" y2="30" stroke={theme === 'light' ? '#e2e8f0' : '#1e293b'} strokeWidth="1" strokeDasharray="4" />
                              <line x1="30" y1="100" x2="470" y2="100" stroke={theme === 'light' ? '#e2e8f0' : '#1e293b'} strokeWidth="1" strokeDasharray="4" />
                              <line x1="30" y1="170" x2="470" y2="170" stroke={theme === 'light' ? '#e2e8f0' : '#1e293b'} strokeWidth="1" strokeDasharray="4" />
                              
                              <text x="5" y="34" fill="#64748b" className="text-[10px] font-bold font-mono">100</text>
                              <text x="5" y="104" fill="#64748b" className="text-[10px] font-bold font-mono">50</text>
                              <text x="10" y="174" fill="#64748b" className="text-[10px] font-bold font-mono">0</text>

                              <path 
                                fill="none"
                                stroke="url(#indigo-grad3)"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d={parentReport.quiz_history.map((q, idx) => {
                                  const x = 30 + (idx / Math.max(1, parentReport.quiz_history.length - 1)) * 440;
                                  const y = 170 - (q.score / 100) * 140;
                                  return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                                }).join(' ')}
                              />
                              
                              <defs>
                                <linearGradient id="indigo-grad3" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#4f46e5" />
                                  <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                              </defs>

                              {parentReport.quiz_history.map((q, idx) => {
                                const x = 30 + (idx / Math.max(1, parentReport.quiz_history.length - 1)) * 440;
                                const y = 170 - (q.score / 100) * 140;
                                return (
                                  <g key={idx}>
                                    <circle cx={x} cy={y} r="5" className="fill-indigo-500 stroke-white dark:stroke-[#050811] stroke-2" />
                                    <text x={x} y={y - 10} fill={theme === 'light' ? '#334155' : '#f1f5f9'} className="text-[9px] font-extrabold font-mono text-center" textAnchor="middle">{q.score}%</text>
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                        ) : (
                          <div className={`h-48 flex items-center justify-center border border-dashed rounded-xl ${getThemeClass('bg-slate-50 border-slate-205', 'bg-slate-950/40 border-slate-850')}`}>
                            <p className="text-xs text-slate-500 italic">No exams recorded yet.</p>
                          </div>
                        )}
                      </div>

                      {/* Concept Gaps */}
                      <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                        <h4 className={`text-sm font-bold ${getThemeClass('text-slate-800', 'text-slate-200')}`}>Concept Gaps & Review Requirements</h4>
                        <p className="text-xs text-slate-505 leading-relaxed">
                          Syllabus concepts where you scored below 60% on your tests. Focus on remedial review cards to raise these marks.
                        </p>
                        
                        {parentReport.weak_topics.length > 0 ? (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {parentReport.weak_topics.map((topic, index) => (
                              <span key={index} className="text-xs font-bold text-rose-500 dark:text-rose-455 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
                                {topic}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-green-650 bg-green-500/10 border border-green-500/20 p-4 rounded-xl font-semibold">
                            Excellent work! You have passed all tested concepts.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Detailed Score Log Table */}
                    <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/40 border-slate-850')}`}>
                      <h4 className={`text-sm font-bold ${getThemeClass('text-slate-800', 'text-slate-200')}`}>Detailed Exam Log</h4>
                      {parentReport.quiz_history.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-855 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="pb-3">Syllabus Topic</th>
                                <th className="pb-3">Milestone Week</th>
                                <th className="pb-3">Test Date</th>
                                <th className="pb-3">Session Type</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3 text-right">Result Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parentReport.quiz_history.map((q, idx) => (
                                <tr key={idx} className="border-b border-slate-100 dark:border-slate-900/60 last:border-b-0 text-xs text-slate-500">
                                  <td className={`py-3.5 font-bold capitalize ${getThemeClass('text-slate-800', 'text-slate-200')}`}>{q.topic}</td>
                                  <td className="py-3.5">Week {q.week}</td>
                                  <td className="py-3.5">{q.date}</td>
                                  <td className="py-3.5">
                                    <span className={`font-bold px-2 py-0.5 rounded text-[9px] ${
                                      q.quiz_type === 'test' 
                                        ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' 
                                        : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                    }`}>
                                      {q.quiz_type === 'test' ? 'Weekly Test' : 'Practice Quiz'}
                                    </span>
                                  </td>
                                  <td className="py-3.5">
                                    <span className={`font-bold px-2 py-0.5 rounded text-[9px] ${
                                      q.score >= 60 
                                        ? 'bg-green-500/10 text-green-505 border border-green-500/20' 
                                        : 'bg-rose-500/10 text-rose-505 border border-rose-500/20'
                                    }`}>
                                      {q.score >= 60 ? 'PASSED' : 'FAILED'}
                                    </span>
                                  </td>
                                  <td className={`py-3.5 text-right font-black ${
                                    q.score >= 60 ? 'text-green-500' : 'text-rose-500'
                                  }`}>{q.score}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic py-2">No exam results recorded yet.</p>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className={`text-center py-16 border rounded-2xl ${getThemeClass('bg-white border-slate-200', 'bg-slate-900/20 border-slate-850')}`}>
                    <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-550">Loading test score reports...</p>
                  </div>
                )}
              </div>
            )}

          </main>
        </div>
      )}

      {/* GAMIFIED MASCOT BOT OVERLAY MODAL */}
      {mascotBotData.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center relative overflow-hidden animate-glow-border">
            
            {/* Background glowing circle */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />

            {/* Speaking voice status */}
            <button 
              onClick={() => {
                if ('speechSynthesis' in window) {
                  if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel();
                  } else {
                    speakFeedback(mascotBotData.spokenText);
                  }
                }
              }}
              className="absolute top-4 right-4 p-2 bg-slate-955 border border-slate-850 hover:bg-slate-900 text-slate-400 rounded-full transition"
              title="Re-play Voice Explanation"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Mascot Image layout */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-4">
              {/* Mascot shadow */}
              <div className="absolute bottom-2 w-28 h-4 bg-black/40 rounded-full blur-md animate-mascot-shadow" />
              <img 
                src="/study_mascot.png" 
                alt="AI Mascot Coach" 
                className="w-36 h-36 object-contain z-10 animate-mascot-float" 
              />
            </div>

            {/* floating credits reward badge */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-550 border border-cyan-400/20 text-white font-black px-4.5 py-1.5 rounded-full text-xs shadow-lg mb-4 animate-bounce">
              +{mascotBotData.creditsAwarded} Study Credits
            </div>

            {/* Text description */}
            <div className="text-center space-y-2 mb-6">
              <h3 className="text-2xl font-black text-white tracking-tight">Test Finished! Score: {mascotBotData.score}%</h3>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-850 p-4 rounded-2xl max-h-40 overflow-y-auto">
                {mascotBotData.feedback}
              </p>
            </div>

            <button 
              onClick={() => {
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                setMascotBotData({ show: false, feedback: "", score: 0, creditsAwarded: 0 });
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-550 hover:from-blue-500 hover:to-indigo-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition text-xs"
            >
              Got it, Coach!
            </button>
          </div>
        </div>
      )}

      {showLoginVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 md:p-12">
          {/* Close/Skip button */}
          <button 
            onClick={() => setShowLoginVideo(false)}
            className="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl text-xs transition border border-white/10 flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            Skip Video ✕
          </button>
          
          <div className="relative max-w-4xl w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950">
            <video 
              src="/ai_companion.mp4" 
              autoPlay 
              controls 
              onEnded={() => setShowLoginVideo(false)}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
