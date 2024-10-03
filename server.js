import express from 'express';
import fs from 'fs';
import path from 'path';
import { Groq } from 'groq-sdk'; // Import Groq SDK
import dotenv from 'dotenv'; // Use dotenv to load environment variables

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Groq
const groq = new Groq();

app.use(express.json());
app.use(express.static('public'));

// POST route to process voice command and generate a website
app.post('/generate-website', async (req, res) => {
  const { command } = req.body;

  try {
    const chatCompletion = await groq.chat.completions.create({
      "messages": [
        {
          "role": "user",
          "content": `Generate a complete website based on the following command: "${command}". The entire code should be structured within one 'index.html' file, which includes internal HTML, CSS, and JavaScript in the correct sections. The code structure should follow this format:\n<html>\n<head>\n<style>[css here]</style>\n</head>\n<body><script>[javascript here]</script></body>\n</html>\n

Ensure that the website is fully functional based on the command. Provide clean, efficient, and organized code for responsive design.`
        }
      ],
      "model": "mixtral-8x7b-32768",
      "temperature": 0.5, // Adjust temperature for more consistent output
      "max_tokens": 1024,
      "top_p": 1,
      "stream": true,
      "stop": null
    });

    let generatedCode = '';
    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        generatedCode += content;
      }
    }

    // Function to extract code sections
    function separateCode(response) {
      let html1 = '';
      let css1 = '';
      let javascript1 = '';
      // Regex patterns to match sections for HTML, CSS, and JavaScript
      const htmlPattern = /<html>([\s\S]*?)<\/html>/; // Adjusted regex pattern to match full HTML
      const cssPattern = /<style>([\s\S]*?)<\/style>/;
      const jsPattern = /<script>([\s\S]*?)<\/script>/;

      // Extract the code using the patterns
      const htmlMatch = response.match(htmlPattern);
      const cssMatch = response.match(cssPattern);
      const jsMatch = response.match(jsPattern);

      if (htmlMatch) {
        html1 = htmlMatch[1].trim(); // Extract only the content within <html> tags
      }

      if (cssMatch) {
        css1 = cssMatch[1].trim(); // Extract only the content within <style> tags
      }

      if (jsMatch) {
        javascript1 = jsMatch[1].trim(); // Extract only the content within <script> tags
      }

      return { html1, css1, javascript1 };
    }

    // Correctly destructure the return value
    const { html1, css1, javascript1 } = separateCode(generatedCode);

    // Save the generated code to index.html in the 'generated-website' folder
    const websitePath = path.join(process.cwd(), 'generated-website');
    if (!fs.existsSync(websitePath)) {
      fs.mkdirSync(websitePath);
    }

    // Combine into a functional HTML structure
    // const cleanCode = `<html><head><style>${css1}</style></head><body>${html1}<script>${javascript1}</script></body></html>`;

    // Write the clean code to index.html
    fs.writeFileSync(path.join(websitePath, 'index.html'), html1);

    // Log the successful generation
    console.log('Website generated successfully:', path.join(websitePath));

    // Serve the generated website
    res.json({ previewLink: `http://localhost:${PORT}/generated-website/`    });
    // return res.redirect(302, `http://localhost:${PORT}/generated-website/`);
  } catch (error) {
    console.error('Error generating website:', error.message); // Log the error message
    console.error('Full error details:', error); // Log the full error object
    res.status(500).json({ error: 'Failed to generate website' });
  }
});



app.use('/generated-website', express.static(path.join(process.cwd(), 'generated-website')));

// Start the server
app.listen(PORT, (err) => {
  if (err) {
    console.error('Error starting the server:', err.message);
  } else {
    console.log(`Server is running on http://localhost:${PORT}`);
  }
});
