import os
import json
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define Pydantic models for Structured Outputs
class Milestone(BaseModel):
    week: int = Field(description="The week number, e.g., 1, 2, 3")
    title: str = Field(description="A concise title for this week's milestone")
    description: str = Field(description="Brief summary of what the user will achieve this week")
    topics: List[str] = Field(description="Key concepts or topics to learn this week")
    expected_hours: int = Field(description="Estimated study hours required for this milestone")

class ParsedLearningPlan(BaseModel):
    goal: str
    domain: str
    current_skill_level: str
    target_timeline_weeks: int
    milestones: List[Milestone]

class TaskItem(BaseModel):
    id: str = Field(description="Unique ID for the task, e.g., task_1_1")
    week: int = Field(description="The week number this task belongs to")
    title: str = Field(description="Short title of the task")
    description: str = Field(description="Detailed actionable instruction on what to do")
    estimated_minutes: int = Field(description="Estimated time in minutes to complete this task")
    is_completed: bool = Field(default=False, description="Completion status of the task")
    due_date: str = Field(description="Expected due date for the task in YYYY-MM-DD format")
    video_url: Optional[str] = Field(default=None, description="YouTube video URL for learning this task")

class DetailedCurriculum(BaseModel):
    tasks: List[TaskItem]


# Initialize LLM and CrewAI agents if API Key is available
openai_api_key = os.getenv("OPENAI_API_KEY")
llm = None
has_openai = False

if openai_api_key and not openai_api_key.startswith("your_openai"):
    try:
        from langchain_openai import ChatOpenAI
        model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini")
        llm = ChatOpenAI(api_key=openai_api_key, model=model_name, temperature=0.2)
        has_openai = True
        logger.info("OpenAI LLM initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI LLM: {e}. Falling back to mock generator.")
else:
    logger.warning("OPENAI_API_KEY not found or is default. Using mock generator for AI responses.")


def parse_goal_intent(goal: str, domain: str, level: str, timeline_weeks: int) -> ParsedLearningPlan:
    """
    Parses the goal and level to generate a high-level weekly milestone plan.
    """
    if has_openai and llm:
        try:
            from langchain_core.prompts import PromptTemplate
            
            prompt = PromptTemplate.from_template(
                "You are an expert Learning Assistant. Create a weekly milestone plan for the following learning goal:\n"
                "Goal: {goal}\n"
                "Domain: {domain}\n"
                "Current Level: {level}\n"
                "Timeline: {timeline_weeks} weeks\n\n"
                "Generate structured milestones for each week up to {timeline_weeks} weeks."
            )
            
            # Use structure parsing
            structured_llm = llm.with_structured_output(ParsedLearningPlan)
            chain = prompt | structured_llm
            result = chain.invoke({
                "goal": goal,
                "domain": domain,
                "level": level,
                "timeline_weeks": timeline_weeks
            })
            return result
        except Exception as e:
            logger.error(f"Error parsing goal with LangChain: {e}. Falling back to mock response.")
            
    # Mock fallback
    milestones = []
    topics_pool = {
        "programming": ["Syntax & Variables", "Control Flows & Functions", "Data Structures", "APIs & Web Apps", "Deployment"],
        "data science": ["Python & NumPy", "Pandas & Data Wrangling", "Data Visualization", "Machine Learning Basics", "Model Evaluation"],
        "design": ["UI Basics & Layouts", "Typography & Colors", "Design Systems", "Prototyping in Figma", "Portfolio Review"],
    }
    
    selected_topics = topics_pool.get(domain.lower(), ["Fundamental Concept A", "Intermediate Concept B", "Advanced Concept C", "Practical Project"])
    
    for i in range(1, timeline_weeks + 1):
        topic_idx = (i - 1) % len(selected_topics)
        milestones.append(Milestone(
            week=i,
            title=f"Week {i}: Master {selected_topics[topic_idx]}",
            description=f"Gain practical and theoretical understanding of {selected_topics[topic_idx]} as part of your goal to: {goal}.",
            topics=[selected_topics[topic_idx], f"Practice Exercises for {selected_topics[topic_idx]}"],
            expected_hours=4 + i
        ))
        
    return ParsedLearningPlan(
        goal=goal,
        domain=domain,
        current_skill_level=level,
        target_timeline_weeks=timeline_weeks,
        milestones=milestones
    )


