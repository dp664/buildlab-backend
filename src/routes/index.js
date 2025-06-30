const express = require('express');
const signin = require('./auth/signin');
const signup = require('./auth/signup');
const getInfo = require('./services/getInfo/getInfo')
const addProject = require('./services/project/addProject');
const getAllStudents = require('./services/users/getAllUsers')
const getProjects = require('./services/project/getProjects')
const addTask = require('./services/tasks/addTask')
const getTasks = require('./services/tasks/getTasks')
const getPendingTaskCount = require('./services/tasks/getPendingTaskCount');
const updateTask = require('./services/tasks/updateTask');
const createTeam = require('./services/teams/createTeam');
const fetchTeams = require('./services/teams/getTeams');
const fetchAllMentors = require('./services/mentors/getAllMentors')
const getStudentProjects = require('./services/project/getStudentProjects')
const getProjectById = require('./services/project/getProjectByID')
const updateProject = require('./services/project/updateProject')
const fetchedTeamByID = require('./services/teams/getTeamById')
const getStudentTeams = require('./services/teams/getStudentTeams')
const getStudentTasks = require('./services/tasks/getStudentTasks')
const fetchUsers = require('./services/messages/fetchUsers');
const fetchMesssags = require('./services/messages/fetchMessages');
const createNotification = require('./services/notification/createNotification');
const fetchNotications = require('./services/notification/getNotification')
const updateNotification = require('./services/notification/updateNotification');
const deleteProject = require('./services/project/deleteProject');
const githubLogin = require('../api/github/login/route')
const githubCallback = require('../api/github/callback/route')
const addCollaborator = require('../api/github/add-collaborator/route')
const checkGithubConnection = require('./services/github/checkGitHubConnection')
const projectstatusnotifications = require('./services/notification/createNotificationsForProjectStatus')
const activeProjectCount = require('./services/project/activeProjectsCount');
const fetchTaskByID = require('./services/tasks/fetchTaskByID')
const taskStatusCount = require('./services/tasks/taskStatusCount')
const updateTeam = require('./services/teams/updateTeam')
const deleteTeam = require('./services/teams/deleteTeam')
const fetchTeamStudents = require('./services/teams/fetchTeamStudents')
const deleteTask = require('./services/tasks/deleteTask')
const updateNName = require('./services/setting/updateName')
const updatePassword = require('./services/setting/updatePassword')
const createDailyTask = require('./services/dailyTask/createDailyTask');
const updateDailyTask = require('./services/dailyTask/updateDailyTask');
const fetchDailyTasks = require('./services/dailyTask/fetchDailyTassk');
const deleteDailyTask = require('./services/dailyTask/DeleteDailyTask');
const createComment = require('./services/tasks/comments/createComment')
const fetchTaskComment = require('./services/tasks/comments/fetchTaskComments');
const deleteTaskComment = require('./services/tasks/comments/deleteTaskComment')
const userSearch = require('./services/messages/searchUser')
const deleteProjectForcefully = require('./services/project/deleteProjectForceFully') 
const createMeeting = require('./services/meetings/createMeeting')
const fetchMeetingsMentor = require('./services/meetings/fetchMeetingsMentor')
// const fetchMeetingsStudent = require('./services/meetings/fetchMeetingsStudents')
// const fetchMeetingByID = require('./services/meetings/getMeetingByID')
const updateMeeting = require('./services/meetings/updateMeeting')
const deleteMeeting = require('./services/meetings/deleteMeeting')
const getMeetingParticipants =require('./services/meetings/getParticipants')
const mentorMeetingsCount = require('./services/meetings/mentorMeetingsCount')

const router = express.Router();

// createGitHubRepo("repo1", "this is repo1", "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")


router.use('/signin', signin);
router.use('/signup', signup);
router.use('/getinfo', getInfo);
router.use('/addproject', addProject);
router.use('/getallstudents', getAllStudents);
router.use('/getprojects', getProjects)
router.use('/getprojectbyid', getProjectById)
router.use('/updateproject', updateProject)
router.use('/deleteproject', deleteProject)
router.use('/projectstatuscount', activeProjectCount)
router.use('/deleteprojectforcefully', deleteProjectForcefully)
// tasks
router.use('/addtask', addTask)
router.use('/gettasks', getTasks)
router.use('/getpendingtaskcount', getPendingTaskCount)
router.use('/updatetask', updateTask)
router.use('/getstudenttasks',getStudentTasks)
router.use('/fetchtaskbyid', fetchTaskByID)
router.use('/taskstatuscount', taskStatusCount)
router.use('/deleteTask', deleteTask)
router.use('/task-comment', createComment)
router.use('/task-comment', fetchTaskComment)
router.use('/task-comment', deleteTaskComment)

// team
router.use('/createteam', createTeam)
router.use('/fetchteams', fetchTeams)
router.use('/fetchteambyid', fetchedTeamByID)
router.use('/fetchstudentteams', getStudentTeams)
router.use('/updateteam', updateTeam)
router.use('/deleteteam', deleteTeam)
router.use('/fetchteamstudents', fetchTeamStudents)

// mentors
router.use('/getallmentors', fetchAllMentors);
// router.use('/signout', authenticate, signout); 
// router.use('/verify_auth', authenticate, verifyAuth);

router.use('/getstudentprojects', getStudentProjects)

// messages
router.use('/fetchmessagesusers', fetchUsers)
router.use('/messages', fetchMesssags)
router.use('/user-search', userSearch)

// Notification
router.use('/createnotification', createNotification)
router.use('/fetchnotifications', fetchNotications)
router.use('/updatenotification', updateNotification)
router.use('/projectstatusnotifications', projectstatusnotifications)

// Github
// router.use('/auth/github', githubOAuth)
router.use('/api/github/login', githubLogin)
router.use('/api/auth/github/callback', githubCallback)
// router.use('/api/github/create-repo', createRepo)
router.use('/api/github/add-collaborator', addCollaborator)
router.use('/checkgithubconnection', checkGithubConnection)

// settings
router.use('/updatename', updateNName)
router.use('/updatepassword', updatePassword)

// Daily tasks
router.use('/daily-tasks', createDailyTask);
router.use('/daily-tasks', fetchDailyTasks);
router.use('/daily-tasks', deleteDailyTask);
router.use('/daily-tasks', updateDailyTask);

// Meetings
router.use('/meeting', createMeeting) // create
router.use('/meetings/mentor', fetchMeetingsMentor) // fetch mentor
// router.use('/meetings/student', fetchMeetingsStudent) // fetch mentor
router.use('/meeting', updateMeeting) // update
router.use('/meeting', deleteMeeting) // delete
router.use('/meeting/participants', getMeetingParticipants)
router.use('/meetings/count', mentorMeetingsCount)
// router.use('/meeting', fetchMeetingByID) //fetchbyid
// router.use('/meetings') //today's meetings
// router.use('/meeting') //meeting 

module.exports = router;