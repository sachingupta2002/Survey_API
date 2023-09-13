const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB thr below api is for connecting mongo db in native device
mongoose.connect('mongodb://127.0.0.1:27017/SurveyDB', { useNewUrlParser: true});

// Define MongoDB models
// title of the survey and a new array for string arrays of questions in our mongo db database as needed

const surveySchema = new mongoose.Schema({
  title: String,
  questions: [{ type: String, required: true }],
});

const responseSchema = new mongoose.Schema({
  name: String,
  answers: [Number],
});

const Survey = mongoose.model('Survey', surveySchema);
const Response = mongoose.model('Response', responseSchema);

// API Endpoints
// Create a new survey with 20 questions
app.post('/surveys', async (req, res) => {
  try {
    const { title, questions } = req.body;
    const survey = new Survey({ title, questions });
    await survey.save();
    res.json({ message: 'Survey has been created successfully' });
  } catch (error) {
    res.json({ error: ' error while creating survey' });
  }
});

// Submit a response for a survey from a user
app.post('/responses', async (req, res) => {
  try {
    const { name, answers } = req.body;
    const response = new Response({ name, answers });
    await response.save();
    res.json({ message: 'Responses has been submitted successfully' });
  } catch (error) {
    res.json({ error: 'server error found' });
  }
});

// Calculate and return similarity among candidates' responses
app.get('/similarity', async (req, res) => {
  try {
    const candidateName = req.query.name.toLowerCase();

    // Retrieve all responses
    const responses = await Response.find();

    // Filter responses based on the candidate's name
    const filteredResponses = responses.filter((response) =>
      response.name.toLowerCase().includes(candidateName)
    );
    const page=1;
    const pageSize = 5;

    const similarityResults=[];

    // similarity of students
    for (let i = 0; i < filteredResponses.length; i++) {
      for (let j = i + 1; j < filteredResponses.length; j++) {
        const similarityPercentage = calculateSimilarity(filteredResponses[i].answers, filteredResponses[j].answers);
        similarityResults.push({
          candidate1: filteredResponses[i].surveyId,
          candidate2: filteredResponses[j].surveyId,
          similarityPercentage,
        });
      }
    }
  
    //pagination

  const start = (page - 1) * pageSize;
  const end = start + parseInt(pageSize);
  const Results = similarityResults.slice(start, end);

  res.status(200).json({ similarityResults: Results });
  } catch (error) {
    res.json({ error: ' server error' });
  }
});

// function to calculate similarity between two candidates responses
function calculateSimilarity(response1, response2) {
  const total_questions = response1.answers.length;
  const matching_answers= response1.answers.reduce((count, answer, index) => {
    if (answer === response2.answers[index]) {
      return count + 1;
    }
    return count;
  }, 0);
  const Percentage = (matching_answers / total_questions) * 100;
  return Percentage;
}


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