def get_study_video_url(topic: str, task_idx: int) -> Optional[str]:
    topic_lower = topic.lower()
    
    # Programming
    if "syntax" in topic_lower or "variables" in topic_lower:
        if task_idx == 1:
            return "https://www.youtube.com/watch?v=kqtD5dpn9C8"  # Programming with Mosh Python
        elif task_idx == 2:
            return "https://youtu.be/SzJ46YA_RaA?si=ihWwSYVTjc2Omf2U"  # Map of Computer Science (User request)
        else:
            return "https://www.youtube.com/watch?v=rfscVS0vtbw"  # freeCodeCamp Python
    elif "control flow" in topic_lower or "functions" in topic_lower:
        if task_idx == 1:
            return "https://www.youtube.com/watch?v=8DvywoWv6fI"  # Python Control Flow
        elif task_idx == 2:
            return "https://youtu.be/SzJ46YA_RaA?si=ihWwSYVTjc2Omf2U"  # Map of Computer Science (User request)
        else:
            return "https://www.youtube.com/watch?v=9Os0o3wzS_I"  # Python Functions freeCodeCamp
    elif "data structure" in topic_lower:
        if task_idx == 1:
            return "https://www.youtube.com/watch?v=RBSGKlAOiHs"  # Data Structures freeCodeCamp
        else:
            return "https://youtu.be/SzJ46YA_RaA?si=ihWwSYVTjc2Omf2U"
    elif "api" in topic_lower or "web app" in topic_lower:
        if task_idx == 1:
            return "https://www.youtube.com/watch?v=tLKKmCO6mKg"  # FastAPI Tutorial
        elif task_idx == 2:
            return "https://www.youtube.com/watch?v=GN6L5V5QCGo"  # APIs for Beginners
        else:
            return "https://youtu.be/SzJ46YA_RaA?si=ihWwSYVTjc2Omf2U"
    elif "deployment" in topic_lower:
        return "https://www.youtube.com/watch?v=428987G_n7c"  # Python deployment

    # Data Science
    elif "numpy" in topic_lower:
        return "https://www.youtube.com/watch?v=QUT1VHiLgKQ"
    elif "pandas" in topic_lower or "wrangling" in topic_lower:
        return "https://www.youtube.com/watch?v=ZyhVh-qRZPA"
    elif "visualization" in topic_lower:
        return "https://www.youtube.com/watch?v=a9UrKTVEeZA"
    elif "machine learning" in topic_lower:
        return "https://www.youtube.com/watch?v=GwIo3gToTSM"
    elif "evaluation" in topic_lower:
        return "https://www.youtube.com/watch?v=85dcaS5-g1c"

    # Design
    elif "ui" in topic_lower or "layout" in topic_lower:
        return "https://www.youtube.com/watch?v=c9Wg6A_eLsc"
    elif "typography" in topic_lower or "color" in topic_lower:
        return "https://www.youtube.com/watch?v=mZY81T6871A"
    elif "design system" in topic_lower:
        return "https://www.youtube.com/watch?v=R3LpEa_0fWk"
    elif "figma" in topic_lower or "prototyping" in topic_lower:
        return "https://www.youtube.com/watch?v=3q3fGz3s_w4"
    elif "portfolio" in topic_lower:
        return "https://www.youtube.com/watch?v=Kz697j6T8yE"
        
    return "https://youtu.be/SzJ46YA_RaA?si=ihWwSYVTjc2Omf2U"  # Domain of Science (CS map)


