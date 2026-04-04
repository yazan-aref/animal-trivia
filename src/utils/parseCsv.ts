import Papa from 'papaparse';

export interface Question {
  id: number;
  text: string;
  options: string[];
  timeLimit: number;
  correctAnswers: number[]; // 0-indexed
}

export async function loadQuestions(): Promise<Question[]> {
  const response = await fetch('/src/data/quiz.csv');
  const csvText = await response.text();
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const questions: Question[] = [];
        let idCounter = 1;
        
        for (const row of results.data as any[]) {
          // The CSV headers are:
          // Question - max 120 characters
          // Answer 1 - max 75 characters
          // Answer 2 - max 75 characters
          // Answer 3 - max 75 characters
          // Answer 4 - max 75 characters
          // "Time limit (sec) – 5, 10, 20, 30, 60, 90, 120, or 240 secs"
          // Correct answer(s) - choose at least one
          
          const keys = Object.keys(row);
          if (keys.length < 7) continue;
          
          const text = row[keys[0]];
          if (!text || text.trim() === '') continue;
          
          const options = [
            row[keys[1]],
            row[keys[2]],
            row[keys[3]],
            row[keys[4]]
          ].filter(opt => opt !== undefined && opt !== '');
          
          const timeLimit = parseInt(row[keys[5]], 10) || 30;
          
          // Correct answers are 1-indexed in CSV, convert to 0-indexed
          const correctAnswersStr = String(row[keys[6]]);
          const correctAnswers = correctAnswersStr.split(',').map(s => parseInt(s.trim(), 10) - 1).filter(n => !isNaN(n));
          
          questions.push({
            id: idCounter++,
            text,
            options,
            timeLimit,
            correctAnswers
          });
        }
        resolve(questions);
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
}