def generate_curriculum_tasks(plan: ParsedLearningPlan) -> List[TaskItem]:
    """
    Uses CrewAI to act as a 'Curriculum Agent' and split milestones into actionable, granular daily tasks.
    """
    if has_openai:
        try:
            from crewai import Agent, Task, Crew, Process
            
            # Define Curriculum Agent
            curriculum_agent = Agent(
                role='Curriculum Design Specialist',
                goal='Create detailed, actionable learning checklists from weekly learning milestones',
                backstory='You are an elite educational engineer who designs courses for top tech universities. '
                          'You excel at breaking down complex topics into small, daily, highly-actionable micro-tasks.',
                verbose=False,
                llm=llm
            )
            
            # Define Task
            input_data = plan.model_dump_json(indent=2)
            curriculum_task = Task(
                description=(
                    f"Create a granular list of daily actionable tasks based on the following weekly milestones plan:\n\n"
                    f"{input_data}\n\n"
                    f"For each week in the plan, generate 3-5 specific, action-oriented tasks. "
                    f"Assign estimated minutes (30 to 180) and set a realistic due date for each task. "
                    f"For each task, provide a high-quality educational YouTube URL (e.g., freeCodeCamp, Programming with Mosh, Domain of Science CS Map https://youtu.be/SzJ46YA_RaA, etc.) in the `video_url` field. "
                    f"Assume today is {datetime.utcnow().strftime('%Y-%m-%d')} and milestones start immediately."
                ),
                expected_output="A list of granular learning tasks conforming to the DetailedCurriculum Pydantic schema.",
                agent=curriculum_agent,
                output_pydantic=DetailedCurriculum
            )
            
            crew = Crew(
                agents=[curriculum_agent],
                tasks=[curriculum_task],
                process=Process.sequential
            )
            
            result = crew.kickoff()
            
            # Access pydantic output
            if hasattr(result, 'pydantic') and result.pydantic:
                return result.pydantic.tasks
            elif isinstance(result, str):
                # Try parsing string to dict if crewai returns JSON as string
                try:
                    # Clean markdown code blocks if any
                    clean_str = result.strip().strip("```json").strip("```").strip()
                    parsed = json.loads(clean_str)
                    return [TaskItem(**t) for t in parsed.get("tasks", [])]
                except Exception:
                    pass
        except Exception as e:
            logger.error(f"Error executing CrewAI workflow: {e}. Falling back to mock generator.")

    # Mock fallback
    tasks = []
    start_date = datetime.utcnow()
    
    for milestone in plan.milestones:
        # Create 3 tasks per week
        for task_idx in range(1, 4):
            day_offset = (milestone.week - 1) * 7 + (task_idx * 2) - 1 # Day 1, Day 3, Day 5
            due_date = (start_date + timedelta(days=day_offset)).strftime("%Y-%m-%d")
            
            topic = milestone.topics[0] if milestone.topics else "Syllabus Topic"
            tasks.append(TaskItem(
                id=f"task_{milestone.week}_{task_idx}",
                week=milestone.week,
                title=f"Learn {topic} - Part {task_idx}",
                description=f"Actionable learning session targeting {topic}. Focus on subtopic {task_idx} and run manual exercises.",
                estimated_minutes=90,
                is_completed=False,
                due_date=due_date,
                video_url=get_study_video_url(topic, task_idx)
            ))
            
    return tasks


def recalculate_plan(tasks: List[TaskItem], completed_ids: List[str], days_to_shift: int = 3) -> List[TaskItem]:
    """
    Adjusts future task deadlines if the user marks tasks as incomplete for more than 3 days.
    Identifies all incomplete tasks whose due date has passed or are active, and shifts all incomplete
    tasks forward by `days_to_shift` days.
    """
    updated_tasks = []
    for task in tasks:
        # If task was marked complete, update is_completed
        is_completed = task.id in completed_ids or task.is_completed
        
        # Make a copy of task dict to modify
        task_data = task.model_dump()
        task_data['is_completed'] = is_completed
        
        # If task is not completed, we shift its due date
        if not is_completed:
            try:
                current_due = datetime.strptime(task.due_date, "%Y-%m-%d")
                new_due = current_due + timedelta(days=days_to_shift)
                task_data['due_date'] = new_due.strftime("%Y-%m-%d")
            except Exception as e:
                logger.error(f"Failed to shift date for task {task.id}: {e}")
                
        updated_tasks.append(TaskItem(**task_data))
        
    return updated_tasks


def generate_nudge(
    goal: str,
    domain: str,
    days_inactive: int,
    streak: int = 1,
    weak_topics: list = None,
    strong_topics: list = None,
    project_delayed: bool = False,
    avg_score: int = 0,
    recent_quiz_score: Optional[float] = None
) -> str:
    """
    Generates a personalized, context-aware nudge message matching the student's digital twin metrics.
    """
    if weak_topics is None:
        weak_topics = []
    if strong_topics is None:
        strong_topics = []
        
    weak_str = ", ".join(weak_topics) if weak_topics else "None identified yet"
    strong_str = ", ".join(strong_topics) if strong_topics else "None identified yet"

    if has_openai and llm:
        try:
            from langchain_core.prompts import PromptTemplate
            
            prompt = PromptTemplate.from_template(
                "You are an encouraging and highly specific AI tutor. Write a short, supportive, and context-aware message to the user.\n"
                "User Goal: {goal}\n"
                "Domain: {domain}\n"
                "Twin Metrics:\n"
                "- Days Inactive: {days_inactive}\n"
                "- Current Streak: {streak} days\n"
                "- Weak Topics: {weak_str}\n"
                "- Strong Topics: {strong_str}\n"
                "- Project Overdue: {project_delayed}\n"
                "- Average Quiz Score: {avg_score}%\n\n"
                "Instructions:\n"
                "- Write a highly specific 1-2 sentence response. Do NOT use generic 'keep going' messages.\n"
                "- Case 1 (days_inactive >= 3): Remind them of their goal. Example: 'You were preparing for AWS certification. Completing one VPC lesson today will keep your exam schedule on track.'\n"
                "- Case 2 (daily study, streak >= 2): Praise consistency. Example: 'Excellent! At this pace you'll finish one week early.'\n"
                "- Case 3 (postponing projects): Praise quizzes but point out delayed project work. Example: 'Your quizzes are strong, but project work is delayed. Let's complete a small Flask app today.'\n"
                "- Output ONLY the text nudge. Do not wrap in JSON."
            )
            
            chain = prompt | llm
            response = chain.invoke({
                "goal": goal,
                "domain": domain,
                "days_inactive": days_inactive,
                "streak": streak,
                "weak_str": weak_str,
                "strong_str": strong_str,
                "project_delayed": project_delayed,
                "avg_score": avg_score
            })
            return response.content.strip()
        except Exception as e:
            logger.error(f"Error generating nudge with LangChain: {e}")
            
    # Mock fallback
    if days_inactive >= 3:
        weak_ref = f" focusing on {weak_topics[0]}" if weak_topics else ""
        return f"You were preparing for {goal}. Completing one {domain}{weak_ref} lesson today will keep your exam schedule on track!"
    elif project_delayed:
        quiz_note = f"Your quizzes are strong (average {avg_score}%), but" if avg_score >= 60 else "We noticed your"
        return f"{quiz_note} project work is delayed. Let's complete a small {domain} application task today!"
    elif days_inactive <= 1 and streak >= 2:
        return f"Excellent! You have a {streak}-day learning streak. At this pace you'll finish your {goal} plan one week early."
    elif recent_quiz_score is not None and recent_quiz_score < 60:
        return f"Hey, don't worry about that {recent_quiz_score}% score! Let's take a 10-minute session to review {weak_topics[-1] if weak_topics else domain} and get back on track."
    else:
        return f"Welcome back! Ready to continue your journey towards {goal}? Opening a 5-minute study block today will keep your momentum high."


def generate_remedial_task(goal: str, weak_topic: str, week: int, target_date: str) -> TaskItem:
    """
    Creates a new custom remedial task for a topic the user scored low on.
    """
    if has_openai and llm:
        try:
            from langchain_core.prompts import PromptTemplate
            
            prompt = PromptTemplate.from_template(
                "You are an expert tutor. Create a detailed, actionable Remedial Review task for a student learning '{goal}'.\n"
                "They struggled with the topic: '{weak_topic}'.\n"
                "Return a single JSON object containing 'title' and 'description' fields for the remedial task.\n"
                "Make the title start with 'Remedial Review: '."
            )
            
            # Use structure parsing for a temp pydantic schema
            class RemedialTaskDetails(BaseModel):
                title: str = Field(description="Actionable remediation task title")
                description: str = Field(description="Detailed step by step remedial strategy")
                
            structured_llm = llm.with_structured_output(RemedialTaskDetails)
            chain = prompt | structured_llm
            result = chain.invoke({"goal": goal, "weak_topic": weak_topic})
            
            return TaskItem(
                id=f"remedial_{week}_{int(datetime.utcnow().timestamp())}",
                week=week,
                title=result.title,
                description=result.description,
                estimated_minutes=45,
                is_completed=False,
                due_date=target_date
            )
        except Exception as e:
            logger.error(f"Error generating remedial task: {e}")
            
    # Fallback mock task
    return TaskItem(
        id=f"remedial_{week}_{int(datetime.utcnow().timestamp())}",
        week=week,
        title=f"Remedial Review: Deep Dive into {weak_topic}",
        description=f"Dedicate 45 minutes to revisiting core concepts of {weak_topic}. Review documentation, rewrite sample code, and solve active practice questions.",
        estimated_minutes=45,
        is_completed=False,
        due_date=target_date
    )
